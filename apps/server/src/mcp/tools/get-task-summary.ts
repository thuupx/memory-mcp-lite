import { z } from "zod";
import { resolveProject } from "../../core/project-resolver";
import { getTaskSummary } from "../../services/summary-service";
import { TOOL_META } from "../tool-descriptions";

const summarySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  updated_at: z.string(),
});

export const getTaskSummaryInput = z.object({
  workspace_path: z
    .string()
    .optional()
    .describe("Absolute path to the workspace root"),
  git_root: z
    .string()
    .optional()
    .describe("Absolute path to the git repository root"),
  remote_url: z.string().optional().describe("Git remote URL for the project"),
  project_id: z.string().optional().describe("Explicit project id"),
  task_id: z
    .string()
    .optional()
    .describe("Optional task node id to scope the summary to"),
});

export const getTaskSummaryOutput = z.object({
  project_id: z.string(),
  found: z.boolean(),
  summary: summarySchema.nullable(),
});

const meta = TOOL_META.get_task_summary;

export const getTaskSummaryTool = {
  name: "get_task_summary" as const,
  title: meta.title,
  description: meta.description,
  inputShape: getTaskSummaryInput.shape,
  outputShape: getTaskSummaryOutput.shape,
  annotations: {
    title: meta.title,
    readOnlyHint: meta.readOnly,
    destructiveHint: false,
    idempotentHint: meta.idempotent,
    openWorldHint: false,
  },
  handler: async (input: z.infer<typeof getTaskSummaryInput>) => {
    const { project } = await resolveProject(input);
    const summary = await getTaskSummary(project.id, input.task_id);
    const structured = {
      project_id: project.id,
      found: summary !== null,
      summary,
    };
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(structured, null, 2) },
      ],
      structuredContent: structured,
    };
  },
};
