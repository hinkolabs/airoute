// Standard Mode (A) - Soft Mint (#7FF2C9) 테마
// 카테고리별 가로 스크롤 카드 레이아웃
// 미니멀리즘: 투명 배경 + 민트색 테두리
'use client';

import { useState, useMemo } from 'react';
import { Tool } from '@/types/tool';
import Link from 'next/link';
import AffiliateLinkButton from '@/components/AffiliateLinkButton';

type StandardModeProps = {
  tools: Tool[];
};

export function StandardMode({ tools }: StandardModeProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // best_for 기준으로 도구들을 그룹핑
  const groupedTools = useMemo(() => {
    const groups: Record<string, Tool[]> = {};
    
    tools.forEach((tool) => {
      const category = tool.best_for || tool.task_category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(tool);
    });

    return groups;
  }, [tools]);

  // 검색 필터링
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedTools;
    
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, Tool[]> = {};
    
    Object.entries(groupedTools).forEach(([category, categoryTools]) => {
      const matchedTools = categoryTools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.desc_en?.toLowerCase().includes(query) ||
          tool.best_for?.toLowerCase().includes(query)
      );
      if (matchedTools.length > 0) {
        filtered[category] = matchedTools;
      }
    });
    
    return filtered;
  }, [groupedTools, searchQuery]);

  // 예시 카테고리 (데이터가 없을 경우 표시)
  const defaultCategories = [
    {
      title: 'Resume (이력서)',
      tools: [
        { id: '1', name: 'Jasper', subtitle: 'Best Choice', desc: 'AI Resume Writer' },
        { id: '2', name: 'Kickresume', subtitle: '', desc: 'AI Builder' },
        { id: '3', name: 'Resume.io', subtitle: '', desc: 'ATS Optimizer' },
      ],
    },
    {
      title: 'Logo (로고)',
      tools: [
        { id: '4', name: 'Midjourney', subtitle: 'Best Choice', desc: 'Generative Art' },
        { id: '5', name: 'LogoAI', subtitle: '', desc: 'Smart Design' },
        { id: '6', name: 'Looka', subtitle: '', desc: 'Brand Maker' },
      ],
    },
  ];

  return (
    <div className="flex flex-col">
      {/* 상단 헤더 */}
      <header className="container-mobile flex items-center justify-end gap-4 py-4">
        <button className="text-white/70 transition hover:text-white">
          <SearchIcon />
        </button>
        <button className="text-white/70 transition hover:text-white">
          <ProfileIcon />
        </button>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container-mobile flex-1 pb-24">
        {/* 타이틀 */}
        <h1 className="mb-8 text-3xl font-bold leading-tight text-white">
          What do you
          <br />
          want to create?
        </h1>

        {/* 카테고리 섹션들 */}
        {Object.keys(filteredGroups).length > 0 ? (
          Object.entries(filteredGroups).map(([category, categoryTools]) => (
            <CategorySection
              key={category}
              title={category}
              tools={categoryTools}
            />
          ))
        ) : (
          // 데이터가 없을 경우 예시 표시
          defaultCategories.map((cat) => (
            <div key={cat.title} className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="h-0.5 w-4 bg-mint" />
                Best for {cat.title}
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {cat.tools.map((tool) => (
                  <DemoToolCard
                    key={tool.id}
                    name={tool.name}
                    subtitle={tool.subtitle}
                    desc={tool.desc}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* 하단 네비게이션 바 */}
      <BottomNav />
    </div>
  );
}

// 카테고리 섹션 컴포넌트
function CategorySection({ title, tools }: { title: string; tools: Tool[] }) {
  return (
    <div className="mb-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
        <span className="h-0.5 w-4 bg-mint" />
        Best for {title}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {tools.map((tool, index) => (
          <ToolCard key={tool.id} tool={tool} isBestChoice={index === 0} />
        ))}
      </div>
    </div>
  );
}

// 도구 카드 컴포넌트 - 투명 배경 + 민트색 테두리
function ToolCard({ tool, isBestChoice }: { tool: Tool; isBestChoice?: boolean }) {
  return (
    <div className="card-standard flex w-[140px] shrink-0 flex-col p-4">
      {/* 이모지 + 이름 */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">✨</span>
        <span className="font-semibold text-white">{tool.name}</span>
      </div>
      
      {/* Best Choice 라벨 */}
      {isBestChoice && (
        <span className="text-mint mb-1 text-xs font-medium">Best Choice</span>
      )}
      
      {/* 설명 */}
      <p className="mb-3 text-xs text-slate-400">
        {tool.desc_simple_en || tool.task_category || 'AI Tool'}
      </p>
      
      {/* View 버튼 */}
      <AffiliateLinkButton
        href={tool.affiliate_url}
        placement="tool_card"
        toolSlug={tool.id}
        className="btn-mint mt-auto py-2 text-center text-sm font-medium"
      >
        View
      </AffiliateLinkButton>
    </div>
  );
}

// 데모 카드 (데이터 없을 때) - 투명 배경 + 민트색 테두리
function DemoToolCard({ name, subtitle, desc }: { name: string; subtitle: string; desc: string }) {
  return (
    <div className="card-standard flex w-[140px] shrink-0 flex-col p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">✨</span>
        <span className="font-semibold text-white">{name}</span>
      </div>
      {subtitle && (
        <span className="text-mint mb-1 text-xs font-medium">{subtitle}</span>
      )}
      <p className="mb-3 text-xs text-slate-400">{desc}</p>
      <button className="btn-mint mt-auto py-2 text-center text-sm font-medium">
        View
      </button>
    </div>
  );
}

// 하단 네비게이션 바
function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t border-slate-800 bg-navy py-3">
      <NavItem icon={<HomeIcon />} label="Home" active />
      <NavItem icon={<SearchNavIcon />} label="Search" />
      <NavItem icon={<CommunityIcon />} label="Community" />
      <NavItem icon={<ProfileNavIcon />} label="Profile" />
    </nav>
  );
}

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href="#"
      className={`flex flex-col items-center gap-1 transition ${active ? 'text-mint' : 'text-slate-500 hover:text-slate-300'}`}
    >
      {icon}
      <span className="text-[10px]">{label}</span>
    </Link>
  );
}

// 아이콘들
function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

function SearchNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ProfileNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}
