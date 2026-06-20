import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Stats } from "../lib/csh";
import { loadStats, etherscanAddr, shortHash } from "../lib/csh";
import HashDiff from "../components/HashDiff";

function Figure({
  value,
  label,
  sub,
  accent,
}: {
  value: string;
  label: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="border-l-2 pl-4" style={{ borderColor: accent ?? "var(--color-hairline)" }}>
      <div className="tnum font-[var(--font-display)] text-2xl font-600 leading-none">
        {value}
      </div>
      <div className="mt-1.5 text-[13px] font-500 text-[var(--color-ink)]">{label}</div>
      {sub && <div className="text-[12px] text-[var(--color-ink-soft)]">{sub}</div>}
    </div>
  );
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadStats().then(setStats).catch((e) => setErr(String(e)));
  }, []);

  if (err)
    return (
      <Shell>
        <p className="text-[var(--color-diff)]">
          Could not load registry data. {err}
        </p>
      </Shell>
    );
  if (!stats)
    return (
      <Shell>
        <p className="text-[var(--color-ink-soft)]">Loading registry…</p>
      </Shell>
    );

  return (
    <Shell>
      {/* Hero */}
      <section className="grid items-start gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
        <div>
          <p className="mb-4 font-[var(--font-mono)] text-[12px] uppercase tracking-[0.14em] text-[var(--color-csh)]">
            Conformational Soft Hash · v2
          </p>
          <h1 className="font-[var(--font-display)] text-[2.6rem] font-700 leading-[1.05] tracking-tight sm:text-[3.2rem]">
            A molecule&apos;s shape,
            <br />
            written in 64 bits.
          </h1>
          <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-[var(--color-ink-soft)]">
            CSH turns a 3D conformer into a short, rotation-invariant hash where
            similar shapes differ by only a few bits — compact enough to anchor
            on-chain, sharp enough to tell molecules apart. Every hash here is a
            real registration on Sepolia.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/browse"
              className="rounded-lg bg-[var(--color-ink)] px-4 py-2.5 text-[14px] font-500 text-white transition-opacity hover:opacity-90"
            >
              Browse the registry
            </Link>
            <Link
              to="/compare"
              className="rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-4 py-2.5 text-[14px] font-500 transition-colors hover:border-[var(--color-ink-faint)]"
            >
              Compare two hashes
            </Link>
          </div>
        </div>

        <HashDiff same={stats.hero.same} different={stats.hero.different} />
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 gap-6 border-y border-[var(--color-hairline)] py-8 md:grid-cols-4">
        <Figure
          value={String(stats.conformersOnChain)}
          label="Conformers on-chain"
          sub={`${stats.molecules} flexible drugs`}
          accent="var(--color-csh)"
        />
        <Figure
          value={stats.indexedEvents.toLocaleString()}
          label="Indexed events"
          sub={`block ≤ ${stats.lastIndexedBlock.toLocaleString()}`}
        />
        <Figure
          value="0"
          label="Cross-molecule collisions"
          sub={`at Hamming ≤ 15 · ${stats.adversarial.crossPairs.toLocaleString()} pairs`}
          accent="var(--color-diff)"
        />
        <Figure
          value={`${Math.round(stats.bestOperatingPoint.recall * 100)}%`}
          label={`Recall at T = ${stats.bestOperatingPoint.T}`}
          sub="with 0% cross-mol false positives"
        />
      </section>

      {/* Separation summary */}
      <section className="grid gap-8 py-12 md:grid-cols-2">
        <div>
          <h2 className="font-[var(--font-display)] text-xl font-600">
            Close within, far between
          </h2>
          <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-[var(--color-ink-soft)]">
            Across the on-chain set, conformers of the same molecule sit at a
            mean Hamming distance of{" "}
            <span className="font-[var(--font-mono)] text-[var(--color-ink)]">
              {stats.withinMeanHamming}
            </span>{" "}
            bits, while different molecules average{" "}
            <span className="font-[var(--font-mono)] text-[var(--color-ink)]">
              {stats.crossMeanHamming}
            </span>{" "}
            — and never come closer than{" "}
            <span className="font-[var(--font-mono)] text-[var(--color-ink)]">
              {stats.crossMinHamming}
            </span>
            . That gap is what makes the registry a{" "}
            <em>provenance</em> tool: it proves which conformer you analysed
            without exposing the geometry.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5">
          <div className="mb-4 text-[12px] font-500 uppercase tracking-wide text-[var(--color-ink-faint)]">
            Adversarial collision study
          </div>
          <dl className="space-y-3 text-[14px]">
            {[
              ["Molecules / hashes", `${stats.adversarial.nMolecules} / ${stats.adversarial.nHashes}`],
              ["Cross-molecule pairs", stats.adversarial.crossPairs.toLocaleString()],
              ["Mean separation", `${stats.adversarial.crossMean} ± ${stats.adversarial.crossStd} bits`],
              ["Collisions at H ≤ 15", `${stats.adversarial.collisionsAt15} (0.00%)`],
              ["Collisions at H ≤ 20", `${stats.adversarial.collisionsAt20pct}%`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-[var(--color-hairline)] pb-2 last:border-0">
                <dt className="text-[var(--color-ink-soft)]">{k}</dt>
                <dd className="font-[var(--font-mono)] text-[13px]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Contract footer */}
      <section className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--color-hairline)] py-6 text-[13px] text-[var(--color-ink-soft)]">
        <span>Registry contract (Sepolia):</span>
        <a
          href={etherscanAddr(stats.contractV2)}
          target="_blank"
          rel="noreferrer"
          className="font-[var(--font-mono)] text-[var(--color-csh)] hover:underline"
        >
          {shortHash(stats.contractV2, 10, 8)}
        </a>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-5">{children}</div>;
}
