// src/lib/guides/free-templates/kr.ts
// Korean template builder for FREE guide generation

export type Variant = "A" | "B" | "C";

export type FreeRecipeInput = {
  recipe_key: string;
  guide_type: "route_based" | "tool_based" | "safety";
  primary_intent: string; // kept in English (slug)
  primary_route?: string | null;
  cta_type: "route" | "tool" | "mixed" | null;
  cta_route_slug?: string | null;
  cta_tool_slug?: string | null;
  cta_partner?: string | null;
  variant: Variant;
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

// --- Korean sentence pools (shared) ---
const TITLE_POOL = [
  (intent: string) => `${intent} 실전 가이드`,
  (intent: string) => `${intent} 시작하기 (단계별 안내)`,
  (intent: string) => `${intent}를 위한 가장 간단한 방법`,
];

const EXCERPT_POOL = [
  (intent: string) =>
    `${intent}을 위한 명확하고 실용적인 가이드입니다. 불필요한 도구 없이 간단한 루트를 안내합니다.`,
  (intent: string) =>
    `${intent}을 위한 단계별 루트를 배우고 초보자가 자주 하는 실수를 피하세요.`,
  (intent: string) =>
    `${intent}에 자신감을 가지고 접근할 수 있도록 도와주는 초보자 친화적 가이드입니다.`,
];

const CHECKLIST_POOL = [
  `목표 명확히 정의됨`,
  `주요 도구 선택됨`,
  `첫 번째 버전 완료`,
  `기본 검토 완료`,
  `다음 반복 계획됨`,
];

const CTA_ROUTE_POOL = [
  (route: string) =>
    `추천 루트(${route})를 열어 도구와 단계를 한 곳에서 확인하세요.`,
];

const CTA_TOOL_POOL = [
  (tool: string) =>
    `공식 ${tool} 페이지를 방문하여 추천 설정으로 시작하세요.`,
];

const CTA_MIXED_POOL = [
  (route: string, tool: string) =>
    `루트(${route})로 시작한 다음, ${tool}를 사용하여 핵심 실행 단계를 수행하세요.`,
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
        `이 가이드는 ${intent}를 위한 명확한 루트를 안내합니다. 순서대로 단계를 따르고 목표에 직접적으로 기여하지 않는 것은 건너뛰세요.`,
      stepsIntro: () => `아래 루트는 결정을 최소화하고 꾸준한 진행을 유지하도록 설계되었습니다.`,
      mistakes: [
        `명확한 목표를 정의하기 전에 너무 많은 도구를 시도함`,
        `계획 단계를 건너뛰고 바로 실행에 돌입함`,
        `첫 번째 초안을 완성하기 전에 세부 사항을 최적화함`,
      ],
      checklistIntro: `이 체크리스트를 사용하여 루트를 따라가는 진행 상황을 추적하세요:`,
      cta: `이 루트를 따라 목표를 달성하세요.`,
    },
    B: {
      tldr: (intent: string) =>
        `${intent}에 접근하는 간단한 방법을 원하시나요? 이 루트는 필수 사항에 집중하고 방해 요소를 제거합니다.`,
      stepsIntro: () => `일반적인 우회와 시간 낭비를 피하려면 이 단계를 순서대로 따르세요.`,
      mistakes: [
        `불필요한 단계를 추가하여 프로세스를 복잡하게 만듦`,
        `진행 상황을 측정할 명확한 마일스톤을 설정하지 않음`,
        `초기 결과를 보기 전에 너무 일찍 포기함`,
      ],
      checklistIntro: `다음 단계로 넘어가기 전에 각 체크포인트를 완료하세요:`,
      cta: `추천 경로를 따르고 필요에 따라 조정하세요.`,
    },
    C: {
      tldr: (intent: string) =>
        `분석보다 행동을 우선시하는 ${intent}에 대한 간소화된 접근 방식입니다. 빠른 성과를 원한다면 여기서 시작하세요.`,
      stepsIntro: () => `이 순서는 최소한의 마찰로 결과를 얻도록 최적화되어 있습니다.`,
      mistakes: [
        `대략적인 초안으로 시작하는 대신 끝없이 조사함`,
        `하나를 선택하기 전에 너무 많은 대안을 비교함`,
        `의미 있는 진행을 지연시키는 완벽주의`,
      ],
      checklistIntro: `이 빠른 목록으로 완료 상태를 추적하세요:`,
      cta: `다음 논리적 단계를 수행하고 모멘텀을 계속 쌓아가세요.`,
    },
  },
  tool_based: {
    A: {
      tldr: (intent: string) =>
        `이 도구는 ${intent}을 더 빠르게 달성하도록 도와줍니다. 설정 방법과 빠른 결과를 얻는 방법을 알아보세요.`,
      stepsIntro: () => `추천 도구를 설정하고 사용하는 방법은 다음과 같습니다:`,
      mistakes: [
        `하나를 먼저 마스터하는 대신 프로젝트 중간에 도구를 바꿈`,
        `도구의 내장 기능을 무시하고 과도하게 커스터마이징함`,
        `문서를 읽지 않고 바로 시작함`,
      ],
      checklistIntro: `도구가 올바르게 설정되었는지 이 항목들을 확인하세요:`,
      cta: `도구 사용을 시작하고 즉시 결과를 확인하세요.`,
    },
    B: {
      tldr: (intent: string) =>
        `${intent}을 처리할 도구를 찾고 계신가요? 이 가이드는 어떤 도구를 선택하고 효과적으로 사용하는 방법을 보여줍니다.`,
      stepsIntro: () => `선택한 도구를 최대한 활용하려면 다음 단계를 따르세요:`,
      mistakes: [
        `더 간단한 도구로 충분할 때 복잡한 도구를 사용함`,
        `학습 곡선을 건너뛰고 즉각적인 숙달을 기대함`,
        `커뮤니티 리소스와 튜토리얼을 무시함`,
      ],
      checklistIntro: `도구를 구성할 때 각 항목을 체크하세요:`,
      cta: `도구를 실행하고 설정 가이드를 따르세요.`,
    },
    C: {
      tldr: (intent: string) =>
        `${intent}에 맞는 도구를 마스터하고 수작업 시간을 절약하세요. 이 가이드는 몇 분 만에 시작할 수 있게 해줍니다.`,
      stepsIntro: () => `도구의 잠재력을 최대한 발휘하려면 다음 단계를 완료하세요:`,
      mistakes: [
        `실제로 필요하지 않은 프리미엄 기능에 비용을 지불함`,
        `실험하기 전에 작업을 백업하지 않음`,
        `필수 사항에 집중하는 대신 모든 기능을 한 번에 배우려 함`,
      ],
      checklistIntro: `다음 설정 단계를 완료했는지 확인하세요:`,
      cta: `지금 도구를 열고 배운 내용을 적용하세요.`,
    },
  },
  safety: {
    A: {
      tldr: (intent: string) =>
        `${intent}을 진행하기 전에 위험과 보호 조치를 이해하는 것이 중요합니다. 이 가이드는 주의해야 할 사항을 다룹니다.`,
      stepsIntro: () => `진행하기 전에 각 안전 고려 사항을 검토하세요:`,
      mistakes: [
        `시간을 절약하기 위해 보안 검사를 건너뜀`,
        `암호화 없이 민감한 정보를 공유함`,
        `경고 표시와 오류 메시지를 무시함`,
      ],
      checklistIntro: `시작하기 전에 이 안전 체크리스트를 확인하세요:`,
      cta: `모든 검사가 통과되면 자신있게 진행하세요.`,
    },
    B: {
      tldr: (intent: string) =>
        `안전이 우선입니다. 이 가이드는 ${intent} 작업 시 취해야 할 주요 예방 조치를 설명합니다.`,
      stepsIntro: () => `안전한 워크플로우를 보장하려면 이 검사를 완료하세요:`,
      mistakes: [
        `기본 설정이 충분히 안전하다고 가정함`,
        `여러 도구에서 동일한 비밀번호를 사용함`,
        `액세스 권한을 부여하기 전에 권한을 검토하지 않음`,
      ],
      checklistIntro: `위험을 최소화하기 위해 각 항목을 확인하세요:`,
      cta: `안전을 확인한 후 다음 단계로 진행하세요.`,
    },
    C: {
      tldr: (intent: string) =>
        `${intent} 작업 중 자신을 보호하세요. 이 빠른 안전 개요는 일반적인 함정을 피하도록 도와줍니다.`,
      stepsIntro: () => `작업과 데이터를 보호하기 위해 이 안전 프로토콜을 따르세요:`,
      mistakes: [
        `검증 없이 알 수 없는 출처를 신뢰함`,
        `공유 장치에서 로그아웃하지 않음`,
        `새 도구의 개인 정보 설정을 간과함`,
      ],
      checklistIntro: `보호 상태를 유지하기 위해 이 안전 체크리스트를 사용하세요:`,
      cta: `확인 완료? 다음 작업으로 넘어가세요.`,
    },
  },
};

// --- helper: compute default variant from recipe ---
export function computeVariant(primaryIntent: string, guideType: string): Variant {
  const variants: Variant[] = ["A", "B", "C"];
  return variants[hash(primaryIntent + guideType) % 3];
}

// --- main builder ---
export function buildFreeGuideKr(input: FreeRecipeInput): {
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
    `## 요약`,
    variantPool.tldr(intentLabel),
    ``,
    `## 단계별 가이드`,
    variantPool.stepsIntro(),
    ``,
    `1. 목표를 명확히 정의하세요.`,
    `2. 이 목표에 필요한 도구만 선택하세요.`,
    `3. 최적화하기 전에 한 번 완료하세요.`,
    `4. 결과를 검토하고 다음 반복을 계획하세요.`,
    ``,
    `## 흔한 실수`,
    variantPool.mistakes.map(m => `- ${m}`).join("\n"),
    ``,
    `## 빠른 체크리스트`,
    variantPool.checklistIntro,
    checklist.map(c => `- ${c}`).join("\n"),
    ``,
    `## 추천 도구 스택`,
    routeLabel
      ? `이 루트는 워크플로우를 집중시키기 위해 **${routeLabel}**를 중심으로 합니다.`
      : `이 가이드는 복잡성을 줄이기 위해 최소한의 도구 스택을 강조합니다.`,
    ``,
    `## 다음 단계`,
    ctaText,
  ].join("\n");

  return {
    title: titleFn(intentLabel),
    excerpt: excerptFn(intentLabel).slice(0, 160),
    content,
  };
}



