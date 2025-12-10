import fetch from "node-fetch";

const GITHUB_API = "https://api.github.com";

interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export class GitHubService {
  private config: GitHubConfig;

  constructor(config?: Partial<GitHubConfig>) {
    this.config = {
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      branch: process.env.GITHUB_BRANCH || "main",
      token: process.env.GITHUB_TOKEN!,
      ...config,
    };
  }

  private get headers() {
    return {
      "Authorization": `Bearer ${this.config.token}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "Autokirk-Control-Mesh",
    };
  }

  async getFile(path: string) {
    const url = `${GITHUB_API}/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(path)}?ref=${this.config.branch}`;
    const res = await fetch(url as any, { headers: this.headers as any });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GitHub getFile failed: ${res.status} ${res.statusText} – ${text}`);
    }

    const data: any = await res.json();
    const content = Buffer.from(data.content, data.encoding || "base64").toString("utf8");

    return {
      path,
      sha: data.sha,
      content,
    };
  }

  async updateFile(path: string, newContent: string, message: string, sha?: string) {
    const url = `${GITHUB_API}/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(path)}`;

    const body = {
      message,
      content: Buffer.from(newContent, "utf8").toString("base64"),
      branch: this.config.branch,
      ...(sha ? { sha } : {}),
    };

    const res = await fetch(url as any, {
      method: "PUT",
      headers: {
        ...this.headers,
        "Content-Type": "application/json",
      } as any,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GitHub updateFile failed: ${res.status} ${res.statusText} – ${text}`);
    }

    const data: any = await res.json();

    return {
      path,
      commitSha: data.commit?.sha,
      fileSha: data.content?.sha,
    };
  }
}