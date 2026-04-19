import { z } from "zod";
import { getMemoryDetail } from "../../services/search-service";
import { TOOL_META } from "../tool-descriptions";

const memorySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  content: z.string().nullable(),
  memory_type: z.string(),
  level: z.string(),
  importance: z.number(),
  source: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const getMemoryDetailInput = z.object({
  id: z
    .string()
    .min(1)
    .describe(
      "Memory node id as returned by search_memory_light (e.g. 'mem_<hex>')",
    ),
});

export const getMemoryDetailOutput = z.object({
  found: z.boolean(),
  memory: memorySchema.nullable(),
});

const meta = TOOL_META.get_memory_detail;

export const getMemoryDetailTool = {
  name: "get_memory_detail" as const,
  title: meta.title,
  description: meta.description,
  inputShape: getMemoryDetailInput.shape,
  outputShape: getMemoryDetailOutput.shape,
  annotations: {
    title: meta.title,
    readOnlyHint: meta.readOnly,
    destructiveHint: false,
    idempotentHint: meta.idempotent,
    openWorldHint: false,
  },
  handler: async (input: z.infer<typeof getMemoryDetailInput>) => {
    const memory = await getMemoryDetail(input.id);
    const structured = { found: memory !== null, memory };
    if (!memory) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(structured, null, 2),
          },
        ],
        structuredContent: structured,
        isError: true,
      };
    }
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(structured, null, 2) },
      ],
      structuredContent: structured,
    };
  },
};
