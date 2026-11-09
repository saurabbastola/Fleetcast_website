import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="notfound">
      <Link href="/" aria-label="Fleetcast home" className="notfound__logo">
        <Logo />
      </Link>
      <p className="eyebrow eyebrow--cream">404</p>
      <h1>This road doesn&rsquo;t go anywhere.</h1>
      <p>The page you&rsquo;re looking for has moved or never existed.</p>
      <Link href="/" className="btn btn--cream">
        Back to home
      </Link>
    </main>
  );
}
