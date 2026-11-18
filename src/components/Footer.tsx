import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/80 py-4 px-4 text-xs text-slate-600">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono font-semibold text-slate-800">
            ID: 24B3972
          </span>
          <span>IntegerEase · Card P4–T1–L5–C4 · ET617 Endsem</span>
        </div>
        <Link
          href="/about"
          className="font-medium text-sky-700 underline underline-offset-2 hover:text-sky-900"
        >
          About &amp; Card Details
        </Link>
      </div>
    </footer>
  );
}
