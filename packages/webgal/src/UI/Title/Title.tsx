import { CSSProperties, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import ImageButton from './ImageButton';
import styles from './title.module.scss';

import start_on from '@/assets/image/sg/05_start_on.png';
import start from '@/assets/image/sg/05_start.png';
import load_on from '@/assets/image/sg/06_load_on.png';
import load from '@/assets/image/sg/06_load.png';
import extra_on from '@/assets/image/sg/07_extra_on.png';
import extra from '@/assets/image/sg/07_extra.png';
import exit_on from '@/assets/image/sg/10_exit_on.png';
import exit from '@/assets/image/sg/10_exit.png';
import config_on from '@/assets/image/sg/08_config_on.png';
import config_button from '@/assets/image/sg/08_config.png';

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

  const applyStyle = useApplyStyle('UI/Title/title.scss');
  useConfigData(); // 监听基础ConfigData变化

  const appreciationItems = useSelector((state: RootState) => state.userData.appreciationData);
  const hasAppreciationItems = appreciationItems.bgm.length > 0 || appreciationItems.cg.length > 0;

  // 状态控制是否显示Press Enter按钮
  // const [showPressEnter, setShowPressEnter] = useState(true);
  // const [showButtonList, setShowButtonList] = useState(false);
  // const [isFlashing, setIsFlashing] = useState(false);
  // const pressEnterButtonRef = useRef<HTMLButtonElement>(null);

  // const handlePressEnterClick = () => {
  //   if (isFlashing) return; // 如果正在闪烁，不重复触发

  //   playSeClick();
  //   setIsFlashing(true);

  //   // 开始闪烁效果
  //   setTimeout(() => {
  //     setShowPressEnter(false);
  //     setShowButtonList(true);
  //     setIsFlashing(false);
  //     // 播放背景音乐
  //     playBgm(GUIState.titleBgm);
  //     // 如果需要全屏，则进入全屏模式
  //     if (fullScreen === fullScreenOption.on) {
  //       document.documentElement.requestFullscreen();
  //       if (keyboard) keyboard.lock(['Escape', 'F11']);
  //     }
  //   }, 500); // 闪烁动画持续时间
  // };

  // 监听回车键
  // useEffect(() => {
  //   const handleKeyDown = (event: KeyboardEvent) => {
  //     if (showPressEnter && !showButtonList && !isFlashing) {
  //       if (event.key === 'Enter' || event.key === ' ') {
  //         event.preventDefault();
  //         handlePressEnterClick();
  //       }
  //     }
  //   };

  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => {
  //     window.removeEventListener('keydown', handleKeyDown);
  //   };
  // }, [showPressEnter, showButtonList, isFlashing]);

  // 自动聚焦到Press Enter按钮（暂时注释，下次更新使用）
  // useEffect(() => {
  //   if (showPressEnter && pressEnterButtonRef.current) {
  //     pressEnterButtonRef.current.focus();
  //   }
  // }, [showPressEnter]);

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
          {/* 主按钮列表 */}
          <div
            className={applyStyle('Title_buttonList', styles.Title_buttonList)}
            style={
              {
                '--title-button-gap': GUIState.enableAppreciationMode ? '4rem' : '8rem',
              } as unknown as CSSProperties
            }
          >
            <ImageButton
              normalImage={start}
              hoverImage={start_on}
              altText={t('start.title')}
              onClick={() => {
                startGame();
                playSeClick();
              }}
              onMouseEnter={playSeEnter}
            />
            <ImageButton
              normalImage={load}
              hoverImage={load_on}
              altText={t('continue.title')}
              onClick={async () => {
                playSeClick();
                dispatch(setVisibility({ component: 'showTitle', visibility: false }));
                continueGame();
              }}
              onMouseEnter={playSeEnter}
            />
            <ImageButton
              normalImage={config_button}
              hoverImage={config_on}
              altText={t('options.title')}
              onClick={() => {
                playSeClick();
                dispatch(setVisibility({ component: 'showMenuPanel', visibility: true }));
                dispatch(setMenuPanelTag(MenuPanelTag.Option));
              }}
              onMouseEnter={playSeEnter}
            />
            <ImageButton
              normalImage={load}
              hoverImage={load_on}
              altText={t('load.title')}
              onClick={() => {
                playSeClick();
                dispatch(setVisibility({ component: 'showMenuPanel', visibility: true }));
                dispatch(setMenuPanelTag(MenuPanelTag.Load));
              }}
              onMouseEnter={playSeEnter}
            />
            {GUIState.enableAppreciationMode && (
              <ImageButton
                normalImage={extra}
                hoverImage={extra_on}
                altText={t('extra.title')}
                onClick={() => {
                  if (hasAppreciationItems) {
                    playSeClick();
                    dispatch(setVisibility({ component: 'showExtra', visibility: true }));
                  }
                }}
                disabled={!hasAppreciationItems}
                onMouseEnter={playSeEnter}
              />
            )}
            <ImageButton
              normalImage={exit}
              hoverImage={exit_on}
              altText={t('exit.title')}
              onClick={() => {
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
              }}
              onMouseEnter={playSeEnter}
            />
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
