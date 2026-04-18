import { client } from "../client";
import type { MemoryEdge } from "../../types/memory";

export async function insertEdge(edge: MemoryEdge): Promise<void> {
  await client.memoryEdge.upsert({
    where: {
      from_id_to_id_relation: { from_id: edge.from_id, to_id: edge.to_id, relation: edge.relation },
    },
    update: { metadata_json: edge.metadata_json },
    create: edge,
  });
}

export async function getEdgesFrom(fromId: string): Promise<MemoryEdge[]> {
  return (await client.memoryEdge.findMany({ where: { from_id: fromId } })) as MemoryEdge[];
}

export async function getEdgesTo(toId: string): Promise<MemoryEdge[]> {
  return (await client.memoryEdge.findMany({ where: { to_id: toId } })) as MemoryEdge[];
}

export async function deleteEdge(fromId: string, toId: string, relation: string): Promise<void> {
  await client.memoryEdge.delete({
    where: { from_id_to_id_relation: { from_id: fromId, to_id: toId, relation } },
  });
}
