export default function QueueLoading() {
    return (
        <div role="status" aria-label="Warteschlange wird geladen" className="animate-pulse">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="mt-2 h-4 w-96 max-w-full rounded bg-muted" />
            <div className="mt-8 h-48 rounded-xl border border-border bg-muted/40" />
            <div className="mt-8 h-32 rounded-xl border border-border bg-muted/40" />
        </div>
    );
}
