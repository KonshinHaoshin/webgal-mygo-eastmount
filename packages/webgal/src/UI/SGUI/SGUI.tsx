import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import styles from './SGUI.module.scss';
// 导入sg素材
import auto_button_on from '@/assets/image/sg/auto_button_on.png';
import auto_button from '@/assets/image/sg/auto_button.png';
import skip_button from '@/assets/image/sg/skip_button.png';
import skip_button_on from '@/assets/image/sg/skip_button_on.png';
// 导入实际的游戏控制函数
import { switchAuto, stopAuto } from '@/Core/controller/gamePlay/autoPlay';
import { switchFast, stopFast } from '@/Core/controller/gamePlay/fastSkip';
import { WebGAL } from '@/Core/WebGAL';

interface SguiProps {
  /** 内嵌在文本框内时为 true，随文本框一起显隐与渐入渐出 */
  embedded?: boolean;
}

export default function Sgui(props: SguiProps = {}) {
  const { embedded = false } = props;
  const [isAutoOn, setIsAutoOn] = useState(false);
  const [isSkipOn, setIsSkipOn] = useState(false);

  const GUIStore = useSelector((state: RootState) => state.GUI);
  const stageState = useSelector((state: RootState) => state.stage);

  // 非内嵌模式：文本框关闭时关闭自动/快进；内嵌模式：卸载时关闭
  useEffect(() => {
    if (embedded) {
      return () => {
        stopAuto();
        stopFast();
      };
    }
    if (!GUIStore.showTextBox || stageState.isDisableTextbox) {
      stopAuto();
      stopFast();
    }
  }, [embedded, GUIStore.showTextBox, stageState.isDisableTextbox]);

  useEffect(() => {
    setIsAutoOn(WebGAL.gameplay.isAuto);
    setIsSkipOn(WebGAL.gameplay.isFast);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAutoOn(WebGAL.gameplay.isAuto);
      setIsSkipOn(WebGAL.gameplay.isFast);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleAutoClick = () => {
    switchAuto();
    setIsAutoOn(WebGAL.gameplay.isAuto);
  };

  const handleSkipClick = () => {
    switchFast();
    setIsSkipOn(WebGAL.gameplay.isFast);
  };

  // 内嵌时由父级（文本框）控制显隐，不在此处判断
  if (!embedded) {
    const shouldShowSGUI =
      GUIStore.showTextBox && stageState.enableFilm === '' && !stageState.isDisableTextbox;
    if (!shouldShowSGUI) return null;
  }

    return (
        <div className={styles.SGUI}>
            <button
                className={styles.sguiButton}
                onClick={handleAutoClick}
                aria-label={isAutoOn ? '关闭自动模式' : '开启自动模式'}
            >
                <img
                    src={isAutoOn ? auto_button_on : auto_button}
                    alt="自动模式"
                    className={styles.buttonImage}
                />
            </button>

            <button
                className={styles.sguiButton}
                onClick={handleSkipClick}
                aria-label={isSkipOn ? '关闭跳过模式' : '开启跳过模式'}
            >
                <img
                    src={isSkipOn ? skip_button_on : skip_button}
                    alt="跳过模式"
                    className={styles.buttonImage}
                />
            </button>
        </div>
    );
}