import { Metadata } from "next";
import NormalModePage from "./_components/normal-mode-page";

export const metadata: Metadata = {
  title: "Airoute - Find the Best AI Tools for Your Goals",
  description: "Too many AI tools? We help you find the right one. Get personalized AI tool recommendations for image, video, writing, coding, and more.",
  alternates: {
    canonical: "https://www.airoute.ai",
  },
  openGraph: {
    title: "Airoute - Find the Best AI Tools for Your Goals",
    description: "Too many AI tools? We help you find the right one. Get personalized AI tool recommendations for image, video, writing, coding, and more.",
    url: "https://www.airoute.ai",
  },
};

export default function Page() {
  return <NormalModePage tools={[]} />;
}
