import { SettingsForm } from './SettingsForm';

export default function SettingsPage() {
    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your own account, not other users&apos; — see Users for that.</p>
            <div className="mt-6">
                <SettingsForm />
            </div>
        </div>
    );
}
