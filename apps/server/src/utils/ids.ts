import { randomBytes } from "crypto";

export function generateId(prefix?: string): string {
  const rand = randomBytes(8).toString("hex");
  return prefix ? `${prefix}_${rand}` : rand;
}
