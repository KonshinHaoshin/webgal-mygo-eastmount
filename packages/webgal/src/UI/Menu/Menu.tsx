import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { MenuPanelTag } from '@/store/guiInterface';
import { Save } from './views/SaveAndLoad/Save/Save';
import { Load } from './views/SaveAndLoad/Load/Load';
import { Options } from './views/Options/Options';
import { MenuPanel } from './panel';
import styles from './menu.module.scss';

/** Menu 页面，包括存读档、选项等 */
export default function Menu() {
  const GUIState = useSelector((state: RootState) => state.GUI);
  let currentTag;
  switch (GUIState.currentMenuTag) {
    case MenuPanelTag.Save: {
      currentTag = <Save />;
      break;
    }
    case MenuPanelTag.Load: {
      currentTag = <Load />;
      break;
    }
    case MenuPanelTag.Option: {
      currentTag = <Options />;
      break;
    }
    default: {
      break;
    }
  }
  return (
    <>
      {GUIState.showMenuPanel && (
        <div className={styles.Menu_main}>
          <div className={styles.Menu_TagContent}>{currentTag}</div>
          <MenuPanel />
        </div>
      )}
    </>
  );
}
