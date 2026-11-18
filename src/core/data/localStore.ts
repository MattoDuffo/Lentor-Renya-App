import { blobToBase64, ConflictError, type DataStore, type StoredFile } from './store';
import { seed } from '../../demo/seed';

const PREFIX = 'lentor.demo:';

/**
 * Keeps files in this browser only. Used for "try it out" mode and development.
 * Missing files fall back to sample content so there is something to explore.
 */
export class LocalStore implements DataStore {
  async read(path: string): Promise<StoredFile> {
    const raw = localStorage.getItem(PREFIX + path);
    if (raw) return JSON.parse(raw) as StoredFile;
    const sample = seed[path];
    return sample ? { text: JSON.stringify(sample), version: '0' } : { text: null, version: null };
  }

  async write(path: string, text: string, baseVersion: string | null): Promise<string> {
    const current = await this.read(path);
    if (current.version !== baseVersion) throw new ConflictError();
    const version = String(Number(current.version ?? 0) + 1);
    this.save(PREFIX + path, JSON.stringify({ text, version }));
    return version;
  }

  async readBlob(path: string): Promise<Blob | null> {
    const dataUrl = localStorage.getItem(PREFIX + path);
    return dataUrl ? (await fetch(dataUrl)).blob() : null;
  }

  async writeBlob(path: string, blob: Blob): Promise<void> {
    this.save(PREFIX + path, `data:${blob.type};base64,${await blobToBase64(blob)}`);
  }

  private save(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      throw new Error('This phone is out of space for try-out data. Connect to GitHub to store more.');
    }
  }
}
