import { cn } from "@/lib/utils";
import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  cta,
  className,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  cta?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {breadcrumbs?.length ? (
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-1">
            {breadcrumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-400">/</span>}
                {c.href ? (
                  <Link href={c.href} className="hover:text-accent">
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-700">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-muted">{subtitle}</p>
          ) : null}
        </div>
        {cta ? (
          <Link
            href={cta.href}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark"
          >
            {cta.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
