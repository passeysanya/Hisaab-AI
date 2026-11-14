type LabelProps = {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
};

/** Small uppercase editorial label, e.g. "01 / How it works". */
export function Label({ children, accent = false, className = "" }: LabelProps) {
  return (
    <span
      className={`inline-block text-xs font-medium uppercase tracking-label ${
        accent ? "text-accent" : "text-ink/60"
      } ${className}`}
    >
      {children}
    </span>
  );
}
