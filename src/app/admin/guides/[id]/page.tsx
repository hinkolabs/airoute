import GuideEditorClient from "./_components/guide-editor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminGuideDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <GuideEditorClient guideId={id} />
      </div>
    </div>
  );
}




