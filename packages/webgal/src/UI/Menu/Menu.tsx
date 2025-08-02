import { FC } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { MenuPanelTag } from '@/store/guiInterface';
import { MenuPanel } from './MenuPanel/MenuPanel';
import { Save } from './SaveAndLoad/Save/Save';
import { Load } from './SaveAndLoad/Load/Load';
import { Options } from './Options/Options';
import styles from './menu.module.scss';

/**
 * Menu 页面，包括存读档、选项等
 * @constructor
 */
const Menu: FC = () => {
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
};

export default Menu;
