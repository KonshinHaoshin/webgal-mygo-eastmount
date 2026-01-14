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
import { switchAuto } from '@/Core/controller/gamePlay/autoPlay';
import { switchFast } from '@/Core/controller/gamePlay/fastSkip';
import { WebGAL } from '@/Core/WebGAL';

export default function Sgui() {
    const [isAutoOn, setIsAutoOn] = useState(false);
    const [isSkipOn, setIsSkipOn] = useState(false);

    // 获取状态，类似BottomControlPanel的显示逻辑
    const GUIStore = useSelector((state: RootState) => state.GUI);
    const stageState = useSelector((state: RootState) => state.stage);

    // 监听游戏状态变化
    useEffect(() => {
        setIsAutoOn(WebGAL.gameplay.isAuto);
        setIsSkipOn(WebGAL.gameplay.isFast);
    }, []);

    // 定期更新按钮状态
    useEffect(() => {
        const interval = setInterval(() => {
            setIsAutoOn(WebGAL.gameplay.isAuto);
            setIsSkipOn(WebGAL.gameplay.isFast);
        }, 100); // 每100ms检查一次状态

        return () => clearInterval(interval);
    }, []);

    const handleAutoClick = () => {
        switchAuto();
        // 更新本地状态
        setIsAutoOn(WebGAL.gameplay.isAuto);
    };

    const handleSkipClick = () => {
        switchFast();
        // 更新本地状态
        setIsSkipOn(WebGAL.gameplay.isFast);
    };

    // 类似BottomControlPanel的显示条件
    const shouldShowSGUI = GUIStore.showTextBox && stageState.enableFilm === '';

    if (!shouldShowSGUI) {
        return null;
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