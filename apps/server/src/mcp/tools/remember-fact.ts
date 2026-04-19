import { z } from "zod";
import { resolveProject } from "../../core/project-resolver";
import { writeMemory } from "../../services/memory-service";
import { TOOL_DESCRIPTIONS } from "../tool-descriptions";
import { ATOMIC_MEMORY_TYPES } from "../../config/constants";

export const rememberFactSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(500),
  content: z.string().optional(),
  fact_type: z.enum(ATOMIC_MEMORY_TYPES).optional().default("fact"),
  workspace_path: z.string().optional(),
  git_root: z.string().optional(),
  remote_url: z.string().optional(),
  project_id: z.string().optional(),
  importance: z.number().min(0).max(1).optional(),
  source: z.string().optional(),
});

export const rememberFactTool = {
  name: "remember_fact" as const,
  description: TOOL_DESCRIPTIONS.remember_fact,
  inputSchema: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "Short title (max 200 chars)" },
      summary: {
        type: "string",
        description: "Concise fact to remember (max 500 chars)",
      },
      content: { type: "string", description: "Optional extended detail" },
      fact_type: {
        type: "string",
        enum: [...ATOMIC_MEMORY_TYPES],
        description:
          "Type of atomic memory: fact, command, gotcha, link, convention, decision",
      },
      workspace_path: { type: "string" },
      git_root: { type: "string" },
      remote_url: { type: "string" },
      project_id: { type: "string" },
      importance: { type: "number", description: "0.0-1.0" },
      source: { type: "string" },
    },
    required: ["title", "summary"],
  },
  handler: async (input: z.infer<typeof rememberFactSchema>) => {
    const { project } = await resolveProject(input);

    const result = await writeMemory({
      project_id: project.id,
      memory_type: input.fact_type,
      title: input.title,
      summary: input.summary,
      content: input.content,
      importance: input.importance,
      source: input.source,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { project_id: project.id, memory_id: result.id },
            null,
            2,
          ),
        },
      ],
    };
  },
};
