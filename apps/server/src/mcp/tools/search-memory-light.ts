import { z } from "zod";
import { resolveProject } from "../../core/project-resolver.js";
import { searchMemoryLight } from "../../services/search-service.js";
import { TOOL_DESCRIPTIONS } from "../tool-descriptions.js";
import { LIGHT_SEARCH_LIMIT } from "../../config/constants.js";

export const searchMemoryLightSchema = z.object({
  query: z.string().min(1),
  workspace_path: z.string().optional(),
  git_root: z.string().optional(),
  remote_url: z.string().optional(),
  project_id: z.string().optional(),
  limit: z.number().int().min(1).max(20).optional().default(LIGHT_SEARCH_LIMIT),
  scope: z.enum(["project", "global"]).optional().default("project"),
});

export const searchMemoryLightTool = {
  name: "search_memory_light" as const,
  description: TOOL_DESCRIPTIONS.search_memory_light,
  inputSchema: {
    type: "object" as const,
    properties: {
      query: { type: "string", description: "Search query text" },
      workspace_path: { type: "string" },
      git_root: { type: "string" },
      remote_url: { type: "string" },
      project_id: { type: "string" },
      limit: { type: "number", description: `Max results (default ${LIGHT_SEARCH_LIMIT})` },
      scope: {
        type: "string",
        enum: ["project", "global"],
        description: "Search scope: project-scoped or global",
      },
    },
    required: ["query"],
  },
  handler: async (input: z.infer<typeof searchMemoryLightSchema>) => {
    let projectId: string | undefined;

    if (input.scope === "project") {
      const { project } = await resolveProject(input);
      projectId = project.id;
    }

    const results = await searchMemoryLight(input.query, projectId, input.limit);
    return { ok: true, data: results, count: results.length };
  },
};
