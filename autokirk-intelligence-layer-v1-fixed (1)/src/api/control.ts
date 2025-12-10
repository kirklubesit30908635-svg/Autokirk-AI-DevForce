import express, { Request, Response } from "express";
import { ActionHandler } from "../services/ActionHandler";

const router = express.Router();
const handler = new ActionHandler();

// POST /control/execute
router.post("/execute", async (req: Request, res: Response) => {
  try {
    const { instruction, path, description, actor } = req.body || {};

    if (!instruction || !path || !description) {
      return res.status(400).json({
        status: "error",
        message: "instruction, path, and description are required",
      });
    }

    const result = await handler.handleUpdateFile({
      type: "update_file",
      path,
      description,
      instruction,
      actor: actor || "founder",
    });

    return res.json({
      status: "success",
      action_plan: `Apply instruction to ${path} and commit.`,
      git: {
        commit_id: result.commitSha,
        files_changed: [path],
      },
      diff: result.diff,
      governance: result.governance,
      reasoning: result.reasoning,
      deployment: {
        status: "not_triggered",
        url: null,
      },
    });
  } catch (err: any) {
    console.error("Control API error:", err);
    return res.status(500).json({
      status: "error",
      message: err.message || "Internal server error",
    });
  }
});

export default router;