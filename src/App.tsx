import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import Compare from "./pages/Compare";
import Search from "./pages/Search";

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </main>
      <footer className="mx-auto max-w-6xl px-5 py-10 text-[12.5px] text-[var(--color-ink-faint)]">
        Companion site to the CSH v2 manuscript · data anchored on Ethereum
        Sepolia testnet · built with real on-chain registrations.
      </footer>
    </div>
  );
}
