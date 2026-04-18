import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
  // schema
  getGlobalSummarySchema,
  getProjectSummarySchema,
  getTaskSummarySchema,
  searchMemoryLightSchema,
  getMemoryDetailSchema,
  rememberDecisionSchema,
  rememberFactSchema,
  upsertProjectSummarySchema,
  upsertTaskSummarySchema,
} from "./mcp/tools/index";

export function createServer(): McpServer {
  const server = new McpServer(
    { name: env.serverName, version: env.serverVersion },
    { instructions: SERVER_INSTRUCTIONS },
  );

  server.registerTool(
    getGlobalSummaryTool.name,
    {
      description: getGlobalSummaryTool.description,
      inputSchema: getGlobalSummarySchema.shape,
    },
    getGlobalSummaryTool.handler,
  );

  server.registerTool(
    getProjectSummaryTool.name,
    {
      description: getProjectSummaryTool.description,
      inputSchema: getProjectSummarySchema.shape,
    },
    getProjectSummaryTool.handler,
  );

  server.registerTool(
    getTaskSummaryTool.name,
    {
      description: getTaskSummaryTool.description,
      inputSchema: getTaskSummarySchema.shape,
    },
    getTaskSummaryTool.handler,
  );

  server.registerTool(
    searchMemoryLightTool.name,
    {
      description: searchMemoryLightTool.description,
      inputSchema: searchMemoryLightSchema.shape,
    },
    searchMemoryLightTool.handler,
  );

  server.registerTool(
    getMemoryDetailTool.name,
    {
      description: getMemoryDetailTool.description,
      inputSchema: getMemoryDetailSchema.shape,
    },
    getMemoryDetailTool.handler,
  );

  server.registerTool(
    rememberDecisionTool.name,
    {
      description: rememberDecisionTool.description,
      inputSchema: rememberDecisionSchema.shape,
    },
    rememberDecisionTool.handler,
  );

  server.registerTool(
    rememberFactTool.name,
    {
      description: rememberFactTool.description,
      inputSchema: rememberFactSchema.shape,
    },
    rememberFactTool.handler,
  );

  server.registerTool(
    upsertProjectSummaryTool.name,
    {
      description: upsertProjectSummaryTool.description,
      inputSchema: upsertProjectSummarySchema.shape,
    },
    upsertProjectSummaryTool.handler,
  );

  server.registerTool(
    upsertTaskSummaryTool.name,
    {
      description: upsertTaskSummaryTool.description,
      inputSchema: upsertTaskSummarySchema.shape,
    },
    upsertTaskSummaryTool.handler,
  );

  return server;
}
