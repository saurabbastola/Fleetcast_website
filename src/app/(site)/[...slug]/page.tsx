import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContactCta from "@/components/home/ContactCta";
import { placeholderPages } from "@/content/site";

type Params = { slug: string[] };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return placeholderPages().map((p) => ({ slug: p.slug }));
}

function find(slug: string[]) {
  return placeholderPages().find((p) => p.slug.join("/") === slug.join("/"));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const page = find(slug);
  return { title: page?.title ?? "Fleetcast" };
}

/** Placeholder for every nav/footer link until the real page is built. */
export default async function PlaceholderPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = find(slug);
  if (!page) notFound();
  const section = slug[0].replace(/-/g, " ");

  return (
    <>
      <section className="placeholder" data-nav-transparent>
        <div className="placeholder__inner">
          <p className="eyebrow eyebrow--cream">{section}</p>
          <h1 className="placeholder__title anim-rise">{page.title}</h1>
          <p className="placeholder__text anim-rise anim-delay-1">
            This page is on its way. In the meantime, our team is happy to walk you through it.
          </p>
          <div className="hero__ctas anim-rise anim-delay-2">
            <Link href="/contact" className="btn btn--cream">
              Get in touch
            </Link>
            <Link href="/" className="btn btn--ghost">
              Back to home
            </Link>
          </div>
        </div>
      </section>
      <ContactCta />
    </>
  );
}
