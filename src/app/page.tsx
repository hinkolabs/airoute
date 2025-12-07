import { getActiveTools } from "@/lib/tools";
import HeroSection from "./_components/home/hero-section";
import BestForYouSection from "./_components/home/best-for-you-section";
import AiStudioSection from "./_components/home/ai-studio-section";
import PopularToolsSection from "./_components/home/popular-tools-section";
import BenefitServicesSection from "./_components/home/benefit-services-section";
import GuidesSection from "./_components/home/guides-section";
import SimpleModeCtaSection from "./_components/home/simple-mode-cta-section";

export default async function Page() {
  // Fetch tools data for sections that need it
  const tools = await getActiveTools();

  return (
    <main>
      {/* Hero Section - 메인 히어로 */}
      <HeroSection />

      {/* Best For You Section - 작업별 추천 툴 */}
      <BestForYouSection tools={tools} />

      {/* AI Studio Section - AI 스튜디오 소개 */}
      <AiStudioSection />

      {/* Popular Tools Section - 인기 툴 목록 */}
      <PopularToolsSection tools={tools} />

      {/* Benefit Services Section - 부가 서비스 소개 */}
      <BenefitServicesSection />

      {/* Guides Section - 가이드 & 아티클 */}
      <GuidesSection />

      {/* Simple Mode CTA Section - 심플 모드 전환 유도 */}
      <SimpleModeCtaSection />
    </main>
  );
}
