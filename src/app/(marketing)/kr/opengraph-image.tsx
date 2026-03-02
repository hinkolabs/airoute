import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Airoute KR - AI 도구 네비게이션';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function loadKoreanFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(text)}`;
    const css = await fetch(url, {
      headers: {
        // Older UA to receive TTF format instead of WOFF2
        'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)',
      },
    }).then((r) => r.text());
    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!match) return null;
    return await fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image() {
  const allText =
    'AI 작업이 너무 많아서 헷갈리시나요? 우리가 가장 좋은 루트를 찾아드립니다. 끝없는 검색은 이제 그만. 목표를 선택하시면 최고의 AI 도구 3개를 보여드립니다. 한국 사용자를 위한 AI 도구 네비게이션 Airoute KR airoute.ai';

  const fontData = await loadKoreanFont(allText);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f0fdfa 0%, #e8f9f6 55%, #d1fae5 100%)',
          padding: '64px 80px',
          fontFamily: fontData ? 'NotoSansKR' : 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-140px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(20, 184, 166, 0.12)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-80px',
            width: '360px',
            height: '360px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.08)',
          }}
        />

        {/* Logo row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0891b2, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(8, 145, 178, 0.3)',
            }}
          >
            <span style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>
              ↗
            </span>
          </div>
          <span
            style={{
              fontSize: '30px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.5px',
            }}
          >
            Airoute
          </span>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#0891b2',
              background: 'rgba(8, 145, 178, 0.1)',
              borderRadius: '999px',
              padding: '4px 14px',
              border: '1px solid rgba(8, 145, 178, 0.2)',
            }}
          >
            KR
          </span>
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(13, 148, 136, 0.1)',
            color: '#0d9488',
            borderRadius: '999px',
            padding: '8px 22px',
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '28px',
            border: '1px solid rgba(13, 148, 136, 0.2)',
          }}
        >
          <span>✦</span>
          <span>한국 사용자를 위한 AI 도구 네비게이션</span>
        </div>

        {/* Main headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginBottom: '24px',
          }}
        >
          <span
            style={{
              fontSize: '52px',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.15,
            }}
          >
            AI 작업이 너무 많아서 헷갈리시나요?
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0px' }}>
            <span style={{ fontSize: '52px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
              우리가 가장 좋은{' '}
            </span>
            <span
              style={{
                fontSize: '52px',
                fontWeight: 800,
                color: '#0891b2',
                lineHeight: 1.15,
              }}
            >
              루트
            </span>
            <span style={{ fontSize: '52px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
              를 찾아드립니다.
            </span>
          </div>
        </div>

        {/* Subtext */}
        <p
          style={{
            fontSize: '22px',
            color: '#475569',
            lineHeight: 1.6,
            maxWidth: '780px',
            margin: 0,
          }}
        >
          끝없는 검색은 이제 그만. 목표를 선택하시면 최고의 AI 도구 3개를 보여드립니다.
        </p>

        {/* Bottom URL stamp */}
        <div
          style={{
            position: 'absolute',
            bottom: '44px',
            right: '80px',
            fontSize: '20px',
            color: '#94a3b8',
            fontWeight: 500,
            letterSpacing: '0.5px',
          }}
        >
          airoute.ai
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData
        ? {
            fonts: [
              {
                name: 'NotoSansKR',
                data: fontData,
                style: 'normal',
                weight: 700,
              },
            ],
          }
        : {}),
    }
  );
}
