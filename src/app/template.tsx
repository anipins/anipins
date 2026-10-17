export default function Template({ children }: { children: React.ReactNode }) {
  // Keep navigation out of the animation/render queue. Page-specific motion
  // remains available inside the destination page, but route entry is instant.
  return children;
}
