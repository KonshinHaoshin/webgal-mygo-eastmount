import { useEffect, useRef, useState } from 'react';
import { CHAPTER_ENTER_EVENT, IChapterDef } from '@/Core/controller/gamePlay/chapterProgress';
import styles from './chapterToast.module.scss';

export default function ChapterToast() {
  const [chapter, setChapter] = useState<IChapterDef | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleChapterEnter = (event: Event) => {
      const nextChapter = (event as CustomEvent<IChapterDef>).detail;
      if (!nextChapter) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      setChapter(nextChapter);
      setVisible(true);
      timerRef.current = setTimeout(() => setVisible(false), 3600);
    };

    window.addEventListener(CHAPTER_ENTER_EVENT, handleChapterEnter);
    return () => {
      window.removeEventListener(CHAPTER_ENTER_EVENT, handleChapterEnter);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!chapter) return null;

  return (
    <div className={`${styles.ChapterToast} ${visible ? styles.ChapterToast_visible : ''}`} aria-live="polite">
      <div className={styles.ChapterToast_kicker}>进入章节</div>
      <div className={styles.ChapterToast_body}>
        <span>{chapter.no}</span>
        <strong>{chapter.title}</strong>
      </div>
      <div className={styles.ChapterToast_sub}>{chapter.titleEn}</div>
      <div className={styles.ChapterToast_save}>已自动存档</div>
    </div>
  );
}
