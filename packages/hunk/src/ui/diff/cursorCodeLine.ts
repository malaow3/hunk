import type { DiffFile } from "../../core/changeset/model";
import { reviewExpansionSide } from "../../core/review/expansion";
import { normalizedReviewSourceLines } from "../../core/review/geometry";
import type { LineCursor } from "../lib/lineCursors";
import { contextLineStableKeySides } from "./reviewRenderPlan";

/** Find a cursor's rendered source line in its patch or expanded source text. */
export function cursorPatchLine(
  file: DiffFile,
  cursor: LineCursor,
  sourceText?: string,
): string | undefined {
  if (cursor.fileId !== file.id) return undefined;
  if (cursor.expandedGapKey) {
    if (sourceText === undefined) return undefined;
    const sides = contextLineStableKeySides(cursor.stableKey);
    const side = reviewExpansionSide(file.metadata.type);
    const sourceLine = sides ? (side === "old" ? sides.oldLine : sides.newLine) : cursor.target.line;
    return normalizedReviewSourceLines(sourceText)[sourceLine - 1];
  }

  const hunk = file.metadata.hunks[cursor.hunkIndex];
  if (!hunk) return undefined;

  const old = cursor.target.side === "old";
  let line = old ? hunk.deletionStart : hunk.additionStart;
  let index = old ? hunk.deletionLineIndex : hunk.additionLineIndex;
  const lines = old ? file.metadata.deletionLines : file.metadata.additionLines;
  for (const content of hunk.hunkContent) {
    const count =
      content.type === "context" ? content.lines : old ? content.deletions : content.additions;
    if (cursor.target.line >= line && cursor.target.line < line + count) {
      return lines[index + cursor.target.line - line];
    }
    line += count;
    index += count;
  }
  return undefined;
}
