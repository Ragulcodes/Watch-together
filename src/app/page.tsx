import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Video, MonitorUp, MessageSquare, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <section className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-1 text-xs text-muted">
            <Sparkles size={14} className="text-accent2" />
            Movie nights, study sessions, hangouts — together, in sync.
          </div>
          <h1 className="mt-6 text-5xl md:text-6xl font-semibold tracking-tight text-white">
            Watch anything. <span className="text-accent">Together.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted">
            Create a room, invite friends, share your screen with audio, and
            keep video + chat going while the movie plays in perfect sync.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/rooms" className="btn-primary">Browse rooms</Link>
            <Link href="/signup" className="btn-secondary">Get started</Link>
          </div>
        </section>

        <section className="mt-24 grid gap-6 md:grid-cols-3">
          <Feature icon={<Video />} title="See each other"
            body="Webcams on, real conversation. Low-latency video powered by LiveKit." />
          <Feature icon={<MonitorUp />} title="Share screen + audio"
            body="Stream a movie, a tab, or your whole desktop with crisp audio passthrough." />
          <Feature icon={<MessageSquare />} title="Chat in sync"
            body="Synchronised playback, persistent chat, and host controls for the room." />
        </section>
      </main>
      <footer className="border-t border-border mt-24 py-8 text-center text-xs text-muted">
        Built with Next.js, LiveKit, Prisma.
      </footer>
    </div>
  );
}

function Feature({
  icon, title, body,
}: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-6">
      <div className="w-10 h-10 rounded-lg grid place-items-center bg-accent/15 text-accent">
        {icon}
      </div>
      <h3 className="mt-4 text-white font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
