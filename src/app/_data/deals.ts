export type DealType = "tool" | "external";

export interface DealItem {
  id: string;
  name: string;
  tag?: string;
  description: string;
  icon?: string;
  type: DealType;
  toolSlug?: string; // type === "tool"
  externalUrl?: string; // type === "external"
}

// --- Example Deals (MVP Version) ---
export const DEALS: DealItem[] = [
  {
    id: "chatgpt-deal",
    name: "ChatGPT",
    tag: "Popular",
    description: "Free GPT-4o mini available",
    icon: "🧠",
    type: "tool",
    toolSlug: "chatgpt",
  },
  {
    id: "midjourney-deal",
    name: "Midjourney",
    tag: "Premium",
    description: "30% off first month",
    icon: "🎨",
    type: "tool",
    toolSlug: "midjourney",
  },
  {
    id: "runway-deal",
    name: "Runway",
    tag: "Video AI",
    description: "20% OFF first month",
    icon: "🎬",
    type: "tool",
    toolSlug: "runway",
  },
  {
    id: "elevenlabs-deal",
    name: "ElevenLabs",
    tag: "Free credits",
    description: "Get 10,000 free characters",
    icon: "🎧",
    type: "external",
    externalUrl: "https://elevenlabs.io",
  },
];











