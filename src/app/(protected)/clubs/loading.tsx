export default function ClubsLoading() {
    return (
        <div role="status" aria-label="Vereine werden geladen" className="animate-pulse">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="mt-8 h-64 rounded-xl border border-border bg-muted/40" />
        </div>
    );
}
