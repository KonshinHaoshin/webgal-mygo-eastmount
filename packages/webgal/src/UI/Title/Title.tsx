import { CSSProperties, ReactNode, useEffect, useMemo, useState } from 'react';
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
import { changeScene } from '@/Core/controller/scene/changeScene';
import { assetSetter, fileType } from '@/Core/util/gameAssetsAccess/assetSetter';
import { resetStage } from '@/Core/controller/stage/resetStage';
import { showGlogalDialog } from '../GlobalDialog/GlobalDialog';
import styles from './title.module.scss';

interface IChapterDef {
  id: string;
  no: string;
  title: string;
  titleEn: string;
  scene?: string;
  summary?: string;
  progress?: number;
  locked?: boolean;
}

type TitleView = 'menu' | 'chapters';

/** 标题页 */
export default function Title() {
  const userDataState = useSelector((state: RootState) => state.userData);
  const GUIState = useSelector((state: RootState) => state.GUI);
  const saveDataState = useSelector((state: RootState) => state.saveData);
  const dispatch = useDispatch();
  const [chapters, setChapters] = useState<IChapterDef[]>([]);
  const [titleView, setTitleView] = useState<TitleView>('menu');

  useEffect(() => {
    fetch('./game/chapters.json')
      .then((r) => r.json())
      .then((data: IChapterDef[]) => {
        if (Array.isArray(data)) setChapters(data);
      })
      .catch(() => {});
  }, []);
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

  const currentChapterIndex = useMemo(() => {
    const saveFiles = [...saveDataState.saveData, saveDataState.quickSaveData].filter(Boolean);
    const saveScenes = saveFiles.map((save) => save?.sceneData.sceneName).filter(Boolean);
    const sceneChapterIndex = chapters.reduce((maxIndex, chapter, index) => {
      const scene = chapter.scene;
      if (!scene) return maxIndex;
      const hasScene = saveScenes.some((saveScene) => saveScene === scene || saveScene?.endsWith(`/${scene}`));
      return hasScene ? Math.max(maxIndex, index) : maxIndex;
    }, -1);
    return sceneChapterIndex >= 0 ? sceneChapterIndex : 0;
  }, [chapters, saveDataState.quickSaveData, saveDataState.saveData]);

  const currentChapter = chapters[currentChapterIndex] ?? chapters[0] ?? null;
  const totalChapterProgress =
    chapters.length > 0 ? Math.min(100, Math.max(0, Math.round(((currentChapterIndex + 1) / chapters.length) * 100))) : 0;

  const startChapter = (chapter: IChapterDef) => {
    if (!chapter.scene) return;
    resetStage(true);
    const sceneUrl = assetSetter(chapter.scene, fileType.scene);
    changeScene(sceneUrl, chapter.scene);
    dispatch(setVisibility({ component: 'showTitle', visibility: false }));
  };

  const getChapterProgress = (chapter: IChapterDef, index: number) => {
    if (typeof chapter.progress === 'number') return Math.min(100, Math.max(0, chapter.progress));
    if (index < currentChapterIndex) return 100;
    if (index === currentChapterIndex) return 0;
    return 0;
  };

  const isChapterLocked = (chapter: IChapterDef, index: number) => {
    if (chapter.locked === true || !chapter.scene) return true;
    if (chapter.locked === false) return false;
    return index > currentChapterIndex;
  };

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
      icon: <Announcement {...iconProps} />,
      label: '章节选择',
      subLabel: 'CHAPTER',
      disabled: chapters.length === 0,
      onClick: () => {
        if (chapters.length === 0) return;
        playSeClick();
        setTitleView('chapters');
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
    // {
    //   icon: <Picture {...iconProps} />,
    //   label: t('extra.title'),
    //   subLabel: 'GALLERY',
    //   disabled: !GUIState.enableAppreciationMode || !hasAppreciationItems,
    //   onClick: () => {
    //     if (!GUIState.enableAppreciationMode || !hasAppreciationItems) return;
    //     playSeClick();
    //     dispatch(setVisibility({ component: 'showExtra', visibility: true }));
    //   },
    // },
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
          {titleView === 'menu' && (
            <section className={styles.Title_brand}>
              <div className={styles.Title_brand_jp}>未做之事</div>
              <div className={styles.Title_brand_en}>When Lilies Fall in Silence</div>
              {currentChapter && (
                <div className={styles.Title_current_bookmark} aria-label={`当前章节 ${currentChapter.no} ${currentChapter.title}`}>
                  <span className={styles.Title_current_ribbon} />
                  <div className={styles.Title_current_bookmark_inner}>
                    <span className={styles.Title_current_kicker}>CURRENT CHAPTER</span>
                    <span className={styles.Title_current_no}>{currentChapter.no}</span>
                    <span className={styles.Title_current_rule} />
                    <span className={styles.Title_current_name}>{currentChapter.title}</span>
                    <span className={styles.Title_current_en}>{currentChapter.titleEn}</span>
                    <span className={styles.Title_current_summary}>{currentChapter.summary ?? ''}</span>
                  </div>
                </div>
              )}
            </section>
          )}
          {titleView === 'menu' && (
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
          )}
          {chapters.length > 0 && currentChapter && (
            <>
              {titleView === 'chapters' && (
                <section
                  className={`${styles.Title_chapter_select} ${styles.Title_chapter_select_page}`}
                  aria-label="章节选择"
                >
                  <header className={styles.Title_chapter_select_header}>
                    <div>
                      <div className={styles.Title_panel_label}>章节选择</div>
                      <div className={styles.Title_panel_sub}>CHAPTER SELECT</div>
                    </div>
                    <div className={styles.Title_chapter_progress}>
                      <span>完成度</span>
                      <strong>{totalChapterProgress}%</strong>
                    </div>
                    <button
                      type="button"
                      className={styles.Title_chapter_back}
                      onClick={() => {
                        playSeClick();
                        setTitleView('menu');
                      }}
                      onMouseEnter={playSeEnter}
                    >
                      返回主菜单
                    </button>
                  </header>
                  <div className={styles.Title_chapter_bookmarks}>
                    {chapters.map((chapter, index) => {
                      const locked = isChapterLocked(chapter, index);
                      const progress = getChapterProgress(chapter, index);
                      const isCurrent = index === currentChapterIndex;
                      return (
                        <button
                          type="button"
                          key={chapter.id}
                          className={`${styles.Title_chapter_bookmark} ${
                            isCurrent ? styles.Title_chapter_bookmark_current : ''
                          } ${locked ? styles.Title_chapter_bookmark_locked : ''}`}
                          disabled={locked}
                          onClick={() => {
                            if (locked) return;
                            playSeClick();
                            startChapter(chapter);
                          }}
                          onMouseEnter={playSeEnter}
                        >
                          <span className={styles.Title_chapter_ribbon} />
                          <span className={styles.Title_chapter_bookmark_inner}>
                            <span className={styles.Title_chapter_kicker}>CHAPTER</span>
                            <span className={styles.Title_chapter_no}>{chapter.no}</span>
                            <span className={styles.Title_chapter_rule} />
                            <span className={styles.Title_chapter_name}>{chapter.title}</span>
                            <span className={styles.Title_chapter_en}>{chapter.titleEn}</span>
                            <span className={styles.Title_chapter_summary}>{chapter.summary ?? ''}</span>
                            <span className={styles.Title_chapter_completion}>
                              {locked ? 'LOCKED' : isCurrent ? 'CURRENT' : `${progress}%`}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
          {titleView === 'menu' && (
            <>
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
            </>
          )}
        </div>
      )}
      {/* {GUIState.showTitle && (
        <div className={styles.Title_version_info}>
          <div>WebGAL MyGO Engine v{config.version}</div>
          <div>( Based on WebGAL v{__INFO.version} )</div>
        </div>
      )} */}
    </>
  );
}
