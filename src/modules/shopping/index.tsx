import { useState, type FormEvent } from 'react';
import { defineModule } from '../../core/module';
import { newId, useDoc } from '../../core/useDoc';
import { useSession } from '../../core/session';
import { Photo, PhotoButton } from '../../core/photos';
import { Empty, PageHeader } from '../../ui/Page';
import { StatusLine } from '../../ui/StatusLine';

interface Item {
  id: string;
  name: string;
  qty?: string;
  shop: string;
  note?: string;
  photo?: string;
  by: string;
  done: boolean;
}

/** Things bought before, so re-adding "Milo" brings back its shop and photo. */
interface Known {
  name: string;
  shop: string;
  photo?: string;
  note?: string;
}

interface ShoppingFile {
  items: Item[];
  shops: string[];
  known: Known[];
}

const PATH = 'shopping.json';
const DEFAULT_SHOPS = ['Supermarket', 'Wet market', 'Online', 'Pharmacy', 'Other'];
const EMPTY: ShoppingFile = { items: [], shops: DEFAULT_SHOPS, known: [] };

function remember(known: Known[], item: Item): Known[] {
  const rest = known.filter((k) => k.name.toLowerCase() !== item.name.toLowerCase());
  return [{ name: item.name, shop: item.shop, photo: item.photo, note: item.note }, ...rest].slice(0, 300);
}

function ItemDetails({ item, shops, onChange, onRemove }: { item: Item; shops: string[]; onChange: (i: Item) => void; onRemove: () => void }) {
  const [d, setD] = useState(item);
  return (
    <div className="item-details">
      <label>
        Quantity
        <input value={d.qty ?? ''} onChange={(e) => setD({ ...d, qty: e.target.value })} placeholder="e.g. 2 packs" />
      </label>
      <label>
        Shop
        <select value={d.shop} onChange={(e) => setD({ ...d, shop: e.target.value })}>
          {shops.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        Note
        <input value={d.note ?? ''} onChange={(e) => setD({ ...d, note: e.target.value })} placeholder="e.g. the blue tin, not the green one" />
      </label>
      {d.photo ? (
        <div className="photo-thumb">
          <Photo path={d.photo} className="thumb" />
          <button type="button" aria-label="Remove photo" onClick={() => setD({ ...d, photo: undefined })}>
            ✕
          </button>
        </div>
      ) : (
        <PhotoButton label="📷 Add product photo" onAdded={(photo) => setD({ ...d, photo })} />
      )}
      <div className="row">
        <button className="pill" onClick={() => onChange({ ...d, qty: d.qty?.trim() || undefined, note: d.note?.trim() || undefined })}>
          Done
        </button>
        <button className="pill ghost danger" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}

function ShoppingPage() {
  const { person } = useSession();
  const doc = useDoc<ShoppingFile>(PATH, EMPTY);
  const { items, known } = doc.data;
  const shops = doc.data.shops?.length ? doc.data.shops : DEFAULT_SHOPS;
  const [name, setName] = useState('');
  const [shop, setShop] = useState(shops[0]);
  const [open, setOpen] = useState<string | null>(null);

  const onName = (value: string) => {
    setName(value);
    const match = known.find((k) => k.name.toLowerCase() === value.trim().toLowerCase());
    if (match && shops.includes(match.shop)) setShop(match.shop);
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    const match = known.find((k) => k.name.toLowerCase() === value.toLowerCase());
    const item: Item = { id: newId(), name: match?.name ?? value, shop, photo: match?.photo, note: match?.note, by: person, done: false };
    doc.update((f) => ({ ...f, items: [...f.items, item], known: remember(f.known, item) }), `Shopping: add ${item.name}`).catch(() => {});
    setName('');
  };

  const patch = (id: string, change: (i: Item) => Item, message: string) =>
    doc
      .update((f) => {
        const target = f.items.find((i) => i.id === id);
        if (!target) return f;
        const next = change(target);
        return { ...f, items: f.items.map((i) => (i.id === id ? next : i)), known: remember(f.known, next) };
      }, message)
      .catch(() => {});

  const remove = (id: string) => doc.update((f) => ({ ...f, items: f.items.filter((i) => i.id !== id) }), 'Shopping: remove item').catch(() => {});
  const clearDone = () => doc.update((f) => ({ ...f, items: f.items.filter((i) => !i.done) }), 'Shopping: clear ticked items').catch(() => {});

  const toGet = items.filter((i) => !i.done);
  const got = items.filter((i) => i.done);

  const row = (i: Item) => (
    <li key={i.id} className={i.done ? 'done' : ''}>
      <div className="shop-row">
        <input type="checkbox" aria-label={`Got ${i.name}`} checked={i.done} onChange={() => patch(i.id, (x) => ({ ...x, done: !x.done }), `Shopping: ${i.done ? 'untick' : 'tick'} ${i.name}`)} />
        <button className="shop-name" onClick={() => setOpen(open === i.id ? null : i.id)}>
          <span>
            {i.name}
            {i.qty && <em> · {i.qty}</em>}
          </span>
          {i.note && <small>{i.note}</small>}
        </button>
        {i.photo && <Photo path={i.photo} className="shop-thumb" />}
      </div>
      {open === i.id && (
        <ItemDetails
          item={i}
          shops={shops}
          onChange={(next) => {
            patch(i.id, () => next, `Shopping: update ${next.name}`);
            setOpen(null);
          }}
          onRemove={() => {
            remove(i.id);
            setOpen(null);
          }}
        />
      )}
    </li>
  );

  return (
    <section>
      <PageHeader title="Shopping list" lede="Add anything we need. Tap an item for quantity, notes or a photo." />
      <form className="add-item" onSubmit={add}>
        <input list="known-items" value={name} onChange={(e) => onName(e.target.value)} placeholder="Add an item…" />
        <datalist id="known-items">
          {known.map((k) => (
            <option key={k.name} value={k.name} />
          ))}
        </datalist>
        <select value={shop} onChange={(e) => setShop(e.target.value)} aria-label="Shop">
          {shops.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="pill" disabled={!name.trim()}>
          Add
        </button>
      </form>
      <StatusLine doc={doc} />
      {toGet.length === 0 && !doc.loading && <Empty>The list is empty. 🎉</Empty>}
      {shops
        .filter((s) => toGet.some((i) => i.shop === s))
        .concat(toGet.some((i) => !shops.includes(i.shop)) ? ['Other shops'] : [])
        .map((s) => (
          <div key={s}>
            <h2>{s}</h2>
            <ul className="shopping">{toGet.filter((i) => (s === 'Other shops' ? !shops.includes(i.shop) : i.shop === s)).map(row)}</ul>
          </div>
        ))}
      {got.length > 0 && (
        <div>
          <div className="title-row">
            <h2>In the basket</h2>
            <button className="link small" onClick={clearDone}>
              Clear these
            </button>
          </div>
          <ul className="shopping">{got.map(row)}</ul>
        </div>
      )}
    </section>
  );
}

function ShoppingToday() {
  const doc = useDoc<ShoppingFile>(PATH, EMPTY);
  const toGet = doc.data.items.filter((i) => !i.done);
  if (toGet.length === 0) return null;
  const byShop = new Map<string, number>();
  toGet.forEach((i) => byShop.set(i.shop, (byShop.get(i.shop) ?? 0) + 1));
  return (
    <ul className="kv">
      {[...byShop.entries()].map(([shop, n]) => (
        <li key={shop}>
          <span>{shop}</span>
          <span>
            {n} item{n === 1 ? '' : 's'}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default defineModule({
  id: 'shopping',
  title: 'Shopping',
  icon: '🛒',
  description: 'Our shared shopping list',
  Page: ShoppingPage,
  TodayCard: ShoppingToday,
  todayOrder: 30,
  search: [
    {
      path: PATH,
      empty: EMPTY,
      items: (f: ShoppingFile) =>
        f.items.filter((i) => !i.done).map((i) => ({ title: i.name, snippet: `On the shopping list · ${i.shop}`, text: i.note, to: '/shopping' })),
    },
  ],
});
