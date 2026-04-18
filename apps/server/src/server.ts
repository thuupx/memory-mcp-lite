import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SERVER_INSTRUCTIONS } from "./mcp/instructions";
import { env } from "./config/env";

import {
  getGlobalSummaryTool,
  getGlobalSummarySchema,
} from "./mcp/tools/get-global-summary";
import {
  getProjectSummaryTool,
  getProjectSummarySchema,
} from "./mcp/tools/get-project-summary";
import {
  getTaskSummaryTool,
  getTaskSummarySchema,
} from "./mcp/tools/get-task-summary";
import {
  searchMemoryLightTool,
  searchMemoryLightSchema,
} from "./mcp/tools/search-memory-light";
import {
  getMemoryDetailTool,
  getMemoryDetailSchema,
} from "./mcp/tools/get-memory-detail";
import {
  rememberDecisionTool,
  rememberDecisionSchema,
} from "./mcp/tools/remember-decision";
import {
  rememberFactTool,
  rememberFactSchema,
} from "./mcp/tools/remember-fact";
import {
  upsertProjectSummaryTool,
  upsertProjectSummarySchema,
} from "./mcp/tools/upsert-project-summary";
import {
  upsertTaskSummaryTool,
  upsertTaskSummarySchema,
} from "./mcp/tools/upsert-task-summary";

function wrap<T>(handler: (input: T) => Promise<unknown>) {
  // SDK types the callback input as `{ [x: string]: any }` after schema validation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (input: any) => {
    try {
      const result = await handler(input as T);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const payload = JSON.stringify({ ok: false, error: message }, null, 2);
      return { content: [{ type: "text" as const, text: payload }] };
    }
  };
}

export function createServer(): McpServer {
  const server = new McpServer(
    { name: env.serverName, version: env.serverVersion },
    { instructions: SERVER_INSTRUCTIONS },
  );

  server.tool(
    getGlobalSummaryTool.name,
    getGlobalSummaryTool.description,
    getGlobalSummarySchema.shape,
    wrap(getGlobalSummaryTool.handler),
  );

  server.tool(
    getProjectSummaryTool.name,
    getProjectSummaryTool.description,
    getProjectSummarySchema.shape,
    wrap(getProjectSummaryTool.handler),
  );

  server.tool(
    getTaskSummaryTool.name,
    getTaskSummaryTool.description,
    getTaskSummarySchema.shape,
    wrap(getTaskSummaryTool.handler),
  );

  server.tool(
    searchMemoryLightTool.name,
    searchMemoryLightTool.description,
    searchMemoryLightSchema.shape,
    wrap(searchMemoryLightTool.handler),
  );

  server.tool(
    getMemoryDetailTool.name,
    getMemoryDetailTool.description,
    getMemoryDetailSchema.shape,
    wrap(getMemoryDetailTool.handler),
  );

  server.tool(
    rememberDecisionTool.name,
    rememberDecisionTool.description,
    rememberDecisionSchema.shape,
    wrap(rememberDecisionTool.handler),
  );

  server.tool(
    rememberFactTool.name,
    rememberFactTool.description,
    rememberFactSchema.shape,
    wrap(rememberFactTool.handler),
  );

  server.tool(
    upsertProjectSummaryTool.name,
    upsertProjectSummaryTool.description,
    upsertProjectSummarySchema.shape,
    wrap(upsertProjectSummaryTool.handler),
  );

  server.tool(
    upsertTaskSummaryTool.name,
    upsertTaskSummaryTool.description,
    upsertTaskSummarySchema.shape,
    wrap(upsertTaskSummaryTool.handler),
  );

  return server;
}
