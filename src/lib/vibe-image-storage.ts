/**
 * Vibe Transfer のリファレンス画像 (base64) を IndexedDB に保存する。
 *
 * Zustand persist は localStorage を使うが、リファレンス画像は 1 枚あたり
 * 数 MB に達し得るため localStorage の 5-10 MB 枠を簡単に食い潰す。
 * そのため `vibeConfigs[].referenceImage.image` は永続化対象から外し、
 * 画像本体だけを別途 IndexedDB に逃がす。
 *
 * キーは vibeConfig.id を流用する。
 */

const DB_NAME = "novel-ai-useful";
const DB_VERSION = 1;
const STORE = "vibe-images";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB が利用できません"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function setVibeImage(id: string, base64: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(base64, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function deleteVibeImage(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getAllVibeImages(): Promise<Record<string, string>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const result: Record<string, string> = {};
    const cursorReq = store.openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor) {
        resolve(result);
        return;
      }
      result[cursor.key as string] = cursor.value as string;
      cursor.continue();
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  });
}

/**
 * 古い localStorage 永続化で残った vibeConfigs に IndexedDB の画像を埋め込む。
 * 純関数 (副作用なし)。テスト可能。
 */
export function hydrateVibeConfigsWithImages<
  T extends { id: string; referenceImage: { image: string } },
>(configs: T[], images: Record<string, string>): T[] {
  return configs.map((v) => ({
    ...v,
    referenceImage: {
      ...v.referenceImage,
      image: images[v.id] ?? v.referenceImage.image,
    },
  }));
}
