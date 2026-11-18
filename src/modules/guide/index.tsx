import { useState, type FormEvent } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { defineModule } from '../../core/module';
import { newId, useDoc } from '../../core/useDoc';
import { useSession } from '../../core/session';
import { Photo, PhotoListEditor } from '../../core/photos';
import { RichText } from '../../ui/RichText';
import { Empty, PageHeader, confirmDelete } from '../../ui/Page';
import { StatusLine } from '../../ui/StatusLine';

interface Article {
  id: string;
  title: string;
  topic: string;
  body: string;
  photos: string[];
  updatedBy: string;
  updatedAt: string;
}

interface GuideFile {
  articles: Article[];
}

const PATH = 'guide.json';
const EMPTY: GuideFile = { articles: [] };
const SUGGESTED_TOPICS = ['Kitchen', 'Laundry', 'Cleaning', 'Appliances', 'Where things go', 'Around the house'];

function byTopic(articles: Article[]): [string, Article[]][] {
  const groups = new Map<string, Article[]>();
  for (const a of articles) groups.set(a.topic || 'Other', [...(groups.get(a.topic || 'Other') ?? []), a]);
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([t, list]) => [t, list.sort((x, y) => x.title.localeCompare(y.title))]);
}

function GuideList() {
  const doc = useDoc<GuideFile>(PATH, EMPTY);
  return (
    <section>
      <PageHeader
        title="House guide"
        lede="How things work around the house, and where things go."
        action={
          <Link className="pill" to="new">
            + Add
          </Link>
        }
      />
      <StatusLine doc={doc} />
      {doc.data.articles.length === 0 && !doc.loading && <Empty>Nothing here yet. Add the first guide.</Empty>}
      {byTopic(doc.data.articles).map(([topic, list]) => (
        <div key={topic}>
          <h2>{topic}</h2>
          <ul className="menu">
            {list.map((a) => (
              <li key={a.id}>
                <Link to={a.id}>
                  {a.photos[0] ? <Photo path={a.photos[0]} className="menu-thumb" /> : <span className="menu-icon">📖</span>}
                  <span>{a.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function ArticleView() {
  const { id } = useParams();
  const doc = useDoc<GuideFile>(PATH, EMPTY);
  const a = doc.data.articles.find((x) => x.id === id);
  if (!a) return <section><PageHeader title="House guide" back="/guide" />{doc.loading ? <StatusLine doc={doc} /> : <Empty>This guide was removed.</Empty>}</section>;
  return (
    <article>
      <PageHeader
        title={a.title}
        back="/guide"
        action={
          <Link className="pill" to="edit">
            Edit
          </Link>
        }
      />
      <p className="tag">{a.topic}</p>
      <RichText text={a.body} />
      {a.photos.map((p) => (
        <Photo key={p} path={p} className="photo" />
      ))}
      <p className="hint">
        Last updated by {a.updatedBy}, {new Date(a.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </article>
  );
}

function ArticleEditor() {
  const { id } = useParams();
  const doc = useDoc<GuideFile>(PATH, EMPTY);
  const existing = doc.data.articles.find((x) => x.id === id);
  if (id && !existing) {
    return (
      <section>
        <PageHeader title="Edit guide" back="/guide" />
        {doc.loading ? <StatusLine doc={doc} /> : <Empty>This guide was removed.</Empty>}
      </section>
    );
  }
  return <ArticleForm key={existing?.id ?? 'new'} existing={existing} />;
}

function ArticleForm({ existing }: { existing?: Article }) {
  const navigate = useNavigate();
  const { person } = useSession();
  const doc = useDoc<GuideFile>(PATH, EMPTY);
  const [draft, setDraft] = useState(() => ({
    title: existing?.title ?? '',
    topic: existing?.topic ?? '',
    body: existing?.body ?? '',
    photos: existing?.photos ?? [],
  }));
  const topics = [...new Set([...SUGGESTED_TOPICS, ...doc.data.articles.map((a) => a.topic)])];

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const article: Article = {
      id: existing?.id ?? newId(),
      title: draft.title.trim(),
      topic: draft.topic.trim() || 'Other',
      body: draft.body,
      photos: draft.photos,
      updatedBy: person,
      updatedAt: new Date().toISOString(),
    };
    try {
      await doc.update(
        (f) => ({ articles: [...f.articles.filter((x) => x.id !== article.id), article] }),
        `${existing ? 'Update' : 'Add'} guide: ${article.title}`,
      );
      navigate(`/guide/${article.id}`, { replace: true });
    } catch {
      /* shown by StatusLine */
    }
  };

  const remove = async () => {
    if (!existing || !confirmDelete(`"${existing.title}"`)) return;
    try {
      await doc.update((f) => ({ articles: f.articles.filter((x) => x.id !== existing.id) }), `Remove guide: ${existing.title}`);
      navigate('/guide', { replace: true });
    } catch {
      /* shown by StatusLine */
    }
  };

  return (
    <section>
      <PageHeader title={existing ? 'Edit guide' : 'New guide'} back={existing ? `/guide/${existing.id}` : '/guide'} />
      <form onSubmit={save} className="form">
        <label>
          Title
          <input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Washing machine settings" />
        </label>
        <label>
          Topic
          <input list="guide-topics" value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} placeholder="e.g. Laundry" />
          <datalist id="guide-topics">
            {topics.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
        <label>
          Details
          <textarea
            rows={10}
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            placeholder={'Write it like you would explain it.\n\n- Start a line with "- " for a bullet\n1. or "1. " for steps'}
          />
        </label>
        <label>Photos</label>
        <PhotoListEditor photos={draft.photos} onChange={(photos) => setDraft({ ...draft, photos })} />
        <StatusLine doc={doc} />
        <button className="primary" disabled={doc.saving || !draft.title.trim()}>
          {doc.saving ? 'Saving…' : 'Save'}
        </button>
        {existing && (
          <button type="button" className="link danger" onClick={remove}>
            Delete this guide
          </button>
        )}
      </form>
    </section>
  );
}

function GuidePage() {
  return (
    <Routes>
      <Route index element={<GuideList />} />
      <Route path="new" element={<ArticleEditor />} />
      <Route path=":id" element={<ArticleView />} />
      <Route path=":id/edit" element={<ArticleEditor />} />
    </Routes>
  );
}

export default defineModule({
  id: 'guide',
  title: 'House guide',
  icon: '📖',
  description: 'How things work and where things go',
  Page: GuidePage,
  search: [
    {
      path: PATH,
      empty: EMPTY,
      items: (f: GuideFile) =>
        f.articles.map((a) => ({ title: a.title, snippet: a.topic, text: `${a.topic} ${a.body}`, to: `/guide/${a.id}` })),
    },
  ],
});
