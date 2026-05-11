import { CSSProperties, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Announcement,
  FolderOpen,
  Game,
  Help,
  Picture,
  Power,
  SettingTwo,
  Trophy,
} from '@icon-park/react';
import { config } from '@/config/mygo';
import { __INFO } from '@/config/info';
import { RootState } from '@/store/store';
import { fullScreenOption } from '@/store/userDataInterface';
import { setMenuPanelTag, setVisibility } from '@/store/GUIReducer';
import { MenuPanelTag } from '@/store/guiInterface';
import useTrans from '@/hooks/useTrans';
import useSoundEffect from '@/hooks/useSoundEffect';
import useApplyStyle from '@/hooks/useApplyStyle';
import { keyboard } from '@/hooks/useHotkey';
import useConfigData from '@/hooks/useConfigData';
import { playBgm } from '@/Core/controller/stage/playBgm';
import { continueGame, startGame } from '@/Core/controller/gamePlay/startContinueGame';
import { showGlogalDialog } from '../GlobalDialog/GlobalDialog';
import styles from './title.module.scss';

/** 标题页 */
export default function Title() {
  const userDataState = useSelector((state: RootState) => state.userData);
  const GUIState = useSelector((state: RootState) => state.GUI);
  const dispatch = useDispatch();
  const fullScreen = userDataState.optionData.fullScreen;
  const background = GUIState.titleBg;
  const showBackground = background === '' ? 'rgba(0,0,0,1)' : `url("${background}")`;
  const t = useTrans('title.');
  const tCommon = useTrans('common.');
  const { playSeEnter, playSeClick } = useSoundEffect();

  const applyStyle = useApplyStyle('title');
  useConfigData(); // 监听基础ConfigData变化

  const appreciationItems = useSelector((state: RootState) => state.userData.appreciationData);
  const hasAppreciationItems = appreciationItems.bgm.length > 0 || appreciationItems.cg.length > 0;
  const iconProps = { theme: 'outline' as const, size: 26, fill: 'currentColor', strokeWidth: 2 };

  const openOptionPanel = () => {
    dispatch(setVisibility({ component: 'showMenuPanel', visibility: true }));
    dispatch(setMenuPanelTag(MenuPanelTag.Option));
  };

  const openLoadPanel = () => {
    dispatch(setVisibility({ component: 'showMenuPanel', visibility: true }));
    dispatch(setMenuPanelTag(MenuPanelTag.Load));
  };

  const showNotice = (title: string, body: string) => {
    showGlogalDialog({
      title: `${title}\n${body}`,
      leftText: tCommon('yes'),
      rightText: '',
      leftFunc: () => {},
      rightFunc: () => {},
    });
  };

  const titleMenuItems: Array<{
    icon: ReactNode;
    label: string;
    subLabel: string;
    disabled?: boolean;
    onClick: () => void;
  }> = [
    {
      icon: <Game {...iconProps} />,
      label: t('start.title'),
      subLabel: 'START',
      onClick: () => {
        startGame();
        playSeClick();
      },
    },
    {
      icon: <Power {...iconProps} />,
      label: t('continue.title'),
      subLabel: 'CONTINUE',
      onClick: async () => {
        playSeClick();
        dispatch(setVisibility({ component: 'showTitle', visibility: false }));
        continueGame();
      },
    },
    {
      icon: <FolderOpen {...iconProps} />,
      label: t('load.title'),
      subLabel: 'LOAD',
      onClick: () => {
        playSeClick();
        openLoadPanel();
      },
    },
    {
      icon: <SettingTwo {...iconProps} />,
      label: t('options.title'),
      subLabel: 'CONFIG',
      onClick: () => {
        playSeClick();
        openOptionPanel();
      },
    },
    {
      icon: <Picture {...iconProps} />,
      label: t('extra.title'),
      subLabel: 'GALLERY',
      disabled: !GUIState.enableAppreciationMode || !hasAppreciationItems,
      onClick: () => {
        if (!GUIState.enableAppreciationMode || !hasAppreciationItems) return;
        playSeClick();
        dispatch(setVisibility({ component: 'showExtra', visibility: true }));
      },
    },
    {
      icon: <Power {...iconProps} />,
      label: t('exit.title'),
      subLabel: 'EXIT',
      onClick: () => {
        playSeClick();
        showGlogalDialog({
          title: t('exit.tips'),
          leftText: tCommon('yes'),
          rightText: tCommon('no'),
          leftFunc: () => {
            window.close();
          },
          rightFunc: () => {},
        });
      },
    },
  ];

  const shortcutItems = [
    {
      icon: <Announcement {...iconProps} />,
      label: '公告',
      subLabel: 'NOTICE',
      onClick: () => showNotice('最新公告', '本周开发进度更新已同步。'),
    },
    {
      icon: <Trophy {...iconProps} />,
      label: '成就',
      subLabel: 'ACHIEVEMENT',
      onClick: () => showNotice('成就', '成就系统将在后续章节开放。'),
    },
    {
      icon: <Picture {...iconProps} />,
      label: '回想',
      subLabel: 'RECOLLECTION',
      onClick: () => {
        if (GUIState.enableAppreciationMode) {
          dispatch(setVisibility({ component: 'showExtra', visibility: true }));
        }
      },
    },
    {
      icon: <Help {...iconProps} />,
      label: '帮助',
      subLabel: 'HELP',
      onClick: openOptionPanel,
    },
  ];

  return (
    <>
      {GUIState.showTitle && <div className={applyStyle('Title_backup_background', styles.Title_backup_background)} />}
      <div
        className="title__enter-game-target"
        onClick={() => {
          playBgm(GUIState.titleBgm);
          dispatch(setVisibility({ component: 'isEnterGame', visibility: true }));
          if (fullScreen === fullScreenOption.on) {
            document.documentElement.requestFullscreen();
            if (keyboard) keyboard.lock(['Escape', 'F11']);
          }
        }}
        onMouseEnter={playSeEnter}
      />
      {GUIState.showTitle && (
        <div
          className={applyStyle('Title_main', styles.Title_main)}
          style={{
            backgroundImage: showBackground,
            backgroundSize: 'cover',
          }}
        >
          <div className={styles.Title_overlay} />
          <section className={styles.Title_brand}>
            <div className={styles.Title_brand_jp}>未做之事</div>
            <div className={styles.Title_brand_en}>When Lilies Fall in Silence</div>
          </section>
          <div
            className={applyStyle('Title_buttonList', styles.Title_buttonList)}
            style={
              {
                '--title-button-gap': GUIState.enableAppreciationMode ? '4rem' : '8rem',
              } as unknown as CSSProperties
            }
          >
            {titleMenuItems.map((item) => (
              <button
                className={`${applyStyle('Title_button', styles.Title_button)} ${
                  item.disabled ? styles.Title_button_disabled : ''
                }`}
                disabled={item.disabled}
                key={item.subLabel}
                onClick={item.onClick}
                onMouseEnter={playSeEnter}
                type="button"
              >
                <span className={styles.Title_button_icon}>{item.icon}</span>
                <span className={applyStyle('Title_button_text', styles.Title_button_text)} data-content={item.label}>
                  <span>{item.label}</span>
                  <small>{item.subLabel}</small>
                </span>
              </button>
            ))}
          </div>
          {/* <aside className={styles.Title_chapter_card}>
            <div className={styles.Title_panel_label}>章节选择</div>
            <div className={styles.Title_panel_sub}>CHAPTER</div>
            <div className={styles.Title_chapter_no}>01</div>
            <div className={styles.Title_chapter_name}>初遇</div>
            <div className={styles.Title_chapter_en}>The First Meeting</div>
          </aside>
          <aside className={styles.Title_news_card}>
            <div className={styles.Title_panel_label}>最新公告</div>
            <div className={styles.Title_panel_sub}>NEWS</div>
            <div className={styles.Title_news_row}>
              <span>制作组寄语</span>
              <time>05/20</time>
            </div>
            <div className={styles.Title_news_row}>
              <span>音乐专辑上架</span>
              <time>05/18</time>
            </div>
            <div className={styles.Title_news_row}>
              <span>角色介绍: 白羽</span>
              <time>05/15</time>
            </div>
            <div className={styles.Title_news_more}>MORE &gt;</div>
          </aside> */}
          <div className={styles.Title_poem}>
            <p>仙人抚我顶，结发受长生。</p>
          </div>
          <div className={styles.Title_shortcuts}>
            {shortcutItems.map((item) => (
              <button type="button" key={item.subLabel} onClick={item.onClick} onMouseEnter={playSeEnter}>
                <span>{item.icon}</span>
                <strong>{item.label}</strong>
                <small>{item.subLabel}</small>
              </button>
            ))}
          </div>
          <div className={styles.Title_socials}>
            <span>BILI</span>
            <span>GITHUB</span>
            <span>LOFT</span>
          </div>
        </div>
      )}
      {GUIState.showTitle && (
        <div className={styles.Title_version_info}>
          <div>WebGAL MyGO Engine v{config.version}</div>
          <div>( Based on WebGAL v{__INFO.version} )</div>
        </div>
      )}
    </>
  );
}
