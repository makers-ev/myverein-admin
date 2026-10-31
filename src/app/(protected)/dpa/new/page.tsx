import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { DpaForm } from '../DpaForm';

export default function NewDpaPage() {
    return (
        <div className="max-w-3xl">
            <Link href="/dpa" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={14} />
                Zurück zu den AV-Verträgen
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-foreground">Neuer Entwurf</h1>
            <DpaForm />
        </div>
    );
}
