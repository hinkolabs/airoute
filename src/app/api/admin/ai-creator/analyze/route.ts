import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

type LangOption = "en" | "kr" | "both";
type DifficultyLevel = "beginner" | "intermediate" | "advanced";
type CreatorMode = "route" | "tool";

function buildDifficultyPrompt(difficulty: DifficultyLevel): string {
  if (difficulty === "beginner") {
    return `## DIFFICULTY: BEGINNER (초급) — THIS IS THE MOST IMPORTANT SECTION

Target: Complete beginners who have never used AI tools. They should feel "I can do this too!"

### TOOL RULES:
- BEST tools: ChatGPT (can generate images AND videos), Gemini (image+video capable), Canva (simple design)
- ChatGPT and Gemini are ALL-IN-ONE: they generate text, images, AND videos in one chat
- It is PERFECTLY OK to use the SAME tool for multiple steps (e.g., ChatGPT for step 1 AND step 2)
  - Example: Step 1 "ChatGPT로 이미지 만들기" → Step 2 "ChatGPT로 영상 만들기" → Step 3 "Canva로 썸네일 만들기"
- AVOID: Midjourney, Runway, Pika, FaceSwap, CapCut, Filmora, any tool requiring download or complex UI
- ONLY use tools where the user types/uploads something and gets a result — no editing timelines, no layers

### PROMPT QUALITY (CRITICAL):
- step_prompt_example is THE MOST VALUABLE part of this route
- Write EXACT, copy-pasteable prompts that produce great results
- Include specific details: style, mood, lighting, composition, aspect ratio
- For image prompts: describe the EXACT scene the user wants
- For video prompts: specify motion, duration, camera angle
- Prompts should be so good that a beginner gets impressive results on first try

### WRITING STYLE:
- Explain like teaching a parent/grandparent
- "~하세요" style, warm and encouraging
- Each step: what to click, what to type, what to expect
- Never assume they know what "프롬프트" means — say "아래 문장을 복사해서 붙여넣기 하세요"`;
  }

  if (difficulty === "intermediate") {
    return `## DIFFICULTY: INTERMEDIATE (중급)

Target: Users who have used ChatGPT and basic AI tools, ready for specialized tools.

### TOOL RULES:
- Use specialized tools for better quality: Leonardo AI, Runway, ElevenLabs, HeyGen, Pika, Kling
- Web-based tools only, no CLI or local installation
- Each step should use a DIFFERENT specialized tool for variety
- It's OK to use ChatGPT/Gemini for one step if it fits

### PROMPT QUALITY:
- Include advanced parameters and settings alongside prompts
- Mention optimal settings (resolution, style presets, model versions)
- Prompts should demonstrate intermediate technique (negative prompts, seed, etc.)

### WRITING STYLE:
- Assumes they can navigate web apps and create accounts
- Can reference settings panels, sliders, dropdown menus
- Include "pro tips" for better results`;
  }

  return `## DIFFICULTY: ADVANCED (고급)

Target: Power users, content creators, developers.

### TOOL RULES:
- ANY tool: Midjourney, ComfyUI, Stable Diffusion, professional tools
- Can include tools requiring Discord, CLI, API keys, local setup
- Pick the BEST quality tool regardless of learning curve

### PROMPT QUALITY:
- Technical prompts with parameters, weights, model specifications
- Include workflow optimization tips
- Reference specific model versions, samplers, schedulers

### WRITING STYLE:
- Technical, efficiency-focused
- Can reference APIs, batch processing, automation`;
}

function buildRoutePrompt(lang: LangOption): string {
  const base = `## ROUTE FORMAT (CRITICAL — follow exactly)

A Route is a 3-step workflow. ALWAYS exactly 3 steps. Every step has is_best3: true.
Using the SAME tool for multiple steps is allowed if it genuinely fits the workflow (e.g., ChatGPT for image in step 1 and video in step 2).

### WORKFLOW DESIGN PROCESS (think step by step):
1. First, understand WHAT the user wants to create (the final output)
2. Break it down: what INPUTS are needed? what TRANSFORMATIONS? what's the final OUTPUT?
3. For each transformation, pick the BEST tool at the selected difficulty level
4. Make sure each step's OUTPUT feeds naturally into the NEXT step's INPUT

### step_input_type rules:
1. "prompt" — actual AI prompt template. step_prompt_example: EXACT copy-pasteable prompt with specific details. THIS IS THE MOST IMPORTANT.
2. "settings" — tool configuration. step_prompt_example: arrow-separated setting flow.
3. "action" — hands-on instructions. step_prompt_example: detailed click-by-click guide.

Prefer "prompt" type when the tool accepts text input — the prompt quality is what makes our guides valuable.

- tags: lowercase kebab-case English keywords`;

  if (lang === "en") {
    return `${base}

### Field formats (EN only):
- step_title: English short action phrase
- step_why: One sentence explaining WHY this tool is the best choice (English)
- step_cta_label: "Try [ToolName]"
- step_prompt_example: English version of the prompt/settings/action
- guide_bullets: 3-5 practical pro tips in English`;
  }
  if (lang === "kr") {
    return `${base}

### Field formats (KR only — include English slug/title for DB):
- step_title: English short action phrase (for DB key)
- step_title_kr: Korean descriptive with context in parentheses
- step_why: English one sentence (for DB key)
- step_why_kr: Korean one sentence explaining WHY this tool is the best choice
- step_cta_label: "Try [ToolName]" (for DB key)
- step_cta_label_kr: "[ToolName] 사용해보기"
- step_prompt_example: English version (for DB base)
- step_prompt_example_kr: Korean version of the prompt/settings/action
- guide_bullets: 3-5 pro tips in English (for DB base)
- guide_bullets_kr: 3-5 practical pro tips in Korean`;
  }
  return `${base}

### Field formats (EN + KR bilingual):
- step_title: English short action phrase
- step_title_kr: Korean descriptive with context in parentheses
- step_why / step_why_kr: One sentence explaining WHY this tool is the best choice
- step_cta_label: "Try [ToolName]"
- step_cta_label_kr: "[ToolName] 사용해보기"
- step_prompt_example_en: English version of the prompt/settings/action
- step_prompt_example_kr: Korean version of the prompt/settings/action
- guide_bullets_en: 3-5 practical pro tips in English
- guide_bullets_kr: 3-5 practical pro tips in Korean`;
}

function buildGuideFormatPrompt(lang: LangOption): string {
  const guideSpec = `
## GUIDE CONTENT LENGTH RULES — READ THIS VERY CAREFULLY

🚨🚨🚨 ABSOLUTE MINIMUM: 4000 characters per guide. TARGET: 5000 characters. 🚨🚨🚨
If your guide content is under 3500 characters, it WILL BE REJECTED and you must regenerate.
The "content" field is the LONGEST field in the entire JSON response. Write generously.
Do NOT include CTA sections — they are rendered separately by the frontend.

### Required H2 sections (ALL 6 are mandatory):

EN: ## Summary | ## Step-by-Step Guide | ## Common Mistakes | ## Quick Checklist | ## Recommended Tool Stack | ## Bonus Tips
KR: ## 요약 | ## 단계별 가이드 | ## 흔한 실수 | ## 빠른 체크리스트 | ## 추천 도구 스택 | ## 보너스 팁

### EXACT LENGTH REQUIREMENTS PER SECTION (these add up to 4000-5000 chars):

**1. 요약/Summary (500-700 chars):**
Write 3 full paragraphs:
- Para 1: What is this workflow/tool and what amazing result will the user create?
- Para 2: Why this specific approach? What makes it special compared to alternatives?
- Para 3: Who is this guide for? What prior knowledge is needed? (Answer: none!)

**2. 단계별 가이드/Step-by-Step Guide (2000-2500 chars) — THIS IS THE CORE:**
For EACH step, write a ### sub-heading and include ALL of the following:
- **준비물/What you need**: What files, accounts, or setup before starting
- **상세 과정/Detailed process**: Click-by-click instructions. "Click X → Select Y → Set Z to W"
- **복사용 프롬프트/Copy-paste prompt**: The EXACT text the user should type or paste (in a blockquote or code block)
- **예상 결과/Expected result**: What the output should look like. "You should see a 5-second video where..."
- **문제 해결/Troubleshooting**: "If [problem], try [solution]" — at least 1-2 per step

Example density for ONE step (this is the minimum detail level):
> ### 1단계: ChatGPT로 산타 이미지 만들기
> 
> **준비물:** ChatGPT Plus 구독 (무료 버전도 가능하지만 이미지 품질이 다를 수 있습니다), 합성할 원본 사진 1장
>
> **과정:**
> 1. ChatGPT (chat.openai.com)에 접속합니다
> 2. 새 대화를 시작하고 원본 사진을 업로드합니다
> 3. 아래 프롬프트를 복사해서 붙여넣기 합니다:
>
> > "이 거실 사진을 봐주세요. 크리스마스 트리 옆에 산타클로스가 큰 빨간 선물 가방을 들고 서 있는 새로운 이미지를 만들어주세요. 산타는 전통적인 빨간 옷을 입고 사실적이고 인자한 모습이어야 합니다. 조명은 방의 따뜻한 조명과 맞춰주세요. 사실적인 스타일, 따뜻한 홀리데이 분위기로 부탁합니다."
>
> **예상 결과:** 원본 거실 배경에 산타가 자연스럽게 합성된 이미지가 생성됩니다. 조명과 그림자가 자연스러워야 합니다.
>
> **문제 해결:**
> - 산타가 부자연스러우면: "산타의 크기를 방 비율에 맞춰주세요" 추가
> - 배경이 변형되면: "원본 배경은 절대 변경하지 마세요" 강조

**3. 흔한 실수/Common Mistakes (500-600 chars):**
Write 5 mistakes, each with:
- **실수 제목**: 2-3문장으로 왜 이 실수가 발생하는지, 어떻게 해결하는지 구체적으로 설명

**4. 빠른 체크리스트/Quick Checklist (300-400 chars):**
8-10 checkbox items: "- [ ] 구체적인 확인 항목"

**5. 추천 도구 스택/Recommended Tool Stack (400-500 chars):**
- Why EACH tool was chosen (not just listing names)
- What alternatives exist and why these are better for this use case
- Free vs paid considerations

**6. 보너스 팁/Bonus Tips (400-500 chars):**
4-5 tips that make the result go from "good" to "amazing":
- Specific settings, parameters, or techniques
- Time-saving shortcuts
- Quality improvement tricks`;

  if (lang === "en") {
    return `${guideSpec}

Generate ONE guide object "guide_en" written ENTIRELY in English. Target: 4500-5500 English characters.`;
  }
  if (lang === "kr") {
    return `${guideSpec}

Generate ONE guide object "guide_kr" written ENTIRELY in Korean. Target: 4500-5500 Korean characters.
Korean guides tend to be shorter — FIGHT this tendency. Write MORE detail, not less.`;
  }
  return `${guideSpec}

Generate TWO separate guide objects:
- "guide_en": written ENTIRELY in English (4500-5500 English characters)
- "guide_kr": written ENTIRELY in Korean (4500-5500 Korean characters)
Both guides cover the same topic but are independently written for each audience — NOT a translation.
Korean guides tend to be shorter — FIGHT this tendency and write the SAME level of detail as English.`;
}

function buildSystemPrompt(lang: LangOption, difficulty: DifficultyLevel = "beginner"): string {
  const guideOutputFields = `{
    "title": "string (SEO-friendly, 20-60 chars in target language)",
    "slug": "string (kebab-case English)",
    "excerpt": "string (50-80 chars in target language)",
    "content": "string (LONG markdown, MUST be 4000-5500 chars, 6 H2 sections, extremely detailed step-by-step)",
    "category": "string (Image & Design | Writing | Video | Audio | Voice | Coding)",
    "taxonomy": "string (kebab-case)",
    "primary_intent": "string (kebab-case)"
  }`;

  let guideJson: string;
  if (lang === "en") {
    guideJson = `"guide_en": ${guideOutputFields}`;
  } else if (lang === "kr") {
    guideJson = `"guide_kr": ${guideOutputFields}`;
  } else {
    guideJson = `"guide_en": ${guideOutputFields},\n  "guide_kr": ${guideOutputFields}`;
  }

  let routeSchema: string;
  if (lang === "en") {
    routeSchema = `{
    "title": "string (English)",
    "slug": "string (kebab-case English)",
    "description": "string (English, 1 sentence)",
    "icon": "string (single emoji)",
    "tags": ["string (lowercase kebab-case)"],
    "guide_bullets": ["string (English pro tips, 3-5 items)"],
    "steps": [
      {
        "position": 1,
        "tool_slug": "string",
        "is_existing_tool": true,
        "is_best3": true,
        "step_title": "string (English)",
        "step_why": "string (English)",
        "step_cta_label": "Try [ToolName]",
        "step_prompt_example": "string (English)",
        "step_input_type": "settings" | "action" | "prompt",
        "new_tool": null
      }
    ]
  }`;
  } else if (lang === "kr") {
    routeSchema = `{
    "title": "string (English, for DB key)",
    "title_kr": "string (Korean)",
    "slug": "string (kebab-case English)",
    "description": "string (English, 1 sentence, for DB key)",
    "description_kr": "string (Korean, 1 sentence)",
    "icon": "string (single emoji)",
    "tags": ["string (lowercase kebab-case)"],
    "guide_bullets": ["string (English, for DB base)"],
    "guide_bullets_kr": ["string (Korean pro tips, 3-5 items)"],
    "steps": [
      {
        "position": 1,
        "tool_slug": "string",
        "is_existing_tool": true,
        "is_best3": true,
        "step_title": "string (English, for DB key)",
        "step_title_kr": "string (Korean)",
        "step_why": "string (English, for DB key)",
        "step_why_kr": "string (Korean)",
        "step_cta_label": "Try [ToolName]",
        "step_cta_label_kr": "[ToolName] 사용해보기",
        "step_prompt_example": "string (English, for DB base)",
        "step_prompt_example_kr": "string (Korean)",
        "step_input_type": "settings" | "action" | "prompt",
        "new_tool": null
      }
    ]
  }`;
  } else {
    routeSchema = `{
    "title": "string (English)",
    "title_kr": "string (Korean)",
    "slug": "string (kebab-case English)",
    "description": "string (English, 1 sentence)",
    "description_kr": "string (Korean, 1 sentence)",
    "icon": "string (single emoji)",
    "tags": ["string (lowercase kebab-case)"],
    "guide_bullets_en": ["string (English pro tips, 3-5 items)"],
    "guide_bullets_kr": ["string (Korean pro tips, 3-5 items)"],
    "steps": [
      {
        "position": 1,
        "tool_slug": "string",
        "is_existing_tool": true,
        "is_best3": true,
        "step_title": "string (English)",
        "step_title_kr": "string (Korean)",
        "step_why": "string (English)",
        "step_why_kr": "string (Korean)",
        "step_cta_label": "Try [ToolName]",
        "step_cta_label_kr": "[ToolName] 사용해보기",
        "step_prompt_example_en": "string (English)",
        "step_prompt_example_kr": "string (Korean)",
        "step_input_type": "settings" | "action" | "prompt",
        "new_tool": null
      }
    ]
  }`;
  }

  return `You are an expert AI workflow architect for Airoute — you have deep knowledge of the AI tool ecosystem.
Given a user's natural language description, design the BEST possible AI Route with exactly 3 tools that form a logical, practical workflow.

${buildDifficultyPrompt(difficulty)}

## YOUR CORE EXPERTISE (use this knowledge):

### AI Video Generation & Editing:
- Kling AI, Runway Gen-3/Gen-4, Pika Labs, Luma Dream Machine — generate video from image/text
- HeyGen, Synthesia — AI avatar video generation
- CapCut, Filmora — video editing with AI features
- Opus Clip, Vizard — long video to short clips
- Descript — AI video/audio editing with transcript

### AI Image Generation & Editing:
- Midjourney, DALL-E 3, Stable Diffusion, Flux — text to image
- Leonardo AI — image generation with fine control
- Remove.bg, Photoroom — background removal
- Canva AI, Adobe Firefly — design with AI assist
- FaceSwap, InsightFace — face swap in images/video

### AI Audio & Voice:
- ElevenLabs, Play.ht — AI voice generation / TTS
- Suno, Udio — AI music generation
- Adobe Podcast, Descript — audio cleanup/editing
- Whisper, Clova Note — speech-to-text

### AI Writing & Productivity:
- ChatGPT, Claude, Gemini — text generation, brainstorming
- Notion AI, Jasper — structured writing
- Copy.ai, Writesonic — marketing copy

## CRITICAL WORKFLOW DESIGN RULES:
- Choose tools that ACTUALLY solve the user's specific task
- The 3 tools must form a LOGICAL SEQUENCE (output of step N feeds into step N+1)
- Pick the BEST tool for each specific sub-task, not generic catch-alls
- For video from image: use Kling/Runway/Pika (NOT generic editors)
- For AI avatars: use HeyGen/Synthesia (NOT basic video editors)
- For face/character compositing: use face swap or AI video tools

${buildRoutePrompt(lang)}

## TOOL MATCHING RULES
- Use existing tools from the provided DB list when they are a GOOD FIT.
- If a DB tool is NOT the best choice for the task, create a new tool entry instead.
- Quality of the workflow matters more than reusing existing tools.
- Each step uses exactly ONE tool.
${lang !== "en" ? "\n## NEW TOOL FORMAT\nWhen creating a new tool, include name_kr and description_kr in the new_tool object for Korean i18n.\n" : ""}
## OUTPUT FORMAT (strict JSON):
{
  "route": ${routeSchema},
  ${guideJson}
}

${buildGuideFormatPrompt(lang)}

REMEMBER — FINAL CHECKLIST BEFORE RESPONDING:
- Exactly 3 steps, all is_best3: true
- Prioritize "prompt" type for step_input_type — great prompts are our key value
- 🚨 COUNT your guide content characters. It MUST be 4000-5500 characters. Under 3500 = REJECTED.
- The Step-by-Step section ALONE should be 2000+ characters (it's the bulk of the guide)
- Each step needs: preparation, detailed process, copy-paste prompt, expected result, troubleshooting
- If you think you're done writing the guide, you're probably only halfway. KEEP WRITING MORE DETAIL.`;
}

/* ──────────────────────────────────────────────────────── */
/* Tool Mode Prompts                                       */
/* ──────────────────────────────────────────────────────── */

function buildToolModeSystemPrompt(lang: LangOption, difficulty: DifficultyLevel = "beginner"): string {
  const guideOutputFields = `{
    "title": "string (SEO-friendly tool guide title, 20-60 chars in target language)",
    "slug": "string (kebab-case English, e.g. how-to-use-kling-ai)",
    "excerpt": "string (50-80 chars in target language)",
    "content": "string (LONG markdown, MUST be 4000-5500 chars, 6 H2 sections, extremely detailed step-by-step)",
    "category": "string (Image & Design | Writing | Video | Audio | Voice | Coding)",
    "taxonomy": "string (kebab-case)",
    "primary_intent": "string (kebab-case)"
  }`;

  let guideJson: string;
  if (lang === "en") {
    guideJson = `"guide_en": ${guideOutputFields}`;
  } else if (lang === "kr") {
    guideJson = `"guide_kr": ${guideOutputFields}`;
  } else {
    guideJson = `"guide_en": ${guideOutputFields},\n  "guide_kr": ${guideOutputFields}`;
  }

  const toolSchema = lang === "en"
    ? `{
    "slug": "string (kebab-case, e.g. kling-ai)",
    "name": "string (official English name)",
    "description": "string (1-2 sentence English description of what the tool does)",
    "url": "string (official website URL)",
    "category": "string (Image & Design | Writing | Video | Audio | Voice | Coding)",
    "pricing": "string (free | freemium | paid | enterprise)",
    "is_existing": false
  }`
    : lang === "kr"
    ? `{
    "slug": "string (kebab-case)",
    "name": "string (official English name)",
    "name_kr": "string (Korean name/transliteration)",
    "description": "string (English description)",
    "description_kr": "string (Korean description)",
    "url": "string (official URL)",
    "category": "string (Image & Design | Writing | Video | Audio | Voice | Coding)",
    "pricing": "string (free | freemium | paid | enterprise)",
    "is_existing": false
  }`
    : `{
    "slug": "string (kebab-case)",
    "name": "string (official English name)",
    "name_kr": "string (Korean name/transliteration)",
    "description": "string (English description)",
    "description_kr": "string (Korean description)",
    "url": "string (official URL)",
    "category": "string (Image & Design | Writing | Video | Audio | Voice | Coding)",
    "pricing": "string (free | freemium | paid | enterprise)",
    "is_existing": false
  }`;

  return `You are an expert AI tool reviewer for Airoute — a platform that helps beginners discover and use AI tools effectively.
Given a user's description of an AI tool, generate a comprehensive tool profile and a detailed usage guide.

${buildDifficultyPrompt(difficulty)}

## YOUR TASK:
1. Identify the tool (check if it's an existing tool in our DB or create a new profile)
2. Generate a thorough tool_based guide explaining HOW to use this specific tool

## TOOL PROFILE RULES:
- Use the official tool name and URL
- Accurate category and pricing info
- If the tool matches one in the existing DB list, set is_existing: true and use the EXACT slug from the DB
- If the tool is NOT in the DB, set is_existing: false and create a new slug

## GUIDE FOCUS (tool_based guide differs from route_based guide):
- Focus entirely on ONE tool — deep dive into its features
- Step-by-Step should cover: sign up, basic usage, intermediate tips, export/share
- Common mistakes should be specific to THIS tool
- Include specific prompts, settings, and examples for THIS tool
- The guide should make a beginner confident to start using this tool TODAY

${buildGuideFormatPrompt(lang)}

## OUTPUT FORMAT (strict JSON):
{
  "tool": ${toolSchema},
  ${guideJson}
}

REMEMBER — FINAL CHECKLIST BEFORE RESPONDING:
- 🚨 COUNT your guide content characters. It MUST be 4000-5500 characters. Under 3500 = REJECTED.
- The Step-by-Step section ALONE should be 2000+ characters — it's the core of the guide
- Each step needs: preparation, detailed process, copy-paste prompt/settings, expected result, troubleshooting
- Focus on PRACTICAL, actionable instructions for this specific tool
- Include real prompt examples and settings the user can copy
- If you think you're done writing the guide, you're probably only halfway. KEEP WRITING MORE DETAIL.`;
}

function buildToolModeUserPrompt(
  prompt: string,
  existingTools: { slug: string; name: string; category: string }[],
): string {
  const toolList = existingTools
    .map((t) => `- ${t.name} (slug: ${t.slug}, category: ${t.category})`)
    .join("\n");

  return `User request: "${prompt}"

## Existing tools in our DB (if the tool matches one of these, set is_existing: true and use the EXACT slug):
${toolList}

Generate a tool profile + guide(s) for the described tool.
If the user mentions a specific tool name, find or create that tool.
If the user describes a use case, identify the BEST single tool for it and generate the profile + guide.`;
}

/* ──────────────────────────────────────────────────────── */
/* Route Mode User Prompt                                  */
/* ──────────────────────────────────────────────────────── */

function buildUserPrompt(
  prompt: string,
  existingTools: { slug: string; name: string; category: string }[],
  difficulty: DifficultyLevel,
): string {
  const toolList = existingTools
    .map((t) => `- ${t.name} (slug: ${t.slug}, category: ${t.category})`)
    .join("\n");

  let example: string;

  if (difficulty === "beginner") {
    example = `## Reference: BEGINNER Route Example

Route: "Make a fun Santa Christmas video from my house photo"
- slug: santa-christmas-video, icon: 🎅, tags: ["video", "christmas", "ai-image"]

Step 1 (prompt): "Create Santa in my house photo" / chatgpt
  EN: "Look at this photo of my living room. Generate a new image where Santa Claus is standing next to the Christmas tree, holding a big red gift bag. Santa should look realistic and jolly, wearing a traditional red suit. The lighting should match the room's warm lighting. Keep the room exactly as it is, just add Santa naturally into the scene. Photorealistic style, warm holiday atmosphere."
  KR: "이 거실 사진을 봐주세요. 이 사진의 크리스마스 트리 옆에 산타클로스가 큰 빨간 선물 가방을 들고 서 있는 새로운 이미지를 만들어주세요. 산타는 전통적인 빨간 옷을 입고 사실적이고 인자한 모습이어야 합니다. 조명은 방의 따뜻한 조명과 맞춰주세요. 방은 그대로 유지하고 산타만 자연스럽게 추가해주세요. 사실적인 스타일, 따뜻한 홀리데이 분위기."

Step 2 (prompt): "Turn the image into a short video" / chatgpt
  EN: "Take this image of Santa in my living room. Create a 5-second video where: Santa slowly turns his head toward the camera and gives a warm smile, the Christmas tree lights gently twinkle in the background, and there's a subtle camera zoom-in effect. Keep it warm and magical."
  KR: "이 거실의 산타 이미지를 가지고 5초짜리 영상을 만들어주세요: 산타가 천천히 카메라를 향해 고개를 돌리며 따뜻한 미소를 짓고, 배경의 크리스마스 트리 조명이 부드럽게 반짝이며, 은은한 카메라 줌인 효과를 넣어주세요. 따뜻하고 마법 같은 분위기로."

Step 3 (prompt): "Write a social media caption" / chatgpt
  EN: "Write 3 Instagram caption options for a video of Santa visiting my house. Include: 1) A heartwarming family-friendly caption with 1-2 emojis, 2) A funny/playful caption, 3) A short caption under 10 words. Also suggest 10 relevant hashtags. Tone: warm, festive, shareable."
  KR: "산타가 우리 집에 방문한 영상에 어울리는 인스타그램 캡션 3가지를 작성해주세요. 1) 따뜻한 가족용 캡션 (이모지 1~2개 포함), 2) 재미있고 장난스러운 캡션, 3) 10단어 이내의 짧은 캡션. 관련 해시태그 10개도 추천해주세요. 톤: 따뜻하고 축제 분위기, 공유하고 싶은 느낌."

Notice: The same tool (ChatGPT) is used for ALL 3 steps because it handles image generation, video creation, and text — all in one simple chat interface. This is IDEAL for beginners.`;
  } else if (difficulty === "intermediate") {
    example = `## Reference: INTERMEDIATE Route Example

Route: "Turn long videos into Shorts"
- slug: turn-long-videos-into-shorts, icon: ✂️, tags: ["video", "shorts", "content-repurpose"]

Step 1 (settings): "Auto-Detect Viral Moments" / opus-clip
  EN: "Upload long video → Set platform 'YouTube Shorts' → AI Virality Score 70+ filter → Generate clips → Review top 10 candidates → Pick clips with clear hook in first 1-2s."
  KR: "긴 비디오 업로드 → 플랫폼 설정 'YouTube Shorts' → AI 바이럴 점수 70+ 필터 → 클립 생성 → 상위 10개 후보 검토 → 첫 1~2초에 명확한 후크 있는 클립 선택."

Step 2 (action): "Polish & Export" / filmora
  EN: "Import selected clip → Add auto captions (bold white, black outline) → Remove filler segments → Add subtle zoom every 3-5s → Export 1080×1920, 30fps, H.264."
  KR: "선택한 클립 가져오기 → 자동 자막 추가 (굵은 흰색, 검은 외곽선) → 필러 구간 제거 → 3~5초마다 은은한 줌 추가 → 1080×1920, 30fps, H.264로 내보내기."

Step 3 (prompt): "Generate Hooks & Titles" / chatgpt
  EN: "Generate a viral Shorts content bundle for [topic]. Create: 5 scroll-stopping hooks (first 3 words must trigger curiosity), 5 SEO titles under 60 chars, 5 short captions with CTA. Audience: [target]. Tone: [tone]. No emojis in titles."
  KR: "주제 [topic]에 대한 바이럴 Shorts 콘텐츠 묶음을 만들어주세요. 스크롤을 멈추게 하는 후크 5개 (처음 3단어가 호기심 유발), 60자 이내 SEO 제목 5개, CTA 포함 짧은 캡션 5개. 대상: [target]. 톤: [tone]. 제목에 이모지 없음."`;
  } else {
    example = `## Reference: ADVANCED Route Example

Route: "Professional AI product photography"
- slug: ai-product-photography, icon: 📸, tags: ["image", "ecommerce", "product-photo"]

Step 1 (prompt): "Generate base product image" / midjourney
  EN: "[product] on white marble surface, soft studio lighting from top-left at 45°, shallow depth of field f/2.8, subtle reflection on surface, 8K commercial photography, Canon EOS R5 style --ar 4:5 --v 6.1 --style raw --s 250"
  KR: "[제품명] 흰색 대리석 위, 왼쪽 상단 45°에서 부드러운 스튜디오 조명, f/2.8 얕은 심도, 표면에 은은한 반사, 8K 상업 사진, Canon EOS R5 스타일 --ar 4:5 --v 6.1 --style raw --s 250"

Step 2 (prompt): "Composite into lifestyle scene" / comfyui
  EN: "Load product image → ControlNet (depth + canny) → SDXL base + refiner → Positive: luxurious living room scene, product on coffee table, golden hour sunlight through window, bokeh background → Negative: text, watermark, blurry product → Steps: 30, CFG: 7, Sampler: DPM++ 2M Karras"
  KR: "제품 이미지 로드 → ControlNet (depth + canny) → SDXL base + refiner → 긍정: 고급 거실 장면, 커피테이블 위 제품, 창문으로 들어오는 골든아워 햇빛, 보케 배경 → 부정: 텍스트, 워터마크, 흐린 제품 → Steps: 30, CFG: 7, Sampler: DPM++ 2M Karras"

Step 3 (action): "Batch resize for all platforms" / canva
  EN: "Upload final image → Bulk Create: 1080×1080 (Instagram), 1200×628 (Facebook), 1000×1000 (Amazon), 800×800 (Shopify) → Smart Resize → Export all as PNG (transparent bg option) → Download ZIP"
  KR: "최종 이미지 업로드 → 일괄 생성: 1080×1080 (Instagram), 1200×628 (Facebook), 1000×1000 (Amazon), 800×800 (Shopify) → 스마트 리사이즈 → 모두 PNG로 내보내기 (투명 배경 옵션) → ZIP 다운로드"`;
  }

  return `User request: "${prompt}"

## Existing tools in our DB (use if they are a good fit, otherwise create new):
${toolList}

${example}

Now generate a Route + Guide(s) for the user's request.
CRITICAL: First THINK about what the user actually wants to achieve, then design the workflow. The step_prompt_example must be SPECIFIC and DETAILED — not generic templates.`;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      return NextResponse.json({ ok: false, error: "Not a system admin" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Auth failed" }, { status: 401 });
  }

  try {
    if (process.env.OPENAI_ENABLED !== "true") {
      return NextResponse.json(
        { ok: false, error: "OpenAI disabled. Set OPENAI_ENABLED=true." },
        { status: 403 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const prompt = body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ ok: false, error: "prompt is required" }, { status: 400 });
    }

    const lang: LangOption = (body.lang === "en" || body.lang === "kr" || body.lang === "both")
      ? body.lang
      : "both";

    const difficulty: DifficultyLevel = (body.difficulty === "beginner" || body.difficulty === "intermediate" || body.difficulty === "advanced")
      ? body.difficulty
      : "beginner";

    const mode: CreatorMode = body.mode === "tool" ? "tool" : "route";

    const adminDb = createAdminSupabase();

    const { data: toolsRaw } = await adminDb
      .from("tools")
      .select("slug, name, category_id, tags")
      .eq("is_active", true)
      .order("name");

    const existingTools = (toolsRaw ?? []).map((t: any) => ({
      slug: t.slug ?? "",
      name: t.name ?? "",
      category: t.category_id ?? "Other",
    }));

    const creatorModel = process.env.OPENAI_CREATOR_MODEL || "gpt-4o";
    const openai = new OpenAI({ apiKey });
    const model = creatorModel;

    const systemContent = mode === "tool"
      ? buildToolModeSystemPrompt(lang, difficulty)
      : buildSystemPrompt(lang, difficulty);

    const userContent = mode === "tool"
      ? buildToolModeUserPrompt(prompt, existingTools)
      : buildUserPrompt(prompt, existingTools, difficulty);

    const maxTokens = mode === "tool"
      ? (lang === "both" ? 16000 : 10000)
      : (lang === "both" ? 16000 : 12000);

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("OpenAI returned empty response");

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Failed to parse OpenAI JSON: ${raw.slice(0, 300)}`);
    }

    if (mode === "tool") {
      if (!parsed.tool) throw new Error("Missing tool in AI response");
    } else {
      if (!parsed.route) throw new Error("Missing route in AI response");
    }

    // Normalize guide keys: AI sometimes returns "guide" instead of "guide_en"/"guide_kr"
    if (parsed.guide && typeof parsed.guide === "object") {
      if (!parsed.guide_en && !parsed.guide_kr) {
        // Single "guide" key — assign based on lang
        if (lang === "en") parsed.guide_en = parsed.guide;
        else if (lang === "kr") parsed.guide_kr = parsed.guide;
        else {
          parsed.guide_en = parsed.guide;
          parsed.guide_kr = parsed.guide;
        }
      }
      delete parsed.guide;
    }

    if (lang === "en" && !parsed.guide_en) throw new Error("Missing guide_en");
    if (lang === "kr" && !parsed.guide_kr) throw new Error("Missing guide_kr");
    if (lang === "both") {
      if (!parsed.guide_en && !parsed.guide_kr) {
        throw new Error("Missing guide_en and guide_kr for both mode");
      }
      // If one is missing, duplicate the other so the flow can continue
      if (!parsed.guide_en) parsed.guide_en = parsed.guide_kr;
      if (!parsed.guide_kr) parsed.guide_kr = parsed.guide_en;
    }

    if (mode === "route") {
      const existingSlugs = new Set(existingTools.map((t) => t.slug));
      for (const step of parsed.route.steps ?? []) {
        if (existingSlugs.has(step.tool_slug)) {
          step.is_existing_tool = true;
          step.new_tool = null;
        } else {
          step.is_existing_tool = false;
          if (!step.new_tool) {
            step.new_tool = {
              name: step.tool_slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
              slug: step.tool_slug,
              description: step.step_why || `AI tool for ${step.step_title}`,
              category: parsed.route.tags?.[0] || "Other",
              website_url: "",
              tags: parsed.route.tags ?? [],
            };
          }
        }
      }
    } else {
      const existingSlugs = new Set(existingTools.map((t) => t.slug));
      if (existingSlugs.has(parsed.tool.slug)) {
        parsed.tool.is_existing = true;
      }
    }

    const usage = completion.usage;
    await adminDb.from("admin_openai_usage_logs").insert({
      guide_id: null,
      action: mode === "tool" ? "ai_creator_analyze_tool" : "ai_creator_analyze",
      lang,
      model,
      prompt_tokens: usage?.prompt_tokens ?? null,
      completion_tokens: usage?.completion_tokens ?? null,
      total_tokens: usage?.total_tokens ?? null,
    });

    return NextResponse.json({
      ok: true,
      mode,
      preview: parsed,
      lang,
      difficulty,
      model,
      tokens: usage?.total_tokens ?? 0,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[ai-creator/analyze]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
