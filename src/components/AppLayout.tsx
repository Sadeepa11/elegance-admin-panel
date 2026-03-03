'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const isLoginPage = pathname === '/login';
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';

            if (!isAuthenticated && !isLoginPage) {
                router.push('/login');
            } else if (isAuthenticated && isLoginPage) {
                router.push('/');
            } else {
                setLoading(false);
            }
        };

        checkAuth();

        // Listen for storage changes in other tabs (optional but good)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'adminAuthenticated') {
                checkAuth();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [isLoginPage, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (isLoginPage) {
        return <main className="min-h-screen bg-gray-50">{children}</main>;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b flex items-center px-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 capitalize">
                        {pathname === '/' ? 'Dashboard' : pathname.split('/')[1]}
                    </h2>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
