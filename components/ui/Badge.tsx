type BadgeProps = {
  children: React.ReactNode;
  tone?: "accent" | "ink" | "outline";
};

const tones = {
  accent: "bg-accent text-paper border-accent",
  ink: "bg-ink text-paper border-ink",
  outline: "bg-paper text-ink border-ink",
};

export function Badge({ children, tone = "outline" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-label ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
