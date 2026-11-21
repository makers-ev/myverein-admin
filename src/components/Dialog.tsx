'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

/** Modal dialog (portal to body, rest of the page `inert`): focus moves to the first field, Tab/Shift+Tab cycle inside, Escape closes (unless `busy`), backdrop click only when nothing was entered (`dirty` false), focus returns on close. */
export function Dialog({ title, children, onClose, busy = false, dirty = false }: { title: string; children: React.ReactNode; onClose: () => void; busy?: boolean; dirty?: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const busyRef = useRef(busy);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        busyRef.current = busy;
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        const previouslyFocused = document.activeElement as HTMLElement | null;
        const first = ref.current?.querySelector<HTMLElement>('input:not([disabled]), textarea:not([disabled]), select:not([disabled])');
        (first ?? ref.current)?.focus();
        const host = ref.current?.parentElement ?? null;
        const inerted: HTMLElement[] = [];
        for (const el of Array.from(document.body.children)) {
            if (el !== host && el instanceof HTMLElement && !el.inert) {
                el.inert = true;
                inerted.push(el);
            }
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape' && !busyRef.current) {
                onCloseRef.current();
                return;
            }
            if (e.key === 'Tab' && ref.current) {
                const items = Array.from(ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'));
                if (items.length === 0) {
                    e.preventDefault();
                    return;
                }
                const first = items[0]!;
                const last = items[items.length - 1]!;
                const active = document.activeElement;
                if (e.shiftKey && (active === first || active === ref.current)) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && active === last) {
                    e.preventDefault();
                    first.focus();
                } else if (!ref.current.contains(active)) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            for (const el of inerted) el.inert = false;
            previouslyFocused?.focus?.();
        };
    }, []);

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !busy && !dirty) onClose();
            }}
        >
            <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg outline-none">
                <h3 id={titleId} className="text-lg font-semibold text-foreground">{title}</h3>
                {children}
            </div>
        </div>,
        document.body,
    );
}
