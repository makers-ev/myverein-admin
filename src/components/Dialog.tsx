'use client';

import { useEffect, useId, useRef } from 'react';

/** Modal dialog: focus moves in, Tab/Shift+Tab cycle inside, Escape and backdrop click close (unless `busy`), focus returns on close. */
export function Dialog({ title, children, onClose, busy = false }: { title: string; children: React.ReactNode; onClose: () => void; busy?: boolean }) {
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
        ref.current?.focus();
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
            <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg outline-none">
                <h3 id={titleId} className="text-lg font-semibold text-foreground">{title}</h3>
                {children}
            </div>
        </div>
    );
}
