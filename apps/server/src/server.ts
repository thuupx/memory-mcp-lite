import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CallToolResult,
  ToolAnnotations,
} from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShape } from "zod";
import { SERVER_INSTRUCTIONS } from "./mcp/instructions.js";
import { env } from "./config/env.js";
import {
  getGlobalSummaryTool,
  getProjectSummaryTool,
  getTaskSummaryTool,
  searchMemoryLightTool,
  getMemoryDetailTool,
  rememberDecisionTool,
  rememberFactTool,
  upsertProjectSummaryTool,
  upsertTaskSummaryTool,
} from "./mcp/tools";

interface RegisterableTool {
  name: string;
  title: string;
  description: string;
  inputShape: ZodRawShape;
  outputShape: ZodRawShape;
  annotations: ToolAnnotations;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (input: any) => Promise<CallToolResult>;
}

const TOOLS: RegisterableTool[] = [
  getGlobalSummaryTool,
  getProjectSummaryTool,
  getTaskSummaryTool,
  searchMemoryLightTool,
  getMemoryDetailTool,
  rememberDecisionTool,
  rememberFactTool,
  upsertProjectSummaryTool,
  upsertTaskSummaryTool,
];

export function createServer(): McpServer {
  const server = new McpServer(
    { name: env.serverName, version: env.serverVersion },
    { instructions: SERVER_INSTRUCTIONS },
  );

  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputShape,
        outputSchema: tool.outputShape,
        annotations: tool.annotations,
      },
      tool.handler,
    );
  }

  return server;
}
