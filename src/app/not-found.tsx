import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-6xl opacity-40">🔍</div>
      <h1 className="text-2xl font-extrabold tracking-tight mb-2">Page not found</h1>
      <p className="text-sm text-[var(--text-soft)] mb-6 max-w-sm">
        This app or page doesn&apos;t exist on AdilStore. It may have been removed or the URL might be wrong.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[#0b1120] shadow-accent hover:shadow-accent-lg hover:-translate-y-px transition-all"
      >
        ← Back to AdilStore
      </Link>
    </div>
  );
}
