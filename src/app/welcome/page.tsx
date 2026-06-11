import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Film, Play, Popcorn } from "lucide-react";

export const metadata: Metadata = {
  title: "Welcome 🤍❤️",
  description: "A little movie night, just for you.",
};

export default async function WelcomePage() {
  const session = await getServerSession(authOptions);
  // The welcome greets whoever is signed in — so it needs a session.
  if (!session?.user) redirect("/signin?callbackUrl=/welcome");
  const name = session.user.name?.trim() || "friend";

  return (
    <main className="min-h-screen grid place-items-center px-4 py-16">
      <div className="card w-full max-w-xl p-8 sm:p-10 text-center welcome-rise">
        <div className="soft-glow mx-auto w-16 h-16 rounded-2xl grid place-items-center bg-accent/15 text-accent">
          <Film size={30} />
        </div>

        <p className="welcome-rise-2 mt-7 text-xs uppercase tracking-[0.25em] text-muted">
          A little movie night, just for you
        </p>

        <h1 className="welcome-rise-2 mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
          Welcome,
          <br className="sm:hidden" />{" "}
          <span className="text-accent">{name}</span>{" "}
          <span className="inline-block animate-pulse align-middle">🤍❤️</span>
        </h1>

        <p className="welcome-rise-3 mt-6 text-lg leading-relaxed text-muted">
          Pull up the comfiest seat and grab your favourite snack — tonight, the
          screen is ours. No matter the distance, <span className="text-white">Ragul</span> saved you
          the best seat in the house. So let&rsquo;s dim the lights, press play,
          and watch something together.
        </p>

        <p className="welcome-rise-3 mt-4 inline-flex items-center gap-2 text-sm text-muted">
          <Popcorn size={16} className="text-accent2" /> Snacks ready? Let&rsquo;s begin.
        </p>

        <div className="welcome-rise-3 mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/rooms" className="btn-primary text-base" style={{ padding: "0.7rem 1.6rem" }}>
            <Play size={18} /> Let&rsquo;s watch together
          </Link>
        </div>

        <p className="welcome-rise-3 mt-9 inline-flex items-center gap-1.5 text-sm text-muted">
          made with 🤍❤️ by Ragul, for you
        </p>
      </div>
    </main>
  );
}
