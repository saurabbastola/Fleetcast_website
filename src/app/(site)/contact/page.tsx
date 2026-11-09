import type { Metadata } from "next";
import Image from "next/image";
import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the Fleetcast team about fleet advertising for your brand or your vehicles.",
};

const STEPS = [
  {
    title: "We reply within a day",
    text: "A real person from our team reads every message and gets back to you within one business day.",
  },
  {
    title: "A quick discovery call",
    text: "Thirty minutes to understand your goals, your audience or your fleet, and where you want to show up.",
  },
  {
    title: "A plan built for you",
    text: "Routes, screens, creative and measurement — packaged into a clear proposal you can act on.",
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="contact" data-nav-transparent>
        <div className="contact__copy">
          <p className="eyebrow eyebrow--cream">Contact</p>
          <h1 className="contact__title anim-rise">Let&rsquo;s talk fleet media.</h1>
          <p className="contact__text anim-rise anim-delay-1">
            Whether you&rsquo;re planning a campaign, adding vehicles to the network, or just curious, our team will get back to
            you within one business day.
          </p>
          <ul className="contact__details anim-rise anim-delay-2">
            <li>
              <span>Email</span>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </li>
            <li>
              <span>Phone</span>
              <a href={`tel:${site.phone.replace(/[^0-9+]/g, "")}`}>{site.phone}</a>
            </li>
            <li>
              <span>Office</span>
              <p>{site.address}</p>
            </li>
          </ul>
          <div className="contact__media">
            <Image src="/images/hero-night.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 45vw" />
          </div>
        </div>
        <div className="contact__form">
          <ContactForm />
        </div>
      </section>
      <section className="steps" aria-label="What happens next">
        <h2 className="steps__title">What happens next</h2>
        <ol className="steps__list">
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 100} className="steps__item">
              <span className="steps__num">{String(i + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>
    </>
  );
}
