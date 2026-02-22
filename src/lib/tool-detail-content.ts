/**
 * Tool Detail Content
 * Rich content for priority partner tools
 */

export interface ToolDetailContent {
  slug: string;
  intro: string;
  features: string[];
  bestFor: string[];
  whyPicked: string;
  tips: string[];
}

export const TOOL_DETAIL_CONTENT: Record<string, ToolDetailContent> = {
  "filmora": {
    slug: "filmora",
    intro: "Filmora is an intuitive video editing software designed for creators at all skill levels. With built-in AI features, drag-and-drop simplicity, and a rich effects library, Filmora makes professional video editing accessible to everyone.",
    features: [
      "AI Copilot for smart editing suggestions",
      "Auto-captions with customizable styles",
      "AI background removal and object tracking",
      "1000+ effects, transitions, and titles",
      "Color grading and LUT presets",
      "Multi-track timeline editing",
      "Direct export to YouTube, TikTok, Instagram"
    ],
    bestFor: [
      "YouTube creators and vloggers",
      "Social media content producers",
      "Marketing teams creating video ads",
      "Educators and online course creators",
      "Small business owners"
    ],
    whyPicked: "Filmora strikes the perfect balance between ease of use and powerful features. Unlike complex professional tools that require months to learn, Filmora lets you create stunning videos on day one while still offering advanced AI tools when you need them.",
    tips: [
      "Use AI Auto Reframe to convert landscape videos to vertical format for TikTok and Shorts",
      "Enable Auto Captions and customize the style to match your brand",
      "Explore the Effects Store for trending templates and overlays",
      "Use keyboard shortcuts (C to cut, Delete to remove) for faster editing",
      "Export with hardware acceleration enabled to save time on rendering"
    ]
  },
  "prowritingaid": {
    slug: "prowritingaid",
    intro: "ProWritingAid is a comprehensive writing assistant that goes far beyond basic grammar checking. It analyzes your writing for style, clarity, engagement, and readability, helping you polish every sentence to perfection.",
    features: [
      "20+ in-depth writing reports (style, readability, overused words)",
      "Grammar and spelling checker",
      "Contextual thesaurus and word explorer",
      "Sentence structure analysis",
      "Consistency checker (hyphenation, capitalization)",
      "Plagiarism detector",
      "Integration with Word, Google Docs, Scrivener"
    ],
    bestFor: [
      "Professional writers and authors",
      "Content marketers and copywriters",
      "Students writing essays and theses",
      "Business professionals writing reports",
      "Bloggers and freelance writers"
    ],
    whyPicked: "While Grammarly focuses on correctness, ProWritingAid dives deeper into writing quality. It's the tool professional writers use to refine their craft, with detailed reports that teach you to become a better writer over time.",
    tips: [
      "Run the Summary Report first to get an overview of all issues",
      "Use the Sticky Sentences report to identify hard-to-read passages",
      "Check the Echoes report to find repetitive words and phrases",
      "Enable Consistency checks to maintain style throughout long documents",
      "Set your writing style (general, business, academic) for better suggestions"
    ]
  },
  "opus-clip": {
    slug: "opus-clip",
    intro: "Opus Clip uses AI to automatically identify the most engaging moments in your long-form videos and transform them into viral-ready short clips. Perfect for repurposing podcasts, webinars, and YouTube videos into TikToks, Shorts, and Reels.",
    features: [
      "AI-powered highlight detection",
      "Automatic viral score for each clip",
      "Auto-generated captions with animated styles",
      "Face tracking and auto-reframe to 9:16",
      "Customizable caption templates",
      "Batch processing for multiple videos",
      "Direct posting to social platforms"
    ],
    bestFor: [
      "Podcasters repurposing episodes into clips",
      "YouTubers creating Shorts from long videos",
      "Coaches and consultants sharing expertise",
      "Event organizers promoting highlights",
      "Marketing teams maximizing content ROI"
    ],
    whyPicked: "Opus Clip saves hours of manual editing by automatically finding the best moments in your content. Its AI understands what makes clips go viral—hooks, payoffs, and emotional peaks—so you can focus on creating rather than editing.",
    tips: [
      "Upload videos with clear speech and good audio quality for best results",
      "Review the viral score predictions to prioritize which clips to post",
      "Customize caption styles to match your brand colors and fonts",
      "Use the 'Add B-roll' feature to keep viewers engaged",
      "Export multiple aspect ratios (9:16, 1:1, 16:9) for cross-platform posting"
    ]
  }
};

/**
 * Get detail content for a tool
 */
export function getToolDetailContent(slug: string): ToolDetailContent | null {
  return TOOL_DETAIL_CONTENT[slug] || null;
}









