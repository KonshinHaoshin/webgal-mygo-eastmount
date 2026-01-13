import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import styles from './SGUI.module.scss';
// 导入sg素材
import auto_button_on from '@/assets/image/sg/auto_button_on.png';
import auto_button from '@/assets/image/sg/auto_button.png';
import skip_button from '@/assets/image/sg/skip_button.png';
import skip_button_on from '@/assets/image/sg/skip_button_on.png';

export default function Sgui() {
    const [isAutoOn, setIsAutoOn] = useState(false);
    const [isSkipOn, setIsSkipOn] = useState(false);

    // 获取状态，类似BottomControlPanel的显示逻辑
    const GUIStore = useSelector((state: RootState) => state.GUI);
    const stageState = useSelector((state: RootState) => state.stage);

    const handleAutoClick = () => {
        setIsAutoOn(!isAutoOn);
        // 这里可以添加auto模式的实际逻辑
        console.log('Auto mode:', !isAutoOn ? 'ON' : 'OFF');
    };

    const handleSkipClick = () => {
        setIsSkipOn(!isSkipOn);
        // 这里可以添加skip模式的实际逻辑
        console.log('Skip mode:', !isSkipOn ? 'ON' : 'OFF');
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