import { z } from "zod";
import { resolveProject } from "../../core/project-resolver";
import { searchMemoryLight } from "../../services/search-service";
import { TOOL_META } from "../tool-descriptions";
import { LIGHT_SEARCH_LIMIT } from "../../config/constants";

const candidateSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  memory_type: z.string(),
  level: z.string(),
  importance: z.number(),
  updated_at: z.string(),
});

export const searchMemoryLightInput = z.object({
  query: z
    .string()
    .min(1)
    .describe("Free-text search query — a keyword, command, or phrase"),
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
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .default(LIGHT_SEARCH_LIMIT)
    .describe(
      `Max candidate results, 1-20. Defaults to ${LIGHT_SEARCH_LIMIT}.`,
    ),
  scope: z
    .enum(["project", "global"])
    .optional()
    .default("project")
    .describe(
      "Search scope: 'project' (scoped to resolved project) or 'global' (all projects).",
    ),
});

export const searchMemoryLightOutput = z.object({
  count: z.number().int().min(0),
  results: z.array(candidateSchema),
});

const meta = TOOL_META.search_memory_light;

export const searchMemoryLightTool = {
  name: "search_memory_light" as const,
  title: meta.title,
  description: meta.description,
  inputShape: searchMemoryLightInput.shape,
  outputShape: searchMemoryLightOutput.shape,
  annotations: {
    title: meta.title,
    readOnlyHint: meta.readOnly,
    destructiveHint: false,
    idempotentHint: meta.idempotent,
    openWorldHint: false,
  },
  handler: async (input: z.infer<typeof searchMemoryLightInput>) => {
    let projectId: string | undefined;
    if (input.scope === "project") {
      const { project } = await resolveProject(input);
      projectId = project.id;
    }

    const results = await searchMemoryLight(
      input.query,
      projectId,
      input.limit,
    );

    const structured = { count: results.length, results };
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(structured, null, 2) },
      ],
      structuredContent: structured,
    };
  },
};
