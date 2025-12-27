import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  highlight?: string;
  titleSuffix?: string;
  subtitle?: string;
  className?: string;
}

/**
 * PageHeader - Renders a page header with optional eyebrow badge,
 * highlighted title word, and subtitle.
 */
export default function PageHeader({
  eyebrow,
  title,
  highlight,
  titleSuffix,
  subtitle,
  className,
}: PageHeaderProps) {
  // Build the title with optional highlight
  const renderTitle = () => {
    if (!highlight) {
      return (
        <>
          {title}
          {titleSuffix && <span className="text-slate-300">{titleSuffix}</span>}
        </>
      );
    }

    const parts = title.split(highlight);
    return (
      <>
        {parts[0]}
        <span className="text-emerald-400">{highlight}</span>
        {parts[1]}
        {titleSuffix && <span className="text-slate-300">{titleSuffix}</span>}
      </>
    );
  };

  return (
    <header className={cn('mb-8 text-center', className)}>
      {eyebrow && (
        <div className="mb-4">
          <Badge tone="emerald">{eyebrow}</Badge>
        </div>
      )}
      <h1 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl lg:text-5xl">
        {renderTitle()}
      </h1>
      {subtitle && (
        <p className="mt-4 text-lg text-slate-300 sm:text-xl">{subtitle}</p>
      )}
    </header>
  );
}











