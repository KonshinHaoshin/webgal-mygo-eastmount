import { FC, useEffect } from 'react';
import { useValue } from '@/hooks/useValue';
import useTrans from '@/hooks/useTrans';
import useSoundEffect from '@/hooks/useSoundEffect';
import { getStorage } from '@/Core/controller/storage/storageController';
import { System } from './System/System';
import { Display } from './Display/Display';
import { Sound } from './Sound/Sound';
import titleIcon from '@/assets/image/title-icon.png';
import styles from './options.module.scss';

const OPTION_PAGE = {
  SYSTEM: 'SYSTEM',
  DISPLAY: 'DISPLAY',
  SOUND: 'SOUND',
} as const;

type OptionPage = (typeof OPTION_PAGE)[keyof typeof OPTION_PAGE];
export const Options: FC = () => {
  const { playSeEnter, playSeSwitch } = useSoundEffect();
  const currentOptionPage = useValue(OPTION_PAGE.SYSTEM as OptionPage);
  useEffect(getStorage, []);

  function getClassName(page: OptionPage) {
    if (page === currentOptionPage.value) {
      return styles.Options_page_button + ' ' + styles.Options_page_button_active;
    } else return styles.Options_page_button;
  }

  const t = useTrans('menu.options.');

  return (
    <div className={styles.Options_main}>
      <div className={styles.Options_top}>
        <img className={styles.Options_icon} src={titleIcon} alt="title-icon" />
        <div className={styles.Options_title}>
          <div className={styles.Option_title_text}>{t('title')}</div>
        </div>
      </div>
      <div className={styles.Options_page_container}>
        <div className={styles.Options_button_list}>
          <div
            onClick={() => {
              currentOptionPage.set(OPTION_PAGE.SYSTEM);
              playSeSwitch();
            }}
            className={getClassName(OPTION_PAGE.SYSTEM)}
            onMouseEnter={playSeEnter}
          >
            {t('pages.system.title')}
          </div>
          <div
            onClick={() => {
              currentOptionPage.set(OPTION_PAGE.DISPLAY);
              playSeSwitch();
            }}
            className={getClassName(OPTION_PAGE.DISPLAY)}
            onMouseEnter={playSeEnter}
          >
            {t('pages.display.title')}
          </div>
          <div
            onClick={() => {
              currentOptionPage.set(OPTION_PAGE.SOUND);
              playSeSwitch();
            }}
            className={getClassName(OPTION_PAGE.SOUND)}
            onMouseEnter={playSeEnter}
          >
            {t('pages.sound.title')}
          </div>
        </div>
        <div className={styles.Options_main_content}>
          {currentOptionPage.value === OPTION_PAGE.DISPLAY && <Display />}
          {currentOptionPage.value === OPTION_PAGE.SYSTEM && <System />}
          {currentOptionPage.value === OPTION_PAGE.SOUND && <Sound />}
        </div>
      </div>
    </div>
  );
};
