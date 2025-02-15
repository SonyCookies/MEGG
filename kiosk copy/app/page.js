import Image from "next/image";
import Link from "next/link";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <Image
            src="/Logos/logoblue.png"
            alt="megg logo"
            width={200}
            height={200}
            className="mx-auto"
          />
        </div>
        <h1 className="text-5xl font-bold mb-4 text-primary">Welcome to megg</h1>
        <p className="text-xl mb-8 text-foreground">Your intelligent egg sorting assistant</p>
        <div className="flex flex-row space-x-10 justify-center align-baseline">
        .          <Link
            href="/register"
            className="bg-accent text-accent-foreground font-bold py-3 px-8 rounded-full text-lg hover:bg-accent/80 transition-colors"
          >
            Register
          </Link>

          <Link
            href="/home"
            className="bg-accent text-accent-foreground font-bold py-3 px-8 rounded-full text-lg hover:bg-accent/80 transition-colors"
          >
            Start Sorting
          </Link>
        </div>

      </div>
      <footer className="mt-16 text-sm text-foreground/60">© 2025 megg. All rights reserved.</footer>
    </div>
  );
}
