import { hashToBits } from "../lib/csh";

interface BitStripProps {
  hash: string; // 16-char hex
  color?: string; // on-bit color
  height?: number;
  barWidth?: number;
  className?: string;
}

/**
 * Compact 64-bit "barcode": one thin bar per bit, on = color, off = hairline.
 * Conformers of the same molecule produce visibly similar strips — the
 * within-molecule soft-collision property, scannable down a list.
 */
export default function BitStrip({
  hash,
  color = "var(--color-ink)",
  height = 20,
  barWidth = 3,
  className = "",
}: BitStripProps) {
  const bits = hashToBits(hash);
  return (
    <div
      className={`inline-flex items-stretch overflow-hidden rounded-[2px] ${className}`}
      style={{ height, gap: 1 }}
      role="img"
      aria-label={`64-bit hash ${hash}`}
      title={hash}
    >
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            width: barWidth,
            background: b ? color : "var(--color-hairline)",
          }}
        />
      ))}
    </div>
  );
}
