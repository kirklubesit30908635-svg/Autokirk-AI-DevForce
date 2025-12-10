import { isProtectedPath } from "../services/protection";
import { ModelClient } from "../services/ModelClient";
import { computeLineDiff, DiffResult } from "../utils/diff";

export interface UpdateRequestContext {
  path: string;
  instruction: string;
  currentContent: string;
  actor: string; // e.g., "founder", "system", etc.
}

export interface GovernanceDecision {
  allowed: boolean;
  reason?: string;
  riskLevel: "low" | "medium" | "high";
}

export interface TransformOutcome {
  newContent: string;
  reasoning: string;
  diff: DiffResult;
  governance: GovernanceDecision;
}

export class AutokirkOS {
  private model: ModelClient;

  constructor(modelClient?: ModelClient) {
    this.model = modelClient ?? new ModelClient();
  }

  evaluateUpdateRequest(ctx: UpdateRequestContext): GovernanceDecision {
    if (isProtectedPath(ctx.path)) {
      return {
        allowed: false,
        reason: `Path ${ctx.path} is protected.`,
        riskLevel: "high",
      };
    }

    // Simple v1 risk model:
    const lowered = ctx.instruction.toLowerCase();
    if (lowered.includes("delete") || lowered.includes("wipe")) {
      return {
        allowed: false,
        reason: "Destructive instructions are blocked by v1 governance.",
        riskLevel: "high",
      };
    }

    return {
      allowed: true,
      riskLevel: "low",
    };
  }

  async transform(ctx: UpdateRequestContext): Promise<TransformOutcome> {
    const governance = this.evaluateUpdateRequest(ctx);
    if (!governance.allowed) {
      throw new Error(`AutokirkOS blocked update: ${governance.reason}`);
    }

    const { newContent, reasoning } = await this.model.transformFile({
      path: ctx.path,
      currentContent: ctx.currentContent,
      instruction: ctx.instruction,
    });

    const diff = computeLineDiff(ctx.currentContent, newContent);

    return {
      newContent,
      reasoning,
      diff,
      governance,
    };
  }
}