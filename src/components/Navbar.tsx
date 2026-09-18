'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Menu, Settings as SettingsIcon, X } from 'lucide-react';

import { authClient } from '@/lib/auth-client';
import { ThemeToggle } from '@/components/ThemeToggle';
import Logo from '@/components/Logo';

const NAV_LINKS = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Users', href: '/users' },
    { name: 'Notifications', href: '/notifications' },
];

/**
 * Every route in this app requires an admin session (see (protected)/layout.tsx),
 * so unlike the website template's Navbar there is no guest-vs-signed-in
 * branching to render here -- just nav links + a user menu. `isPending`
 * still gets a neutral placeholder to avoid a signed-out flash before the
 * client-side session hook resolves.
 */
export function Navbar() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const pathname = usePathname();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMenuOpen(false);
        setIsMobileOpen(false);
    }, [pathname]);

    const displayName = session?.user.name ?? session?.user.email ?? '';

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                        <Logo />
                    </Link>

                    <div className="hidden md:flex md:gap-6">
                        {NAV_LINKS.map((link) => {
                            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-sm font-medium transition-colors ${
                                        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />

                    {!isPending && session && (
                        <div className="relative hidden md:block" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen((v) => !v)}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                    {displayName.slice(0, 1).toUpperCase()}
                                </span>
                                <span>{displayName}</span>
                                <ChevronDown size={14} className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-border bg-card p-2 shadow-lg ring-1 ring-black/5">
                                    <Link
                                        href="/settings"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-2 rounded px-3 py-2 text-sm text-foreground hover:bg-muted"
                                    >
                                        <SettingsIcon size={16} />
                                        Settings
                                    </Link>
                                    <button
                                        onClick={async () => {
                                            setIsMenuOpen(false);
                                            await authClient.signOut();
                                            router.push('/login');
                                            router.refresh();
                                        }}
                                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                                    >
                                        <LogOut size={16} />
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        className="flex md:hidden items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => setIsMobileOpen((v) => !v)}
                    >
                        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {isMobileOpen && (
                <div className="md:hidden border-t border-border bg-background px-4 py-4 shadow-lg">
                    <div className="flex flex-col space-y-3">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`block rounded-md px-3 py-2 text-base font-medium ${
                                    pathname === link.href ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        {session && (
                            <div className="border-t border-border mt-2 pt-3 flex flex-col space-y-1">
                                <Link
                                    href="/settings"
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-muted"
                                >
                                    <SettingsIcon size={16} />
                                    Settings
                                </Link>
                                <button
                                    onClick={async () => {
                                        await authClient.signOut();
                                        router.push('/login');
                                        router.refresh();
                                    }}
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-base font-medium text-foreground hover:bg-muted"
                                >
                                    <LogOut size={16} />
                                    Sign out ({displayName})
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
