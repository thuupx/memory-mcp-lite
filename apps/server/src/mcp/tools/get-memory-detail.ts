import { z } from "zod";
import { getMemoryDetail } from "../../services/search-service";
import { TOOL_DESCRIPTIONS } from "../tool-descriptions";

export const getMemoryDetailSchema = z.object({
  id: z.string().min(1),
});

export const getMemoryDetailTool = {
  name: "get_memory_detail" as const,
  description: TOOL_DESCRIPTIONS.get_memory_detail,
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "string",
        description: "The memory node ID to load full detail for",
      },
    },
    required: ["id"],
  },
  handler: async (input: z.infer<typeof getMemoryDetailSchema>) => {
    const result = await getMemoryDetail(input.id);
    if (!result) {
      return { ok: false, error: `Memory not found: ${input.id}` };
    }
    return { ok: true, data: result };
  },
};
