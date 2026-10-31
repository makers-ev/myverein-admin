'use client';

import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

import Logo from '@/components/Logo';
import { siteConfig } from '@/config/site';

/**
 * 1:1 structural copy of _template_better-auth-website's Footer.tsx --
 * same Product/Company/Legal columns, same social icons, same cookie-
 * settings button. English-only (this app has no LanguageContext/i18n,
 * unlike the website template) and every link target below is a
 * placeholder -- none of /features, /pricing, /changelog, /about, /blog,
 * /careers, /contact, /privacy, /terms, /imprint exist as routes in this
 * app, and the social links are "#" in the source template too. Kept as-is
 * on explicit request; wire real routes/links or delete columns once this
 * template is adapted for a real project.
 */
export function Footer() {
    const currentYear = new Date().getFullYear();

    const openCookieSettings = () => {
        window.dispatchEvent(new Event('open-cookie-settings'));
    };

    const footerLinks = {
        product: [
            { name: 'Features', href: '/features' },
            { name: 'Pricing', href: '/pricing' },
            { name: 'Changelog', href: '/changelog' },
        ],
        company: [
            { name: 'About', href: '/about' },
            { name: 'Blog', href: '/blog' },
            { name: 'Careers', href: '/careers' },
            { name: 'Contact', href: '/contact' },
        ],
        legal: [
            { name: 'Privacy Policy', href: '/privacy' },
            { name: 'Terms of Service', href: '/terms' },
            { name: 'Imprint', href: '/imprint' },
        ],
    };

    return (
        <footer className="bg-background border-t border-border">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                    <div className="space-y-8 xl:col-span-1 justify-self-center">
                        <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                            <Logo />
                        </Link>
                        <p className="max-w-xs text-sm leading-6 text-muted-foreground">{siteConfig.tagline}</p>
                        <div className="flex space-x-5">
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <span className="sr-only">GitHub</span>
                                <Github size={20} strokeWidth={1.5} />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <span className="sr-only">Twitter</span>
                                <Twitter size={20} strokeWidth={1.5} />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <span className="sr-only">LinkedIn</span>
                                <Linkedin size={20} strokeWidth={1.5} />
                            </a>
                        </div>
                    </div>

                    <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-foreground">Product</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    {footerLinks.product.map((item) => (
                                        <li key={item.name}>
                                            <Link href={item.href} className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors">
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-10 md:mt-0">
                                <h3 className="text-sm font-semibold leading-6 text-foreground">Company</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    {footerLinks.company.map((item) => (
                                        <li key={item.name}>
                                            <Link href={item.href} className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors">
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-foreground">Legal</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    {footerLinks.legal.map((item) => (
                                        <li key={item.name}>
                                            <Link href={item.href} className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors">
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                    <button
                                        onClick={openCookieSettings}
                                        className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        Cookie Settings
                                    </button>
                                </ul>
                            </div>
                            <div className="mt-10 md:mt-0" />
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-8 sm:mt-20 lg:mt-24 flex flex-col items-center justify-between">
                    <p className="text-xs leading-5 text-muted-foreground">
                        &copy; {currentYear} MyVerein, All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
