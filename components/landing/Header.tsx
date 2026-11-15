import Link from "next/link";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#ai-at-work", label: "AI at work" },
  { href: "/#flags", label: "Flags" },
];

export function Header() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
      <Link href="/" className="font-display text-lg font-bold tracking-tight">
        Hisaab<span className="text-accent"> AI</span>
      </Link>
      <nav className="hidden gap-8 md:flex" aria-label="Main">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="text-xs font-medium uppercase tracking-label text-ink/70 underline-offset-8 hover:text-accent hover:underline hover:decoration-accent hover:decoration-2"
          >
            {l.label}
          </a>
        ))}
      </nav>
      <Link
        href="/demo"
        className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-label hover:border-accent hover:bg-accent hover:text-paper"
      >
        Try the demo
      </Link>
    </header>
  );
}
