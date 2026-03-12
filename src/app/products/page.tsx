'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'products'));
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await deleteDoc(doc(db, 'products', id));
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product", error);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-1000">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">Asset Catalog</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter">Products</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Manage and deploy your high-end inventory.</p>
                </div>
                <Link 
                    href="/products/new" 
                    className="bg-primary text-white px-8 py-4 rounded-2xl flex items-center font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Plus className="w-4 h-4 mr-3" />
                    New Asset
                </Link>
            </div>

            <div className="premium-card shadow-xl shadow-primary/5">
                {loading ? (
                    <div className="p-24 flex flex-col items-center justify-center gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">Synchronizing Records...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-24 text-center">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                            <Plus className="h-10 w-10 text-muted-foreground opacity-30" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Assets Found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/30">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Asset Configuration</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Classification</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Valuation</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-primary/5 transition-all duration-300 group">
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-14 w-14 flex-shrink-0 relative">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img className="h-14 w-14 rounded-xl object-cover shadow-lg border border-white/5" src={product.imageUrl || 'https://via.placeholder.com/40'} alt="" />
                                                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl"></div>
                                                </div>
                                                <div className="ml-5">
                                                    <div className="text-sm font-black text-foreground tracking-tight">{product.name}</div>
                                                    <div className="text-[11px] text-muted-foreground truncate max-w-[200px] mt-0.5 opacity-70 tracking-tight">{product.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className="px-4 py-1.5 inline-flex text-[10px] font-black uppercase tracking-widest rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="text-sm font-black text-foreground tracking-tighter">LKR {product.price?.toLocaleString()}</div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end items-center space-x-3">
                                                <Link 
                                                    href={`/products/edit/${product.id}`} 
                                                    className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 shadow-sm"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button 
                                                    onClick={() => handleDelete(product.id)} 
                                                    className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
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
