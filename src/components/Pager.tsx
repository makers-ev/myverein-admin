import Link from 'next/link';

/** Prev/next links for URL-query-driven paging; `hrefFor(page)` builds the target URL. */
export function Pager({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (page: number) => string }) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (pages <= 1) return null;
    const linkClass = 'rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors';
    return (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
                Seite {page} von {pages} ({total} Einträge)
            </span>
            <div className="flex gap-2">
                {page > 1 && (
                    <Link href={hrefFor(page - 1)} className={linkClass}>
                        Zurück
                    </Link>
                )}
                {page < pages && (
                    <Link href={hrefFor(page + 1)} className={linkClass}>
                        Weiter
                    </Link>
                )}
            </div>
        </div>
    );
}
