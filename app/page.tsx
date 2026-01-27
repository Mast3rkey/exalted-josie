"use client";

export default function Home() {
  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 600,
          width: "100%",
          padding: 32,
          border: "1px solid #222",
          borderRadius: 12,
          backgroundColor: "#000",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>Josie</h1>
          <span
            style={{
              border: "1px solid #333",
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              color: "#aaa",
            }}
          >
            Record 001
          </span>
        </div>

        <p style={{ color: "#aaa", marginBottom: 24 }}>
          A record by Exalted
        </p>

        <p style={{ color: "#ccc", lineHeight: 1.6, marginBottom: 16 }}>
          This release is presented as a limited physical object, with private
          digital access provided directly to listeners who support the work.
        </p>

        <p style={{ color: "#ccc", lineHeight: 1.6, marginBottom: 32 }}>
          All net proceeds from this release are distributed equally among the
          artists involved.
        </p>

        <button
          onClick={handleCheckout}
          style={{
            width: "100%",
            padding: "14px 16px",
            backgroundColor: "#111",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Purchase & Access
        </button>

        <p
          style={{
            marginTop: 24,
            fontSize: 12,
            color: "#666",
            textAlign: "center",
          }}
        >
          Exalted releases are limited by design. Digital access is a secondary,
          direct extension of physical ownership.
        </p>
      </div>
    </main>
  );
}
