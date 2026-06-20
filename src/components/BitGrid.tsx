import { hashToBits } from "../lib/csh";

interface BitGridProps {
  hash: string; // 16-char hex
  /** "on" bit fill color (defaults to ink). Pass a molecule color to tint. */
  color?: string;
  /** per-bit mask (length 64): 1 = this bit differs, ignite it. */
  diff?: number[];
  /** cell edge length in px */
  size?: number;
  className?: string;
}

/**
 * The signature element: a 64-bit CSH hash drawn as 8 bytes x 8 bits.
 * Filled cell = 1, hairline cell = 0. When `diff` is supplied, columns
 * where two hashes disagree ignite in the diff signal color — making
 * "similar conformers differ in few bits" literally visible.
 */
export default function BitGrid({
  hash,
  color = "var(--color-ink)",
  diff,
  size = 13,
  className = "",
}: BitGridProps) {
  const bits = hashToBits(hash);
  return (
    <div
      className={`inline-flex flex-wrap gap-[6px] ${className}`}
      role="img"
      aria-label={`64-bit hash ${hash}`}
    >
      {Array.from({ length: 8 }).map((_, byteIdx) => (
        <div key={byteIdx} className="flex gap-[2px]">
          {bits.slice(byteIdx * 8, byteIdx * 8 + 8).map((bit, i) => {
            const idx = byteIdx * 8 + i;
            const isDiff = diff?.[idx] === 1;
            const on = bit === 1;
            const bg = isDiff
              ? "var(--color-diff)"
              : on
                ? color
                : "transparent";
            return (
              <span
                key={i}
                style={{
                  width: size,
                  height: size,
                  background: bg,
                  borderColor: isDiff
                    ? "var(--color-diff)"
                    : on
                      ? color
                      : "var(--color-hairline)",
                }}
                className="rounded-[2px] border transition-colors duration-300"
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
