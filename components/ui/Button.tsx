import Link from "next/link";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
};

const styles = {
  primary: "bg-accent text-paper border-accent hover:bg-ink hover:border-ink",
  outline: "bg-transparent text-ink border-ink hover:border-accent hover:text-accent",
};

export function Button({ href, children, variant = "primary" }: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 border px-6 py-3 text-sm font-semibold uppercase tracking-label transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${styles[variant]}`}
    >
      {children}
    </Link>
  );
}
