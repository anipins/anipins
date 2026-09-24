import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copyright and Content Removal | AniPins",
  description: "Submit a copyright or content-removal request to AniPins.",
  alternates: { canonical: "/copyright" },
};

export default function CopyrightLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
