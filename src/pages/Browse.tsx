import { useEffect, useMemo, useState } from "react";
import type { Conformer } from "../lib/csh";
import {
  loadConformers,
  hamming,
  MOLECULES,
  MOLECULE_COLOR,
  MOLECULE_LABEL,
  etherscanTx,
  etherscanAddr,
  shortHash,
} from "../lib/csh";
import BitStrip from "../components/BitStrip";

type SortKey = "id" | "energy" | "delta";
type Filter = "all" | (typeof MOLECULES)[number];
type Row = Conformer & { delta: number; isRef: boolean };

const confNo = (id: string) => id.split("_conf")[1] ?? "";

export default function Browse() {
  const [rows, setRows] = useState<Conformer[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "id",
    dir: 1,
  });

  useEffect(() => {
    loadConformers().then(setRows).catch((e) => setErr(String(e)));
  }, []);

  // Reference conformer per molecule = lowest conf index (the "conf 00" anchor).
  const refHash = useMemo(() => {
    const ref: Record<string, string> = {};
    if (rows) {
      for (const m of MOLECULES) {
        const first = rows
          .filter((r) => r.molecule === m)
          .sort((a, b) => a.id.localeCompare(b.id))[0];
        if (first) ref[m] = first.hash64;
      }
    }
    return ref;
  }, [rows]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows?.length ?? 0 };
    for (const m of MOLECULES)
      c[m] = rows?.filter((r) => r.molecule === m).length ?? 0;
    return c;
  }, [rows]);

  const view: Row[] = useMemo(() => {
    if (!rows) return [];
    const base =
      filter === "all" ? rows : rows.filter((r) => r.molecule === filter);
    const withDelta: Row[] = base.map((c) => {
      const ref = refHash[c.molecule];
      const delta = ref ? hamming(c.hash64, ref) : 0;
      return { ...c, delta, isRef: c.hash64 === ref && delta === 0 };
    });
    const k = sort.key;
    return withDelta.sort((a, b) => {
      const d =
        k === "id"
          ? a.id.localeCompare(b.id)
          : (a[k] as number) - (b[k] as number);
      return d * sort.dir;
    });
  }, [rows, filter, sort, refHash]);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 },
    );
  }

  if (err)
    return (
      <Shell>
        <p className="py-20 text-[var(--color-diff)]">
          Could not load conformers. {err}
        </p>
      </Shell>
    );
  if (!rows)
    return (
      <Shell>
        <p className="py-20 text-[var(--color-ink-soft)]">Loading registry…</p>
      </Shell>
    );

  return (
    <Shell>
      <div className="py-10">
        <p className="mb-2 font-[var(--font-mono)] text-[12px] uppercase tracking-[0.14em] text-[var(--color-csh)]">
          Registry
        </p>
        <h1 className="font-[var(--font-display)] text-3xl font-600">
          Browse conformers
        </h1>
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[var(--color-ink-soft)]">
          Every conformer below is a real registration on Sepolia. The bit
          pattern is its 64-bit CSH hash; <span className="text-[var(--color-ink)]">Δ</span> is its
          Hamming distance from that molecule&apos;s first conformer — small,
          because the same molecule lands in the same neighbourhood.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-y border-[var(--color-hairline)] py-3">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
          count={counts.all}
        />
        {MOLECULES.map((m) => (
          <FilterChip
            key={m}
            active={filter === m}
            onClick={() => setFilter(m)}
            label={MOLECULE_LABEL[m]}
            count={counts[m]}
            color={MOLECULE_COLOR[m]}
          />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="border-b border-[var(--color-hairline)] text-left text-[12px] uppercase tracking-wide text-[var(--color-ink-faint)]">
              <Th onClick={() => toggleSort("id")} active={sort.key === "id"} dir={sort.dir}>
                Conformer
              </Th>
              <th className="py-2.5 font-500">Bit pattern</th>
              <Th onClick={() => toggleSort("delta")} active={sort.key === "delta"} dir={sort.dir} align="right">
                Hamming Δ
              </Th>
              <Th onClick={() => toggleSort("energy")} active={sort.key === "energy"} dir={sort.dir} align="right">
                Energy
              </Th>
              <th className="py-2.5 text-right font-500">Transaction</th>
            </tr>
          </thead>
          <tbody>
            {view.map((c) => (
              <tr
                key={c.id}
                className="border-b border-[var(--color-hairline)] transition-colors hover:bg-[var(--color-paper)]"
              >
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: MOLECULE_COLOR[c.molecule] }}
                    />
                    <span className="font-500">{MOLECULE_LABEL[c.molecule]}</span>
                    <span className="font-[var(--font-mono)] text-[12.5px] text-[var(--color-ink-soft)]">
                      conf {confNo(c.id)}
                    </span>
                  </div>
                </td>
                <td className="py-3">
                  <BitStrip hash={c.hash64} color={MOLECULE_COLOR[c.molecule]} />
                </td>
                <td className="tnum py-3 text-right font-[var(--font-mono)] text-[13px]">
                  {c.isRef ? (
                    <span className="text-[var(--color-ink-faint)]">ref</span>
                  ) : (
                    <>
                      {c.delta}
                      <span className="text-[var(--color-ink-faint)]"> bits</span>
                    </>
                  )}
                </td>
                <td
                  className="tnum py-3 text-right font-[var(--font-mono)] text-[13px]"
                  title={`${c.energy} kcal/mol`}
                >
                  {c.energy.toFixed(1)}
                  <span className="text-[var(--color-ink-faint)]"> kcal/mol</span>
                </td>
                <td className="py-3 text-right">
                  <a
                    href={etherscanTx(c.tx)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-[var(--font-mono)] text-[12.5px] text-[var(--color-csh)] hover:underline"
                    title={`${c.tx} · block ${c.block.toLocaleString()}`}
                  >
                    {shortHash(c.tx)} ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 py-4 md:hidden">
        {view.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: MOLECULE_COLOR[c.molecule] }}
                />
                <span className="font-500">{MOLECULE_LABEL[c.molecule]}</span>
                <span className="font-[var(--font-mono)] text-[12.5px] text-[var(--color-ink-soft)]">
                  conf {confNo(c.id)}
                </span>
              </div>
              <a
                href={etherscanTx(c.tx)}
                target="_blank"
                rel="noreferrer"
                className="font-[var(--font-mono)] text-[12px] text-[var(--color-csh)]"
              >
                {shortHash(c.tx, 5, 3)} ↗
              </a>
            </div>
            <BitStrip
              hash={c.hash64}
              color={MOLECULE_COLOR[c.molecule]}
              barWidth={4}
              height={22}
              className="w-full"
            />
            <div className="mt-3 flex justify-between text-[12.5px] text-[var(--color-ink-soft)]">
              <span className="tnum font-[var(--font-mono)]">
                {c.energy.toFixed(1)} kcal/mol
              </span>
              <span className="tnum font-[var(--font-mono)]">
                {c.isRef ? "reference" : `Δ ${c.delta} bits`}
              </span>
            </div>
          </div>
        ))}
      </div>

      <section className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--color-hairline)] py-6 text-[13px] text-[var(--color-ink-soft)]">
        <span>{view.length} conformers shown · registry contract:</span>
        <a
          href={etherscanAddr("0x2081c6b3216Bb21811c179C195cbe9490C9F6572")}
          target="_blank"
          rel="noreferrer"
          className="font-[var(--font-mono)] text-[var(--color-csh)] hover:underline"
        >
          0x2081…F6572 ↗
        </a>
      </section>
    </Shell>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
        active
          ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
          : "border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-faint)]"
      }`}
    >
      {color && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: active ? "#fff" : color }}
        />
      )}
      {label}
      <span
        className={`tnum text-[11.5px] ${active ? "text-white/70" : "text-[var(--color-ink-faint)]"}`}
      >
        {count}
      </span>
    </button>
  );
}

function Th({
  children,
  onClick,
  active,
  dir,
  align = "left",
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: 1 | -1;
  align?: "left" | "right";
}) {
  return (
    <th className={`py-2.5 font-500 ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-[var(--color-ink)] ${
          active ? "text-[var(--color-ink)]" : ""
        }`}
      >
        {children}
        <span className="text-[10px]">
          {active ? (dir === 1 ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-5">{children}</div>;
}
