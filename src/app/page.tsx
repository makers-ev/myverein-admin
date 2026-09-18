import { redirect } from 'next/navigation';

/** No public landing page in an admin tool -- root just forwards into the protected area, which itself redirects to /login when there's no session. */
export default function RootPage() {
    redirect('/dashboard');
}
