import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 🎨 브랜드 커스텀 컬러
      colors: {
        // Navy Background - Deep Navy
        navy: {
          DEFAULT: '#0A0F14',
          50: '#1a2332',
          100: '#151c27',
          200: '#10161f',
          300: '#0A0F14',
          400: '#080c10',
          500: '#05080b',
        },
        // Mint Accent - Soft Mint (Standard Mode)
        mint: {
          DEFAULT: '#7FF2C9',
          50: '#e6fcf4',
          100: '#c2f8e5',
          200: '#9ef4d7',
          300: '#7FF2C9',
          400: '#5eeab8',
          500: '#3de2a7',
          600: '#2cc98f',
          700: '#1fb077',
        },
        // Senior Accent - Cream Yellow (Simple Mode)
        senior: {
          DEFAULT: '#FDE047',
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#FDE047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
        },
      },
      // 📏 기본 폰트 크기 (1rem = 16px 기준)
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1' }],           // 48px
      },
      // 📐 커스텀 간격 (모바일 패딩용)
      spacing: {
        'safe': '1rem',       // 16px - 모바일 기본 패딩
        'safe-lg': '1.5rem',  // 24px - 태블릿 패딩
        'safe-xl': '2rem',    // 32px - 데스크톱 패딩
      },
      // 🔲 카드 테두리 반경
      borderRadius: {
        'card': '1rem',       // 16px
        'card-lg': '1.25rem', // 20px
        'button': '9999px',   // pill shape
      },
      // 🎭 그림자 (미니멀리즘)
      boxShadow: {
        'card': '0 0 0 1px rgba(127, 242, 201, 0.3)',
        'card-hover': '0 0 0 2px rgba(127, 242, 201, 0.5)',
        'senior-card': '0 0 0 2px rgba(253, 224, 71, 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;







