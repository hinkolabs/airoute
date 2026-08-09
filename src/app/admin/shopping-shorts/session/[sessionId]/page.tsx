import SessionResultsClient from "./session-client";

export const dynamic = "force-dynamic";

export default async function ShoppingShortsSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <SessionResultsClient sessionId={sessionId} />;
}
