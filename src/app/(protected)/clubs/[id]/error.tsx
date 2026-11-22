'use client';

export default function ClubDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="max-w-3xl">
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Der Verein konnte nicht angezeigt werden.
            </p>
            <button onClick={reset} className="mt-4 min-h-11 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Erneut versuchen
            </button>
        </div>
    );
}
