/**
 * The little "speech bubble" joint that links two stacked rounded boxes
 * (e.g. the "Our goal is simple." tag and the box beneath it).
 * Place it inside a relatively positioned wrapper; it bridges the gap of
 * 2 × radius between the upper and lower box, hugging their left edges.
 */
export default function BubbleConnector({ className = "", radius = 23 }: { className?: string; radius?: number }) {
  const r = radius;
  const d = [
    `M0 ${-r}`,
    `A${r} ${r} 0 0 1 ${-r} 0`,
    `A${r} ${r} 0 0 0 ${-r} ${2 * r}`,
    `A${r} ${r} 0 0 1 0 ${3 * r}`,
    `L${r} ${3 * r}`,
    `L${r} ${2 * r}`,
    `A${r} ${r} 0 0 1 ${r} 0`,
    `L${r} ${-r}`,
    "Z",
  ].join(" ");
  return (
    <svg
      className={`bubble-connector ${className}`}
      width={3 * r}
      height={4 * r}
      viewBox={`${-2 * r} ${-r} ${3 * r} ${4 * r}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}
