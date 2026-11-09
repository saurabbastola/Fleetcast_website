import { MARK_PATH } from "@/components/Logo";

/** Illustrated ebook cover used by the playbook pop-up. Replace with a real cover image any time. */
export default function PlaybookCover({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <svg className="book" viewBox="0 0 140 180" role="img" aria-label={`${eyebrow} ${title}`}>
      <defs>
        <linearGradient id="bookShade" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".35" />
          <stop offset=".08" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="6" y="4" width="130" height="174" rx="2" fill="#0a1530" />
      <rect x="2" y="2" width="130" height="174" rx="2" fill="#0d2350" />
      <rect x="2" y="2" width="130" height="174" rx="2" fill="url(#bookShade)" />
      {/* pixel pattern */}
      <g fill="#1a3a78" opacity=".9">
        <rect x="104" y="12" width="9" height="9" rx="1" />
        <rect x="116" y="24" width="9" height="9" rx="1" />
        <rect x="18" y="132" width="9" height="9" rx="1" />
        <rect x="92" y="150" width="9" height="9" rx="1" />
      </g>
      <g fill="none" stroke="#9fb4e6" strokeWidth="1.3" strokeLinejoin="round">
        <path d="M14 14h12v10M14 32v-8" />
        <path d="M14 150h12v14H14" />
        <path d="M70 160v-14h14v-12h14v12h14v14" />
      </g>
      {/* label */}
      <rect x="22" y="40" width="102" height="52" rx="7" fill="#F1FDE6" />
      <path d="M28 92l-8 8 14-8z" fill="#F1FDE6" />
      <text x="30" y="55" fontSize="7.4" fontWeight="700" fill="#001B43" fontFamily="inherit">
        {eyebrow}
      </text>
      <foreignObject x="29" y="58" width="92" height="32">
        <div className="book__title">{title}</div>
      </foreignObject>
      <g transform="translate(28 100) scale(.26)" fill="#F1FDE6">
        <path d={MARK_PATH} />
        <rect x="58" y="0" width="12" height="12" rx="2" />
        <rect x="46" y="24" width="12" height="12" rx="2" />
      </g>
    </svg>
  );
}
