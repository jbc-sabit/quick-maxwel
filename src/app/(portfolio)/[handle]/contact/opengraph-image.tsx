import { OG_CONTENT_TYPE, OG_SIZE, renderSectionCard } from "@/lib/og";

export const alt = "Contact";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return renderSectionCard(handle, "Contact", (p) => `Get in touch with ${p.name}`);
}
