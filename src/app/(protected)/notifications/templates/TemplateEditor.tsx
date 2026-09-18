'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { authClient, backendUrl } from '@/lib/auth-client';
import { SUPPORTED_LANGUAGES, type LanguageId } from '@/lib/supportedLanguages';
import type { TemplateRow } from './page';

type TranslationEntry = { title: string; body: string };
type Translations = Partial<Record<LanguageId, TranslationEntry>>;

const REQUIRED_LANGS: LanguageId[] = ['de', 'en'];
const OPTIONAL_LANGS = SUPPORTED_LANGUAGES.filter((l) => !REQUIRED_LANGS.includes(l.id));

/** One editable card per known `translation_key`, one Title+Body pair per supported language (ADR-009) -- Save upserts an override (`PATCH`), Reset deletes it so the app falls back to its built-in translation again (`DELETE`). */
export function TemplateEditor({ template }: { template: TemplateRow }) {
    const router = useRouter();
    const isOverridden = template.translations !== null;

    const [translations, setTranslations] = useState<Translations>(() => ({ ...template.translations }));
    const [error, setError] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);

    function setField(lang: LanguageId, field: 'title' | 'body', value: string) {
        setTranslations((prev) => ({
            ...prev,
            [lang]: { title: '', body: '', ...prev[lang], [field]: value },
        }));
    }

    const canSave = Boolean(translations.de?.title && translations.de?.body && translations.en?.title && translations.en?.body);

    async function handleSave() {
        setError(null);
        setIsBusy(true);
        // Drop languages left blank so an override only carries what the admin actually filled in.
        const payload = Object.fromEntries(
            Object.entries(translations).filter(([, v]) => v?.title && v?.body),
        );
        const { error: saveError } = await authClient.$fetch(`${backendUrl}/admin/notification-templates/${template.translationKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ translations: payload }),
        });
        setIsBusy(false);
        if (saveError) {
            console.error('[notification-templates] PATCH failed', saveError);
            setError(saveError.message ?? 'Unable to save.');
            return;
        }
        router.refresh();
    }

    async function handleReset() {
        if (!confirm('Revert to the built-in text? Your override will be deleted.')) return;
        setIsBusy(true);
        const { error: resetError } = await authClient.$fetch(`${backendUrl}/admin/notification-templates/${template.translationKey}`, {
            method: 'DELETE',
        });
        setIsBusy(false);
        if (resetError) {
            console.error('[notification-templates] DELETE failed', resetError);
            setError(resetError.message ?? 'Unable to reset.');
            return;
        }
        setTranslations({});
        router.refresh();
    }

    function LanguageFields({ id, label, nativeLabel }: { id: LanguageId; label: string; nativeLabel: string }) {
        const entry = translations[id];
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
                        onChange={(e) => setField(id, 'title', e.target.value)}
                        placeholder="Uses the app's built-in text"
                        className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground">
                        Body ({label} &middot; {nativeLabel})
                    </label>
                    <textarea
                        rows={2}
                        maxLength={2000}
                        value={entry?.body ?? ''}
                        onChange={(e) => setField(id, 'body', e.target.value)}
                        placeholder="Uses the app's built-in text"
                        className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
                <code className="text-sm font-semibold text-foreground">{template.translationKey}</code>
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isOverridden ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                >
                    {isOverridden ? 'Overridden' : 'Using built-in text'}
                </span>
            </div>

            <div className="mt-4 space-y-4">
                {REQUIRED_LANGS.map((id) => {
                    const lang = SUPPORTED_LANGUAGES.find((l) => l.id === id)!;
                    return <LanguageFields key={id} id={lang.id} label={lang.label} nativeLabel={lang.nativeLabel} />;
                })}
            </div>

            <div className="mt-4 max-h-72 space-y-4 overflow-y-auto rounded-md border border-border/60 p-3">
                <p className="text-xs font-medium text-muted-foreground">Other languages (optional)</p>
                {OPTIONAL_LANGS.map((lang) => (
                    <LanguageFields key={lang.id} id={lang.id} label={lang.label} nativeLabel={lang.nativeLabel} />
                ))}
            </div>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            <div className="mt-4 flex items-center gap-3">
                <button
                    onClick={() => void handleSave()}
                    disabled={isBusy || !canSave}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 disabled:opacity-50 transition-colors"
                >
                    Save
                </button>
                {isOverridden && (
                    <button
                        onClick={() => void handleReset()}
                        disabled={isBusy}
                        className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                    >
                        Reset to default
                    </button>
                )}
            </div>
        </div>
    );
}
