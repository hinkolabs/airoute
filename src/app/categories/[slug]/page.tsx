import { notFound } from "next/navigation";
import CategoryDetailContent from "./category-detail-content";

interface CategoryDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Category slug to display name mapping
const CATEGORY_MAP: Record<string, string> = {
  "image": "Image & Design",
  "writing": "Writing",
  "video": "Video",
  "audio": "Audio",
  "voice": "Voice",
  "coding": "Coding",
};

// Generate static params for all categories
export async function generateStaticParams() {
  return Object.keys(CATEGORY_MAP).map((slug) => ({ slug }));
}

export default async function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { slug } = await params;
  
  // Check if category exists
  const categoryName = CATEGORY_MAP[slug];
  if (!categoryName) {
    notFound();
  }

  return <CategoryDetailContent slug={slug} categoryName={categoryName} />;
}

