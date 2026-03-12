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
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                    </div>
                </div>
                <p className="mt-4 text-muted-foreground font-medium animate-pulse">Loading Elegance...</p>
            </div>
        );
    }

    if (isLoginPage) {
        return <main className="min-h-screen bg-background transition-colors duration-300">{children}</main>;
    }

    return (
        <div className="flex h-screen bg-background text-foreground transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

                <header className="h-20 glass-panel flex items-center justify-between px-10 z-10">
                    <div className="flex items-center space-x-2">
                        <div className="h-1 w-8 bg-primary rounded-full"></div>
                        <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
                            {pathname === '/' ? 'Overview' : pathname.split('/')[1].replace('-', ' ')}
                        </h2>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs font-medium text-muted-foreground">
                        <div className="flex items-center px-3 py-1.5 bg-muted rounded-full">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                            System Online
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-10 scroll-smooth">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
