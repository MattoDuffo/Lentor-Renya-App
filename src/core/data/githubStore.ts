import { ConflictError, type DataStore, type StoredFile } from './store';

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string; // household data lives on its own branch, apart from the app code
  token: string;
}

const API = 'https://api.github.com';

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function fromBase64(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Stores files in a GitHub repository branch through the REST contents API. */
export class GitHubStore implements DataStore {
  private branchReady: Promise<void> | null = null;

  constructor(private cfg: GitHubConfig) {}

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`${API}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.cfg.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  }

  private contentsUrl(path: string): string {
    const { owner, repo } = this.cfg;
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    return `/repos/${owner}/${repo}/contents/${encoded}`;
  }

  /** Checks that the token works and the repo is reachable. */
  async verify(): Promise<void> {
    const res = await this.request(`/repos/${this.cfg.owner}/${this.cfg.repo}`);
    if (res.status === 401) throw new Error('That access key was not accepted.');
    if (res.status === 404) throw new Error('Repository not found, or the key cannot see it.');
    if (!res.ok) throw new Error(`GitHub said: ${res.status}`);
  }

  /** Creates the data branch from the default branch the first time it is needed. */
  private ensureBranch(): Promise<void> {
    this.branchReady ??= (async () => {
      const { owner, repo, branch } = this.cfg;
      const existing = await this.request(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
      if (existing.ok) return;
      const repoInfo = await (await this.request(`/repos/${owner}/${repo}`)).json();
      const base = await this.request(`/repos/${owner}/${repo}/git/ref/heads/${repoInfo.default_branch}`);
      if (!base.ok) throw new Error('Could not find the default branch to start the data branch from.');
      const sha = (await base.json()).object.sha;
      const created = await this.request(`/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
      });
      if (!created.ok && created.status !== 422) throw new Error(`Could not create data branch (${created.status}).`);
    })().catch((e) => {
      this.branchReady = null;
      throw e;
    });
    return this.branchReady;
  }

  async read(path: string): Promise<StoredFile> {
    const res = await this.request(`${this.contentsUrl(path)}?ref=${encodeURIComponent(this.cfg.branch)}`);
    if (res.status === 404) return { text: null, version: null };
    if (!res.ok) throw new Error(`Could not load ${path} (${res.status}).`);
    const body = await res.json();
    return { text: fromBase64(body.content ?? ''), version: body.sha };
  }

  async write(path: string, text: string, baseVersion: string | null, message: string): Promise<string> {
    await this.ensureBranch();
    const res = await this.request(this.contentsUrl(path), {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: toBase64(text),
        branch: this.cfg.branch,
        ...(baseVersion ? { sha: baseVersion } : {}),
      }),
    });
    if (res.status === 409 || res.status === 422) throw new ConflictError();
    if (!res.ok) throw new Error(`Could not save ${path} (${res.status}).`);
    return (await res.json()).content.sha;
  }
}
