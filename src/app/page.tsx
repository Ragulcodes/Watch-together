import { redirect } from "next/navigation";

// The welcome page is the entry point — funnel everyone there.
export default function Home() {
  redirect("/welcome");
}
