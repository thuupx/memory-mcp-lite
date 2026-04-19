import { z } from "zod";
import { resolveProject } from "../../core/project-resolver";
import { getProjectSummary } from "../../services/summary-service";
import { TOOL_META } from "../tool-descriptions";

const summarySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  updated_at: z.string(),
});

export const getProjectSummaryInput = z.object({
  workspace_path: z
    .string()
    .optional()
    .describe("Absolute path to the workspace root, e.g. /Users/me/code/app"),
  git_root: z
    .string()
    .optional()
    .describe("Absolute path to the git repository root"),
  remote_url: z
    .string()
    .optional()
    .describe("Git remote URL, e.g. https://github.com/org/repo"),
  project_id: z
    .string()
    .optional()
    .describe("Explicit project id (skip auto-resolution when known)"),
});

export const getProjectSummaryOutput = z.object({
  project_id: z.string(),
  found: z.boolean(),
  summary: summarySchema.nullable(),
});

const meta = TOOL_META.get_project_summary;

export const getProjectSummaryTool = {
  name: "get_project_summary" as const,
  title: meta.title,
  description: meta.description,
  inputShape: getProjectSummaryInput.shape,
  outputShape: getProjectSummaryOutput.shape,
  annotations: {
    title: meta.title,
    readOnlyHint: meta.readOnly,
    destructiveHint: false,
    idempotentHint: meta.idempotent,
    openWorldHint: false,
  },
  handler: async (input: z.infer<typeof getProjectSummaryInput>) => {
    const { project } = await resolveProject(input);
    const summary = await getProjectSummary(project.id);
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
