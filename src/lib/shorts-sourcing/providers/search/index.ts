import { ShortsPlatform } from "../../types";
import { SearchProvider } from "./base";
import { douyinApifyProvider } from "./douyin-apify";
import { xiaohongshuApifyProvider } from "./xiaohongshu-apify";

const REGISTRY: Record<ShortsPlatform, SearchProvider> = {
  douyin: douyinApifyProvider,
  xiaohongshu: xiaohongshuApifyProvider,
};

export function getSearchProvider(platform: ShortsPlatform): SearchProvider {
  return REGISTRY[platform];
}

export { douyinApifyProvider, xiaohongshuApifyProvider };
export type { SearchProvider };
