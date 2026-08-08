import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({
  className = "",
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "danger";
}) {
  const classes =
    variant === "secondary"
      ? "bg-card text-primary border-line hover:bg-slate-50"
      : variant === "ghost"
        ? "bg-transparent text-primary border-transparent hover:bg-slate-100"
        : variant === "danger"
          ? "bg-rose-700 text-white border-rose-700 hover:bg-rose-800"
          : "bg-primary text-card border-primary hover:bg-slate-800";

  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${classes} ${className}`}
      {...props}
    />
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-[1.5rem] border border-line bg-card p-4 ${className}`}>
      {children}
    </section>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-primary outline-none placeholder:text-slate-400 focus:border-primary"
      {...props}
    />
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warning" | "muted";
  children: ReactNode;
}) {
  const classes =
    tone === "good"
      ? "bg-success text-white border-success"
      : tone === "warning"
        ? "bg-amber-700 text-white border-amber-700"
        : tone === "muted"
          ? "bg-slate-100 text-muted border-line"
          : "bg-slate-100 text-primary border-line";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}>
      {children}
    </span>
  );
}

export function Divider() {
  return <div className="h-px w-full bg-line" />;
}
