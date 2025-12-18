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
    slug: "turn-long-videos-into-shorts",
    title: "Turn long videos into Shorts",
    description: "Auto-detect viral moments, add captions, and export Shorts in minutes.",
    icon: "✂️",
    tags: ["video", "shorts", "content-repurpose", "social-media"],
    featured: true,
    steps: [
      {
        title: "Auto-Detect Viral Moments",
        toolSlug: "opus-clip",
        why: "AI finds the best clips automatically with virality scores",
        ctaLabel: "Try Opus Clip",
        promptExample: "Upload long video → AI detects highlights → Review clips → Select best moments",
      },
      {
        title: "Polish & Add Effects",
        toolSlug: "filmora",
        why: "Quick edits with AI captions, transitions, and color grading",
        ctaLabel: "Try Filmora",
        promptExample: "Import clip → Add AI captions → Apply color grade → Export 9:16",
      },
      {
        title: "Optimize Hook & Title",
        toolSlug: "chatgpt",
        why: "Create scroll-stopping hooks and titles for each Short",
        ctaLabel: "Try ChatGPT",
        promptExample: "Generate 5 viral hooks for: [clip summary]. Requirements: attention in 3 sec, curiosity, value promise",
      },
    ],
    guide: {
      bullets: [
        "Hook viewers in first 3 seconds - use questions, bold claims, or visual surprises",
        "Add captions to every Short - 85% watch without sound",
        "Test multiple hooks by posting variations and comparing retention",
      ],
    },
  },
  {
    slug: "polish-shorts-and-reels",
    title: "Polish Shorts & Reels edits",
    description: "Take raw clips to polished Shorts with effects, captions, and music.",
    icon: "✨",
    tags: ["video", "editing", "shorts", "reels"],
    featured: true,
    steps: [
      {
        title: "Edit & Add Captions",
        toolSlug: "filmora",
        why: "Fast video editing with AI auto-captions and templates",
        ctaLabel: "Try Filmora",
        promptExample: "Import clip → Trim → Add AI captions → Apply transitions → Color grade",
      },
      {
        title: "Add Background Music",
        toolSlug: "mubert",
        why: "Royalty-free AI music that matches your clip mood and length",
        ctaLabel: "Try Mubert",
        promptExample: "Select mood (upbeat/chill/epic) → Set duration → Generate → Download",
      },
      {
        title: "Final Review & Export",
        toolSlug: "opus-clip",
        why: "Preview on mobile format and export optimized for platforms",
        ctaLabel: "Try Opus Clip",
        promptExample: "Check caption timing → Verify 9:16 format → Export optimized file",
      },
    ],
    guide: {
      bullets: [
        "Keep Shorts under 60 seconds for best retention",
        "Match music tempo to visual pacing - fast cuts need fast beats",
        "Preview on mobile before posting - desktop preview can be misleading",
      ],
    },
  },
  {
    slug: "rewrite-email-professionally",
    title: "Rewrite an email professionally",
    description: "Turn casual drafts into clear, professional emails fast.",
    icon: "✉️",
    tags: ["writing", "email", "professional", "communication"],
    featured: true,
    steps: [
      {
        title: "Draft Quick Version",
        toolSlug: "chatgpt",
        why: "Get the structure and main points down fast",
        ctaLabel: "Try ChatGPT",
        promptExample: "Rewrite this email professionally: [paste draft]. Keep it: under 150 words, clear subject line, specific CTA",
      },
      {
        title: "Fix Clarity & Tone",
        toolSlug: "prowritingaid",
        why: "Polish grammar, remove filler, and ensure professional tone",
        ctaLabel: "Try ProWritingAid",
        promptExample: "Paste email → Check readability → Fix passive voice → Remove redundancy → Verify tone",
      },
      {
        title: "Final Check",
        toolSlug: "chatgpt",
        why: "Quick review for clarity and impact before sending",
        ctaLabel: "Try ChatGPT",
        promptExample: "Review this email for: clarity, politeness, action-oriented CTA. Suggest improvements.",
      },
    ],
    guide: {
      bullets: [
        "Start with a clear subject line that promises value",
        "One email = one ask - multiple requests reduce response rate by 50%",
        "End with a specific, low-friction CTA (not 'let me know your thoughts')",
      ],
    },
  },
  {
    slug: "fix-grammar-and-clarity",
    title: "Fix grammar and clarity",
    description: "Polish any text for grammar, readability, and professional tone.",
    icon: "📝",
    tags: ["writing", "editing", "grammar", "clarity"],
    featured: true,
    steps: [
      {
        title: "Deep Grammar & Style Check",
        toolSlug: "prowritingaid",
        why: "Catch grammar, style, and readability issues AI writing tools miss",
        ctaLabel: "Try ProWritingAid",
        promptExample: "Paste text → Run full report → Fix grammar → Improve readability → Check consistency",
      },
      {
        title: "Simplify Complex Sentences",
        toolSlug: "chatgpt",
        why: "Break down hard-to-read sentences into clear, simple language",
        ctaLabel: "Try ChatGPT",
        promptExample: "Simplify these sentences for grade 8 reading level: [paste text]. Keep meaning, remove jargon.",
      },
      {
        title: "Final Tone Check",
        toolSlug: "claude",
        why: "Verify tone matches intent (formal/casual/persuasive)",
        ctaLabel: "Try Claude",
        promptExample: "Review tone of this text. Target: [professional/casual/friendly]. Flag inconsistencies.",
      },
    ],
    guide: {
      bullets: [
        "Aim for grade 8-10 readability for most professional writing",
        "Read aloud - if you stumble, your reader will too",
        "Cut 20% of words after first draft - tighter is clearer",
      ],
    },
  },
  {
    slug: "make-slides-from-notes",
    title: "Make slides from notes",
    description: "Turn rough notes or outlines into presentation-ready slides.",
    icon: "📊",
    tags: ["presentation", "slides", "design", "productivity"],
    featured: true,
    steps: [
      {
        title: "Structure Outline",
        toolSlug: "chatgpt",
        why: "Organize notes into clear slide structure with talking points",
        ctaLabel: "Try ChatGPT",
        promptExample: "Turn these notes into a 10-slide presentation outline: [paste notes]. Include: title slide, 3 main sections, conclusion with CTA",
      },
      {
        title: "Generate Slides",
        toolSlug: "slidesai",
        why: "Auto-create slides from outline with design and layouts",
        ctaLabel: "Try SlidesAI",
        promptExample: "Paste outline → Choose template → AI generates slides → Review structure",
      },
      {
        title: "Polish & Export",
        toolSlug: "canva",
        why: "Final design touches and brand customization",
        ctaLabel: "Try Canva",
        promptExample: "Import slides → Apply brand colors → Adjust layouts → Export PDF/PPT",
      },
    ],
    guide: {
      bullets: [
        "One idea per slide - cramming reduces retention by 40%",
        "Use visuals over text - images + bullet points outperform text-only slides",
        "Rehearse with slides - adjust based on what feels clunky to present",
      ],
    },
  },
  {
    slug: "create-background-music",
    title: "Create background music for videos",
    description: "Generate royalty-free music that matches your video mood and length.",
    icon: "🎵",
    tags: ["music", "audio", "video", "content-creation"],
    featured: true,
    steps: [
      {
        title: "Generate Music Track",
        toolSlug: "mubert",
        why: "AI music generator with mood control and custom durations",
        ctaLabel: "Try Mubert",
        promptExample: "Select mood (upbeat/chill/cinematic) → Set duration (30s/60s/120s) → Generate → Download",
      },
      {
        title: "Alternative: Try Suno",
        toolSlug: "suno",
        why: "Create full songs with vocals or instrumental tracks",
        ctaLabel: "Try Suno",
        promptExample: "Describe style: 'upbeat electronic background music, no vocals, 90 BPM' → Generate → Download",
      },
      {
        title: "Mix Into Video",
        toolSlug: "filmora",
        why: "Adjust volume, fade in/out, and sync music to video pacing",
        ctaLabel: "Try Filmora",
        promptExample: "Import video + music → Lower music during dialogue (-12dB) → Fade out at end → Export",
      },
    ],
    guide: {
      bullets: [
        "Music should support, not compete with dialogue - keep it 12-18dB lower",
        "Match tempo to pacing - fast cuts need energetic music (120+ BPM)",
        "Always check platform music policies - some block copyrighted AI music",
      ],
    },
  },
  {
    slug: "text-to-narrated-video",
    title: "Turn text into a narrated video",
    description: "Create talking-head or voiceover videos from written scripts.",
    icon: "🎙️",
    tags: ["video", "voice", "narration", "content-creation"],
    featured: true,
    steps: [
      {
        title: "Write & Polish Script",
        toolSlug: "chatgpt",
        why: "Create engaging video script optimized for spoken delivery",
        ctaLabel: "Try ChatGPT",
        promptExample: "Write a 90-second video script about [topic]. Include: hook, 3 main points, CTA. Conversational tone.",
      },
      {
        title: "Generate Voiceover",
        toolSlug: "elevenlabs",
        why: "Natural-sounding AI voice with emotion and pacing control",
        ctaLabel: "Try ElevenLabs",
        promptExample: "Paste script → Choose voice → Adjust speed/emotion → Generate → Download MP3",
      },
      {
        title: "Create Video",
        toolSlug: "fliki",
        why: "Turn script + voiceover into video with AI visuals and captions",
        ctaLabel: "Try Fliki",
        promptExample: "Import script → Add voiceover → Select AI visuals → Add captions → Export video",
      },
    ],
    guide: {
      bullets: [
        "Write for the ear, not the eye - use short sentences and natural pauses",
        "Add personality to AI voice with punctuation (! for energy, ... for pause)",
        "Preview voiceover before creating video - re-recording wastes time",
      ],
    },
  },
  {
    slug: "clip-podcasts-into-shorts",
    title: "Clip podcasts into viral shorts",
    description: "Find the best moments in long podcasts and turn them into shareable clips.",
    icon: "🎧",
    tags: ["podcast", "video", "clips", "content-repurpose"],
    featured: true,
    steps: [
      {
        title: "Auto-Detect Best Moments",
        toolSlug: "opus-clip",
        why: "AI finds highlight moments and scores them for virality",
        ctaLabel: "Try Opus Clip",
        promptExample: "Upload podcast video → AI detects highlights → Review clips with scores → Select top 3",
      },
      {
        title: "Add Captions & B-Roll",
        toolSlug: "filmora",
        why: "Enhance clips with auto-captions and visual interest",
        ctaLabel: "Try Filmora",
        promptExample: "Import clip → Add AI captions → Insert relevant b-roll → Apply transitions → Export",
      },
      {
        title: "Optimize Hook",
        toolSlug: "chatgpt",
        why: "Create attention-grabbing hooks for each clip",
        ctaLabel: "Try ChatGPT",
        promptExample: "Generate 3 viral hooks for this podcast clip: [summary]. Hook must create curiosity in 3 seconds.",
      },
    ],
    guide: {
      bullets: [
        "Look for clips with: surprising facts, strong opinions, or relatable stories",
        "Keep podcast clips 30-90 seconds - longer kills retention",
        "Add context text at start - viewers don't know your guests",
      ],
    },
  },
  {
    slug: "add-captions-fast",
    title: "Add captions fast",
    description: "Auto-generate accurate captions for any video in minutes.",
    icon: "💬",
    tags: ["video", "captions", "accessibility", "editing"],
    featured: true,
    steps: [
      {
        title: "Auto-Generate Captions",
        toolSlug: "opus-clip",
        why: "Fast, accurate AI captions with customizable styles",
        ctaLabel: "Try Opus Clip",
        promptExample: "Upload video → Auto-generate captions → Choose style (large/animated/minimal) → Review accuracy",
      },
      {
        title: "Edit & Customize",
        toolSlug: "filmora",
        why: "Fine-tune timing, style, and formatting",
        ctaLabel: "Try Filmora",
        promptExample: "Import video with captions → Fix typos → Adjust timing → Change font/color → Export",
      },
      {
        title: "Final Check",
        toolSlug: "chatgpt",
        why: "Quick review for grammar and formatting consistency",
        ctaLabel: "Try ChatGPT",
        promptExample: "Review these captions for errors: [paste captions]. Check: spelling, capitalization, readability.",
      },
    ],
    guide: {
      bullets: [
        "85% of social video is watched without sound - captions aren't optional",
        "Use high-contrast colors (white text on black box) for readability",
        "Test on mobile - if you can't read it, neither can your audience",
      ],
    },
  },
  {
    slug: "summarize-and-repurpose",
    title: "Summarize and repurpose content",
    description: "Turn long content into multiple formats: summaries, threads, scripts, and more.",
    icon: "♻️",
    tags: ["content-repurpose", "productivity", "writing", "social-media"],
    featured: true,
    steps: [
      {
        title: "Create Core Summary",
        toolSlug: "chatgpt",
        why: "Extract key points and create master summary document",
        ctaLabel: "Try ChatGPT",
        promptExample: "Summarize this content: [paste text/link]. Output: 1) One-line hook, 2) 3 key points, 3) One takeaway",
      },
      {
        title: "Repurpose Into Formats",
        toolSlug: "claude",
        why: "Turn summary into Twitter thread, LinkedIn post, video script, etc.",
        ctaLabel: "Try Claude",
        promptExample: "From this summary, create: 1) 5-tweet thread, 2) LinkedIn post (200 words), 3) 60s video script",
      },
      {
        title: "Polish Each Format",
        toolSlug: "prowritingaid",
        why: "Ensure each format is clear, engaging, and error-free",
        ctaLabel: "Try ProWritingAid",
        promptExample: "Review each format for: clarity, grammar, platform fit (thread = casual, LinkedIn = professional)",
      },
    ],
    guide: {
      bullets: [
        "Start with one pillar content piece, create 10+ smaller assets from it",
        "Adapt tone for each platform - LinkedIn formal, Twitter casual, video conversational",
        "Schedule repurposed content across 2-3 weeks to maximize reach",
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

