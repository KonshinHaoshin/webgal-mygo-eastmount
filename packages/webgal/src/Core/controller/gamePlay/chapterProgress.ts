import { logger } from '@/Core/util/logger';
import { fastSaveGame } from '@/Core/controller/storage/fastSaveLoad';

export interface IChapterDef {
  id: string;
  no: string;
  title: string;
  titleEn: string;
  scene?: string;
  summary?: string;
  progress?: number;
  locked?: boolean;
}

export const CHAPTER_ENTER_EVENT = 'webgal:chapter-enter';

let chapterCache: IChapterDef[] | null = null;
let chapterLoadPromise: Promise<IChapterDef[]> | null = null;

function normalizeSceneName(sceneName: string) {
  return sceneName.replaceAll('\\', '/').split('/').pop() ?? sceneName;
}

export async function loadChapterDefs() {
  if (chapterCache) return chapterCache;
  if (!chapterLoadPromise) {
    chapterLoadPromise = fetch('./game/chapters.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: IChapterDef[]) => {
        chapterCache = Array.isArray(data) ? data : [];
        return chapterCache;
      })
      .catch((e) => {
        logger.warn('章节信息读取失败', e);
        chapterCache = [];
        return chapterCache;
      });
  }
  return chapterLoadPromise;
}

export async function getChapterByScene(sceneName: string) {
  const targetScene = normalizeSceneName(sceneName);
  const chapters = await loadChapterDefs();
  return chapters.find((chapter) => chapter.scene && normalizeSceneName(chapter.scene) === targetScene) ?? null;
}

export async function handleChapterEnter(sceneName: string) {
  const chapter = await getChapterByScene(sceneName);
  if (!chapter) return;

  window.dispatchEvent(new CustomEvent<IChapterDef>(CHAPTER_ENTER_EVENT, { detail: chapter }));

  try {
    await fastSaveGame();
    logger.info(`进入章节 ${chapter.no} ${chapter.title}，已自动存档`);
  } catch (e) {
    logger.warn(`进入章节 ${chapter.no} ${chapter.title} 后自动存档失败`, e);
  }
}
