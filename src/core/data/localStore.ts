import { ConflictError, type DataStore, type StoredFile } from './store';

const PREFIX = 'lentor.demo:';

/** Keeps files in this browser only. Used for "try it out" mode and development. */
export class LocalStore implements DataStore {
  async read(path: string): Promise<StoredFile> {
    const raw = localStorage.getItem(PREFIX + path);
    if (!raw) return { text: null, version: null };
    return JSON.parse(raw) as StoredFile;
  }

  async write(path: string, text: string, baseVersion: string | null): Promise<string> {
    const current = await this.read(path);
    if (current.version !== baseVersion) throw new ConflictError();
    const version = String(Number(current.version ?? 0) + 1);
    localStorage.setItem(PREFIX + path, JSON.stringify({ text, version }));
    return version;
  }
}
