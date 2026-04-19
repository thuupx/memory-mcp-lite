import { z } from "zod";
import { resolveProject } from "../../core/project-resolver";
import { upsertSummary } from "../../services/summary-service";
import { TOOL_META } from "../tool-descriptions";

export const upsertProjectSummaryInput = z.object({
  title: z
    .string()
    .min(1)
    .max(200)
    .describe("Project summary title, e.g. 'MyApp Project Overview'"),
  summary: z
    .string()
    .min(1)
    .max(2000)
    .describe(
      "Structured project summary: stack, key decisions, conventions, architecture (max 2000 chars)",
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
  display_name: z
    .string()
    .optional()
    .describe("Human-readable project name (displayed to users)"),
});

export const upsertProjectSummaryOutput = z.object({
  project_id: z.string(),
  summary_id: z.string(),
});

const meta = TOOL_META.upsert_project_summary;

export const upsertProjectSummaryTool = {
  name: "upsert_project_summary" as const,
  title: meta.title,
  description: meta.description,
  inputShape: upsertProjectSummaryInput.shape,
  outputShape: upsertProjectSummaryOutput.shape,
  annotations: {
    title: meta.title,
    readOnlyHint: meta.readOnly,
    destructiveHint: false,
    idempotentHint: meta.idempotent,
    openWorldHint: false,
  },
  handler: async (input: z.infer<typeof upsertProjectSummaryInput>) => {
    const { project } = await resolveProject(input);

    const result = await upsertSummary(
      project.id,
      "project_summary",
      input.title,
      input.summary,
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
