import { useEffect, useState } from 'react';
import { useSession } from './session';
import { newId } from './useDoc';
import type { DataStore } from './data/store';

const MAX_SIDE = 1280;
const CACHE_NAME = 'lentor-photos';

/** Shrinks a camera photo to a sensible size before upload. */
async function resize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read that photo.'))), 'image/jpeg', 0.8),
  );
}

/** Photos never change once saved, so they are cached on the phone indefinitely. */
const memory = new Map<string, Promise<string | null>>();

async function cachedBlob(store: DataStore, path: string): Promise<Blob | null> {
  const key = `/photo/${path}`;
  try {
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(key);
    if (hit) return hit.blob();
    const blob = await store.readBlob(path);
    if (blob) await cache.put(key, new Response(blob));
    return blob;
  } catch {
    return store.readBlob(path); // Cache API unavailable (private mode etc.)
  }
}

export function usePhotoUrl(path: string | undefined): string | null {
  const { store } = useSession();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let alive = true;
    if (!memory.has(path)) {
      memory.set(
        path,
        cachedBlob(store, path)
          .then((b) => (b ? URL.createObjectURL(b) : null))
          .catch(() => {
            memory.delete(path);
            return null;
          }),
      );
    }
    memory.get(path)!.then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [store, path]);
  return url;
}

export function Photo({ path, alt = '', className }: { path: string; alt?: string; className?: string }) {
  const url = usePhotoUrl(path);
  return url ? <img src={url} alt={alt} className={className ?? 'photo'} /> : <div className={`${className ?? 'photo'} photo-placeholder`} />;
}

/** "Add photo" button: resizes, uploads and reports the stored path. */
export function PhotoButton({ onAdded, label = '📷 Add photo' }: { onAdded: (path: string) => void; label?: string }) {
  const { store, person } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await resize(file);
      const path = `photos/${newId()}.jpg`;
      await store.writeBlob(path, blob, `Add photo (${person})`);
      onAdded(path);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="photo-button">
      <label className={`secondary small ${busy ? 'busy' : ''}`}>
        {busy ? 'Uploading…' : label}
        <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      {error && <p className="status error">{error}</p>}
    </div>
  );
}

/** Editable row of photos with remove buttons and an add button. */
export function PhotoListEditor({ photos, onChange }: { photos: string[]; onChange: (photos: string[]) => void }) {
  return (
    <div className="photo-editor">
      {photos.length > 0 && (
        <div className="photo-strip">
          {photos.map((p) => (
            <div key={p} className="photo-thumb">
              <Photo path={p} className="thumb" />
              <button type="button" aria-label="Remove photo" onClick={() => onChange(photos.filter((x) => x !== p))}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <PhotoButton onAdded={(p) => onChange([...photos, p])} />
    </div>
  );
}
