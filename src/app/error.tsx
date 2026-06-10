"use client";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the console / monitoring; never show raw errors to users.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card p-8 text-center max-w-md">
        <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
        <p className="text-muted mt-2 text-sm">
          An unexpected error occurred. You can try again — if it keeps
          happening, refresh the page.
        </p>
        <button onClick={reset} className="btn-primary mt-6">
          Try again
        </button>
      </div>
    </div>
  );
}
