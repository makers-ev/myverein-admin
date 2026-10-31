export default function ClubStorageLoading() {
    return (
        <div role="status" aria-label="Speicher wird geladen" className="animate-pulse">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="mt-8 h-64 rounded-xl border border-border bg-muted/40" />
        </div>
    );
}
