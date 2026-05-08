"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import Link from "next/link";

type Props = {
  code: string;
  filename: string;
  size: number;
  senderName: string | null;
  expiresAt: string;
  recipientUrl: string;
};

type Status = "waiting" | "delivered" | "expired" | "exhausted";

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

export default function SentScreen({
  code,
  filename,
  size,
  senderName,
  expiresAt,
  recipientUrl,
}: Props) {
  const qrRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(() => formatRemaining(expiresAt));
  const [status, setStatus] = useState<Status>("waiting");

  // QR generation — client-side, deep ink on slightly-warm white.
  useEffect(() => {
    if (!qrRef.current) return;
    QRCode.toString(recipientUrl, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 0,
      color: { dark: "#11110F", light: "#FBFAF7" },
    }).then((svg) => {
      if (qrRef.current) qrRef.current.innerHTML = svg;
    });
  }, [recipientUrl]);

  // Countdown
  useEffect(() => {
    const i = setInterval(() => setRemaining(formatRemaining(expiresAt)), 1000);
    return () => clearInterval(i);
  }, [expiresAt]);

  // Live status polling — the "watch this" moment for a Joe walkthrough.
  // Poll every 2.5s while waiting; once delivered, slow down to 30s and
  // eventually stop. AbortController for hot-reload safety.
  useEffect(() => {
    const ctrl = new AbortController();
    let stopped = false;

    async function tick() {
      if (stopped) return;
      try {
        const res = await fetch(`/api/drops/${code}/status`, {
          signal: ctrl.signal,
          cache: "no-store",
        });
        if (res.ok) {
          const body = await res.json();
          if (body.expired) setStatus("expired");
          else if (body.delivered) setStatus("delivered");
          else if (body.exhausted) setStatus("exhausted");
          else setStatus("waiting");
        }
      } catch {
        // ignore — try again next tick
      }
    }

    tick();
    const interval = setInterval(tick, 2500);
    return () => {
      stopped = true;
      ctrl.abort();
      clearInterval(interval);
    };
  }, [code]);

  function copyUrl() {
    navigator.clipboard.writeText(recipientUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function nativeShare() {
    const data = {
      title: "A file via TapDrop",
      text: senderName
        ? `${senderName} sent you a file via TapDrop.`
        : "I sent you a file via TapDrop.",
      url: recipientUrl,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share(data).catch(() => copyUrl());
    } else {
      copyUrl();
    }
  }

  // Status-pill data
  const pill =
    status === "delivered"
      ? { label: "Delivered ✓", color: "#1d6e3a", pulsing: false }
      : status === "expired"
        ? { label: "Expired", color: "var(--ink-mute)", pulsing: false }
        : status === "exhausted"
          ? { label: "Picked up ✓", color: "#1d6e3a", pulsing: false }
          : { label: "Waiting for tap…", color: "var(--accent)", pulsing: true };

  return (
    <main className="relative z-10 flex-1 flex flex-col">
      <header className="flex justify-between items-center px-6 md:px-12 pt-7 pb-5 border-b border-[var(--rule)]">
        <Link
          href="/"
          className="wordmark text-[24px] md:text-[26px]"
          style={{ textDecoration: "none", color: "var(--ink)" }}
        >
          Tap<span className="dot" />Drop
        </Link>
        <span className="mono-eyebrow text-[10px] md:text-[11px]">
          {status === "delivered" ? "Delivered" : "Sent"}
        </span>
      </header>

      <section className="flex-1 grid place-items-center px-5 py-10 md:py-14">
        <div className="w-full max-w-[460px]">
          <div className="text-center mb-6">
            <div className="mono-eyebrow mb-3">
              {status === "delivered"
                ? "— Tap received —"
                : "— Ready for tap —"}
            </div>
            <h1 className="display" style={{ fontSize: "clamp(34px, 5vw, 50px)" }}>
              {status === "delivered" ? (
                <>
                  <em>They got it.</em>
                </>
              ) : (
                <>
                  <em>Show this</em>
                  <br />
                  to anyone.
                </>
              )}
            </h1>
          </div>

          {/* File card */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--rule)",
              borderRadius: 18,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 52,
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
                  fontSize: 9,
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
                  fontSize: 13,
                  color: "var(--ink)",
                  marginBottom: 3,
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
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--ink-mute)",
                }}
              >
                {fileExt(filename)} · {formatBytes(size)}
              </div>
            </div>
          </div>

          {/* QR — fades on delivered */}
          <div
            style={{
              background: "#fff",
              borderRadius: 22,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              border: "1px solid rgba(0,0,0,0.04)",
              opacity: status === "delivered" ? 0.45 : 1,
              transition: "opacity 0.4s ease",
            }}
          >
            <div ref={qrRef} style={{ width: 220, height: 220 }} />
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--ink-mute)",
              }}
            >
              {status === "delivered"
                ? "— Already grabbed —"
                : "— Aim camera, no app needed —"}
            </div>
          </div>

          {/* Or-type code */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 0 8px",
              opacity: status === "delivered" ? 0.45 : 1,
              transition: "opacity 0.4s ease",
            }}
          >
            <span
              style={{
                flex: 1,
                height: 1,
                background:
                  "linear-gradient(to right, transparent, var(--rule), transparent)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                letterSpacing: "0.22em",
                color: "var(--ink-light)",
                textTransform: "uppercase",
              }}
            >
              or type
            </span>
            <span
              style={{
                flex: 1,
                height: 1,
                background:
                  "linear-gradient(to right, transparent, var(--rule), transparent)",
              }}
            />
          </div>

          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 350,
              fontSize: 36,
              letterSpacing: "0.06em",
              textAlign: "center",
              color: "var(--ink)",
              marginBottom: 4,
              opacity: status === "delivered" ? 0.45 : 1,
              transition: "opacity 0.4s ease",
            }}
          >
            {code.split("").map((ch, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  minWidth: 24,
                  padding: "2px 4px 4px",
                  borderBottom: "1.5px solid var(--ink)",
                  margin: "0 2px",
                }}
              >
                {ch}
              </span>
            ))}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textAlign: "center",
              color: "var(--ink-mute)",
              marginBottom: 18,
              opacity: status === "delivered" ? 0.45 : 1,
              transition: "opacity 0.4s ease",
            }}
          >
            at <b style={{ color: "var(--ink)", fontWeight: 500 }}>tapdrop.app</b>
          </div>

          {/* Status / actions */}
          <div
            style={{
              background: status === "delivered" ? "#E8F2EC" : "var(--card)",
              border: status === "delivered" ? "1px solid #B5D6C2" : "1px solid var(--rule)",
              borderRadius: 14,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              transition: "background 0.4s ease, border-color 0.4s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: pill.color,
                  }}
                />
                {pill.pulsing && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: pill.color,
                      animation: "td-ping 1.6s cubic-bezier(0,0,0.2,1) infinite",
                      opacity: 0.55,
                    }}
                  />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  {pill.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--ink-mute)",
                    marginTop: 2,
                  }}
                >
                  {status === "delivered" ? "Just now" : `Expires ${remaining}`}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={copyUrl} style={btnGhost}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
              <button onClick={nativeShare} style={btnSolid}>
                Share ↗
              </button>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 22 }}>
            <Link
              href="/"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--ink-mute)",
                textDecoration: "none",
                borderBottom: "1px solid var(--rule)",
                paddingBottom: 1,
              }}
            >
              Send another →
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-5 border-t border-[var(--rule)] flex justify-between items-center mono-eyebrow text-[10px] md:text-[11px]">
        <span>47 Industries × iUSEJOE</span>
        <span>Drop · {code}</span>
      </footer>

      <style>{`
        @keyframes td-ping {
          0%   { transform: scale(1);   opacity: 0.55; }
          100% { transform: scale(2.4); opacity: 0;    }
        }
      `}</style>
    </main>
  );
}

const btnGhost: React.CSSProperties = {
  border: "1px solid var(--rule)",
  background: "transparent",
  color: "var(--ink-soft)",
  fontFamily: "var(--font-mono)",
  fontSize: 9.5,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  padding: "8px 11px",
  borderRadius: 999,
  cursor: "pointer",
};

const btnSolid: React.CSSProperties = {
  border: "1px solid var(--ink)",
  background: "var(--ink)",
  color: "var(--paper)",
  fontFamily: "var(--font-mono)",
  fontSize: 9.5,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  padding: "8px 11px",
  borderRadius: 999,
  cursor: "pointer",
};
