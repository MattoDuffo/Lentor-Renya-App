/**
 * A DataStore reads and writes files. Each text write carries the version it
 * was based on, so concurrent edits are detected rather than overwritten.
 * Photos (blobs) are written once under a unique name and never change.
 */
export interface StoredFile {
  text: string | null; // null when the file does not exist yet
  version: string | null;
}

export interface DataStore {
  read(path: string): Promise<StoredFile>;
  write(path: string, text: string, baseVersion: string | null, message: string): Promise<string>;
  readBlob(path: string): Promise<Blob | null>;
  writeBlob(path: string, blob: Blob, message: string): Promise<void>;
}

/** Thrown when the file changed since it was read. Callers re-read and retry. */
export class ConflictError extends Error {
  constructor() {
    super('The file was changed by someone else.');
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
