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

  // Generate the QR client-side so the URL never appears in HTML on the wire
  // (purely cosmetic — the URL is also visible below).
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

  useEffect(() => {
    const i = setInterval(() => setRemaining(formatRemaining(expiresAt)), 1000);
    return () => clearInterval(i);
  }, [expiresAt]);

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
        <span className="mono-eyebrow text-[10px] md:text-[11px]">Sent</span>
      </header>

      <section className="flex-1 grid place-items-center px-5 py-10 md:py-14">
        <div className="w-full max-w-[460px]">
          <div className="text-center mb-6">
            <div className="mono-eyebrow mb-3">— Ready for tap —</div>
            <h1 className="display" style={{ fontSize: "clamp(34px, 5vw, 50px)" }}>
              <em>Show this</em><br />to anyone.
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

          {/* QR */}
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
              — Aim camera, no app needed —
            </div>
          </div>

          {/* Or-type code */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0 8px" }}>
            <span style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, var(--rule), transparent)" }} />
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
            <span style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, var(--rule), transparent)" }} />
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
            }}
          >
            at <b style={{ color: "var(--ink)", fontWeight: 500 }}>tapdrop.app</b>
          </div>

          {/* Status / actions */}
          <div
            style={{
              background: "var(--card)",
              borderRadius: 14,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  Waiting for tap…
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
                  Expires {remaining}
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
