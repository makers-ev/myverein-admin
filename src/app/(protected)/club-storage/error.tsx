'use client';

export default function ClubStorageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div>
            <h1 className="text-2xl font-bold text-foreground">Speicher</h1>
            <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Die Seite konnte nicht angezeigt werden.
            </p>
            <button
                onClick={reset}
                className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
                Erneut versuchen
            </button>
        </div>
    );
}
