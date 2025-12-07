// Simple Mode (B) - Cream Yellow (#FDE047) 테마 (효도 모드)
// 초보자 친화적인 큰 버튼 UI + 고양이 캐릭터
// layout.tsx에서 컨테이너 제공하므로 중복 제거
'use client';

import Link from 'next/link';

export function SimpleMode() {
  const menuItems = [
    { icon: '📷', label: 'Need a Photo?', href: '/simple/photo' },
    { icon: '✉️', label: 'Write Email?', href: '/simple/email' },
    { icon: '🌐', label: 'Translate?', href: '/simple/translate' },
    { icon: '🔍', label: 'Find Info?', href: '/simple/search' },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* 상단 헤더 */}
      <header className="flex items-center justify-between">
        {/* 로고 */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <span className="text-xl font-bold">Airoute</span>
        </div>
        
        {/* Help 버튼 */}
        <button className="flex flex-col items-center text-slate-400 transition hover:text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-600">
            <span className="text-sm">?</span>
          </div>
          <span className="mt-1 text-[10px]">Help</span>
        </button>
      </header>

      {/* 메인 메뉴 버튼들 */}
      <div className="flex flex-col gap-4">
        {menuItems.map((item, index) => (
          <MenuButton key={index} icon={item.icon} label={item.label} href={item.href} />
        ))}
      </div>

      {/* Start Here 버튼 */}
      <Link
        href="/"
        className="mt-4 flex h-14 items-center justify-center rounded-full bg-yellow-400 text-lg font-semibold text-slate-900 shadow-lg transition hover:bg-yellow-300"
      >
        Start Here
      </Link>
    </div>
  );
}

// 메뉴 버튼 컴포넌트 - Cream Yellow 테두리 + 고양이 캐릭터
function MenuButton({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="group relative flex h-16 items-center gap-4 rounded-full border-2 border-yellow-400 bg-slate-900/50 px-6 transition hover:bg-yellow-400/10"
    >
      {/* 아이콘 */}
      <span className="text-2xl">{icon}</span>
      
      {/* 라벨 */}
      <span className="text-lg font-medium">{label}</span>
      
      {/* 고양이 캐릭터 + Easy! 말풍선 */}
      <div className="absolute right-4 flex items-center">
        {/* Easy! 말풍선 */}
        <div className="relative mr-1">
          <div className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-900">
            Easy!
          </div>
          {/* 말풍선 꼬리 */}
          <div className="absolute -bottom-1 right-2 h-2 w-2 rotate-45 bg-white" />
        </div>
        
        {/* 고양이 이모지 */}
        <div className="text-3xl">🐱</div>
      </div>
    </Link>
  );
}
