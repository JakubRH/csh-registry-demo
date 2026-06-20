import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Conformer } from "../lib/csh";
import {
  loadConformers,
  hamming,
  MOLECULES,
  MOLECULE_COLOR,
  MOLECULE_LABEL,
  etherscanTx,
  shortHash,
} from "../lib/csh";
import BitStrip from "../components/BitStrip";

const AXIS_MAX = 40;
const confNo = (id: string) => id.split("_conf")[1] ?? "";

interface Hit extends Conformer {
  h: number;
  stack: number;
  same: boolean;
}

export default function Search() {
  const [rows, setRows] = useState<Conformer[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState<string>("");
  const [t, setT] = useState<number>(20);

  useEffect(() => {
    loadConformers()
      .then((c) => {
        setRows(c);
        const pq = params.get("q");
        setQuery(pq && c.some((r) => r.id === pq) ? pq! : (c[0]?.id ?? ""));
        const pt = Number(params.get("t"));
        if (pt >= 0 && pt <= AXIS_MAX) setT(pt);
      })
      .catch((e) => setErr(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = useMemo(() => rows?.find((r) => r.id === query), [rows, query]);

  const placed: Hit[] = useMemo(() => {
    if (!rows || !q) return [];
    const bucket: Record<number, number> = {};
    return rows
      .filter((r) => r.id !== q.id)
      .map((r) => {
        const h = hamming(q.hash64, r.hash64);
        return { ...r, h, same: r.molecule === q.molecule };
      })
      .sort((a, b) => a.h - b.h)
      .map((r) => {
        const stack = (bucket[r.h] = bucket[r.h] ?? 0);
        bucket[r.h]++;
        return { ...r, stack };
      });
  }, [rows, q]);

  if (err)
    return (
      <Shell>
        <p className="py-20 text-[var(--color-diff)]">Could not load data. {err}</p>
      </Shell>
    );
  if (!rows || !q)
    return (
      <Shell>
        <p className="py-20 text-[var(--color-ink-soft)]">Loading…</p>
      </Shell>
    );

  function setQueryParam(next: { q?: string; t?: number }) {
    const nq = next.q ?? query;
    const nt = next.t ?? t;
    if (next.q !== undefined) setQuery(nq);
    if (next.t !== undefined) setT(nt);
    setParams({ q: nq, t: String(nt) }, { replace: true });
  }

  const sameAll = placed.filter((p) => p.same);
  const crossAll = placed.filter((p) => !p.same);
  const retrieved = placed.filter((p) => p.h <= t).sort((a, b) => a.h - b.h);
  const sameHit = sameAll.filter((p) => p.h <= t).length;
  const crossHit = crossAll.filter((p) => p.h <= t).length;
  const recall = sameAll.length ? Math.round((sameHit / sameAll.length) * 100) : 0;

  const maxStack = Math.max(1, ...Object.values(
    placed.reduce<Record<number, number>>((acc, p) => {
      acc[p.h] = (acc[p.h] ?? 0) + 1;
      return acc;
    }, {}),
  ));
  const SPACING = 16;
  const swarmH = maxStack * SPACING + 24;
  const xPct = (h: number) => `${Math.min(100, (h / AXIS_MAX) * 100)}%`;

  return (
    <Shell>
      <div className="py-10">
        <p className="mb-2 font-[var(--font-mono)] text-[12px] uppercase tracking-[0.14em] text-[var(--color-csh)]">
          Search
        </p>
        <h1 className="font-[var(--font-display)] text-3xl font-600">Similarity search</h1>
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[var(--color-ink-soft)]">
          Pick a query conformer and slide the threshold T. Everything within T bits is
          retrieved. Same-molecule conformers cluster close; other molecules sit far — so a
          well-chosen T recovers the family without pulling in strangers.
        </p>
      </div>

      {/* Controls */}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-500 uppercase tracking-wide text-[var(--color-ink-faint)]">
            Query conformer
          </span>
          <select
            value={query}
            onChange={(e) => setQueryParam({ q: e.target.value })}
            className="w-full rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2.5 font-[var(--font-mono)] text-[13.5px] transition-colors hover:border-[var(--color-ink-faint)] focus:border-[var(--color-csh)]"
          >
            {MOLECULES.map((m) => (
              <optgroup key={m} label={MOLECULE_LABEL[m]}>
                {rows
                  .filter((r) => r.molecule === m)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {MOLECULE_LABEL[c.molecule]} · conf {confNo(c.id)}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-baseline justify-between text-[12px] font-500 uppercase tracking-wide text-[var(--color-ink-faint)]">
            Threshold T
            <span className="tnum font-[var(--font-mono)] text-[15px] normal-case text-[var(--color-ink)]">
              {t} bits
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={AXIS_MAX}
            value={t}
            onChange={(e) => setQueryParam({ t: Number(e.target.value) })}
            className="mt-2.5 w-full accent-[var(--color-csh)]"
          />
        </label>
      </div>

      {/* Metrics */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <Metric value={`${retrieved.length}`} label="Retrieved" sub={`of ${placed.length} conformers`} />
        <Metric
          value={`${recall}%`}
          label="Within-molecule recall"
          sub={`${sameHit} of ${sameAll.length} ${MOLECULE_LABEL[q.molecule].toLowerCase()}`}
          accent={MOLECULE_COLOR[q.molecule]}
        />
        <Metric
          value={`${crossHit}`}
          label="Cross-molecule FP"
          sub={crossHit === 0 ? "clean separation" : "false positives"}
          accent={crossHit === 0 ? "var(--color-csh)" : "var(--color-diff)"}
        />
      </div>

      {/* Distance swarm */}
      <div className="mt-6 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 sm:p-7">
        <div className="mb-1 flex items-center justify-between text-[12px] text-[var(--color-ink-faint)]">
          <span>Hamming distance from query →</span>
          <span className="hidden sm:flex sm:gap-4">
            {MOLECULES.map((m) => (
              <span key={m} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: MOLECULE_COLOR[m] }} />
                {MOLECULE_LABEL[m]}
              </span>
            ))}
          </span>
        </div>

        <div className="relative" style={{ height: swarmH }}>
          {/* retrieved zone */}
          <div
            className="absolute inset-y-0 left-0 rounded-l-md bg-[var(--color-csh-soft)]/60"
            style={{ width: xPct(t) }}
          />
          {/* T line */}
          <div className="absolute inset-y-0" style={{ left: xPct(t) }}>
            <div className="h-full w-px bg-[var(--color-csh)]" />
            <span className="absolute -top-0.5 left-1 whitespace-nowrap font-[var(--font-mono)] text-[10px] text-[var(--color-csh)]">
              T={t}
            </span>
          </div>
          {/* dots */}
          {placed.map((p) => {
            const retrievedDot = p.h <= t;
            const fp = retrievedDot && !p.same;
            return (
              <span
                key={p.id}
                title={`${MOLECULE_LABEL[p.molecule]} conf ${confNo(p.id)} · ${p.h} bits`}
                className="absolute h-[11px] w-[11px] -translate-x-1/2 rounded-full border transition-opacity"
                style={{
                  left: xPct(p.h),
                  bottom: 6 + p.stack * SPACING,
                  background: MOLECULE_COLOR[p.molecule],
                  borderColor: fp ? "var(--color-diff)" : "transparent",
                  boxShadow: fp ? "0 0 0 2px var(--color-diff)" : "none",
                  opacity: retrievedDot ? 1 : 0.28,
                }}
              />
            );
          })}
        </div>
        {/* axis ticks */}
        <div className="relative mt-1 h-4 border-t border-[var(--color-hairline)]">
          {[0, 10, 20, 30, 40].map((v) => (
            <span
              key={v}
              className="absolute -translate-x-1/2 pt-1 font-[var(--font-mono)] text-[10px] text-[var(--color-ink-faint)]"
              style={{ left: xPct(v) }}
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* Retrieved list */}
      <div className="mt-6">
        <h2 className="mb-3 text-[13px] font-500 uppercase tracking-wide text-[var(--color-ink-faint)]">
          Retrieved within T = {t} ({retrieved.length})
        </h2>
        {retrieved.length === 0 ? (
          <p className="text-[14px] text-[var(--color-ink-soft)]">
            Nothing within {t} bits — drag T higher.
          </p>
        ) : (
          <div className="space-y-2">
            {retrieved.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2.5"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: MOLECULE_COLOR[p.molecule] }} />
                <span className="w-40 shrink-0 text-[13px] font-500">
                  {MOLECULE_LABEL[p.molecule]}{" "}
                  <span className="font-[var(--font-mono)] text-[12px] text-[var(--color-ink-soft)]">
                    conf {confNo(p.id)}
                  </span>
                </span>
                <BitStrip hash={p.hash64} color={MOLECULE_COLOR[p.molecule]} height={16} barWidth={2} className="hidden md:flex" />
                <span className="ml-auto flex shrink-0 items-center gap-3">
                  {!p.same && (
                    <span className="rounded-full bg-[var(--color-diff-soft)] px-2 py-0.5 font-[var(--font-mono)] text-[10.5px] font-500 text-[var(--color-diff)]">
                      cross
                    </span>
                  )}
                  <span className="tnum w-14 text-right font-[var(--font-mono)] text-[13px]">
                    {p.h} {p.h === 1 ? "bit" : "bits"}
                  </span>
                  <a
                    href={etherscanTx(p.tx)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-[var(--font-mono)] text-[12px] text-[var(--color-csh)] hover:underline"
                    title={p.tx}
                  >
                    {shortHash(p.tx, 5, 3)} ↗
                  </a>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

function Metric({
  value,
  label,
  sub,
  accent,
}: {
  value: string;
  label: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-4">
      <div
        className="tnum font-[var(--font-display)] text-2xl font-600 leading-none"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[12.5px] font-500">{label}</div>
      <div className="text-[11.5px] text-[var(--color-ink-soft)]">{sub}</div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl px-5">{children}</div>;
}
