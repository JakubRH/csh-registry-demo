import { useEffect, useMemo, useState } from "react";
import type { Conformer } from "../lib/csh";
import {
  loadConformers,
  MOLECULES,
  MOLECULE_COLOR,
  MOLECULE_LABEL,
  etherscanTx,
  shortHash,
} from "../lib/csh";
import BitGrid from "../components/BitGrid";

type Filter = "all" | (typeof MOLECULES)[number];
type SortKey = "id" | "energy";

export default function Browse() {
  const [conformers, setConformers] = useState<Conformer[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("id");

  useEffect(() => {
    loadConformers().then(setConformers).catch((e) => setErr(String(e)));
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: conformers?.length ?? 0 };
    for (const m of MOLECULES)
      c[m] = conformers?.filter((x) => x.molecule === m).length ?? 0;
    return c;
  }, [conformers]);

  const rows = useMemo(() => {
    if (!conformers) return [];
    const f = filter === "all" ? conformers : conformers.filter((c) => c.molecule === filter);
    return [...f].sort((a, b) =>
      sort === "energy" ? a.energy - b.energy : a.id.localeCompare(b.id),
    );
  }, [conformers, filter, sort]);

  if (err)
    return (
      <Shell>
        <p className="text-[var(--color-diff)]">Could not load conformers. {err}</p>
      </Shell>
    );
  if (!conformers)
    return (
      <Shell>
        <p className="text-[var(--color-ink-soft)]">Loading registry…</p>
      </Shell>
    );

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-10">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl font-600 tracking-tight">
            Registry
          </h1>
          <p className="mt-1.5 text-[14.5px] text-[var(--color-ink-soft)]">
            {conformers.length} unique conformers anchored on Sepolia — each row
            links to its registration transaction.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-[var(--color-ink-soft)]">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-[var(--color-hairline)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[var(--color-ink)]"
          >
            <option value="id">Conformer ID</option>
            <option value="energy">Energy</option>
          </select>
        </label>
      </div>

      {/* molecule filter pills */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Pill active={filter === "all"} onClick={() => setFilter("all")} count={counts.all}>
          All
        </Pill>
        {MOLECULES.map((m) => (
          <Pill
            key={m}
            active={filter === m}
            onClick={() => setFilter(m)}
            count={counts[m]}
            color={MOLECULE_COLOR[m]}
          >
            {MOLECULE_LABEL[m]}
          </Pill>
        ))}
      </div>

      {/* column header (desktop) */}
      <div className="mt-6 hidden grid-cols-[150px_1fr_92px_120px] gap-4 border-b border-[var(--color-hairline)] px-3 pb-2 text-[11px] font-500 uppercase tracking-wide text-[var(--color-ink-faint)] md:grid">
        <span>Conformer</span>
        <span>64-bit hash</span>
        <span className="text-right">Energy</span>
        <span className="text-right">Transaction</span>
      </div>

      <ul className="mt-1 divide-y divide-[var(--color-hairline)]">
        {rows.map((c) => (
          <Row key={c.id} c={c} />
        ))}
      </ul>
    </Shell>
  );
}

function Row({ c }: { c: Conformer }) {
  const color = MOLECULE_COLOR[c.molecule];
  const confNo = c.id.split("conf")[1] ?? "";
  return (
    <li className="grid grid-cols-1 items-center gap-3 px-3 py-3.5 transition-colors hover:bg-[var(--color-surface)] md:grid-cols-[150px_1fr_92px_120px] md:gap-4">
      <div className="flex items-center gap-2.5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
        <div className="leading-tight">
          <div className="text-[14px] font-500" style={{ color }}>
            {MOLECULE_LABEL[c.molecule]}
          </div>
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-ink-faint)]">
            conf {confNo}
          </div>
        </div>
      </div>

      <BitGrid hash={c.hash64} color={color} size={11} />

      <div className="tnum font-[var(--font-mono)] text-[13px] md:text-right">
        <span className="text-[var(--color-ink)]">{c.energy.toFixed(1)}</span>
        <span className="text-[var(--color-ink-faint)]"> kcal/mol</span>
      </div>

      <div className="md:text-right">
        <a
          href={etherscanTx(c.tx)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-[var(--font-mono)] text-[12.5px] text-[var(--color-csh)] hover:underline"
          title={`Block ${c.block.toLocaleString()}`}
        >
          {shortHash(c.tx, 6, 4)}
          <span aria-hidden className="text-[10px]">↗</span>
        </a>
      </div>
    </li>
  );
}

function Pill({
  children,
  active,
  onClick,
  count,
  color,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count: number;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
        active
          ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
          : "border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-faint)]"
      }`}
    >
      {color && (
        <span className="h-2 w-2 rounded-full" style={{ background: active ? "#fff" : color }} />
      )}
      {children}
      <span className={active ? "text-white/70" : "text-[var(--color-ink-faint)]"}>{count}</span>
    </button>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-5 pb-16">{children}</div>;
}
