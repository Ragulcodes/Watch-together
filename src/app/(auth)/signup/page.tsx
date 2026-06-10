"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "Sign up failed");
      setLoading(false);
      return;
    }
    await signIn("credentials", {
      identifier: form.email,
      password: form.password,
      redirect: false,
    });
    router.push("/rooms");
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="card p-8">
          <h1 className="text-2xl font-semibold text-white">Create account</h1>
          <p className="text-sm text-muted mt-1">It takes 10 seconds.</p>
          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            <input className="input" placeholder="Display name"
              value={form.displayName} onChange={set("displayName")} required />
            <input className="input" placeholder="Username"
              value={form.username} onChange={set("username")} required />
            <input className="input" type="email" placeholder="Email"
              value={form.email} onChange={set("email")} required />
            <input className="input" type="password" placeholder="Password (min 8 chars)"
              value={form.password} onChange={set("password")} required minLength={8} />
            {err && <div className="text-sm text-danger">{err}</div>}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-sm text-muted">
            Already have one?{" "}
            <Link href="/signin" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
