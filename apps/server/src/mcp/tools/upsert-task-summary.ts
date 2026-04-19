import { z } from "zod";
import { resolveProject } from "../../core/project-resolver";
import { upsertSummary } from "../../services/summary-service";
import { TOOL_META } from "../tool-descriptions";

export const upsertTaskSummaryInput = z.object({
  title: z
    .string()
    .min(1)
    .max(200)
    .describe("Short task title, e.g. 'Implement auth middleware'"),
  summary: z
    .string()
    .min(1)
    .max(2000)
    .describe(
      "Current task state: what was done, blockers, next steps (max 2000 chars)",
    ),
  workspace_path: z
    .string()
    .optional()
    .describe("Absolute path to the workspace root"),
  git_root: z
    .string()
    .optional()
    .describe("Absolute path to the git repository root"),
  remote_url: z.string().optional().describe("Git remote URL"),
  project_id: z.string().optional().describe("Explicit project id"),
  parent_task_id: z
    .string()
    .optional()
    .describe("Optional parent task node id for nesting"),
});

export const upsertTaskSummaryOutput = z.object({
  project_id: z.string(),
  summary_id: z.string(),
});

const meta = TOOL_META.upsert_task_summary;

export const upsertTaskSummaryTool = {
  name: "upsert_task_summary" as const,
  title: meta.title,
  description: meta.description,
  inputShape: upsertTaskSummaryInput.shape,
  outputShape: upsertTaskSummaryOutput.shape,
  annotations: {
    title: meta.title,
    readOnlyHint: meta.readOnly,
    destructiveHint: false,
    idempotentHint: meta.idempotent,
    openWorldHint: false,
  },
  handler: async (input: z.infer<typeof upsertTaskSummaryInput>) => {
    const { project } = await resolveProject(input);

    const result = await upsertSummary(
      project.id,
      "task_summary",
      input.title,
      input.summary,
      input.parent_task_id,
    );
    const structured = { project_id: project.id, summary_id: result.id };
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(structured, null, 2) },
      ],
      structuredContent: structured,
    };
  },
};
