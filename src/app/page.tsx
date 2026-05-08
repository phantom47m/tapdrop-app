export default function Home() {
  return (
    <main className="relative z-10 flex-1 flex flex-col">
      <header className="flex justify-between items-center px-8 md:px-12 pt-8 pb-6 border-b border-[var(--rule)]">
        <span className="wordmark text-[26px]">
          Tap<span className="dot" />Drop
        </span>
        <span className="mono-eyebrow">v0 · Sender</span>
      </header>

      <section className="flex-1 grid place-items-center px-6 py-20 md:py-28">
        <div className="max-w-[680px] w-full text-center">
          <div className="mono-eyebrow mb-6">— Coming online —</div>

          <h1
            className="display"
            style={{ fontSize: "clamp(44px, 6vw, 80px)" }}
          >
            Drop a file.
            <br />
            Show your screen.
            <br />
            <em>They tap it.</em>
          </h1>

          <p
            className="mt-10 mx-auto max-w-[480px] italic"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 350,
              fontSize: "20px",
              lineHeight: 1.4,
              color: "var(--ink-soft)",
            }}
          >
            The sender app is being built right now. Drag-and-drop file upload,
            real short codes, live recipient page — all on real Railway
            infrastructure under 47 Industries.
          </p>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
            <span className="stage-chip live">Stage 1 · Live shell</span>
            <span className="stage-chip next">Stage 2 · Upload flow</span>
            <span className="stage-chip next">Stage 3 · Dynamic recipient</span>
          </div>
        </div>
      </section>

      <footer className="px-8 md:px-12 py-6 border-t border-[var(--rule)] flex justify-between items-center mono-eyebrow">
        <span>47 Industries × iUSEJOE</span>
        <a
          href="https://github.com/phantom47m/tapdrop-demo"
          style={{
            color: "var(--ink-mute)",
            textDecoration: "none",
            borderBottom: "1px solid var(--rule)",
            paddingBottom: "1px",
          }}
        >
          View static demo →
        </a>
      </footer>
    </main>
  );
}
