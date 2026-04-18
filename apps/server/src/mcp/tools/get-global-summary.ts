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
      return {
        content: [{ type: "text" as const, text: "No global summary found." }],
      };
    }
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  },
};
