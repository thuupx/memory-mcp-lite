import { z } from "zod";
import { resolveProject } from "../../core/project-resolver";
import { getTaskSummary } from "../../services/summary-service";
import { TOOL_DESCRIPTIONS } from "../tool-descriptions";

export const getTaskSummarySchema = z.object({
  workspace_path: z.string().optional(),
  git_root: z.string().optional(),
  remote_url: z.string().optional(),
  project_id: z.string().optional(),
  task_id: z.string().optional(),
});

export const getTaskSummaryTool = {
  name: "get_task_summary" as const,
  description: TOOL_DESCRIPTIONS.get_task_summary,
  inputSchema: {
    type: "object" as const,
    properties: {
      workspace_path: { type: "string" },
      git_root: { type: "string" },
      remote_url: { type: "string" },
      project_id: { type: "string" },
      task_id: {
        type: "string",
        description: "Optional task node ID to scope the summary to",
      },
    },
    required: [],
  },
  handler: async (input: z.infer<typeof getTaskSummarySchema>) => {
    const { project } = await resolveProject(input);
    const result = await getTaskSummary(project.id, input.task_id);
    if (!result) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No task summary found for ${project.id}.`,
          },
        ],
      };
    }
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
