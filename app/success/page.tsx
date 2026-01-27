"use client";

import React, { useEffect, useMemo, useState } from "react";

export default function SuccessPage() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [used, setUsed] = useState(false);

  const downloadUrl = useMemo(() => {
    if (!token) return null;
    return `/api/download?token=${encodeURIComponent(token)}`;
  }, [token]);

  useEffect(() => {
    const session_id = new URLSearchParams(window.location.search).get("session_id");
    if (!session_id) {
      setError("Missing session_id.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/download-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id }),
        });

        const data = await res.json().catch(() => ({} as any));

        if (!res.ok) {
          setError(data?.error || "Unable to confirm purchase.");
          return;
        }

        if (!data?.token) {
          setError("No token returned.");
          return;
        }

        setToken(data.token);
      } catch {
        setError("Unable to confirm purchase.");
      }
    })();
  }, []);

  function startDownload() {
    if (!downloadUrl || used) return;
    setUsed(true);
    window.location.assign(downloadUrl);
  }

  async function copyLink() {
    if (!downloadUrl || used) return;

    try {
      const full = `${window.location.origin}${downloadUrl}`;
      await navigator.clipboard.writeText(full);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setError("Copy failed. Your browser may block clipboard access.");
    }
  }

  const fullDownloadLink =
    token && downloadUrl && typeof window !== "undefined"
      ? `${window.location.origin}${downloadUrl}`
      : null;

  return (
    <main
      style={{
        padding: "4rem",
        textAlign: "center",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginBottom: "0.5rem" }}>Thank you</h1>
      <p style={{ marginTop: 0, opacity: 0.85 }}>Your purchase was successful.</p>

      {error && <p style={{ marginTop: "2rem", color: "crimson" }}>{error}</p>}

      {!error && !token && <p style={{ marginTop: "2rem" }}>Confirming your purchase…</p>}

      {!error && token && (
        <>
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={startDownload}
              disabled={used}
              style={{
                padding: "0.75rem 1.1rem",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.08)",
                cursor: used ? "not-allowed" : "pointer",
                opacity: used ? 0.6 : 1,
              }}
            >
              {used ? "Download started" : "Download"}
            </button>

            <button
              onClick={copyLink}
              disabled={used}
              style={{
                padding: "0.75rem 1.1rem",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "transparent",
                cursor: used ? "not-allowed" : "pointer",
                opacity: used ? 0.5 : 1,
              }}
            >
              {used ? "Link used" : copied ? "Copied" : "Copy download link"}
            </button>
          </div>

          <p style={{ marginTop: "1rem", fontSize: 13, opacity: 0.7 }}>
            This link is single-use. Click <b>Download</b> once.
          </p>

          {fullDownloadLink && !used && (
            <p style={{ marginTop: "1.25rem", fontSize: 12, opacity: 0.6, wordBreak: "break-all" }}>
              {fullDownloadLink}
            </p>
          )}
        </>
      )}
    </main>
  );
}
