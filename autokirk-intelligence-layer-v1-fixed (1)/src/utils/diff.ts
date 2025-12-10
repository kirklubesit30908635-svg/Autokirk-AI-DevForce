import { diffLines } from "diff";

export interface DiffResult {
  added: string[];
  removed: string[];
  unchanged: string[];
}

export function computeLineDiff(oldContent: string, newContent: string): DiffResult {
  const changes = diffLines(oldContent, newContent);
  const added: string[] = [];
  const removed: string[] = [];
  const unchanged: string[] = [];

  for (const part of changes) {
    const lines = part.value.split("\n").filter(l => l.length > 0);
    if (part.added) {
      added.push(...lines);
    } else if (part.removed) {
      removed.push(...lines);
    } else {
      unchanged.push(...lines);
    }
  }

  return { added, removed, unchanged };
}