import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Stub from "./pages/Stub";
import Browse from "./pages/Browse";

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route
            path="/compare"
            element={
              <Stub
                title="Compare two hashes"
                blurb="Pick any two conformers and read the Hamming distance off a side-by-side bit diff, with the differing bits ignited."
              />
            }
          />
          <Route
            path="/search"
            element={
              <Stub
                title="Similarity search"
                blurb="Query a conformer and slide the Hamming threshold T to watch LSH banding retrieve near-neighbours — same recall/false-positive trade-off as the paper."
              />
            }
          />
        </Routes>
      </main>
      <footer className="mx-auto max-w-6xl px-5 py-10 text-[12.5px] text-[var(--color-ink-faint)]">
        Companion site to the CSH v2 manuscript · data anchored on Ethereum
        Sepolia testnet · built with real on-chain registrations.
      </footer>
    </div>
  );
}
