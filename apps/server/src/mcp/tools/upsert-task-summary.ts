import { z } from "zod";
import { resolveProject } from "../../core/project-resolver";
import { upsertSummary } from "../../services/summary-service";
import { TOOL_DESCRIPTIONS } from "../tool-descriptions";

export const upsertTaskSummarySchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(2000),
  workspace_path: z.string().optional(),
  git_root: z.string().optional(),
  remote_url: z.string().optional(),
  project_id: z.string().optional(),
  parent_task_id: z.string().optional(),
});

export const upsertTaskSummaryTool = {
  name: "upsert_task_summary" as const,
  description: TOOL_DESCRIPTIONS.upsert_task_summary,
  inputSchema: {
    type: "object" as const,
    properties: {
      title: {
        type: "string",
        description: "Short task title, e.g. 'Implement auth middleware'",
      },
      summary: {
        type: "string",
        description:
          "Current task state: what was done, blockers, next steps (max 2000 chars)",
      },
      workspace_path: { type: "string" },
      git_root: { type: "string" },
      remote_url: { type: "string" },
      project_id: { type: "string" },
      parent_task_id: {
        type: "string",
        description: "Optional parent task node ID for nesting",
      },
    },
    required: ["title", "summary"],
  },
  handler: async (input: z.infer<typeof upsertTaskSummarySchema>) => {
    const { project } = await resolveProject(input);

    const result = await upsertSummary(
      project.id,
      "task_summary",
      input.title,
      input.summary,
      input.parent_task_id,
    );
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ project_id: project.id, ...result }, null, 2),
        },
      ],
    };
  },
};
