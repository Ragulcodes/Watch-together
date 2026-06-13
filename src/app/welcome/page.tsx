import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Film, Play, Popcorn, Clock, History } from "lucide-react";

export const metadata: Metadata = {
  title: "Welcome 🤍❤️",
  description: "A little movie night, just for you.",
};

function formatWatched(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return "just getting started";
}

export default async function WelcomePage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name?.trim();

  // "Time watched together" + recent movies (best-effort; never block the page).
  const [agg, recent] = await Promise.all([
    prisma.watchHistory.aggregate({ _sum: { seconds: true } }).catch(() => null),
    prisma.watchHistory
      .findMany({ orderBy: { startedAt: "desc" }, take: 6 })
      .catch(() => []),
  ]);
  const totalSec = agg?._sum.seconds ?? 0;
  const hasHistory = totalSec > 0 || recent.length > 0;

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
          {name ? (
            <>
              Welcome,
              <br className="sm:hidden" />{" "}
              <span className="text-accent">{name}</span>{" "}
            </>
          ) : (
            <>Welcome </>
          )}
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
          {name ? (
            <Link href="/rooms" className="btn-primary text-base" style={{ padding: "0.7rem 1.6rem" }}>
              <Play size={18} /> Let&rsquo;s watch together
            </Link>
          ) : (
            <>
              <Link href="/signup" className="btn-primary text-base" style={{ padding: "0.7rem 1.6rem" }}>
                <Play size={18} /> Create your seat
              </Link>
              <Link href="/signin?callbackUrl=/welcome" className="btn-secondary text-base" style={{ padding: "0.7rem 1.6rem" }}>
                I already have one
              </Link>
            </>
          )}
        </div>

        {hasHistory && (
          <div className="welcome-rise-3 mt-8 pt-6 border-t border-border text-left">
            <div className="flex items-center justify-center gap-2 text-sm text-white">
              <Clock size={16} className="text-accent2" />
              <span className="text-muted">Watched together:</span>
              <span className="font-medium">{formatWatched(totalSec)}</span>
            </div>
            {recent.length > 0 && (
              <div className="mt-4">
                <p className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wide text-muted">
                  <History size={13} /> Movies we&rsquo;ve seen
                </p>
                <ul className="mt-2 flex flex-wrap justify-center gap-2">
                  {recent.map((m) => (
                    <li
                      key={m.id}
                      className="rounded-full bg-white/8 border border-border px-3 py-1 text-xs text-white"
                    >
                      {m.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <p className="welcome-rise-3 mt-9 inline-flex items-center gap-1.5 text-sm text-muted">
          made with 🤍❤️ by Ragul, for you
        </p>
      </div>
    </main>
  );
}
