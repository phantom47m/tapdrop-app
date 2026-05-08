"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Status = "ok" | "missing" | "expired" | "exhausted";

type Props = {
  status: Status;
  code: string;
  filename: string | null;
  size: number | null;
  senderName: string | null;
  expiresAt: string | null;
  maxDownloads: number | null;
  downloadCount: number | null;
  hasPin: boolean;
};

function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MB";
  if (n >= 1024) return (n / 1024).toFixed(1) + " KB";
  return n + " B";
}

function fileExt(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "FILE";
  return name.slice(dot + 1).slice(0, 4).toUpperCase();
}

function formatRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 1) return `${h}h ${String(m).padStart(2, "0")}m`;
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function senderInitial(name: string | null): string {
  if (!name) return "·";
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "·";
}

export default function RecipientScreen(props: Props) {
  const {
    status,
    code,
    filename,
    size,
    senderName,
    expiresAt,
    maxDownloads,
    hasPin,
  } = props;

  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [remaining, setRemaining] = useState(() =>
    expiresAt ? formatRemaining(expiresAt) : "—",
  );

  useEffect(() => {
    if (!expiresAt) return;
    const i = setInterval(() => setRemaining(formatRemaining(expiresAt)), 1000);
    return () => clearInterval(i);
  }, [expiresAt]);

  async function handleDownload() {
    if (downloading || downloaded) return;
    setPinError(null);
    setDownloading(true);

    try {
      const url = `/api/drops/${code}/download${hasPin ? `?pin=${encodeURIComponent(pinInput)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          setPinError("Wrong PIN. Try again.");
          setDownloading(false);
          return;
        }
        if (res.status === 410) {
          setPinError("This drop has expired or been used up.");
          setDownloading(false);
          return;
        }
        setPinError("Download failed. Try again.");
        setDownloading(false);
        return;
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      setDownloading(false);
      setDownloaded(true);
    } catch {
      setPinError("Network error. Try again.");
      setDownloading(false);
    }
  }

  // ── Failure-mode screens ──────────────────────────────────────────────
  if (status !== "ok") {
    const headlines: Record<Exclude<Status, "ok">, string> = {
      missing: "No drop here.",
      expired: "Drop expired.",
      exhausted: "Already grabbed.",
    };
    const subs: Record<Exclude<Status, "ok">, string> = {
      missing: "This code isn't in our system. Double-check the letters and try again.",
      expired: "The sender set a window for this drop and it's now closed.",
      exhausted: "Someone (probably you) already downloaded this. Each drop is single-use by default.",
    };

    return (
      <main className="relative z-10 flex-1 flex flex-col">
        <header className="flex justify-between items-center px-6 md:px-12 pt-7 pb-5 border-b border-[var(--rule)]">
          <Link href="/" className="wordmark text-[24px] md:text-[26px]" style={{ textDecoration: "none", color: "var(--ink)" }}>
            Tap<span className="dot" />Drop
          </Link>
          <span className="mono-eyebrow text-[10px] md:text-[11px]">/g/{code}</span>
        </header>
        <section className="flex-1 grid place-items-center px-5 py-10 md:py-16">
          <div className="w-full max-w-[460px] text-center">
            <div className="mono-eyebrow mb-4">— {status} —</div>
            <h1 className="display" style={{ fontSize: "clamp(34px, 5vw, 50px)" }}>
              {headlines[status]}
            </h1>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 350,
                fontSize: 17,
                lineHeight: 1.45,
                color: "var(--ink-soft)",
                margin: "20px auto 28px",
                maxWidth: 360,
              }}
            >
              {subs[status]}
            </p>
            <Link href="/" style={btnGhostLink}>
              Send your own →
            </Link>
          </div>
        </section>
        <footer className="px-6 md:px-12 py-5 border-t border-[var(--rule)] flex justify-between items-center mono-eyebrow text-[10px] md:text-[11px]">
          <span>47 Industries × iUSEJOE</span>
          <span>—</span>
        </footer>
      </main>
    );
  }

  // ── Happy path ────────────────────────────────────────────────────────
  return (
    <main className="relative z-10 flex-1 flex flex-col">
      <header className="flex justify-between items-center px-6 md:px-12 pt-7 pb-5 border-b border-[var(--rule)]">
        <Link href="/" className="wordmark text-[24px] md:text-[26px]" style={{ textDecoration: "none", color: "var(--ink)" }}>
          Tap<span className="dot" />Drop
        </Link>
        <span className="mono-eyebrow text-[10px] md:text-[11px]">/g/{code}</span>
      </header>

      <section className="flex-1 grid place-items-center px-5 py-10 md:py-14">
        <div className="w-full max-w-[460px]">
          <div className="mono-eyebrow mb-4 flex items-center gap-3">
            <span style={{ width: 18, height: 1, background: "var(--ink-mute)" }} />
            A file is waiting for you
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--ink)",
                color: "var(--paper)",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 18,
              }}
            >
              {senderInitial(senderName)}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9.5,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--ink-mute)",
                }}
              >
                Sent by
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500 }}>
                {senderName ?? "Anonymous"}
              </div>
            </div>
          </div>

          <h1 className="display" style={{ fontSize: "clamp(32px, 4.5vw, 44px)", marginBottom: 18 }}>
            One <em>file</em>,<br />one tap away.
          </h1>

          {filename && size != null && (
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--rule)",
                borderRadius: 18,
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 58,
                  background: "#fff",
                  border: "1px solid var(--rule)",
                  borderRadius: 5,
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: 5,
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    fontSize: 9.5,
                    letterSpacing: "0.08em",
                    color: "var(--accent)",
                  }}
                >
                  {fileExt(filename)}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 500,
                    fontSize: 14,
                    color: "var(--ink)",
                    marginBottom: 4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {filename}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--ink-mute)",
                  }}
                >
                  {fileExt(filename)} · {formatBytes(size)}
                </div>
              </div>
            </div>
          )}

          {/* PIN entry if needed */}
          {hasPin && !downloaded && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--ink-mute)",
                  }}
                >
                  Enter PIN to unlock
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="••••"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--rule)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontFamily: "var(--font-mono)",
                    fontSize: 18,
                    letterSpacing: "0.4em",
                    textAlign: "center",
                    color: "var(--ink)",
                    outline: "none",
                  }}
                />
              </label>
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={downloading || downloaded || (hasPin && pinInput.length < 3)}
            style={{
              width: "100%",
              padding: 18,
              borderRadius: 999,
              border: "none",
              background: downloaded ? "#1d6e3a" : "var(--ink)",
              color: "var(--paper)",
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              fontSize: 16,
              letterSpacing: "0.005em",
              cursor: downloading || downloaded ? "default" : "pointer",
              opacity: hasPin && pinInput.length < 3 && !downloaded ? 0.5 : 1,
              transition: "background 0.25s ease, opacity 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {downloaded ? (
              <>Downloaded ✓</>
            ) : downloading ? (
              <>Downloading…</>
            ) : (
              <>
                Download{" "}
                <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>→</span>
              </>
            )}
          </button>

          {pinError && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 14px",
                background: "#FBE9E2",
                border: "1px solid #E0A491",
                borderRadius: 12,
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "#7A2510",
                textAlign: "center",
              }}
            >
              {pinError}
            </div>
          )}

          <div style={{ marginTop: 22, display: "flex", flexDirection: "column" }}>
            {expiresAt && (
              <Row label="Available for" value={remaining} />
            )}
            {maxDownloads != null && (
              <Row label="Downloads left" value={`${Math.max(0, maxDownloads - (downloaded ? 1 : 0))} / ${maxDownloads}`} />
            )}
            <Row label="Encrypted in transit" value="Yes" last />
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-5 border-t border-[var(--rule)] flex justify-between items-center mono-eyebrow text-[10px] md:text-[11px]">
        <span>Sent via <Link href="/" style={{ color: "var(--ink-mute)", textDecoration: "underline" }}>TapDrop</Link></span>
        <span>—</span>
      </footer>
    </main>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--ink-mute)",
        padding: "11px 0",
        borderTop: "1px solid var(--rule)",
        borderBottom: last ? "1px solid var(--rule)" : "none",
      }}
    >
      <span>{label}</span>
      <b style={{ color: "var(--ink)", fontWeight: 500 }}>{value}</b>
    </div>
  );
}

const btnGhostLink: React.CSSProperties = {
  display: "inline-block",
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--ink)",
  textDecoration: "none",
  border: "1.5px solid var(--ink)",
  padding: "13px 22px",
  borderRadius: 999,
};
