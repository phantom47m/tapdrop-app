"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

const MAX_BYTES = 100 * 1024 * 1024;

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

export default function SendForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [pin, setPin] = useState("");
  const [expiryHours, setExpiryHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }

  function handlePick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  }

  function acceptFile(f: File) {
    setError(null);
    if (f.size === 0) {
      setError("That file is empty.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`Too large. Max is ${MAX_BYTES / (1024 * 1024)} MB for v0.1.`);
      return;
    }
    setFile(f);
  }

  async function handleSend() {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setProgress(0);

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (senderName.trim()) fd.append("senderName", senderName.trim());
      if (pin.trim()) fd.append("pin", pin.trim());
      fd.append("expiryHours", String(expiryHours));

      const code: string = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/drops");
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };
        xhr.onload = () => {
          try {
            const body = JSON.parse(xhr.responseText || "{}");
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(body.code);
            } else {
              reject(new Error(body.error || `Upload failed (${xhr.status})`));
            }
          } catch {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(fd);
      });

      router.push(`/sent/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setBusy(false);
      setProgress(0);
    }
  }

  function reset() {
    if (busy) return;
    setFile(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div>
      {/* Drop zone */}
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            background: dragOver ? "var(--card)" : "transparent",
            border: `1.5px dashed ${dragOver ? "var(--accent)" : "var(--rule)"}`,
            borderRadius: 18,
            padding: "44px 24px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.18s ease",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: dragOver ? "var(--accent)" : "var(--ink)",
              color: "var(--paper)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
              transition: "background 0.18s ease",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path
                d="M11 2v15M11 2l-5 5M11 2l5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 350,
              fontSize: 22,
              letterSpacing: "-0.015em",
              color: "var(--ink)",
              marginBottom: 6,
            }}
          >
            Drop a file here
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--ink-mute)",
            }}
          >
            or tap to choose
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handlePick}
            style={{ display: "none" }}
          />
        </div>
      ) : (
        // Selected-file card
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--rule)",
            borderRadius: 18,
            padding: 18,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 52,
              height: 60,
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
                bottom: 6,
                left: 0,
                right: 0,
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--accent)",
              }}
            >
              {fileExt(file.name)}
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
              {file.name}
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
              {fileExt(file.name)} · {formatBytes(file.size)}
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            aria-label="Remove"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "transparent",
              border: "1px solid var(--rule)",
              cursor: busy ? "not-allowed" : "pointer",
              color: "var(--ink-soft)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 14 14">
              <path
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                d="M2 2l10 10M12 2L2 12"
                fill="none"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Advanced fields */}
      {file && (
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            style={{
              background: "transparent",
              border: "none",
              padding: "8px 0",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--ink-mute)",
            }}
          >
            {advanced ? "− Hide options" : "+ Add a name, PIN, or expiry"}
          </button>

          {advanced && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 12,
                padding: "14px 0 4px",
              }}
            >
              <Field label="Your name (optional)">
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Joe Calderón"
                  maxLength={80}
                  style={inputStyle}
                />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="PIN (optional)">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="—"
                    maxLength={8}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Expires in">
                  <select
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(Number(e.target.value))}
                    style={inputStyle}
                  >
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={72}>3 days</option>
                    <option value={168}>7 days</option>
                  </select>
                </Field>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      {file && (
        <button
          type="button"
          onClick={handleSend}
          disabled={busy}
          style={{
            width: "100%",
            marginTop: 18,
            padding: 18,
            borderRadius: 999,
            border: "none",
            background: "var(--ink)",
            color: "var(--paper)",
            fontFamily: "var(--font-sans)",
            fontWeight: 500,
            fontSize: 16,
            letterSpacing: "0.005em",
            cursor: busy ? "wait" : "pointer",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {busy ? (
            <span style={{ position: "relative", zIndex: 1 }}>
              Uploading… {progress}%
            </span>
          ) : (
            <span style={{ position: "relative", zIndex: 1, display: "inline-flex", gap: 10, alignItems: "center" }}>
              Send <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>→</span>
            </span>
          )}
          {busy && (
            <span
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--accent)",
                width: `${progress}%`,
                transition: "width 0.18s ease",
                opacity: 0.9,
                zIndex: 0,
              }}
            />
          )}
        </button>
      )}

      {error && (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            background: "#FBE9E2",
            border: "1px solid #E0A491",
            borderRadius: 12,
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            color: "#7A2510",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
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
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--rule)",
  borderRadius: 10,
  padding: "11px 13px",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  color: "var(--ink)",
  outline: "none",
  width: "100%",
};
