import { Metadata } from "next";
import { ENHomeV2SimpleContent } from "@/app/_components/home/en-home-v2-simple-content";

export const metadata: Metadata = {
  title: "Airoute - AI Tool Navigation (Simple)",
  description: "Choose your goal. We navigate you to the best AI workflow.",
  robots: { index: false },
};

export default function ENHomeSimpleV2Page() {
  return <ENHomeV2SimpleContent />;
}
