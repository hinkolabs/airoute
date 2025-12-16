/**
 * Routes Data Model
 * Local MVP implementation - no DB required
 */

export interface RouteStep {
  title: string;
  toolSlug: string;
  why: string;
  ctaLabel?: string;
  promptExample?: string;
}

export interface RouteRecord {
  slug: string;
  title: string;
  description: string;
  steps: RouteStep[];
  guide: {
    bullets: string[];
  };
  tags?: string[];
  icon?: string;
  featured?: boolean;
}

export const ROUTES: RouteRecord[] = [
  {
    slug: "brand-logo-kit",
    title: "Brand Logo Kit",
    description: "Create a complete brand identity with AI-powered logo design, color palettes, and brand guidelines.",
    icon: "🎨",
    tags: ["design", "branding", "logo", "visual-identity"],
    featured: true,
    steps: [
      {
        title: "Generate Logo Concepts",
        toolSlug: "midjourney",
        why: "Create unique, professional logo designs using AI image generation",
        ctaLabel: "Visit Midjourney",
        promptExample: "minimalist tech startup logo, letter M, gradient blue to purple, modern, vector style --v 6",
      },
      {
        title: "Refine & Vectorize",
        toolSlug: "adobe-firefly",
        why: "Convert raster logos to scalable vector format for all media sizes",
        ctaLabel: "Visit Adobe Firefly",
        promptExample: "vectorize logo, clean lines, export SVG format",
      },
      {
        title: "Build Brand Guidelines",
        toolSlug: "chatgpt",
        why: "Generate comprehensive brand voice, tone, and usage guidelines",
        ctaLabel: "Visit ChatGPT",
        promptExample: "Create brand guidelines for a tech startup: logo usage rules, color palette (primary: #4F46E5, secondary: #10B981), typography (Inter for headings, system fonts for body), and tone of voice (professional yet approachable)",
      },
    ],
    guide: {
      bullets: [
        "Start with 5-10 logo concept variations to explore different directions",
        "Test your logo at small sizes (16px favicon) to ensure clarity",
        "Export logos in multiple formats: SVG for web, PNG with transparency, and PDF for print",
        "Document your color codes (HEX, RGB, CMYK) for consistent brand application",
        "Include do's and don'ts in your guidelines to prevent brand misuse",
      ],
    },
  },
  {
    slug: "shorts-factory",
    title: "Shorts Factory",
    description: "Turn long videos into viral Shorts with AI-powered clip detection and editing.",
    icon: "🎬",
    tags: ["video", "content-creation", "social-media", "shorts"],
    featured: true,
    steps: [
      {
        title: "Plan Hook & Title",
        toolSlug: "chatgpt",
        why: "Create engaging hooks and titles that stop the scroll",
        ctaLabel: "Visit ChatGPT",
        promptExample: "Generate 5 viral TikTok hooks for a video about [topic]. Each hook must: grab attention in first 3 seconds, promise clear value, and create curiosity. Format: Hook + Why it works",
      },
      {
        title: "Auto-Clip & Caption",
        toolSlug: "opus-clip",
        why: "Automatically find best moments and add viral-ready captions",
        ctaLabel: "Visit Opus Clip",
        promptExample: "Upload long video, let AI detect viral moments, apply caption style, export 9:16 format",
      },
      {
        title: "Final Polish & Export",
        toolSlug: "filmora",
        why: "Easy video editor with AI features for professional results",
        ctaLabel: "Visit Filmora",
        promptExample: "Fine-tune timing, add transitions, AI color correction, and export optimized for TikTok/Shorts/Reels",
      },
    ],
    guide: {
      bullets: [
        "Hook viewers in the first 3 seconds with a question, bold statement, or visual surprise",
        "Add captions to 100% of your shorts - 85% of social videos are watched without sound",
        "Test multiple hooks and opening frames - the first frame is your thumbnail",
        "Post consistently: 1-3 shorts per day performs better than sporadic posting",
        "Analyze retention graphs to identify exact drop-off points and improve future edits",
      ],
    },
  },
  {
    slug: "resume-polish",
    title: "Resume Polish",
    description: "Write a clear resume and fix tone, clarity, and grammar for professional impact.",
    icon: "📝",
    tags: ["career", "resume", "job-search", "professional"],
    featured: true,
    steps: [
      {
        title: "Draft Structure",
        toolSlug: "chatgpt",
        why: "Create ATS-optimized resume structure with proper keywords",
        ctaLabel: "Visit ChatGPT",
        promptExample: "Analyze this job description and my background. Create a resume outline with: 1) ATS-friendly keywords, 2) STAR format bullets, 3) Quantifiable achievements. Format: [Action Verb] + [What] + [Result with numbers]",
      },
      {
        title: "Deep Style & Clarity Pass",
        toolSlug: "prowritingaid",
        why: "Professional writing analysis for grammar, clarity, and impact",
        ctaLabel: "Visit ProWritingAid",
        promptExample: "Paste resume text, run style report, fix passive voice, eliminate redundancy, strengthen word choice, and ensure professional tone throughout",
      },
      {
        title: "Final Review",
        toolSlug: "claude",
        why: "Human-like review for flow, consistency, and overall impact",
        ctaLabel: "Visit Claude",
        promptExample: "Review this resume for: 1) Consistency in tense and formatting, 2) Achievement emphasis over duties, 3) Gaps or weak points. Suggest final improvements.",
      },
    ],
    guide: {
      bullets: [
        "Tailor your resume for each application - generic resumes get 50% fewer callbacks",
        "Use numbers everywhere: revenue impact, team size, time saved, % improvements",
        "Keep it to 1 page for <10 years experience, 2 pages maximum for senior roles",
        "Avoid tables, columns, headers/footers, and images - they break ATS parsers",
        "Save final version as 'FirstName_LastName_Resume.pdf' for easy recruiter filing",
      ],
    },
  },
  {
    slug: "script-to-publish",
    title: "YouTube Script to Publish",
    description: "Script → polish → edit → publish-ready YouTube video workflow.",
    icon: "🎥",
    tags: ["video", "youtube", "content-creation", "workflow"],
    featured: true,
    steps: [
      {
        title: "Script Outline",
        toolSlug: "chatgpt",
        why: "Create engaging script structure with hooks and retention points",
        ctaLabel: "Visit ChatGPT",
        promptExample: "Create a YouTube script outline for [topic]. Include: 1) Hook (first 30 sec), 2) Value promises, 3) 3 main points with examples, 4) CTA. Target length: 8-12 minutes. Optimize for retention.",
      },
      {
        title: "Polish Script Language",
        toolSlug: "prowritingaid",
        why: "Refine clarity, pacing, and conversational tone for video delivery",
        ctaLabel: "Visit ProWritingAid",
        promptExample: "Paste script, check readability score (aim for grade 8-10), fix complex sentences, ensure natural speech patterns, and remove filler words",
      },
      {
        title: "Video Edit & Export",
        toolSlug: "filmora",
        why: "Easy video editing with AI features, titles, and export optimization",
        ctaLabel: "Visit Filmora",
        promptExample: "Import footage, add intro/outro, insert b-roll at key points, add AI captions, color grade, and export in YouTube-optimized format (1080p/4K, H.264)",
      },
    ],
    guide: {
      bullets: [
        "Write scripts 20% longer than target - you'll cut during editing",
        "Include pattern interrupts every 90 seconds to maintain viewer attention",
        "Read your script aloud before filming - if it sounds unnatural, rewrite it",
        "Add visual cues in your script (B-ROLL, GRAPHIC, PAUSE) for easier editing",
        "Test your hook with friends - if they're not curious in 15 seconds, rewrite",
      ],
    },
  },
];

/**
 * Get route by slug
 */
export function getRouteBySlug(slug: string): RouteRecord | undefined {
  return ROUTES.find(r => r.slug === slug);
}

/**
 * Get all route slugs (for static generation)
 */
export function getAllRouteSlugs(): string[] {
  return ROUTES.map(r => r.slug);
}

/**
 * Search routes by query
 */
export function searchRoutes(query: string): RouteRecord[] {
  if (!query.trim()) return ROUTES;
  
  const q = query.toLowerCase();
  return ROUTES.filter(route => {
    const matchTitle = route.title.toLowerCase().includes(q);
    const matchDescription = route.description.toLowerCase().includes(q);
    const matchTags = route.tags?.some(tag => tag.toLowerCase().includes(q));
    return matchTitle || matchDescription || matchTags;
  });
}

