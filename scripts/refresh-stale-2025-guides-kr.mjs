/**
 * KR counterpart of refresh-stale-2025-guides.mjs (build-safety-protocol: KR/EN 동시 유지).
 * Only 2 KR guides currently hardcode "2025" in title/excerpt.
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
    slug: 'chatgpt-vs-claude-2025-kr',
    title: 'ChatGPT와 Claude: 어떤 AI가 글쓰기와 추론에 더 좋을까요?',
    excerpt: 'ChatGPT와 Claude의 작업 기반 비교—글쓰기 품질, 장문 구조, 추론, 코딩 도움, 그리고 작업 흐름에 적합한 선택.',
  },
  {
    slug: 'runway-vs-pika-2025-kr',
    title: 'Runway 대 Pika: 어떤 AI 비디오 생성기를 사용해야 할까요?',
    excerpt: 'Runway와 Pika의 실제 비교 - 비디오 품질, 속도, 제어, 가격 및 제작자와 마케터를 위한 최적의 사용 사례.',
  },
];

const nowIso = new Date().toISOString();
let okCount = 0;

for (const u of UPDATES) {
  const res = await fetch(`${url}/rest/v1/guides?slug=eq.${encodeURIComponent(u.slug)}`, {
    method: 'PATCH',
    headers: { ...h, Prefer: 'return=representation' },
    body: JSON.stringify({
      title: u.title,
      excerpt: u.excerpt,
      updated_at: nowIso,
      last_updated_content_at: nowIso,
      last_verified_at: nowIso,
      is_verified: true,
    }),
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
  console.log(`✅ ${u.slug} -> ${updated[0].title}`);
}

console.log(`\n총 ${okCount}/${UPDATES.length}건 업데이트 완료.`);
