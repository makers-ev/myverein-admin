'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Download, ExternalLink } from 'lucide-react';

import {
    adminFetch,
    ApiError,
    DOCUMENT_KIND_LABELS,
    formatBytes,
    formatDate,
    label,
    REGISTRATIONS_CHANGED_EVENT,
    LEGAL_FORM_LABELS,
    STATUS_BADGE_CLASSES,
    STATUS_LABELS,
    type Registration,
    type RegistrationDocument,
} from '@/lib/clubRegistrations';

const ROLE_LABELS: Record<string, string> = {
    vorsitz: 'Vorsitz',
    stellv_vorsitz: 'Stellv. Vorsitz',
    schriftfuehrer: 'Schriftführung',
};

type DialogKind = 'approve' | 'request-info' | 'reject' | null;

function Field({ name, children }: { name: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-medium text-muted-foreground">{name}</dt>
            <dd className="mt-0.5 text-sm text-foreground">{children}</dd>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <div className="mt-3">{children}</div>
        </section>
    );
}

function Modal({ title, children, onClose, busy }: { title: string; children: React.ReactNode; onClose: () => void; busy: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    const busyRef = useRef(busy);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        busyRef.current = busy;
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        const previouslyFocused = document.activeElement as HTMLElement | null;
        ref.current?.focus();
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape' && !busyRef.current) onCloseRef.current();
        }
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            previouslyFocused?.focus?.();
        };
    }, []);

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !busy) onClose();
            }}
        >
            <div
                ref={ref}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg outline-none"
            >
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                {children}
            </div>
        </div>
    );
}

export function RegistrationReview({ registration: reg }: { registration: Registration }) {
    const router = useRouter();
    const [dialog, setDialog] = useState<DialogKind>(null);
    const [slug, setSlug] = useState('');
    const [slugError, setSlugError] = useState<string | null>(null);
    const [note, setNote] = useState('');
    const [dialogError, setDialogError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const inFlight = useRef(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [approved, setApproved] = useState<{ name: string; slug: string } | null>(null);
    const [docError, setDocError] = useState<string | null>(null);
    const [docBusy, setDocBusy] = useState<string | null>(null);

    const isPending = reg.status === 'pending';
    const trimmedSlug = slug.trim();
    const finalSlug = trimmedSlug || reg.slugSuggestion;

    function closeDialog() {
        // The note is deliberately kept, so an accidental backdrop click/Escape does not lose typed text.
        setDialog(null);
        setDialogError(null);
    }

    /** 409 "already decided": reload the registration and tell the admin. Returns true if handled. */
    function handleAlreadyDecided(err: unknown): boolean {
        if (err instanceof ApiError && err.status === 409 && /already been decided|not pending/i.test(err.message)) {
            closeDialog();
            setNotice('Dieser Antrag wurde bereits entschieden (z. B. von einer anderen Person). Die Ansicht wurde neu geladen.');
            window.dispatchEvent(new Event(REGISTRATIONS_CHANGED_EVENT));
            router.refresh();
            return true;
        }
        return false;
    }

    async function approve() {
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        setDialogError(null);
        setSlugError(null);
        try {
            const res = await adminFetch(`/${reg.id}/approve`, {
                method: 'POST',
                body: JSON.stringify(trimmedSlug ? { slug: trimmedSlug } : {}),
            });
            const body = (await res.json()) as { data: { club: { name: string; slug: string } } };
            setApproved({ name: body.data.club.name, slug: body.data.club.slug });
            setDialog(null);
            window.dispatchEvent(new Event(REGISTRATIONS_CHANGED_EVENT));
            router.refresh();
        } catch (err) {
            if (handleAlreadyDecided(err)) return;
            const message = err instanceof ApiError ? err.message : 'Freigabe fehlgeschlagen.';
            // Only attribute the error to the slug field if an explicit slug was entered AND the message is about the slug.
            const slugInvalid = err instanceof ApiError && err.status === 422 && /slug/i.test(message);
            const slugTaken = err instanceof ApiError && err.status === 409 && /slug is already taken/i.test(message);
            if (trimmedSlug && slugInvalid) {
                setDialog(null);
                setSlugError(`Ungültig oder reserviert: ${message}`);
            } else if (trimmedSlug && slugTaken) {
                setDialog(null);
                setSlugError('Dieser Slug ist bereits vergeben.');
            } else {
                setDialogError(message);
            }
        } finally {
            inFlight.current = false;
            setBusy(false);
        }
    }

    async function decideWithNote(kind: 'request-info' | 'reject') {
        const trimmed = note.trim();
        if (!trimmed) {
            setDialogError('Bitte einen Text angeben.');
            return;
        }
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        setDialogError(null);
        try {
            await adminFetch(`/${reg.id}/${kind}`, { method: 'POST', body: JSON.stringify({ note: trimmed }) });
            setNote('');
            closeDialog();
            window.dispatchEvent(new Event(REGISTRATIONS_CHANGED_EVENT));
            setNotice(kind === 'reject' ? 'Der Antrag wurde abgelehnt.' : 'Die Rückfrage wurde gesendet, der Antrag steht auf „Rückfrage“.');
            router.refresh();
        } catch (err) {
            if (handleAlreadyDecided(err)) return;
            setDialogError(err instanceof ApiError ? err.message : 'Aktion fehlgeschlagen.');
        } finally {
            inFlight.current = false;
            setBusy(false);
        }
    }

    /** Documents are private: authenticated fetch -> Blob -> object URL, never a public URL. */
    async function openDocument(doc: RegistrationDocument, mode: 'download' | 'preview') {
        setDocError(null);
        // Open the tab synchronously (inside the click) so popup blockers allow it; navigate it once the blob is ready.
        const tab = mode === 'preview' ? window.open('', '_blank') : null;
        if (mode === 'preview' && !tab) {
            setDocError('Der Browser hat das neue Tab blockiert. Bitte Pop-ups für diese Seite erlauben.');
            return;
        }
        if (tab) tab.opener = null;
        setDocBusy(`${doc.id}:${mode}`);
        try {
            const res = await adminFetch(`/${reg.id}/documents/${doc.id}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            if (tab) {
                tab.location.href = url;
            } else {
                const a = document.createElement('a');
                a.href = url;
                a.download = doc.filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (err) {
            tab?.close();
            setDocError(err instanceof ApiError ? err.message : 'Dokument konnte nicht geladen werden.');
        } finally {
            setDocBusy(null);
        }
    }

    const canPreview = (d: RegistrationDocument) => ['application/pdf', 'image/jpeg', 'image/png'].includes(d.mimeType);

    return (
        <div className="mt-4 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{reg.clubName}</h1>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[reg.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {label(STATUS_LABELS, reg.status)}
                </span>
            </div>

            {notice && (
                <p role="status" className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
                    {notice}
                </p>
            )}

            {approved && (
                <p role="status" className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <span>
                        Verein <strong>{approved.name}</strong> angelegt, Slug: <code className="font-mono">{approved.slug}</code>
                    </span>
                </p>
            )}

            {reg.duplicateHints.length > 0 && (
                <div role="alert" className="rounded-xl border-2 border-amber-500/60 bg-amber-500/10 p-5">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-amber-800 dark:text-amber-300">
                        <AlertTriangle size={18} />
                        Mögliche Dubletten ({reg.duplicateHints.length})
                    </h2>
                    <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">
                        Bestehende Vereine mit gleichem Namen/Slug, gleichem Ort oder gleichem Registerschlüssel. Treffer mit gleichem
                        Registergericht + Registernummer stehen zuerst.
                    </p>
                    <ul className="mt-3 space-y-1 text-sm text-foreground">
                        {reg.duplicateHints.map((h) => (
                            <li key={h.clubId} className="rounded-md bg-background/60 px-3 py-1.5">
                                <span className="font-medium">{h.name}</span>
                                <span className="text-muted-foreground">
                                    {' '}
                                    — {[h.postalCode, h.city].filter(Boolean).join(' ') || 'Ort unbekannt'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {reg.reviewNote && (reg.status === 'needs_info' || reg.status === 'rejected') && (
                <Section title="Notiz der Prüfung">
                    <p className="whitespace-pre-wrap text-sm text-foreground">{reg.reviewNote}</p>
                </Section>
            )}

            <Section title="Vereinsdaten">
                <dl className="grid gap-4 sm:grid-cols-2">
                    <Field name="Name">{reg.clubName}</Field>
                    <Field name="Rechtsform">{label(LEGAL_FORM_LABELS, reg.legalForm)}</Field>
                    <Field name="Adresse">
                        {[reg.street, [reg.postalCode, reg.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '—'}
                    </Field>
                    <Field name="Website">{reg.websiteUrl ?? '—'}</Field>
                    <Field name="Eingereicht am">{formatDate(reg.submittedAt)}</Field>
                    <Field name="Beanspruchte Rolle">{label(ROLE_LABELS, reg.claimedRole)}</Field>
                </dl>
            </Section>

            <Section title="Registerangaben">
                <dl className="grid gap-4 sm:grid-cols-2">
                    <Field name="Registergericht">{reg.registerCourt ?? '—'}</Field>
                    <Field name="Registernummer (VR)">{reg.registerNumber ?? '—'}</Field>
                </dl>
                <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                    Prüfhinweis: Registergericht + VR-Nummer im gemeinsamen Registerportal der Länder gegenprüfen.
                </p>
            </Section>

            <Section title="Antragsteller">
                {reg.applicant ? (
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <Field name="Name">{reg.applicant.name || '—'}</Field>
                        <Field name="E-Mail">{reg.applicant.email}</Field>
                    </dl>
                ) : (
                    <p className="text-sm text-muted-foreground">Antragsteller nicht mehr vorhanden.</p>
                )}
            </Section>

            <Section title={`Dokumente (${reg.documents.length})`}>
                {reg.documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Keine Dokumente hochgeladen.</p>
                ) : (
                    <ul className="divide-y divide-border">
                        {reg.documents.map((d) => (
                            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">{d.filename}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {label(DOCUMENT_KIND_LABELS, d.kind)} · {d.mimeType} · {formatBytes(d.sizeBytes)}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {canPreview(d) && (
                                        <button
                                            type="button"
                                            onClick={() => void openDocument(d, 'preview')}
                                            disabled={docBusy !== null}
                                            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                                        >
                                            <ExternalLink size={13} />
                                            Vorschau
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => void openDocument(d, 'download')}
                                        disabled={docBusy !== null}
                                        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                                    >
                                        <Download size={13} />
                                        Herunterladen
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                {docError && <p role="alert" className="mt-3 text-sm text-destructive">{docError}</p>}
                <p className="mt-3 text-xs text-muted-foreground">Jeder Abruf eines Dokuments wird im Audit-Log protokolliert.</p>
            </Section>

            {reg.status === 'approved' && (
                <Section title="Freigabe">
                    <p className="text-sm text-foreground">
                        Slug: <code className="font-mono">{reg.clubSlug ?? '—'}</code>
                    </p>
                </Section>
            )}

            {isPending ? (
                <Section title="Entscheidung">
                    <label htmlFor="slug" className="block text-sm font-medium text-foreground">
                        Slug (optional)
                    </label>
                    <input
                        id="slug"
                        value={slug}
                        onChange={(e) => {
                            setSlug(e.target.value);
                            setSlugError(null);
                        }}
                        placeholder={reg.slugSuggestion ?? 'wird aus dem Vereinsnamen erzeugt'}
                        autoComplete="off"
                        spellCheck={false}
                        className="mt-1 block w-full max-w-sm rounded-md border border-border bg-background px-3 py-2 font-mono text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                        Leer lassen, um den Vorschlag{reg.slugSuggestion ? ` („${reg.slugSuggestion}“)` : ''} zu verwenden. Erlaubt:
                        Kleinbuchstaben, Ziffern, einzelne Bindestriche.
                    </p>
                    {slugError && <p role="alert" className="mt-2 text-sm text-destructive">{slugError}</p>}

                    <div className="mt-4 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => setDialog('approve')}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 transition-colors"
                        >
                            Freigeben
                        </button>
                        <button
                            type="button"
                            onClick={() => setDialog('request-info')}
                            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                        >
                            Rückfrage
                        </button>
                        <button
                            type="button"
                            onClick={() => setDialog('reject')}
                            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            Ablehnen
                        </button>
                    </div>
                </Section>
            ) : (
                !approved && (
                    <p className="text-sm text-muted-foreground">
                        Entscheidungen sind nur für offene Anträge möglich (Status: {label(STATUS_LABELS, reg.status)}).
                    </p>
                )
            )}

            {dialog === 'approve' && (
                <Modal title="Antrag freigeben?" onClose={closeDialog} busy={busy}>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Der Verein <strong className="text-foreground">{reg.clubName}</strong> wird angelegt, der Antragsteller wird
                        Inhaber.
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                        Slug:{' '}
                        {finalSlug ? (
                            <code className="font-mono">{finalSlug}</code>
                        ) : (
                            <em>wird aus dem Vereinsnamen erzeugt</em>
                        )}
                    </p>
                    {!trimmedSlug && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            Ist der Vorschlag bereits vergeben, hängt das System automatisch eine Zahl an.
                        </p>
                    )}
                    {dialogError && <p role="alert" className="mt-3 text-sm text-destructive">{dialogError}</p>}
                    <div className="mt-5 flex justify-end gap-3">
                        <button type="button" onClick={closeDialog} disabled={busy} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50">
                            Abbrechen
                        </button>
                        <button
                            type="button"
                            onClick={() => void approve()}
                            disabled={busy}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 disabled:opacity-50"
                        >
                            {busy ? 'Wird freigegeben…' : 'Freigeben'}
                        </button>
                    </div>
                </Modal>
            )}

            {(dialog === 'request-info' || dialog === 'reject') && (
                <Modal title={dialog === 'reject' ? 'Antrag ablehnen?' : 'Rückfrage an Antragsteller'} onClose={closeDialog} busy={busy}>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {dialog === 'reject'
                            ? 'Die Begründung wird dem Antragsteller mitgeteilt. Diese Entscheidung kann nicht rückgängig gemacht werden.'
                            : 'Die Notiz wird dem Antragsteller mitgeteilt; der Antrag wechselt auf „Rückfrage“.'}
                    </p>
                    <label htmlFor="note" className="mt-3 block text-sm font-medium text-foreground">
                        {dialog === 'reject' ? 'Begründung (Pflicht)' : 'Notiz (Pflicht)'}
                    </label>
                    <textarea
                        id="note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={2000}
                        rows={5}
                        className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {dialogError && <p role="alert" className="mt-2 text-sm text-destructive">{dialogError}</p>}
                    <div className="mt-5 flex justify-end gap-3">
                        <button type="button" onClick={closeDialog} disabled={busy} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50">
                            Abbrechen
                        </button>
                        <button
                            type="button"
                            onClick={() => void decideWithNote(dialog)}
                            disabled={busy || !note.trim()}
                            className={`rounded-md px-4 py-2 text-sm font-semibold shadow-sm hover:brightness-110 disabled:opacity-50 ${
                                dialog === 'reject' ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground'
                            }`}
                        >
                            {busy ? 'Wird gesendet…' : dialog === 'reject' ? 'Ablehnen' : 'Rückfrage senden'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
