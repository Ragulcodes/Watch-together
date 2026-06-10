"use client";

// Catches errors in the root layout itself. It replaces <html>/<body>, so it
// can't rely on globals.css being present — keep styling inline.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0a0a0f",
          color: "#e6e6ee",
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#8b8b9a", marginTop: 8 }}>
            The app hit an unexpected error.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 24,
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: "#7c5cff",
              color: "white",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
