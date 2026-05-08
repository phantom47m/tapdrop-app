import SendForm from "./_components/send-form";

export default function Home() {
  return (
    <main className="relative z-10 flex-1 flex flex-col">
      <header className="flex justify-between items-center px-6 md:px-12 pt-7 pb-5 border-b border-[var(--rule)]">
        <span className="wordmark text-[24px] md:text-[26px]">
          Tap<span className="dot" />Drop
        </span>
        <span className="mono-eyebrow text-[10px] md:text-[11px]">v0.1 · Sender</span>
      </header>

      <section className="flex-1 grid place-items-center px-5 py-10 md:py-16">
        <div className="w-full max-w-[560px]">
          <div className="text-center mb-10 md:mb-14">
            <div className="mono-eyebrow mb-4">— Drop one file. Hand it off. —</div>
            <h1 className="display" style={{ fontSize: "clamp(38px, 5.5vw, 64px)" }}>
              Drop a file.<br />
              <em>They tap it.</em>
            </h1>
          </div>

          <SendForm />

          <p
            className="mt-10 text-center"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--ink-mute)",
            }}
          >
            100 MB max · 24 h expiry · 1 download · No account required
          </p>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-5 border-t border-[var(--rule)] flex justify-between items-center mono-eyebrow text-[10px] md:text-[11px]">
        <span>47 Industries × iUSEJOE</span>
        <a
          href="https://github.com/phantom47m/tapdrop-app"
          style={{
            color: "var(--ink-mute)",
            textDecoration: "none",
            borderBottom: "1px solid var(--rule)",
            paddingBottom: "1px",
          }}
        >
          Source ↗
        </a>
      </footer>
    </main>
  );
}
