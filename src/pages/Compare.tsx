import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Conformer, Stats } from "../lib/csh";
import {
  loadConformers,
  loadStats,
  hamming,
  diffMask,
  MOLECULES,
  MOLECULE_COLOR,
  MOLECULE_LABEL,
  etherscanTx,
  shortHash,
} from "../lib/csh";
import BitGrid from "../components/BitGrid";

const confNo = (id: string) => id.split("_conf")[1] ?? "";

function ConformerSelect({
  rows,
  value,
  onChange,
  label,
}: {
  rows: Conformer[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const grouped = MOLECULES.map((m) => ({
    m,
    items: rows.filter((r) => r.molecule === m),
  }));
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-500 uppercase tracking-wide text-[var(--color-ink-faint)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2.5 font-[var(--font-mono)] text-[13.5px] transition-colors hover:border-[var(--color-ink-faint)] focus:border-[var(--color-csh)]"
      >
        {grouped.map((g) => (
          <optgroup key={g.m} label={MOLECULE_LABEL[g.m]}>
            {g.items.map((c) => (
              <option key={c.id} value={c.id}>
                {MOLECULE_LABEL[c.molecule]} · conf {confNo(c.id)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

function ConformerCard({ c }: { c: Conformer }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
      <span className="flex items-center gap-2 font-500">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: MOLECULE_COLOR[c.molecule] }} />
        {MOLECULE_LABEL[c.molecule]} · conf {confNo(c.id)}
      </span>
      <span className="tnum font-[var(--font-mono)] text-[var(--color-ink-soft)]">
        {c.energy.toFixed(1)} kcal/mol
      </span>
      <a
        href={etherscanTx(c.tx)}
        target="_blank"
        rel="noreferrer"
        className="font-[var(--font-mono)] text-[var(--color-csh)] hover:underline"
        title={c.tx}
      >
        {shortHash(c.tx)} ↗
      </a>
    </div>
  );
}

/** Horizontal 0–64 scale with within/cross means marked and a pointer at d. */
function DistanceScale({
  d,
  within,
  cross,
  pointerColor,
}: {
  d: number;
  within: number;
  cross: number;
  pointerColor: string;
}) {
  const pct = (v: number) => `${(v / 64) * 100}%`;
  return (
    <div className="pt-2">
      <div className="relative h-1.5 rounded-full bg-[var(--color-hairline)]">
        {/* within / cross mean ticks — staggered to avoid overlap when close */}
        <Tick at={pct(within)} label={`within ${within}`} color="var(--color-ink-faint)" pos="top" />
        <Tick at={pct(cross)} label={`cross ${cross}`} color="var(--color-ink-faint)" pos="bottom" />
        {/* current pointer */}
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--color-surface)]"
          style={{ left: pct(d), background: pointerColor }}
        />
      </div>
      <div className="mt-4 flex justify-between font-[var(--font-mono)] text-[10.5px] text-[var(--color-ink-faint)]">
        <span>0</span>
        <span>64 bits</span>
      </div>
    </div>
  );
}

function Tick({
  at,
  label,
  color,
  pos = "bottom",
}: {
  at: string;
  label: string;
  color: string;
  pos?: "top" | "bottom";
}) {
  return (
    <span className="absolute top-1/2 -translate-y-1/2" style={{ left: at }}>
      <span className="block h-3 w-px -translate-x-1/2" style={{ background: color }} />
      <span
        className={`absolute -translate-x-1/2 whitespace-nowrap font-[var(--font-mono)] text-[10px] ${
          pos === "top" ? "bottom-3" : "top-3"
        }`}
        style={{ color }}
      >
        {label}
      </span>
    </span>
  );
}

export default function Compare() {
  const [rows, setRows] = useState<Conformer[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");

  useEffect(() => {
    Promise.all([loadConformers(), loadStats()])
      .then(([c, s]) => {
        setRows(c);
        setStats(s);
        const pa = params.get("a");
        const pb = params.get("b");
        const has = (id: string | null) => id && c.some((r) => r.id === id);
        // defaults: first conformer, and first of a different molecule
        const def0 = c[0]?.id ?? "";
        const def1 = (c.find((r) => r.molecule !== c[0]?.molecule) ?? c[1] ?? c[0])?.id ?? "";
        setA(has(pa) ? pa! : def0);
        setB(has(pb) ? pb! : def1);
      })
      .catch((e) => setErr(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(next: { a?: string; b?: string }) {
    const na = next.a ?? a;
    const nb = next.b ?? b;
    setA(na);
    setB(nb);
    setParams({ a: na, b: nb }, { replace: true });
  }

  const ca = useMemo(() => rows?.find((r) => r.id === a), [rows, a]);
  const cb = useMemo(() => rows?.find((r) => r.id === b), [rows, b]);

  if (err)
    return (
      <Shell>
        <p className="py-20 text-[var(--color-diff)]">Could not load data. {err}</p>
      </Shell>
    );
  if (!rows || !stats || !ca || !cb)
    return (
      <Shell>
        <p className="py-20 text-[var(--color-ink-soft)]">Loading…</p>
      </Shell>
    );

  const d = hamming(ca.hash64, cb.hash64);
  const mask = diffMask(ca.hash64, cb.hash64);
  const sim = (((64 - d) / 64) * 100).toFixed(0);
  const sameMol = ca.molecule === cb.molecule;

  return (
    <Shell>
      <div className="py-10">
        <p className="mb-2 font-[var(--font-mono)] text-[12px] uppercase tracking-[0.14em] text-[var(--color-csh)]">
          Compare
        </p>
        <h1 className="font-[var(--font-display)] text-3xl font-600">Compare two hashes</h1>
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[var(--color-ink-soft)]">
          Pick any two conformers. The bits that disagree ignite in red; the count is their
          Hamming distance. Same molecule sits close, different molecules sit far.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ConformerSelect rows={rows} value={a} label="Conformer A" onChange={(id) => update({ a: id })} />
        <ConformerSelect rows={rows} value={b} label="Conformer B" onChange={(id) => update({ b: id })} />
      </div>

      {/* Result */}
      <div className="mt-6 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="tnum font-[var(--font-display)] text-4xl font-700 text-[var(--color-diff)]">
              {d}
            </span>
            <span className="text-[13.5px] text-[var(--color-ink-soft)]">
              {d === 1 ? "bit differs" : "bits differ"}
              <span className="text-[var(--color-ink-faint)]"> / 64</span>
            </span>
          </div>
          <div className="text-right text-[13px] text-[var(--color-ink-soft)]">
            <span className="tnum font-[var(--font-mono)] text-[var(--color-ink)]">{sim}%</span> bit
            agreement
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2.5">
            <ConformerCard c={ca} />
            <BitGrid hash={ca.hash64} color={MOLECULE_COLOR[ca.molecule]} diff={mask} size={14} />
          </div>
          <div className="space-y-2.5 border-t border-[var(--color-hairline)] pt-5">
            <ConformerCard c={cb} />
            <BitGrid hash={cb.hash64} color={MOLECULE_COLOR[cb.molecule]} diff={mask} size={14} />
          </div>
        </div>

        <div className="mt-8">
          <DistanceScale
            d={d}
            within={stats.withinMeanHamming}
            cross={stats.crossMeanHamming}
            pointerColor={sameMol ? MOLECULE_COLOR[ca.molecule] : "var(--color-diff)"}
          />
        </div>

        <p className="mt-9 border-t border-[var(--color-hairline)] pt-4 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">
          {sameMol ? (
            <>
              Same molecule ({MOLECULE_LABEL[ca.molecule]}).{" "}
              {d <= stats.bestOperatingPoint.T ? (
                <>
                  At {d} {d === 1 ? "bit" : "bits"} they fall within the operating threshold T ={" "}
                  {stats.bestOperatingPoint.T}, so a similarity search would retrieve one given the
                  other.
                </>
              ) : (
                <>
                  At {d} bits they sit beyond T = {stats.bestOperatingPoint.T} — a wider conformational
                  swing within the same molecule.
                </>
              )}
            </>
          ) : (
            <>
              Different molecules ({MOLECULE_LABEL[ca.molecule]} vs {MOLECULE_LABEL[cb.molecule]}).
              No cross-molecule pair in the benchmark falls within 15 bits, so this distance reflects
              identity, not a near-miss.
            </>
          )}
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl px-5">{children}</div>;
}
