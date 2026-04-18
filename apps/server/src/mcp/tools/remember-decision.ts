import { z } from "zod";
import { resolveProject } from "../../core/project-resolver";
import { writeMemory } from "../../services/memory-service";
import { TOOL_DESCRIPTIONS } from "../tool-descriptions";
import { HIGH_IMPORTANCE } from "../../config/constants";

export const rememberDecisionSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(500),
  content: z.string().optional(),
  workspace_path: z.string().optional(),
  git_root: z.string().optional(),
  remote_url: z.string().optional(),
  project_id: z.string().optional(),
  importance: z.number().min(0).max(1).optional(),
  source: z.string().optional(),
});

export const rememberDecisionTool = {
  name: "remember_decision" as const,
  description: TOOL_DESCRIPTIONS.remember_decision,
  inputSchema: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "Short title for this decision (max 200 chars)" },
      summary: {
        type: "string",
        description: "Concise summary: what was decided and why (max 500 chars)",
      },
      content: {
        type: "string",
        description: "Optional detailed rationale, trade-offs, or alternatives considered",
      },
      workspace_path: { type: "string" },
      git_root: { type: "string" },
      remote_url: { type: "string" },
      project_id: { type: "string" },
      importance: { type: "number", description: "0.0–1.0, defaults to 0.8 for decisions" },
      source: { type: "string", description: "Optional source reference (file, PR, doc link)" },
    },
    required: ["title", "summary"],
  },
  handler: async (input: z.infer<typeof rememberDecisionSchema>) => {
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

    return { ok: true, data: result, project_id: project.id };
  },
};
