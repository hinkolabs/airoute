/**
 * SearchProvider — the abstraction boundary between the sourcing orchestrator and
 * a concrete Apify Actor. If an Actor gets discontinued or replaced, only the
 * matching provider file (douyin-apify.ts / xiaohongshu-apify.ts) needs to change;
 * search-orchestrator.ts, the API routes, and the UI never see raw Actor fields.
 */

import { ShortsPlatform, SourceItem } from "../../types";

export interface SearchProvider {
  platform: ShortsPlatform;
  /** Apify Actor id/slug, e.g. "zen-studio/douyin-search-scraper". Read from env — never hardcoded. */
  actorId: string;
  /** A version tag bumped whenever normalize() changes field mapping, to invalidate old cache rows. */
  providerVersion: string;
  /** Builds the Actor's run input for a single keyword search. */
  buildRunInput(keyword: string, limitPerKeyword: number): Record<string, unknown>;
  /**
   * Converts one raw dataset item into a SourceItem. Returns null if the raw item
   * is missing fields we consider required (e.g. no canonical URL) — callers must
   * filter out nulls rather than crash on unexpected Actor output.
   */
  normalize(raw: unknown, keyword: string): SourceItem | null;
}

export function getRequiredActorId(envVarName: string): string {
  const actorId = process.env[envVarName];
  if (!actorId) {
    throw new Error(`missing_env:${envVarName}`);
  }
  return actorId;
}
