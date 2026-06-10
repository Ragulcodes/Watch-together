import Link from "next/link";
import { Nav } from "@/components/Nav";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-6xl font-semibold text-white">404</h1>
        <p className="text-muted mt-3">That page doesn’t exist.</p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Go home
        </Link>
      </main>
    </div>
  );
}
