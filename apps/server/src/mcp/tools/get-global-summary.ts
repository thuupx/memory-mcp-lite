import { z } from "zod";
import { getGlobalSummary } from "../../services/summary-service";
import { TOOL_DESCRIPTIONS } from "../tool-descriptions";

export const getGlobalSummarySchema = z.object({});

export const getGlobalSummaryTool = {
  name: "get_global_summary" as const,
  description: TOOL_DESCRIPTIONS.get_global_summary,
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
  handler: async (_input: z.infer<typeof getGlobalSummarySchema>) => {
    const result = await getGlobalSummary();
    if (!result) {
      return { ok: true, data: null, message: "No global summary found." };
    }
    return { ok: true, data: result };
  },
};
