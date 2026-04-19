import { z } from "zod";
import { resolveProject } from "../../core/project-resolver";
import { writeMemory } from "../../services/memory-service";
import { TOOL_META } from "../tool-descriptions";
import { HIGH_IMPORTANCE } from "../../config/constants";

export const rememberDecisionInput = z.object({
  title: z
    .string()
    .min(1)
    .max(200)
    .describe("Short, specific title for the decision (max 200 chars)"),
  summary: z
    .string()
    .min(1)
    .max(500)
    .describe(
      "One-paragraph summary: what was decided and the primary reason (max 500 chars)",
    ),
  content: z
    .string()
    .optional()
    .describe(
      "Optional extended rationale, trade-offs, and rejected alternatives",
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
    .describe("0.0-1.0, defaults to 0.8 for decisions"),
  source: z
    .string()
    .optional()
    .describe("Optional source pointer (file path, PR url, doc link)"),
});

export const rememberDecisionOutput = z.object({
  project_id: z.string(),
  memory_id: z.string(),
});

const meta = TOOL_META.remember_decision;

export const rememberDecisionTool = {
  name: "remember_decision" as const,
  title: meta.title,
  description: meta.description,
  inputShape: rememberDecisionInput.shape,
  outputShape: rememberDecisionOutput.shape,
  annotations: {
    title: meta.title,
    readOnlyHint: meta.readOnly,
    destructiveHint: false,
    idempotentHint: meta.idempotent,
    openWorldHint: false,
  },
  handler: async (input: z.infer<typeof rememberDecisionInput>) => {
    const { project } = await resolveProject(input);

    const result = await writeMemory({
      project_id: project.id,
      memory_type: "decision",
      title: input.title,
      summary: input.summary,
      content: input.content,
      importance: input.importance ?? HIGH_IMPORTANCE,
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
