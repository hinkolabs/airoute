// src/lib/guides/free-templates/en.ts

export type Variant = "A" | "B" | "C";

export type FreeRecipeInput = {
  recipe_key: string; // for deterministic pick
  guide_type: "route_based" | "tool_based" | "safety";
  primary_intent: string; // kebab-case
  primary_route?: string | null; // kebab-case
  cta_type: "route" | "tool" | "mixed" | null;
  cta_route_slug?: string | null;
  cta_tool_slug?: string | null;
  cta_partner?: string | null;
  variant: Variant; // A, B, or C for content variation
};

// --- helpers ---
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
};

const pick = <T,>(arr: T[], seed: string) => arr[hash(seed) % arr.length];

const labelize = (slug?: string | null) =>
  slug ? slug.replace(/-/g, " ").replace(/\b\w/g, m => m.toUpperCase()) : "";

// --- sentence pools (shared) ---
const TITLE_POOL = [
  (intent: string) => `A Practical Route to ${intent}`,
  (intent: string) => `How to Get Started with ${intent} (Step-by-Step)`,
  (intent: string) => `The Simplest Way to Approach ${intent}`,
];

const EXCERPT_POOL = [
  (intent: string) =>
    `A clear, practical guide that shows a simple route to ${intent} without unnecessary tools.`,
  (intent: string) =>
    `Learn a focused, step-by-step route for ${intent} and avoid common beginner mistakes.`,
  (intent: string) =>
    `A beginner-friendly route that helps you approach ${intent} with confidence.`,
];

const CHECKLIST_POOL = [
  `Clear goal defined`,
  `Primary tools selected`,
  `First version completed`,
  `Basic review done`,
  `Next iteration planned`,
];

const CTA_ROUTE_POOL = [
  (route: string) =>
    `Open the recommended route (${route}) to see the tools and steps in one place.`,
];

const CTA_TOOL_POOL = [
  (tool: string) =>
    `Visit the official ${tool} page to start with the recommended setup.`,
];

const CTA_MIXED_POOL = [
  (route: string, tool: string) =>
    `Start with the route (${route}), then use ${tool} for the key execution step.`,
];

// --- guide_type-specific template pools with A/B/C variants ---
type VariantPool = {
  tldr: (intent: string) => string;
  stepsIntro: () => string;
  mistakes: string[];
  checklistIntro: string;
  cta: string;
};

type GuideTypePools = {
  A: VariantPool;
  B: VariantPool;
  C: VariantPool;
};

const TEMPLATE_POOLS: Record<string, GuideTypePools> = {
  route_based: {
    A: {
      tldr: (intent: string) =>
        `This guide walks you through a clear route to ${intent}. Follow the steps in order and skip anything that does not directly move you forward.`,
      stepsIntro: () => `The route below is designed to keep decisions minimal and progress steady.`,
      mistakes: [
        `Trying too many tools at once before defining a clear goal.`,
        `Skipping the planning step and jumping straight into execution.`,
        `Optimizing details too early instead of finishing the first draft.`,
      ],
      checklistIntro: `Use this checklist to track your progress along the route:`,
      cta: `Continue along this route to reach your goal.`,
    },
    B: {
      tldr: (intent: string) =>
        `Want a simple way to approach ${intent}? This route focuses on essentials and removes distractions.`,
      stepsIntro: () => `Follow these steps in order to avoid common detours and wasted time.`,
      mistakes: [
        `Overcomplicating the process by adding unnecessary steps.`,
        `Not setting clear milestones to measure progress.`,
        `Giving up too early before seeing initial results.`,
      ],
      checklistIntro: `Make sure you complete each checkpoint before moving on:`,
      cta: `Follow the recommended path and adjust as needed.`,
    },
    C: {
      tldr: (intent: string) =>
        `A streamlined approach to ${intent} that prioritizes action over analysis. Start here if you want quick wins.`,
      stepsIntro: () => `This sequence is optimized for getting results with minimal friction.`,
      mistakes: [
        `Researching endlessly instead of starting with a rough draft.`,
        `Comparing too many alternatives before committing to one.`,
        `Perfectionism that delays meaningful progress.`,
      ],
      checklistIntro: `Track your completion status with this quick list:`,
      cta: `Take the next logical step and keep building momentum.`,
    },
  },
  tool_based: {
    A: {
      tldr: (intent: string) =>
        `This tool helps you achieve ${intent} faster. Learn how to set it up and get results quickly.`,
      stepsIntro: () => `Here is how to set up and use the recommended tool:`,
      mistakes: [
        `Switching tools mid-project instead of mastering one first.`,
        `Ignoring the tool's built-in features and over-customizing.`,
        `Not reading the documentation before diving in.`,
      ],
      checklistIntro: `Verify these items to ensure your tool is set up correctly:`,
      cta: `Start using the tool and see results immediately.`,
    },
    B: {
      tldr: (intent: string) =>
        `Looking for a tool to handle ${intent}? This guide shows you which one to pick and how to use it effectively.`,
      stepsIntro: () => `Follow these steps to get the most out of your chosen tool:`,
      mistakes: [
        `Using a complex tool when a simpler one would suffice.`,
        `Skipping the learning curve and expecting instant mastery.`,
        `Ignoring community resources and tutorials.`,
      ],
      checklistIntro: `Check off each item as you configure your tool:`,
      cta: `Launch the tool and follow the setup guide.`,
    },
    C: {
      tldr: (intent: string) =>
        `Master the right tool for ${intent} and save hours of manual work. This guide gets you started in minutes.`,
      stepsIntro: () => `Complete these steps to unlock the full potential of your tool:`,
      mistakes: [
        `Paying for premium features you do not actually need.`,
        `Not backing up your work before experimenting.`,
        `Trying to learn every feature at once instead of focusing on essentials.`,
      ],
      checklistIntro: `Ensure you have completed these setup steps:`,
      cta: `Open the tool now and apply what you have learned.`,
    },
  },
  safety: {
    A: {
      tldr: (intent: string) =>
        `Before you proceed with ${intent}, it is important to understand the risks and safeguards. This guide covers what to watch out for.`,
      stepsIntro: () => `Review each safety consideration before proceeding:`,
      mistakes: [
        `Skipping security checks to save time.`,
        `Sharing sensitive information without encryption.`,
        `Ignoring warning signs and error messages.`,
      ],
      checklistIntro: `Run through this safety checklist before you start:`,
      cta: `Once all checks pass, proceed with confidence.`,
    },
    B: {
      tldr: (intent: string) =>
        `Safety first. This guide explains the key precautions to take when working on ${intent}.`,
      stepsIntro: () => `Complete these checks to ensure a safe workflow:`,
      mistakes: [
        `Assuming default settings are secure enough.`,
        `Using the same password across multiple tools.`,
        `Not reviewing permissions before granting access.`,
      ],
      checklistIntro: `Confirm each item to minimize risk:`,
      cta: `After verifying safety, continue to the next step.`,
    },
    C: {
      tldr: (intent: string) =>
        `Protect yourself while working on ${intent}. This quick safety overview helps you avoid common pitfalls.`,
      stepsIntro: () => `Follow this safety protocol to protect your work and data:`,
      mistakes: [
        `Trusting unknown sources without verification.`,
        `Not logging out of shared devices.`,
        `Overlooking privacy settings in new tools.`,
      ],
      checklistIntro: `Use this safety checklist to stay protected:`,
      cta: `Verified and secure? Move on to your next task.`,
    },
  },
};

// --- helper: compute default variant from recipe ---
export function computeVariant(primaryIntent: string, guideType: string): Variant {
  const variants: Variant[] = ["A", "B", "C"];
  return variants[hash(primaryIntent + guideType) % 3];
}

// --- main builder ---
export function buildFreeGuideEn(input: FreeRecipeInput): {
  title: string;
  excerpt: string;
  content: string;
} {
  const intentLabel = labelize(input.primary_intent);
  const routeLabel = labelize(input.primary_route);
  const toolLabel = labelize(input.cta_tool_slug);

  // Select pool by guide_type + variant (fallback to route_based.A)
  const guideTypePools = TEMPLATE_POOLS[input.guide_type] ?? TEMPLATE_POOLS.route_based;
  const variantPool = guideTypePools[input.variant] ?? guideTypePools.A;

  const titleFn = pick(TITLE_POOL, input.recipe_key);
  const excerptFn = pick(EXCERPT_POOL, input.recipe_key + ":ex");

  const checklist = [...CHECKLIST_POOL]
    .sort((a, b) => hash(input.recipe_key + a) - hash(input.recipe_key + b));

  // Build CTA text - prefer specific CTA if available, else use variant default
  let ctaText = "";
  if (input.cta_type === "route" && routeLabel) {
    ctaText = pick(CTA_ROUTE_POOL, input.recipe_key + ":cta")(routeLabel);
  } else if (input.cta_type === "tool" && toolLabel) {
    ctaText = pick(CTA_TOOL_POOL, input.recipe_key + ":cta")(toolLabel);
  } else if (input.cta_type === "mixed" && routeLabel && toolLabel) {
    ctaText = pick(CTA_MIXED_POOL, input.recipe_key + ":cta")(routeLabel, toolLabel);
  } else {
    ctaText = variantPool.cta;
  }

  const content = [
    `## TL;DR`,
    variantPool.tldr(intentLabel),
    ``,
    `## Step-by-step route`,
    variantPool.stepsIntro(),
    ``,
    `1. Define your goal clearly.`,
    `2. Select only the tools required for this goal.`,
    `3. Execute one complete pass before optimizing.`,
    `4. Review results and plan the next iteration.`,
    ``,
    `## Common mistakes`,
    variantPool.mistakes.map(m => `- ${m}`).join("\n"),
    ``,
    `## Quick checklist`,
    variantPool.checklistIntro,
    checklist.map(c => `- ${c}`).join("\n"),
    ``,
    `## Recommended tool stack`,
    routeLabel
      ? `This route is centered around **${routeLabel}** to keep your workflow focused.`
      : `This guide emphasizes a minimal tool stack to reduce complexity.`,
    ``,
    `## Next step`,
    ctaText,
  ].join("\n");

  return {
    title: titleFn(intentLabel),
    excerpt: excerptFn(intentLabel).slice(0, 160),
    content,
  };
}
