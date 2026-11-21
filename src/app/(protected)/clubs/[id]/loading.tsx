export default function ClubDetailLoading() {
    return (
        <div role="status" aria-label="Verein wird geladen" className="max-w-3xl animate-pulse">
            <div className="h-8 w-64 rounded bg-muted" />
            <div className="mt-6 h-32 rounded-xl border border-border bg-muted/40" />
            <div className="mt-4 h-48 rounded-xl border border-border bg-muted/40" />
        </div>
    );
}
