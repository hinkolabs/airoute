/**
 * Light-touch freshness pass for pillar guides whose title/excerpt hardcode "2025".
 * - Does NOT touch `content` (body) — per user's decision, no deep rewrite.
 * - Rewrites `title`/`excerpt` to drop the hardcoded year so they read as evergreen.
 * - Bumps `updated_at`, `last_updated_content_at`, `last_verified_at`, sets `is_verified = true`
 *   so freshness signals (UI "최종 수정일", sitemap lastModified) reflect a real 2026 review pass.
 */
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx < 0) continue;
  process.env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const h = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

const UPDATES = [
  {
    slug: 'best-ai-tools-2025',
    title: 'Best AI Tools to Use Right Now (A Complete Guide)',
    excerpt: 'We tested 120+ AI tools and selected the 10 best performers across writing, image, video, and automation categories.',
  },
  {
    slug: 'how-to-choose-ai-tool',
    title: "How to Choose the Right AI Tool (Beginner's Guide)",
    excerpt: 'A beginner-friendly roadmap for choosing the right AI tools, including LLMs, image models, video models, pricing, and workflow recommendations.',
  },
  {
    slug: 'best-ai-tools-for-beginners-2025',
    title: 'Best AI Tools for Beginners: Start Here Without Overthinking',
    excerpt: 'A beginner-friendly list of the best AI tools, chosen by real tasks—writing, images, video, voice, and music—so you can start fast without confusion.',
  },
  {
    slug: 'best-ai-tools-by-task-2025',
    title: 'Best AI Tools by Task: Writing, Image, Video, Voice, Music',
    excerpt: 'A task-first guide to the best AI tools—pick the right tool for writing, images, video, voice, and music without overthinking.',
  },
  {
    slug: 'midjourney-vs-dalle-2025',
    title: 'Midjourney vs DALL·E: Which AI Image Tool Is Better?',
    excerpt: 'A task-based comparison of Midjourney and DALL·E—image quality, prompt control, speed, pricing, and best use cases for creators and marketers.',
  },
  {
    slug: 'runway-vs-pika-2025',
    title: 'Runway vs Pika: Which AI Video Generator Should You Use?',
    excerpt: 'A practical comparison of Runway and Pika—video quality, speed, control, pricing, and best use cases for creators and marketers.',
  },
  {
    slug: 'elevenlabs-vs-openvoice-2025',
    title: 'ElevenLabs vs OpenVoice: Which AI Voice Tool Sounds More Human?',
    excerpt: 'A practical comparison of ElevenLabs and OpenVoice—voice realism, emotion control, cloning quality, and best use cases for creators and businesses.',
  },
  {
    slug: 'chatgpt-vs-claude-2025',
    title: 'ChatGPT vs Claude: Which AI Is Better for Writing and Reasoning?',
    excerpt: 'A task-based comparison of ChatGPT and Claude—writing quality, long-form structure, reasoning, coding help, and which one to choose for your workflow.',
  },
  {
    slug: 'suno-vs-udio-2025',
    title: 'Suno vs Udio: Which AI Music Generator Is Better?',
    excerpt: 'A real-world comparison of Suno and Udio—music quality, control, copyright considerations, and which tool fits creators and businesses.',
  },
  {
    slug: 'best-ai-tools-for-youtube-shorts',
    title: 'Best AI Tools for YouTube Shorts: Create Viral Clips Faster',
    excerpt: 'A practical list of the best AI tools for YouTube Shorts—from long-video clipping to captions, visuals, and music—so creators can publish faster and grow views.',
  },
  {
    slug: 'ai-image-generation-guide',
    // title/excerpt already year-neutral; only bump freshness timestamps
  },
];

const nowIso = new Date().toISOString();
let okCount = 0;

for (const u of UPDATES) {
  const body = {
    updated_at: nowIso,
    last_updated_content_at: nowIso,
    last_verified_at: nowIso,
    is_verified: true,
  };
  if (u.title) body.title = u.title;
  if (u.excerpt) body.excerpt = u.excerpt;

  const res = await fetch(`${url}/rest/v1/guides?slug=eq.${encodeURIComponent(u.slug)}`, {
    method: 'PATCH',
    headers: { ...h, Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`❌ ${u.slug} 업데이트 실패:`, res.status, await res.text());
    continue;
  }
  const updated = await res.json();
  if (updated.length === 0) {
    console.warn(`⚠️  ${u.slug}: 대상 행을 찾지 못함`);
    continue;
  }
  okCount++;
  console.log(`✅ ${u.slug}`);
  if (u.title) console.log(`   title -> ${updated[0].title}`);
}

console.log(`\n총 ${okCount}/${UPDATES.length}건 업데이트 완료.`);
