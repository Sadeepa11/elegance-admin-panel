'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Tags, Users, LogOut, ClipboardList, Sun, Moon, ChevronRight } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Orders', href: '/orders', icon: ClipboardList },
    { name: 'Products', href: '/products', icon: ShoppingBag },
    { name: 'Categories', href: '/categories', icon: Tags },
    { name: 'Users', href: '/users', icon: Users },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();

    const handleLogout = async () => {
        try {
            await auth.signOut();
            sessionStorage.removeItem('adminAuthenticated');
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="flex flex-col w-72 glass-panel border-r h-full relative transition-[width] duration-300">
            <div className="flex items-center px-6 h-20 border-b border-white/10">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mr-3 shadow-lg shadow-primary/20">
                    <span className="text-white font-bold text-lg">E</span>
                </div>
                <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    Elegance
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
                <div>
                    <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Main Menu</p>
                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                                        group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                                        ${isActive
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}
                                    `}
                                >
                                    <div className="flex items-center">
                                        <item.icon
                                            className={`
                                                mr-3 flex-shrink-0 h-5 w-5 transition-colors
                                                ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}
                                            `}
                                        />
                                        {item.name}
                                    </div>
                                    {isActive && <ChevronRight className="h-4 w-4" />}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

            </div>

            <div className="p-4 space-y-2 border-t border-white/10">
                <button
                    onClick={toggleTheme}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-muted-foreground rounded-xl hover:bg-white/5 hover:text-foreground transition-all duration-200 group"
                >
                    <div className="bg-muted p-2 rounded-lg mr-3 group-hover:bg-primary/10 transition-colors">
                        {theme === 'light' ? (
                            <Moon className="h-4 w-4 text-primary" />
                        ) : (
                            <Sun className="h-4 w-4 text-primary" />
                        )}
                    </div>
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>

                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-500/80 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                >
                    <div className="bg-red-500/10 p-2 rounded-lg mr-3">
                        <LogOut className="h-4 w-4" />
                    </div>
                    Sign Out
                </button>
            </div>
        </div>
    );
}
