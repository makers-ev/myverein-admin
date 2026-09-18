'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

import { authClient, backendUrl } from '@/lib/auth-client';
import { SUPPORTED_LANGUAGES, type LanguageId } from '@/lib/supportedLanguages';

interface UserOption {
    id: string;
    email: string;
}

/** Debounced email search against the same `admin.listUsers` API `users/SearchBar.tsx` uses, scoped down to a handful of matches for inline picking instead of a full paginated table. */
function UserTargetPicker({ selected, onSelect }: { selected: UserOption | null; onSelect: (user: UserOption | null) => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserOption[]>([]);

    useEffect(() => {
        if (!query) return;
        const timer = setTimeout(() => {
            void authClient.admin
                .listUsers({ query: { limit: 5, searchField: 'email', searchOperator: 'contains', searchValue: query } })
                .then(({ data }) => setResults(data?.users.map((u) => ({ id: u.id, email: u.email })) ?? []));
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Derived directly at render time instead of mirrored into its own
    // effect-driven reset -- an empty query has no results to show,
    // computable from `query` on every render.
    const visibleResults = query ? results : [];

    if (selected) {
        return (
            <div className="mt-1 flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
                <span className="text-foreground">{selected.email}</span>
                <button type="button" onClick={() => onSelect(null)} className="text-muted-foreground hover:text-foreground">
                    <X size={14} />
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by email…"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {visibleResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
                    {visibleResults.map((u) => (
                        <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                                onSelect(u);
                                setQuery('');
                                setResults([]);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                        >
                            {u.email}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

type TranslationEntry = { title: string; body: string };
type Translations = Partial<Record<LanguageId, TranslationEntry>>;

const REQUIRED_LANGS: LanguageId[] = ['de', 'en'];
const OPTIONAL_LANGS = SUPPORTED_LANGUAGES.filter((l) => !REQUIRED_LANGS.includes(l.id));

export function CreateNotificationForm() {
    const router = useRouter();
    const [target, setTarget] = useState<'everyone' | 'user'>('everyone');
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
    const [translations, setTranslations] = useState<Translations>({});
    const [deletable, setDeletable] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function setField(lang: LanguageId, field: 'title' | 'body', value: string) {
        setTranslations((prev) => ({
            ...prev,
            [lang]: { title: '', body: '', ...prev[lang], [field]: value },
        }));
    }

    const canSubmit = Boolean(
        translations.de?.title && translations.de?.body && translations.en?.title && translations.en?.body,
    );

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (target === 'user' && !selectedUser) {
            setError('Pick a target user, or switch to "Everyone".');
            return;
        }

        // Drop languages left blank so the request only carries what the admin actually filled in.
        const payload = Object.fromEntries(Object.entries(translations).filter(([, v]) => v?.title && v?.body));

        setIsSubmitting(true);
        const { error: createError } = await authClient.$fetch(`${backendUrl}/admin/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                targetUserId: target === 'user' ? selectedUser?.id : undefined,
                translations: payload,
                deletable,
            }),
        });
        setIsSubmitting(false);

        if (createError) {
            console.error('[notifications] POST /admin/notifications failed', createError);
            setError(createError.message ?? 'Unable to create notification.');
            return;
        }

        router.push('/notifications');
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-foreground">Target</label>
                <div className="mt-1 flex gap-4 text-sm">
                    <label className="flex items-center gap-1.5">
                        <input
                            type="radio"
                            checked={target === 'everyone'}
                            onChange={() => {
                                setTarget('everyone');
                                setSelectedUser(null);
                            }}
                        />
                        Everyone
                    </label>
                    <label className="flex items-center gap-1.5">
                        <input type="radio" checked={target === 'user'} onChange={() => setTarget('user')} />
                        Specific user
                    </label>
                </div>
                {target === 'user' && <UserTargetPicker selected={selectedUser} onSelect={setSelectedUser} />}
            </div>

            <div className="space-y-4">
                {REQUIRED_LANGS.map((id) => {
                    const lang = SUPPORTED_LANGUAGES.find((l) => l.id === id)!;
                    return (
                        <LanguageFields
                            key={id}
                            id={lang.id}
                            label={lang.label}
                            nativeLabel={lang.nativeLabel}
                            entry={translations[id]}
                            onChange={setField}
                        />
                    );
                })}
            </div>

            <div className="max-h-72 space-y-4 overflow-y-auto rounded-md border border-border/60 p-3">
                <p className="text-xs font-medium text-muted-foreground">Other languages (optional)</p>
                {OPTIONAL_LANGS.map((lang) => (
                    <LanguageFields
                        key={lang.id}
                        id={lang.id}
                        label={lang.label}
                        nativeLabel={lang.nativeLabel}
                        entry={translations[lang.id]}
                        onChange={setField}
                    />
                ))}
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={deletable} onChange={(e) => setDeletable(e.target.checked)} />
                Recipients can delete this notification
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 disabled:opacity-50 transition-colors"
            >
                {isSubmitting ? 'Creating…' : 'Create notification'}
            </button>
        </form>
    );
}

function LanguageFields({
    id,
    label,
    nativeLabel,
    entry,
    onChange,
}: {
    id: LanguageId;
    label: string;
    nativeLabel: string;
    entry: TranslationEntry | undefined;
    onChange: (lang: LanguageId, field: 'title' | 'body', value: string) => void;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <div>
                <label className="block text-sm font-medium text-foreground">
                    Title ({label} &middot; {nativeLabel})
                </label>
                <input
                    type="text"
                    maxLength={200}
                    value={entry?.title ?? ''}
                    onChange={(e) => onChange(id, 'title', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-foreground">
                    Body ({label} &middot; {nativeLabel})
                </label>
                <textarea
                    rows={3}
                    maxLength={2000}
                    value={entry?.body ?? ''}
                    onChange={(e) => onChange(id, 'body', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
        </div>
    );
}
