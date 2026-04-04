import { cn } from "@/lib/utils";
import { HardDrive, Headphones, Laptop, Wifi } from "lucide-react";
import Link from "next/link";

const iconMap: Record<string, typeof Laptop> = {
  laptop: Laptop,
  mouse: Headphones,
  wifi: Wifi,
  "hard-drive": HardDrive,
};

export function HomeCategories({
  categories,
}: {
  categories: { name: string; slug: string; icon: string | null; productCount: number }[];
}) {
  return (
    <section className="border-b border-slate-100 bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Shop by category</h2>
        <p className="mt-1 text-muted">Curated catalog for business buyers</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => {
            const Icon = (c.icon && iconMap[c.icon]) || Laptop;
            return (
              <Link
                key={c.slug}
                href={`/products?category=${c.slug}`}
                className={cn(
                  "group flex flex-col rounded-xl border border-slate-200 bg-surface p-6 transition",
                  "hover:-translate-y-1 hover:border-accent hover:shadow-lg",
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-light text-accent transition group-hover:bg-accent group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{c.name}</h3>
                <p className="mt-1 text-sm text-muted">{c.productCount} products</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
