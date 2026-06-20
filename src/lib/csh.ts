export interface Conformer {
  id: string;
  molecule: string;
  hash64: string; // 16 hex chars = 64 bits
  hashFull: string; // bytes32 0x...
  sha256: string;
  energy: number; // kcal/mol
  block: number;
  tx: string;
  registrant: string;
  timestamp: number;
}

export interface HeroPair {
  hamming: number;
  a: { id: string; molecule: string; hash64: string };
  b: { id: string; molecule: string; hash64: string };
}

export interface Stats {
  conformersOnChain: number;
  molecules: number;
  indexedEvents: number;
  lastIndexedBlock: number;
  contractV2: string;
  contractV1: string;
  withinMeanHamming: number;
  crossMeanHamming: number;
  crossMinHamming: number;
  adversarial: {
    nMolecules: number;
    nHashes: number;
    crossPairs: number;
    crossMean: number;
    crossStd: number;
    crossMin: number;
    collisionsAt15: number;
    collisionsAt20pct: number;
  };
  bestOperatingPoint: { T: number; recall: number; crossFP: number };
  hero: { same: HeroPair; different: HeroPair };
}

export const MOLECULES = ["tamoxifen", "imatinib", "atorvastatin"] as const;
export type Molecule = (typeof MOLECULES)[number];

export const MOLECULE_COLOR: Record<string, string> = {
  tamoxifen: "var(--color-tamoxifen)",
  imatinib: "var(--color-imatinib)",
  atorvastatin: "var(--color-atorvastatin)",
};

export const MOLECULE_LABEL: Record<string, string> = {
  tamoxifen: "Tamoxifen",
  imatinib: "Imatinib",
  atorvastatin: "Atorvastatin",
};

const BASE = import.meta.env.BASE_URL;

export async function loadConformers(): Promise<Conformer[]> {
  const res = await fetch(`${BASE}data/conformers.json`);
  if (!res.ok) throw new Error(`Failed to load conformers (${res.status})`);
  return res.json();
}

export async function loadStats(): Promise<Stats> {
  const res = await fetch(`${BASE}data/stats.json`);
  if (!res.ok) throw new Error(`Failed to load stats (${res.status})`);
  return res.json();
}

/** 64-bit array (MSB first) from a 16-char hex string. */
export function hashToBits(hex: string): number[] {
  const bits: number[] = [];
  for (const ch of hex) {
    const nib = parseInt(ch, 16);
    for (let i = 3; i >= 0; i--) bits.push((nib >> i) & 1);
  }
  return bits;
}

/** Hamming distance between two 16-char hex hashes. */
export function hamming(a: string, b: string): number {
  const ba = hashToBits(a);
  const bb = hashToBits(b);
  let d = 0;
  for (let i = 0; i < ba.length; i++) if (ba[i] !== bb[i]) d++;
  return d;
}

/** Per-bit XOR mask: 1 where the two hashes differ. */
export function diffMask(a: string, b: string): number[] {
  const ba = hashToBits(a);
  const bb = hashToBits(b);
  return ba.map((bit, i) => (bit !== bb[i] ? 1 : 0));
}

export const etherscanTx = (tx: string) => `https://sepolia.etherscan.io/tx/${tx}`;
export const etherscanAddr = (addr: string) =>
  `https://sepolia.etherscan.io/address/${addr}`;

export const shortHash = (h: string, head = 6, tail = 4) =>
  h.length <= head + tail + 1 ? h : `${h.slice(0, head)}…${h.slice(-tail)}`;
