import { OldFilmFilter } from '@pixi/filter-old-film';
import { DotFilter } from '@pixi/filter-dot';
import { ReflectionFilter } from '@pixi/filter-reflection';
import { GlitchFilter } from '@pixi/filter-glitch';
import { RGBSplitFilter } from '@pixi/filter-rgb-split';
import { GodrayFilter } from '@pixi/filter-godray';
import { AdjustmentFilter, AdvancedBloomFilter, ShockwaveFilter } from 'pixi-filters';
import { BevelFilter } from '@/Core/controller/stage/pixi/shaders/BevelFilter';
import * as PIXI from 'pixi.js';
import { BlurFilter } from '@pixi/filter-blur';
import { INIT_RAD, RadiusAlphaFilter } from '@/Core/controller/stage/pixi/shaders/RadiusAlphaFilter';
import { assetSetter, fileType } from '@/Core/util/gameAssetsAccess/assetSetter';
import { CustomColorMapFilter } from './shaders/CustomColorMapFilter';

/**
 * Filter configuration for creation and default state detection.
 */
interface FilterConfig {
  priority: number;
  create: () => PIXI.Filter;
  isDefault?: (f: PIXI.Filter) => boolean;
}

/**
 * Property configuration for mapping class properties to filter effects.
 */
// interface PropertyConfig {
//   filterName: string;
//   filterProperty?: string;
//   defaultValue: number;
//   isBoolean?: boolean;
//   overrideSet?: (value: number, filter: PIXI.Filter, container: WebGALPixiContainer) => void;
//   overrideGet?: (filter: PIXI.Filter | undefined, defaultValue: number, container: WebGALPixiContainer) => number;
// }

// LUT SUPPORT MODIFY
type PropertyValue = number | string;

// LUT SUPPORT MODIFY
// 现在需要支持 string，添加 type 联合类型。
interface PropertyConfig<T extends PropertyValue = number> {
  filterName: string;
  // LUT SUPPORT MODIFY
  type: 'number' | 'string' | 'boolean';
  defaultValue: T;
  filterProperty?: string;
  // LUT SUPPORT MODIFY
  overrideSet?: (value: T, filter: PIXI.Filter, container: WebGALPixiContainer) => void;
  // LUT SUPPORT MODIFY
  overrideGet?: (filter: PIXI.Filter | undefined, defaultValue: T, container: WebGALPixiContainer) => T;
}

// LUT SUPPORT MODIFY
type PropertyConfigs = Record<string, PropertyConfig<any>>;

// 滤镜顺序，靠上滤镜的排滤镜数组后面(在上层)
const enum FilterPriority {
  ReflectionFilm,
  RadiusAlpha,
  ShockWave,
  Blur,
  RgbFilm,
  DotFilm,
  GlitchFilm,
  OldFilm,
  Bloom,
  GodrayFilm,
  Bevel,
  // LUT SUPPORT MODIFY
  // 这里随便找了个地方放，实则优先级有待讨论
  ColorMap,
  Adjustment,
}

const FILTER_CONFIGS: Record<string, FilterConfig> = {
  blur: {
    priority: FilterPriority.Blur,
    create: () => {
      const f = new PIXI.filters.BlurFilter();
      f.blur = 0;
      return f;
    },
    isDefault: (f) => (f as BlurFilter).blur === 0,
  },
  oldFilm: {
    priority: FilterPriority.OldFilm,
    create: () => new OldFilmFilter(),
  },
  dotFilm: {
    priority: FilterPriority.DotFilm,
    create: () => new DotFilter(),
  },
  reflectionFilm: {
    priority: FilterPriority.ReflectionFilm,
    create: () => new ReflectionFilter(),
  },
  glitchFilm: {
    priority: FilterPriority.GlitchFilm,
    create: () => new GlitchFilter(),
  },
  rgbFilm: {
    priority: FilterPriority.RgbFilm,
    create: () => new RGBSplitFilter(),
  },
  godrayFilm: {
    priority: FilterPriority.GodrayFilm,
    create: () => new GodrayFilter(),
  },
  shockwave: {
    // Renamed from shockwaveFilter for consistency
    priority: FilterPriority.ShockWave, // Example priority
    create: () => {
      // The [1280, 720] seems to be the intended center in pixel coordinates.
      // This might need to be dynamic based on the container's actual size/stage size.
      // For now, using the value from the provided snippet.
      const f = new ShockwaveFilter([1280, 720]); // Center of the shockwave
      f.time = 0; // Initial time
      return f;
    },
    isDefault: (f) => (f as ShockwaveFilter).time === 0,
  },
  adjustment: {
    priority: FilterPriority.Adjustment,
    create: () => new AdjustmentFilter(),
    isDefault: (f) => {
      const a = f as AdjustmentFilter;
      return (
        a.brightness === 1 &&
        a.contrast === 1 &&
        a.saturation === 1 &&
        a.gamma === 1 &&
        a.red === 1 &&
        a.green === 1 &&
        a.blue === 1
      );
    },
  },
  radiusAlpha: {
    // Renamed from radiusAlphaFilter for consistency
    priority: FilterPriority.RadiusAlpha, // Example priority
    create: () => {
      // Center (0.5, 0.5) for normalized center of the texture
      const f = new RadiusAlphaFilter(new PIXI.Point(0.5, 0.5), INIT_RAD);
      return f;
    },
    isDefault: (f) => (f as RadiusAlphaFilter).radius === INIT_RAD,
  },
  bevel: {
    priority: FilterPriority.Bevel, // 示例优先级，请根据需要调整
    create: () => {
      const f = new BevelFilter();
      // BevelFilter 默认值
      f.lightAlpha = 0; // bevel
      f.thickness = 0; // bevelThickness
      f.rotation = 0; // bevelRotation
      f.softness = 0; // bevelSoftness
      // 默认 lightColor (255, 255, 255) -> 0xFFFFFF
      f.lightColor = 0xffffff;
      f.shadowAlpha = 0; // 通常边缘光不需要阴影
      return f;
    },
    isDefault: (f) => {
      const b = f as BevelFilter;
      return (
        b.lightAlpha === 0 &&
        b.thickness === 0 &&
        b.rotation === 0 &&
        b.softness === 0 &&
        b.lightColor === 0xffffff && // 假设默认白色
        b.shadowAlpha === 0
      );
    },
  },
  bloom: {
    // 使用 'bloom' 作为 filterName
    priority: FilterPriority.Bloom, // 示例优先级
    create: () => {
      const f = new AdvancedBloomFilter();
      // AdvancedBloomFilter 默认值
      f.bloomScale = 0; // bloom
      f.brightness = 1; // bloomBrightness
      f.blur = 0; // bloomBlur
      f.threshold = 0; // bloomThreshold
      // AdvancedBloomFilter 还有其他属性如 quality, blendMode，如果需要控制也应在此处设置初始值
      return f;
    },
    isDefault: (f) => {
      const ab = f as AdvancedBloomFilter;
      return ab.bloomScale === 0 && ab.brightness === 1 && ab.blur === 0 && ab.threshold === 0;
    },
  },
  // LUT SUPPORT MODIFY
  colorMap: {
    priority: FilterPriority.ColorMap,
    create: () => {
      // 这里不可能为 ''（会导致报错），需要考虑之后引擎自带一个 template 色彩映射贴图
      // const colormapTexture = PIXI.Texture.from('');
      // 这里使用 Pixi.JS 自带的 template 色彩映射贴图（GitHub）
      // 网络加载会导致可能的延迟，更建议使用本地资源
      const template =
        'https://raw.githubusercontent.com/pixijs/filters/refs/heads/v5.x/filters/color-map/colormap-template-16.png';

      const colormapTexture = PIXI.Texture.from(template);

      const f = new CustomColorMapFilter(colormapTexture);
      f.mix = 0;
      return f;
    },
    isDefault: (f) => {
      const template =
        'https://raw.githubusercontent.com/pixijs/filters/refs/heads/v5.x/filters/color-map/colormap-template-16.png';

      const cmap = f as CustomColorMapFilter;
      // 这里同理
      // return cmap.mix === 0 && cmap.colorMap === '';
      return cmap.mix === 0 && cmap.colorMap === template;
    },
  },
};

// LUT SUPPORT MODIFY
// Record<string, PropertyConfig> -> PropertyConfigs
// 以下全部加上 type 属性
const PROPERTY_CONFIGS: PropertyConfigs = {
  blur: {
    type: 'number',
    filterName: 'blur',
    filterProperty: 'blur',
    defaultValue: 0,
  },
  brightness: {
    type: 'number',
    filterName: 'adjustment',
    filterProperty: 'brightness',
    defaultValue: 1,
  },
  contrast: {
    type: 'number',
    filterName: 'adjustment',
    filterProperty: 'contrast',
    defaultValue: 1,
  },
  saturation: {
    type: 'number',
    filterName: 'adjustment',
    filterProperty: 'saturation',
    defaultValue: 1,
  },
  gamma: {
    type: 'number',
    filterName: 'adjustment',
    filterProperty: 'gamma',
    defaultValue: 1,
  },
  colorRed: {
    type: 'number',
    filterName: 'adjustment',
    defaultValue: 255,
    overrideSet: (value, filter) => {
      (filter as AdjustmentFilter).red = value / 255;
    },
    overrideGet: (filter, defaultValue) => (filter ? (filter as AdjustmentFilter).red * 255 : defaultValue),
  },
  colorGreen: {
    type: 'number',
    filterName: 'adjustment',
    defaultValue: 255,
    overrideSet: (value, filter) => {
      (filter as AdjustmentFilter).green = value / 255;
    },
    overrideGet: (filter, defaultValue) => (filter ? (filter as AdjustmentFilter).green * 255 : defaultValue),
  },
  colorBlue: {
    type: 'number',
    filterName: 'adjustment',
    defaultValue: 255,
    overrideSet: (value, filter) => {
      (filter as AdjustmentFilter).blue = value / 255;
    },
    overrideGet: (filter, defaultValue) => (filter ? (filter as AdjustmentFilter).blue * 255 : defaultValue),
  },
  oldFilm: { filterName: 'oldFilm', defaultValue: 0, type: 'boolean' },
  dotFilm: { filterName: 'dotFilm', defaultValue: 0, type: 'boolean' },
  reflectionFilm: { filterName: 'reflectionFilm', defaultValue: 0, type: 'boolean' },
  glitchFilm: { filterName: 'glitchFilm', defaultValue: 0, type: 'boolean' },
  rgbFilm: { filterName: 'rgbFilm', defaultValue: 0, type: 'boolean' },
  godrayFilm: { filterName: 'godrayFilm', defaultValue: 0, type: 'boolean' },
  shockwaveFilter: {
    type: 'number',
    // Public property name
    filterName: 'shockwave', // Key in FILTER_CONFIGS
    filterProperty: 'time', // Property on ShockwaveFilter instance
    defaultValue: 0,
  },
  radiusAlphaFilter: {
    type: 'number',
    // Public property name
    filterName: 'radiusAlpha', // Key in FILTER_CONFIGS
    filterProperty: 'radius', // Property on RadiusAlphaFilter instance
    defaultValue: INIT_RAD,
  },
  // Bevel Filter Properties
  bevel: {
    type: 'number',
    filterName: 'bevel',
    filterProperty: 'lightAlpha', // 'bevel' 公开属性映射到 lightAlpha
    defaultValue: 0,
  },
  bevelThickness: {
    type: 'number',
    filterName: 'bevel',
    filterProperty: 'thickness',
    defaultValue: 0,
  },
  bevelRotation: {
    type: 'number',
    filterName: 'bevel',
    filterProperty: 'rotation',
    defaultValue: 0,
  },
  bevelSoftness: {
    type: 'number',
    filterName: 'bevel',
    filterProperty: 'softness',
    defaultValue: 0,
  },
  bevelRed: {
    type: 'number',
    filterName: 'bevel',
    defaultValue: 255,
    overrideSet: (value, filter) => {
      const bFilter = filter as BevelFilter;
      const g = (bFilter.lightColor >> 8) & 0xff;
      const bl = bFilter.lightColor & 0xff;
      bFilter.lightColor = (value << 16) | (g << 8) | bl;
    },
    overrideGet: (filter, defaultValue) => {
      if (filter) {
        return ((filter as BevelFilter).lightColor >> 16) & 0xff;
      }
      return defaultValue;
    },
  },
  bevelGreen: {
    type: 'number',
    filterName: 'bevel',
    defaultValue: 255,
    overrideSet: (value, filter) => {
      const bFilter = filter as BevelFilter;
      const r = (bFilter.lightColor >> 16) & 0xff;
      const bl = bFilter.lightColor & 0xff;
      bFilter.lightColor = (r << 16) | (value << 8) | bl;
    },
    overrideGet: (filter, defaultValue) => {
      if (filter) {
        return ((filter as BevelFilter).lightColor >> 8) & 0xff;
      }
      return defaultValue;
    },
  },
  bevelBlue: {
    type: 'number',
    filterName: 'bevel',
    defaultValue: 255,
    overrideSet: (value, filter) => {
      const bFilter = filter as BevelFilter;
      const r = (bFilter.lightColor >> 16) & 0xff;
      const g = (bFilter.lightColor >> 8) & 0xff;
      bFilter.lightColor = (r << 16) | (g << 8) | value;
    },
    overrideGet: (filter, defaultValue) => {
      if (filter) {
        return (filter as BevelFilter).lightColor & 0xff;
      }
      return defaultValue;
    },
  },

  // Advanced Bloom Filter Properties
  bloom: {
    type: 'number',
    filterName: 'bloom',
    filterProperty: 'bloomScale', // 'bloom' 公开属性映射到 bloomScale
    defaultValue: 0,
  },
  bloomBrightness: {
    type: 'number',
    filterName: 'bloom',
    filterProperty: 'brightness',
    defaultValue: 1,
  },
  bloomBlur: {
    type: 'number',
    filterName: 'bloom',
    filterProperty: 'blur',
    defaultValue: 0,
  },
  bloomThreshold: {
    type: 'number',
    filterName: 'bloom',
    filterProperty: 'threshold',
    defaultValue: 0,
  },
  // LUT SUPPORT MODIFY
  colorMapFile: {
    type: 'string',
    filterName: 'colorMap',
    filterProperty: 'colorMapFile',
    defaultValue:
      'https://raw.githubusercontent.com/pixijs/filters/refs/heads/v5.x/filters/color-map/colormap-template-16.png',
    overrideSet: (value: string, filter: PIXI.Filter) => {
      console.log(`Setting colorMapUrl to ${value}`);
      const cmapFilter = filter as CustomColorMapFilter;
      const defaultValue =
        'https://raw.githubusercontent.com/pixijs/filters/refs/heads/v5.x/filters/color-map/colormap-template-16.png';

      // 因为现在多类型了，一定要进行一次类型检查。
      // 现在先放在这里，之后可以对 _getPropertyValue() 进行修改，添加类型检查逻辑。
      if (typeof value !== 'string') {
        cmapFilter.colorMap = assetSetter(defaultValue, fileType.background);
        return;
      }

      if (value) {
        const resolvedUrl = assetSetter(value, fileType.background);
        cmapFilter.colorMap = resolvedUrl;
      } else {
        cmapFilter.colorMap = assetSetter(defaultValue, fileType.background);
      }
    },
    overrideGet: (filter: PIXI.Filter | undefined, defaultValue: string) => {
      if (filter) {
        const cmapFilter = filter as CustomColorMapFilter;
        const colorMapTexture = cmapFilter.colorMap as PIXI.Texture;

        // PIXI.Texture.from() 会将 URL 作为缓存 ID。
        // 我们可以通过 textureCacheIds 数组来取回这个原始 URL。
        if (colorMapTexture?.textureCacheIds && colorMapTexture.textureCacheIds.length > 0) {
          return colorMapTexture.textureCacheIds[0];
        }
      }
      // 如果获取不到，则返回默认的 URL。
      return defaultValue;
    },
  },
  // 控制颜色映射的混合
  colorMapMix: {
    type: 'number',
    filterName: 'colorMap',
    filterProperty: 'colorMapMix',
    defaultValue: 0,
    overrideSet(value: number, filter: PIXI.Filter) {
      const cmapFilter = filter as CustomColorMapFilter;
      cmapFilter.mix = value;
    },
    overrideGet(filter: PIXI.Filter | undefined, defaultValue: number) {
      if (filter) {
        const cmapFilter = filter as CustomColorMapFilter;
        return cmapFilter.mix;
      }
      return defaultValue;
    },
  },
};

export class WebGALPixiContainer extends PIXI.Container {
  public containerFilters = new Map<string, PIXI.Filter>();
  private filterToName = new Map<PIXI.Filter, string>();

  private baseX = 0;
  private baseY = 0;

  public constructor() {
    super();
  }

  public removeFilterByName(filterName: string) {
    const filter = this.containerFilters.get(filterName);
    if (!filter || !this.filters) return;
    const idx = this.filters.indexOf(filter);
    if (idx !== -1) this.filters.splice(idx, 1);
    this.containerFilters.delete(filterName);
    this.filterToName.delete(filter);
  }

  // --- Position ---
  public override get x(): number {
    return (super.position?.x ?? 0) - this.baseX;
  }
  public override set x(v: number) {
    if (super.position) super.position.x = v + this.baseX;
  }
  public override get y(): number {
    return (super.position?.y ?? 0) - this.baseY;
  }
  public override set y(v: number) {
    if (super.position) super.position.y = v + this.baseY;
  }
  public setBaseX(x: number) {
    const old = this.x;
    this.baseX = x;
    this.x = old;
  }
  public setBaseY(y: number) {
    const old = this.y;
    this.baseY = y;
    this.y = old;
  }

  // --- Standard Filters ---
  public get blur(): number {
    return this._getPropertyValue('blur');
  }
  public set blur(v: number) {
    this._setPropertyValue('blur', v);
  }

  public get brightness(): number {
    return this._getPropertyValue('brightness');
  }
  public set brightness(v: number) {
    this._setPropertyValue('brightness', v);
  }
  public get contrast(): number {
    return this._getPropertyValue('contrast');
  }
  public set contrast(v: number) {
    this._setPropertyValue('contrast', v);
  }
  public get saturation(): number {
    return this._getPropertyValue('saturation');
  }
  public set saturation(v: number) {
    this._setPropertyValue('saturation', v);
  }
  public get gamma(): number {
    return this._getPropertyValue('gamma');
  }
  public set gamma(v: number) {
    this._setPropertyValue('gamma', v);
  }
  public get colorRed(): number {
    return this._getPropertyValue('colorRed');
  }
  public set colorRed(v: number) {
    this._setPropertyValue('colorRed', v);
  }
  public get colorGreen(): number {
    return this._getPropertyValue('colorGreen');
  }
  public set colorGreen(v: number) {
    this._setPropertyValue('colorGreen', v);
  }
  public get colorBlue(): number {
    return this._getPropertyValue('colorBlue');
  }
  public set colorBlue(v: number) {
    this._setPropertyValue('colorBlue', v);
  }

  // --- Boolean Filters ---
  public get oldFilm(): number {
    return this._getPropertyValue('oldFilm');
  }
  public set oldFilm(v: number) {
    this._setPropertyValue('oldFilm', v);
  }
  public get dotFilm(): number {
    return this._getPropertyValue('dotFilm');
  }
  public set dotFilm(v: number) {
    this._setPropertyValue('dotFilm', v);
  }
  public get reflectionFilm(): number {
    return this._getPropertyValue('reflectionFilm');
  }
  public set reflectionFilm(v: number) {
    this._setPropertyValue('reflectionFilm', v);
  }
  public get glitchFilm(): number {
    return this._getPropertyValue('glitchFilm');
  }
  public set glitchFilm(v: number) {
    this._setPropertyValue('glitchFilm', v);
  }
  public get rgbFilm(): number {
    return this._getPropertyValue('rgbFilm');
  }
  public set rgbFilm(v: number) {
    this._setPropertyValue('rgbFilm', v);
  }
  public get godrayFilm(): number {
    return this._getPropertyValue('godrayFilm');
  }
  public set godrayFilm(v: number) {
    this._setPropertyValue('godrayFilm', v);
  }

  // --- Newly Integrated Filters ---
  public get shockwaveFilter(): number {
    return this._getPropertyValue('shockwaveFilter');
  }
  public set shockwaveFilter(v: number) {
    this._setPropertyValue('shockwaveFilter', v);
  }

  public get radiusAlphaFilter(): number {
    return this._getPropertyValue('radiusAlphaFilter');
  }
  public set radiusAlphaFilter(v: number) {
    this._setPropertyValue('radiusAlphaFilter', v);
  }

  // --- Bevel Filter ---
  public get bevel(): number {
    return this._getPropertyValue('bevel');
  }
  public set bevel(v: number) {
    this._setPropertyValue('bevel', v);
  }

  public get bevelThickness(): number {
    return this._getPropertyValue('bevelThickness');
  }
  public set bevelThickness(v: number) {
    this._setPropertyValue('bevelThickness', v);
  }

  public get bevelRotation(): number {
    return this._getPropertyValue('bevelRotation');
  }
  public set bevelRotation(v: number) {
    this._setPropertyValue('bevelRotation', v);
  }

  public get bevelSoftness(): number {
    return this._getPropertyValue('bevelSoftness');
  }
  public set bevelSoftness(v: number) {
    this._setPropertyValue('bevelSoftness', v);
  }

  public get bevelRed(): number {
    return this._getPropertyValue('bevelRed');
  }
  public set bevelRed(v: number) {
    this._setPropertyValue('bevelRed', v);
  }

  public get bevelGreen(): number {
    return this._getPropertyValue('bevelGreen');
  }
  public set bevelGreen(v: number) {
    this._setPropertyValue('bevelGreen', v);
  }

  public get bevelBlue(): number {
    return this._getPropertyValue('bevelBlue');
  }
  public set bevelBlue(v: number) {
    this._setPropertyValue('bevelBlue', v);
  }

  // --- Advanced Bloom Filter ---
  public get bloom(): number {
    return this._getPropertyValue('bloom');
  }
  public set bloom(v: number) {
    this._setPropertyValue('bloom', v);
  }

  public get bloomBrightness(): number {
    return this._getPropertyValue('bloomBrightness');
  }
  public set bloomBrightness(v: number) {
    this._setPropertyValue('bloomBrightness', v);
  }

  public get bloomBlur(): number {
    return this._getPropertyValue('bloomBlur');
  }
  public set bloomBlur(v: number) {
    this._setPropertyValue('bloomBlur', v);
  }

  public get bloomThreshold(): number {
    return this._getPropertyValue('bloomThreshold');
  }
  public set bloomThreshold(v: number) {
    this._setPropertyValue('bloomThreshold', v);
  }

  // LUT SUPPORT MODIFY
  public get colorMapFile(): string {
    return this._getPropertyValue('colorMapFile');
  }

  // LUT SUPPORT MODIFY
  public set colorMapFile(v: string) {
    this._setPropertyValue('colorMapFile', v);
  }

  // LUT SUPPORT MODIFY
  public get colorMapMix(): number {
    return this._getPropertyValue('colorMapMix');
  }

  // LUT SUPPORT MODIFY
  public set colorMapMix(v: number) {
    this._setPropertyValue('colorMapMix', v);
  }

  private removeIfDefault(filterName: string) {
    const inst = this.containerFilters.get(filterName);
    const cfg = FILTER_CONFIGS[filterName];
    if (inst && cfg?.isDefault && cfg.isDefault(inst)) {
      this.removeFilterByName(filterName);
    }
  }

  // private _getPropertyValue(propertyName: string): number {
  //   const propConfig = PROPERTY_CONFIGS[propertyName];
  //   if (!propConfig) {
  //     console.warn(`WebGALPixiContainer: Unknown property configuration for getter: ${propertyName}`);
  //     return 0;
  //   }
  //   if (propConfig.isBoolean) {
  //     return this.containerFilters.has(propConfig.filterName) ? 1 : 0;
  //   }
  //   const filterInstance = this.containerFilters.get(propConfig.filterName);
  //   if (propConfig.overrideGet) {
  //     return propConfig.overrideGet(filterInstance, propConfig.defaultValue, this);
  //   }
  //   if (filterInstance && propConfig.filterProperty) {
  //     return (filterInstance as any)[propConfig.filterProperty];
  //   }
  //   return propConfig.defaultValue;
  // }

  // private _setPropertyValue(propertyName: string, value: number): void {
  //   const propConfig = PROPERTY_CONFIGS[propertyName];
  //   if (!propConfig) {
  //     console.warn(`WebGALPixiContainer: Unknown property configuration for setter: ${propertyName}`);
  //     return;
  //   }
  //   if (propConfig.isBoolean) {
  //     if (value === 0 || value === undefined || value === null) {
  //       this.removeFilterByName(propConfig.filterName);
  //     } else {
  //       if (!this.containerFilters.has(propConfig.filterName)) {
  //         this.ensureFilterByName(propConfig.filterName);
  //       }
  //     }
  //     return;
  //   }
  //   if (value === propConfig.defaultValue && !this.containerFilters.has(propConfig.filterName)) {
  //     return;
  //   }
  //   const filterInstance = this.ensureFilterByName<any>(propConfig.filterName);
  //   if (propConfig.overrideSet) {
  //     propConfig.overrideSet(value, filterInstance, this);
  //   } else if (propConfig.filterProperty) {
  //     (filterInstance as any)[propConfig.filterProperty] = value;
  //   } else {
  //     console.warn(
  //       `WebGALPixiContainer: Property '${propertyName}' has neither overrideSet nor filterProperty defined for value setting.`,
  //     );
  //   }
  //   this.removeIfDefault(propConfig.filterName);
  // }

  // LUT SUPPORT MODIFY
  // 新的 _getPropertyValue，感谢万能的 AI，但还是不能相信，估计还得改。
  private _getPropertyValue<T extends PropertyValue>(propertyName: string): T {
    const propConfig = PROPERTY_CONFIGS[propertyName] as PropertyConfig<T> | undefined;

    if (propConfig) {
      // 对布尔类型的特殊处理
      if (propConfig.type === 'boolean') {
        return (this.containerFilters.has(propConfig.filterName) ? 1 : 0) as T;
      }

      const filterInstance = this.containerFilters.get(propConfig.filterName);

      // 如果有自定义的 getter，则使用它
      if (propConfig.overrideGet) {
        return propConfig.overrideGet(filterInstance, propConfig.defaultValue, this);
      }

      // 如果滤镜实例存在且属性已映射，返回滤镜上的当前值
      if (filterInstance && propConfig.filterProperty) {
        return (filterInstance as any)[propConfig.filterProperty];
      }

      // 如果滤镜不存在或没有可映射的属性，返回配置中的默认值
      return propConfig.defaultValue;
    }

    console.warn(`WebGALPixiContainer: Unknown property configuration for getter: ${propertyName}`);

    // 由于找不到 propConfig，我们无法知道预期的默认值是数字还是字符串。
    // 返回一个通用的“空”值并强制转换为 T 是一个务实的折衷方案。
    // 控制台的警告是提醒开发人员修复问题的关键。
    return 0 as T;
  }

  private _setPropertyValue<T extends PropertyValue>(propertyName: string, value: T): void {
    const propConfig = PROPERTY_CONFIGS[propertyName] as PropertyConfig<T> | undefined;
    if (!propConfig) {
      console.warn(`WebGALPixiContainer: Unknown property configuration for setter: ${propertyName}`);
      return;
    }

    // 处理布尔类型滤镜的逻辑
    if (propConfig.type === 'boolean') {
      // 值为0, undefined, null, 或空字符串时移除滤镜
      if (!value) {
        this.removeFilterByName(propConfig.filterName);
      } else {
        // 否则确保滤镜存在
        if (!this.containerFilters.has(propConfig.filterName)) {
          this.ensureFilterByName(propConfig.filterName);
        }
      }
      return;
    }

    // 如果值等于默认值且滤镜尚未创建，则无需任何操作
    if (value === propConfig.defaultValue && !this.containerFilters.has(propConfig.filterName)) {
      return;
    }

    const filterInstance = this.ensureFilterByName<any>(propConfig.filterName);

    if (propConfig.overrideSet) {
      propConfig.overrideSet(value, filterInstance, this);
    } else if (propConfig.filterProperty) {
      (filterInstance as any)[propConfig.filterProperty] = value;
    } else {
      console.warn(
        `WebGALPixiContainer: Property '${propertyName}' has neither overrideSet nor filterProperty defined for value setting.`,
      );
    }

    // 检查是否应该移除滤镜（如果它的所有属性都回到了默认状态）
    this.removeIfDefault(propConfig.filterName);
  }

  private insertFilterWithPriority(name: string, filter: PIXI.Filter) {
    const priority = FILTER_CONFIGS[name]?.priority ?? 0;

    if (!this.filters || this.filters.length === 0) {
      this.filters = [filter];
    } else {
      let insertIndex = this.filters.length;
      for (let i = 0; i < this.filters.length; i++) {
        const currentFilter = this.filters[i]!;
        const currentName = this.filterToName.get(currentFilter);
        if (currentName) {
          const currentPriority = FILTER_CONFIGS[currentName]?.priority ?? 0;
          if (priority > currentPriority) {
            insertIndex = i;
            break;
          }
        } else {
          if (priority > 0) {
            insertIndex = i;
            break;
          }
        }
      }
      this.filters.splice(insertIndex, 0, filter);
    }
    this.containerFilters.set(name, filter);
    this.filterToName.set(filter, name);
  }

  private ensureFilterByName<T extends PIXI.Filter>(filterName: string): T {
    let inst = this.containerFilters.get(filterName) as T | undefined;
    if (inst) return inst;
    const cfg = FILTER_CONFIGS[filterName];
    if (!cfg) throw new Error(`Unknown filter configuration: ${filterName}`);
    inst = cfg.create() as T;
    this.insertFilterWithPriority(filterName, inst);
    return inst;
  }
}
