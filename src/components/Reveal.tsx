"use client";

import type { CSSProperties, ReactNode } from "react";
import { useInView } from "@/lib/useInView";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article" | "span";
  effect?: "up" | "fade" | "scale";
  id?: string;
};

/** Fades/slides its children in the first time they scroll into view. */
export default function Reveal({ children, className = "", delay = 0, as = "div", effect = "up", id }: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.15 });
  const Tag = as;
  const style = { "--reveal-delay": `${delay}ms` } as CSSProperties;
  return (
    <Tag id={id} ref={ref as never} className={`reveal reveal--${effect} ${inView ? "is-in" : ""} ${className}`} style={style}>
      {children}
    </Tag>
  );
}
