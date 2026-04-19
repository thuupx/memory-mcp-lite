import { z } from "zod";
import { resolveProject } from "../../core/project-resolver";
import { writeMemory } from "../../services/memory-service";
import { TOOL_META } from "../tool-descriptions";
import { ATOMIC_MEMORY_TYPES } from "../../config/constants";

export const rememberFactInput = z.object({
  title: z
    .string()
    .min(1)
    .max(200)
    .describe("Short title for the fact (max 200 chars)"),
  summary: z
    .string()
    .min(1)
    .max(500)
    .describe("Concise fact body (max 500 chars)"),
  content: z
    .string()
    .optional()
    .describe("Optional extended detail or example usage"),
  fact_type: z
    .enum(ATOMIC_MEMORY_TYPES)
    .optional()
    .default("fact")
    .describe(
      "Atomic memory type: fact | command | gotcha | link | convention | decision. Prefer remember_decision for 'decision'.",
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
  importance: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("0.0-1.0, defaults to the type-specific default in MemoryPolicy"),
  source: z
    .string()
    .optional()
    .describe("Optional source pointer (file path, PR url, doc link)"),
});

export const rememberFactOutput = z.object({
  project_id: z.string(),
  memory_id: z.string(),
});

const meta = TOOL_META.remember_fact;

export const rememberFactTool = {
  name: "remember_fact" as const,
  title: meta.title,
  description: meta.description,
  inputShape: rememberFactInput.shape,
  outputShape: rememberFactOutput.shape,
  annotations: {
    title: meta.title,
    readOnlyHint: meta.readOnly,
    destructiveHint: false,
    idempotentHint: meta.idempotent,
    openWorldHint: false,
  },
  handler: async (input: z.infer<typeof rememberFactInput>) => {
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

    const structured = { project_id: project.id, memory_id: result.id };
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(structured, null, 2) },
      ],
      structuredContent: structured,
    };
  },
};
