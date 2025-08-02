import useSoundEffect from '@/hooks/useSoundEffect';
import { IMenuPanel } from './menuPanelInterface';
import { MenuIconMap } from './MenuIconMap';
import styles from './menuPanel.module.scss';

/** 菜单标签页切换按钮 */
export function MenuPanelButton(props: IMenuPanel) {
  const { playSeEnter } = useSoundEffect();
  let buttonClassName = styles.MenuPanel_button;
  if (props.hasOwnProperty('buttonOnClassName')) {
    buttonClassName = buttonClassName + props.buttonOnClassName;
  }
  return (
    <div
      className={buttonClassName}
      onClick={() => {
        props.clickFunc();
      }}
      onMouseEnter={() => {
        playSeEnter();
      }}
      style={{ ...props.style, color: props.tagColor }}
    >
      <div className={styles.MenuPanel_button_icon}>
        <MenuIconMap iconName={props.iconName} iconColor={props.iconColor} />
      </div>
      {props.tagName}
    </div>
  );
}
