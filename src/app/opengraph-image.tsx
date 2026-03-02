import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Airoute - AI Navigation for Everyone';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
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
          fontFamily: 'sans-serif',
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
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0891b2, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(8, 145, 178, 0.3)',
            }}
          >
            <span style={{ color: 'white', fontSize: '30px', fontWeight: 'bold', lineHeight: 1 }}>
              ↗
            </span>
          </div>
          <span
            style={{
              fontSize: '34px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.5px',
            }}
          >
            Airoute
          </span>
        </div>

        {/* Main headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '28px',
          }}
        >
          <span
            style={{
              fontSize: '58px',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.1,
            }}
          >
            Confused by AI tools?
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: '58px', fontWeight: 800, color: '#0891b2', lineHeight: 1.1 }}>
              Start here.
            </span>
          </div>
        </div>

        {/* Subtext */}
        <p
          style={{
            fontSize: '24px',
            color: '#475569',
            lineHeight: 1.6,
            maxWidth: '780px',
            margin: 0,
          }}
        >
          Too many AI tools? Airoute finds the best route for you. Choose your goal, and we
          navigate you to the best AI workflow.
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
    { ...size }
  );
}
