'use client';

import { useState } from 'react';
import PageShell from '@/components/layout/PageShell';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Chip from '@/components/ui/Chip';
import ToolSearchBar from '@/components/search/ToolSearchBar';
import ToolFilterChips, { CategoryId } from '@/components/search/ToolFilterChips';
import ToolGrid from '@/components/tools/ToolGrid';
import { Tool } from '@/components/tools/ToolCard';

// Sample tools for demonstration
const SAMPLE_TOOLS: Tool[] = [
  {
    id: '1',
    name: 'ChatGPT',
    descShort:
      'AI-powered conversational assistant for writing, coding, brainstorming, and more. The most popular generative AI chatbot.',
    bestFor: 'Writing, coding assistance, Q&A',
    categoryLabel: 'Writing & Docs',
    badge: 'Popular',
    link: 'https://chat.openai.com',
  },
  {
    id: '2',
    name: 'Midjourney',
    descShort:
      'Create stunning AI-generated images from text prompts. Industry-leading quality for artistic and creative visuals.',
    bestFor: 'Art, illustrations, concept design',
    categoryLabel: 'Image & Design',
    badge: 'Editor Pick',
    link: 'https://midjourney.com',
  },
  {
    id: '3',
    name: 'Upscale.ai',
    descShort:
      'Enhance and upscale your images using AI. Increase resolution while preserving details and reducing noise.',
    bestFor: 'Photo enhancement, resolution upscaling',
    categoryLabel: 'Image & Design',
    link: 'https://upscale.ai',
  },
];

/**
 * UI Lab Page - Internal development playground for showcasing reusable components.
 * This page is for internal use only and should not be linked in production navigation.
 */
export default function UILabPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Search query:', query);
  };

  const handleCategoryChange = (category: CategoryId) => {
    setActiveCategory(category);
    console.log('Category changed:', category);
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Internal · UI Lab"
        title="Component "
        highlight="Showcase"
        titleSuffix=""
        subtitle="This page is for development only. Preview all reusable UI components here."
      />

      {/* Section: Badges */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          Badges
        </h2>
        <div className="flex flex-wrap gap-3">
          <Badge tone="emerald">Emerald Badge</Badge>
          <Badge tone="slate">Slate Badge</Badge>
          <Badge>Default (Emerald)</Badge>
        </div>
      </section>

      {/* Section: Buttons */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          Buttons
        </h2>
        <div className="space-y-4">
          {/* Variants */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-400">Variants</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>
          {/* Sizes */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-400">Sizes</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>
          {/* Disabled */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-400">Disabled State</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" disabled>
                Disabled Primary
              </Button>
              <Button variant="secondary" disabled>
                Disabled Secondary
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Chips */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          Chips
        </h2>
        <div className="flex flex-wrap gap-3">
          <Chip>Default Chip</Chip>
          <Chip active>Active Chip</Chip>
          <Chip
            leadingIcon={
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            }
          >
            With Icon
          </Chip>
          <Chip
            active
            leadingIcon={
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            }
          >
            Featured
          </Chip>
        </div>
      </section>

      {/* Section: Search Bar */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          Search Bar
        </h2>
        <ToolSearchBar onSearch={handleSearch} />
        {searchQuery && (
          <p className="mt-3 text-sm text-slate-400">
            Last search: <span className="text-emerald-400">{searchQuery}</span>
          </p>
        )}
      </section>

      {/* Section: Filter Chips */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          Filter Chips
        </h2>
        <ToolFilterChips
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
        <p className="mt-4 text-center text-sm text-slate-400">
          Active category:{' '}
          <span className="text-emerald-400">{activeCategory}</span>
        </p>
      </section>

      {/* Section: Tool Cards & Grid */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          Tool Cards & Grid
        </h2>
        <ToolGrid tools={SAMPLE_TOOLS} />
      </section>

      {/* Footer note */}
      <footer className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
        <p>
          This UI Lab page is for internal development only.
          <br />
          Do not link this page in production navigation.
        </p>
      </footer>
    </PageShell>
  );
}




