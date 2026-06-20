import { Link } from "react-router-dom";

export default function Stub({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-20">
      <p className="mb-3 font-[var(--font-mono)] text-[12px] uppercase tracking-[0.14em] text-[var(--color-csh)]">
        Next build
      </p>
      <h1 className="font-[var(--font-display)] text-3xl font-600">{title}</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
        {blurb}
      </p>
      <Link
        to="/"
        className="mt-6 inline-block text-[14px] text-[var(--color-csh)] hover:underline"
      >
        ← Back to overview
      </Link>
    </div>
  );
}
