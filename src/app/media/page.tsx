'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Calendar, Clock, Trash2 } from 'lucide-react';

interface MediaItem {
    id: string;
    base64: string;
    timestamp?: number;
}

export default function MediaGallery() {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Security check
        const isSuperAdmin = sessionStorage.getItem('superAdminAuthenticated') === 'true';
        if (!isSuperAdmin) {
            router.push('/');
            return;
        }

        const mediaRef = ref(rtdb, 'media');
        
        onValue(mediaRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const items: MediaItem[] = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key],
                })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                
                setMediaItems(items);
            } else {
                setMediaItems([]);
            }
            setLoading(false);
        });

        return () => {
            off(mediaRef);
        };
    }, [router]);

    const formatTimestamp = (ts?: number) => {
        if (!ts) return 'Unknown date';
        return new Date(ts).toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ImageIcon className="text-purple-600" />
                        Captured Media Gallery
                    </h1>
                    <p className="text-gray-500">View and manage media captured from the Android app.</p>
                </div>
                <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
                    {mediaItems.length} Items Found
                </div>
            </div>

            {mediaItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <ImageIcon className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No media items found in database</p>
                    <p className="text-gray-400 text-sm">Media captured via the Android app will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {mediaItems.map((item) => (
                        <div key={item.id} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100">
                            <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                <img
                                    src={`data:image/jpeg;base64,${item.base64}`}
                                    alt="Captured Media"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                                        title="Delete Media"
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this media?')) {
                                                // Implementation for deletion could go here if needed
                                                console.log('Delete item:', item.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex items-center text-xs text-gray-500 gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(item.timestamp || 0).toLocaleDateString()}
                                </div>
                                <div className="flex items-center text-xs text-gray-500 gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    {new Date(item.timestamp || 0).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
