import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "Overview", end: true },
  { to: "/browse", label: "Browse" },
  { to: "/compare", label: "Compare" },
  { to: "/search", label: "Search" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-hairline)] bg-[var(--color-paper)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
        <NavLink to="/" className="flex items-center gap-2.5">
          <span
            className="grid h-6 w-6 grid-cols-3 grid-rows-3 gap-[2px]"
            aria-hidden
          >
            {[1, 0, 1, 0, 1, 1, 1, 0, 0].map((b, i) => (
              <span
                key={i}
                className="rounded-[1px]"
                style={{
                  background: b
                    ? "var(--color-csh)"
                    : "var(--color-hairline)",
                }}
              />
            ))}
          </span>
          <span className="font-[var(--font-display)] text-[15px] font-600 tracking-tight">
            CSH&nbsp;Registry
          </span>
        </NavLink>

        <nav className="flex items-center gap-1 text-[13.5px]">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `rounded-md px-2.5 py-1.5 transition-colors ${
                  isActive
                    ? "bg-[var(--color-csh-soft)] text-[var(--color-csh)]"
                    : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4 text-[13px] text-[var(--color-ink-soft)]">
          <a
            href="https://github.com/JakubRH/conformational-soft-hash"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--color-ink)]"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
