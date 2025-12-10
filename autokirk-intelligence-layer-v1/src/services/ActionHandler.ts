import { GitHubService } from "./GitHubService";
import { AutokirkOS } from "../os/AutokirkOS";

export type ActionType = "update_file";

export interface UpdateFileInstruction {
  type: ActionType;
  path: string;
  description: string;
  instruction: string;
  actor?: string;
}

export class ActionHandler {
  private git: GitHubService;
  private os: AutokirkOS;

  constructor(gitService?: GitHubService, os?: AutokirkOS) {
    this.git = gitService ?? new GitHubService();
    this.os = os ?? new AutokirkOS();
  }

  async handleUpdateFile(input: UpdateFileInstruction) {
    const { path, description, instruction } = input;
    const actor = input.actor || "founder";

    // 1. Read current file
    const file = await this.git.getFile(path);

    // 2. Ask AutokirkOS to transform content under governance
    const outcome = await this.os.transform({
      path,
      instruction,
      currentContent: file.content,
      actor,
    });

    // 3. Commit updated content
    const result = await this.git.updateFile(
      path,
      outcome.newContent,
      `[Autokirk] ${description}`,
      file.sha
    );

    return {
      status: "success" as const,
      path,
      commitSha: result.commitSha,
      fileSha: result.fileSha,
      diff: outcome.diff,
      governance: outcome.governance,
      reasoning: outcome.reasoning,
    };
  }
}