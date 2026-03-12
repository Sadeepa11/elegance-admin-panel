'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserCircle } from 'lucide-react';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'users'));
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="space-y-10 animate-in fade-in duration-1000">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">Identity Manager</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter">Registered Personnel</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Full database of authenticated system users.</p>
                </div>
            </div>

            <div className="premium-card shadow-xl shadow-primary/5">
                {loading ? (
                    <div className="p-24 flex flex-col items-center justify-center gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">Syncing Database...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-24 text-center">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                            <UserCircle className="h-10 w-10 text-muted-foreground opacity-30" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Records Found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/30">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Personnel Identity</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Contact Vector</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Primary Phone</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Geographic Deployment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-primary/5 transition-all duration-300 group">
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-2xl bg-muted text-primary border border-border group-hover:bg-primary/10 transition-colors">
                                                    <UserCircle className="w-6 h-6" />
                                                </div>
                                                <div className="ml-5">
                                                    <div className="text-sm font-black text-foreground tracking-tight">{user.name || 'Anonymous User'}</div>
                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter opacity-60">ID: {user.id.substring(0, 12)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="text-sm font-medium text-foreground">{user.email || 'N/A'}</div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="text-sm font-medium text-foreground">{user.phone || 'N/A'}</div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="text-sm text-muted-foreground truncate max-w-[250px] font-medium" title={user.address}>
                                                {user.address || 'N/A'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
