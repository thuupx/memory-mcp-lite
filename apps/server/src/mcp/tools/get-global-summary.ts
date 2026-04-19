import { z } from "zod";
import { getGlobalSummary } from "../../services/summary-service";
import { TOOL_META } from "../tool-descriptions";

const summarySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  updated_at: z.string(),
});

export const getGlobalSummaryInput = z.object({});

export const getGlobalSummaryOutput = z.object({
  found: z.boolean(),
  summary: summarySchema.nullable(),
});

const meta = TOOL_META.get_global_summary;

export const getGlobalSummaryTool = {
  name: "get_global_summary" as const,
  title: meta.title,
  description: meta.description,
  inputShape: getGlobalSummaryInput.shape,
  outputShape: getGlobalSummaryOutput.shape,
  annotations: {
    title: meta.title,
    readOnlyHint: meta.readOnly,
    destructiveHint: false,
    idempotentHint: meta.idempotent,
    openWorldHint: false,
  },
  handler: async () => {
    const result = await getGlobalSummary();
    const structured = { found: result !== null, summary: result };
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(structured, null, 2) },
      ],
      structuredContent: structured,
    };
  },
};
