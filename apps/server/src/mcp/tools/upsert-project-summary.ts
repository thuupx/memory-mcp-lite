import { z } from "zod";
import { resolveProject } from "../../core/project-resolver.js";
import { upsertSummary } from "../../services/summary-service.js";
import { TOOL_DESCRIPTIONS } from "../tool-descriptions.js";

export const upsertProjectSummarySchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(2000),
  workspace_path: z.string().optional(),
  git_root: z.string().optional(),
  remote_url: z.string().optional(),
  project_id: z.string().optional(),
  display_name: z.string().optional(),
});

export const upsertProjectSummaryTool = {
  name: "upsert_project_summary" as const,
  description: TOOL_DESCRIPTIONS.upsert_project_summary,
  inputSchema: {
    type: "object" as const,
    properties: {
      title: {
        type: "string",
        description: "Project summary title, e.g. 'MyApp Project Overview'",
      },
      summary: {
        type: "string",
        description:
          "Structured project summary: stack, key decisions, conventions, architecture (max 2000 chars)",
      },
      workspace_path: { type: "string" },
      git_root: { type: "string" },
      remote_url: { type: "string" },
      project_id: { type: "string" },
      display_name: { type: "string", description: "Human-readable project name" },
    },
    required: ["title", "summary"],
  },
  handler: async (input: z.infer<typeof upsertProjectSummarySchema>) => {
    const { project } = await resolveProject(input);

    const result = await upsertSummary(project.id, "project_summary", input.title, input.summary);
    return { ok: true, data: result, project_id: project.id };
  },
};
