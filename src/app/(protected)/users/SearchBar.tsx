'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';

export function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [value, setValue] = useState(searchParams.get('q') ?? '');

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set('q', value);
        } else {
            params.delete('q');
        }
        params.delete('page');
        router.push(`/users?${params.toString()}`);
    }

    return (
        <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
        </form>
    );
}
