'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Tags, Users, LogOut, ClipboardList, Image as ImageIcon } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        const isSuper = sessionStorage.getItem('superAdminAuthenticated') === 'true';
        setIsSuperAdmin(isSuper);
    }, []);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            sessionStorage.removeItem('adminAuthenticated');
            sessionStorage.removeItem('superAdminAuthenticated');
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="flex flex-col w-64 bg-white border-r h-full shadow-sm">
            <div className="flex items-center justify-center h-16 border-b">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">Elegance Admin</h1>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
                            >
                                <item.icon
                                    className={`
                    mr-3 flex-shrink-0 h-5 w-5 transition-colors
                    ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}

                    {isSuperAdmin && (
                        <Link
                            href="/media"
                            className={`
                group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                ${pathname?.startsWith('/media')
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
                        >
                            <ImageIcon
                                className={`
                  mr-3 flex-shrink-0 h-5 w-5 transition-colors
                  ${pathname?.startsWith('/media') ? 'text-purple-700' : 'text-gray-400 group-hover:text-gray-500'}
                `}
                                aria-hidden="true"
                            />
                            Media Gallery
                        </Link>
                    )}
                </nav>
            </div>
            <div className="flex-shrink-0 flex border-t p-4">
                <button
                    className="flex-shrink-0 w-full group block text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={handleLogout}
                >
                    <div className="flex items-center">
                        <LogOut className="inline-block h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-500" />
                        <div className="text-sm font-medium">Sign Out</div>
                    </div>
                </button>
            </div>
        </div>
    );
}
