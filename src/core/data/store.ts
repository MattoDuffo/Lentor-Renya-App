/**
 * A DataStore reads and writes text files. Each write carries the version it
 * was based on, so concurrent edits are detected rather than overwritten.
 */
export interface StoredFile {
  text: string | null; // null when the file does not exist yet
  version: string | null;
}

export interface DataStore {
  read(path: string): Promise<StoredFile>;
  write(path: string, text: string, baseVersion: string | null, message: string): Promise<string>;
}

/** Thrown when the file changed since it was read. Callers re-read and retry. */
export class ConflictError extends Error {
  constructor() {
    super('The file was changed by someone else.');
  }
}
