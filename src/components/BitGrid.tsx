import { hashToBits } from "../lib/csh";

interface BitGridProps {
  hash: string; // 16-char hex
  /** "on" bit fill color (defaults to ink). Pass a molecule color to tint. */
  color?: string;
  /** per-bit mask (length 64): 1 = this bit differs, ignite it. */
  diff?: number[];
  /** cell edge length in px */
  size?: number;
  /** compact single-row strip (no byte grouping) — for dense lists */
  flat?: boolean;
  className?: string;
}

/**
 * The signature element: a 64-bit CSH hash drawn as 8 bytes x 8 bits.
 * Filled cell = 1, hairline cell = 0. When `diff` is supplied, columns
 * where two hashes disagree ignite in the diff signal color — making
 * "similar conformers differ in few bits" literally visible.
 *
 * `flat` renders one continuous 64-cell strip for dense rows.
 */
export default function BitGrid({
  hash,
  color = "var(--color-ink)",
  diff,
  size = 13,
  flat = false,
  className = "",
}: BitGridProps) {
  const bits = hashToBits(hash);

  const cell = (bit: number, idx: number, radius: string) => {
    const isDiff = diff?.[idx] === 1;
    const on = bit === 1;
    return (
      <span
        key={idx}
        style={{
          width: size,
          height: size,
          background: isDiff
            ? "var(--color-diff)"
            : on
              ? color
              : "transparent",
          borderColor: isDiff
            ? "var(--color-diff)"
            : on
              ? color
              : "var(--color-hairline)",
        }}
        className={`${radius} border transition-colors duration-300`}
      />
    );
  };

  if (flat) {
    return (
      <div
        className={`inline-flex flex-wrap gap-[1.5px] ${className}`}
        role="img"
        aria-label={`64-bit hash ${hash}`}
      >
        {bits.map((bit, idx) => cell(bit, idx, "rounded-[1px]"))}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex flex-wrap gap-[6px] ${className}`}
      role="img"
      aria-label={`64-bit hash ${hash}`}
    >
      {Array.from({ length: 8 }).map((_, byteIdx) => (
        <div key={byteIdx} className="flex gap-[2px]">
          {bits
            .slice(byteIdx * 8, byteIdx * 8 + 8)
            .map((bit, i) => cell(bit, byteIdx * 8 + i, "rounded-[2px]"))}
        </div>
      ))}
    </div>
  );
}
