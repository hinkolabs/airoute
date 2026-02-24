import { Metadata } from "next";
import { KRHomeV2SimpleContent } from "../../_components/kr-home-v2-simple-content";

export const metadata: Metadata = {
  title: "Airoute KR - AI 도구 네비게이션 (심플)",
  description: "하고싶은 일만 선택하세요. 최고의 AI 워크플로우를 안내합니다.",
  robots: { index: false },
};

export default function KRHomeSimpleV2Page() {
  return <KRHomeV2SimpleContent />;
}
