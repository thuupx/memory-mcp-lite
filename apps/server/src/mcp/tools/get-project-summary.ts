import { z } from "zod";
import { resolveProject } from "../../core/project-resolver";
import { getProjectSummary } from "../../services/summary-service";
import { TOOL_DESCRIPTIONS } from "../tool-descriptions";

export const getProjectSummarySchema = z.object({
  workspace_path: z.string().optional(),
  git_root: z.string().optional(),
  remote_url: z.string().optional(),
  project_id: z.string().optional(),
});

export const getProjectSummaryTool = {
  name: "get_project_summary" as const,
  description: TOOL_DESCRIPTIONS.get_project_summary,
  inputSchema: {
    type: "object" as const,
    properties: {
      workspace_path: { type: "string", description: "Absolute path to the workspace root" },
      git_root: { type: "string", description: "Absolute path to the git repository root" },
      remote_url: { type: "string", description: "Git remote URL for the project" },
      project_id: { type: "string", description: "Explicit project ID if known" },
    },
    required: [],
  },
  handler: async (input: z.infer<typeof getProjectSummarySchema>) => {
    const { project } = await resolveProject(input);
    const result = await getProjectSummary(project.id);
    if (!result) {
      return {
        ok: true,
        data: null,
        project_id: project.id,
        message: "No project summary found.",
      };
    }
    return { ok: true, data: result, project_id: project.id };
  },
};
