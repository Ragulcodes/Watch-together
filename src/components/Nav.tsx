"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Film } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Nav() {
  const { data: session, status } = useSession();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/55 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <span className="grid place-items-center w-8 h-8 rounded-md bg-accent/20 text-accent">
            <Film size={18} />
          </span>
          Watch Together
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/rooms" className="btn-ghost">Rooms</Link>
          <ThemeSwitcher />
          {status === "authenticated" ? (
            <>
              <span className="text-muted hidden sm:inline">
                {session.user?.name}
              </span>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className="btn-ghost">Sign in</Link>
              <Link href="/signup" className="btn-primary">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
