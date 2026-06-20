import { useState } from "react";
import type { HeroPair } from "../lib/csh";
import {
  diffMask,
  MOLECULE_COLOR,
  MOLECULE_LABEL,
} from "../lib/csh";
import BitGrid from "./BitGrid";

interface Props {
  same: HeroPair;
  different: HeroPair;
}

function PairRow({ pair }: { pair: HeroPair }) {
  const mask = diffMask(pair.a.hash64, pair.b.hash64);
  const rows = [pair.a, pair.b];
  return (
    <div className="space-y-3">
      {rows.map((c, i) => (
        <div key={i} className="flex items-center gap-3">
          <span
            className="hidden w-24 shrink-0 text-right font-[var(--font-mono)] text-[11px] sm:inline"
            style={{ color: MOLECULE_COLOR[c.molecule] }}
          >
            {MOLECULE_LABEL[c.molecule]}
          </span>
          <BitGrid
            hash={c.hash64}
            color={MOLECULE_COLOR[c.molecule]}
            diff={mask}
            size={14}
          />
        </div>
      ))}
    </div>
  );
}

export default function HashDiff({ same, different }: Props) {
  const [mode, setMode] = useState<"same" | "different">("same");
  const pair = mode === "same" ? same : different;

  return (
    <div className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 shadow-[0_1px_0_rgba(20,23,31,0.03),0_8px_24px_-12px_rgba(20,23,31,0.12)] sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-[var(--color-hairline)] p-0.5 text-[13px]">
          {(["same", "different"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                mode === m
                  ? "bg-[var(--color-ink)] text-white"
                  : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              }`}
            >
              {m === "same" ? "Same molecule" : "Different molecules"}
            </button>
          ))}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="tnum font-[var(--font-display)] text-3xl font-600 text-[var(--color-diff)]">
            {pair.hamming}
          </span>
          <span className="text-[13px] text-[var(--color-ink-soft)]">
            {pair.hamming === 1 ? "bit differs" : "bits differ"}
            <span className="text-[var(--color-ink-faint)]"> / 64</span>
          </span>
        </div>
      </div>

      <PairRow pair={pair} />

      <p className="mt-5 border-t border-[var(--color-hairline)] pt-4 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">
        {mode === "same" ? (
          <>
            Two conformers of the same molecule share almost every bit — the
            soft hash collapses small geometric differences into a{" "}
            <strong className="font-500 text-[var(--color-ink)]">
              short Hamming distance
            </strong>
            .
          </>
        ) : (
          <>
            Two different molecules land far apart. No cross-molecule pair in the
            benchmark falls within{" "}
            <strong className="font-500 text-[var(--color-ink)]">15 bits</strong>
            , so the hash reveals which molecule it isn&apos;t — not its
            structure.
          </>
        )}
      </p>
    </div>
  );
}
