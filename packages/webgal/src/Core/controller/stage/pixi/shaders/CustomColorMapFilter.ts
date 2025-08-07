import {
  CLEAR_MODES,
  Filter,
  FilterSystem,
  MIPMAP_MODES,
  RenderTexture,
  SCALE_MODES,
  Texture,
  type TextureSource,
} from 'pixi.js';

// 根据 WebGAL 别的地方的实现，这里暂时不用 raw 模式
// import fragment from './color-map.frag?raw';
// import vertex from './default.vert?raw';

type ColorMapSource = TextureSource | Texture | null;

/**
 * The ColorMapFilter applies a color-map effect to an object.<br>
 * ![original](../tools/screenshots/dist/original.png)![filter](../tools/screenshots/dist/color-map.png)
 *
 * @class
 * @extends PIXI.Filter
 * @see {@link https://www.npmjs.com/package/@pixi/filter-color-map|@pixi/filter-color-map}
 * @see {@link https://www.npmjs.com/package/pixi-filters|pixi-filters}
 */
class CustomColorMapFilter extends Filter {
  /** The mix from 0 to 1, where 0 is the original image and 1 is the color mapped image. */
  public mix = 1;

  private _size = 0;
  private _sliceSize = 0;
  private _slicePixelSize = 0;
  private _sliceInnerSize = 0;
  private _nearest = false;
  private _scaleMode: SCALE_MODES | null = null;
  private _colorMap: Texture | null = null;

  /**
   * @param {HTMLImageElement|HTMLCanvasElement|PIXI.BaseTexture|PIXI.Texture} [colorMap] - The
   *        colorMap texture of the filter.
   * @param {boolean} [nearest=false] - Whether use NEAREST for colorMap texture.
   * @param {number} [mix=1] - The mix from 0 to 1, where 0 is the original image and 1 is the color mapped image.
   */
  constructor(colorMap: ColorMapSource, nearest = false, mix = 1) {
    const vertex = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}`;
    const fragment = `varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D colorMap;
uniform float _mix;
uniform float _size;
uniform float _sliceSize;
uniform float _slicePixelSize;
uniform float _sliceInnerSize;

void main() {
    vec4 color = texture2D(uSampler, vTextureCoord.xy);
    vec4 finalColor = color; // 先假设最终颜色就是原始颜色

    // 只有当像素足够不透明时才进行处理，避免处理边缘的半透明像素
    // 这是修复伪影的关键！
    if (color.a > 0.1) { // 使用一个阈值，而不是 > 0.0
        vec4 adjusted;

        // 1. Un-premultiply alpha
        vec3 unmultiplied_rgb = color.rgb / color.a;

        // 2. 使用原始RGB值在3D LUT中查找颜色
        float innerWidth = _size - 1.0;
        float zSlice0 = min(floor(unmultiplied_rgb.b * innerWidth), innerWidth);
        float zSlice1 = min(zSlice0 + 1.0, innerWidth);
        float xOffset = _slicePixelSize * 0.5 + unmultiplied_rgb.r * _sliceInnerSize;
        float s0 = xOffset + (zSlice0 * _sliceSize);
        float s1 = xOffset + (zSlice1 * _sliceSize);
        float yOffset = _sliceSize * 0.5 + unmultiplied_rgb.g * (1.0 - _sliceSize);
        vec4 slice0Color = texture2D(colorMap, vec2(s0,yOffset));
        vec4 slice1Color = texture2D(colorMap, vec2(s1,yOffset));
        float zOffset = fract(unmultiplied_rgb.b * innerWidth);
        adjusted = mix(slice0Color, slice1Color, zOffset);

        // 3. 将原始颜色与LUT颜色混合
        // 注意：这里的 'color' 还是预乘过的，而 'adjusted' 是非预乘的
        // 为了正确混合，最好都在非预乘空间进行
        vec3 mixed_rgb = mix(unmultiplied_rgb, adjusted.rgb, _mix);

        // 4. Re-premultiply alpha
        finalColor = vec4(mixed_rgb * color.a, color.a);

    }

    // 如果不满足 if 条件，finalColor 将保持为原始的 'color'

    gl_FragColor = finalColor;
}`;
    super(vertex, fragment);
    this._scaleMode = null;
    this.nearest = nearest;
    this.mix = mix;
    this.colorMap = colorMap;
  }

  /**
   * Override existing apply method in PIXI.Filter
   * @private
   */
  apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
    this.uniforms._mix = this.mix;

    filterManager.applyFilter(this, input, output, clear);
  }

  /**
   * The size of one color slice
   * @readonly
   */
  get colorSize(): number {
    return this._size;
  }

  /**
   * the colorMap texture
   * @member {PIXI.Texture}
   */
  get colorMap(): ColorMapSource {
    return this._colorMap;
  }
  set colorMap(colorMap: ColorMapSource) {
    if (!colorMap) {
      return;
    }
    if (!(colorMap instanceof Texture)) {
      colorMap = Texture.from(colorMap);
    }
    if ((colorMap as Texture)?.baseTexture) {
      colorMap.baseTexture.scaleMode = this._scaleMode as SCALE_MODES;
      colorMap.baseTexture.mipmap = MIPMAP_MODES.OFF;

      this._size = colorMap.height;
      this._sliceSize = 1 / this._size;
      this._slicePixelSize = this._sliceSize / this._size;
      this._sliceInnerSize = this._slicePixelSize * (this._size - 1);

      this.uniforms._size = this._size;
      this.uniforms._sliceSize = this._sliceSize;
      this.uniforms._slicePixelSize = this._slicePixelSize;
      this.uniforms._sliceInnerSize = this._sliceInnerSize;

      this.uniforms.colorMap = colorMap;
    }

    this._colorMap = colorMap;
  }

  /**
   * Whether use NEAREST for colorMap texture.
   */
  get nearest(): boolean {
    return this._nearest;
  }
  set nearest(nearest: boolean) {
    this._nearest = nearest;
    this._scaleMode = nearest ? SCALE_MODES.NEAREST : SCALE_MODES.LINEAR;

    const texture = this._colorMap;

    if (texture && texture.baseTexture) {
      texture.baseTexture._glTextures = {};

      texture.baseTexture.scaleMode = this._scaleMode;
      texture.baseTexture.mipmap = MIPMAP_MODES.OFF;

      texture._updateID++;
      texture.baseTexture.emit('update', texture.baseTexture);
    }
  }

  /**
   * If the colorMap is based on canvas , and the content of canvas has changed,
   *   then call `updateColorMap` for update texture.
   */
  updateColorMap(): void {
    const texture = this._colorMap;

    if (texture && texture.baseTexture) {
      texture._updateID++;
      texture.baseTexture.emit('update', texture.baseTexture);

      this.colorMap = texture;
    }
  }

  /**
   * Destroys this filter
   *
   * @param {boolean} [destroyBase=false] - Whether to destroy the base texture of colorMap as well
   */
  destroy(destroyBase = false): void {
    if (this._colorMap) {
      this._colorMap.destroy(destroyBase);
    }
    super.destroy();
  }
}

export { CustomColorMapFilter };
