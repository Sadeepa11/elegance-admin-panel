'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trash2, Plus, Edit } from 'lucide-react';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newCatName, setNewCatName] = useState('');
    const [newCatImage, setNewCatImage] = useState('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewCatImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'categories'));
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        setAdding(true);
        try {
            if (editingId) {
                await updateDoc(doc(db, 'categories', editingId), {
                    name: newCatName,
                    imageUrl: newCatImage || ''
                });
            } else {
                await addDoc(collection(db, 'categories'), {
                    name: newCatName,
                    imageUrl: newCatImage || ''
                });
            }
            setNewCatName('');
            setNewCatImage('');
            setEditingId(null);
            fetchCategories();
        } catch (error) {
            console.error("Error saving category", error);
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (category: any) => {
        setEditingId(category.id);
        setNewCatName(category.name);
        setNewCatImage(category.imageUrl || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewCatName('');
        setNewCatImage('');
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;
        try {
            await deleteDoc(doc(db, 'categories', id));
            fetchCategories();
        } catch (error) {
            console.error("Error deleting category", error);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-1000">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">Taxonomy Engine</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter">Categories</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Organize and classify your asset inventory.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Category Form */}
                <div className="lg:col-span-1">
                    <div className="premium-card p-8 sticky top-6 shadow-xl shadow-primary/5">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-lg font-black text-foreground tracking-tight uppercase">
                                {editingId ? 'Modify Category' : 'New Classification'}
                            </h2>
                            {editingId && (
                                <button 
                                    type="button" 
                                    onClick={cancelEdit} 
                                    className="text-[10px] font-bold text-muted-foreground hover:text-foreground border border-border rounded-xl px-4 py-2 bg-muted/50 transition-all uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Identity Label</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="block w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground text-sm font-medium placeholder:text-muted-foreground/30" 
                                    value={newCatName} 
                                    onChange={e => setNewCatName(e.target.value)} 
                                    placeholder="e.g. Winter Collection" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Visual Identifier</label>
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer bg-muted/30 rounded-2xl border border-border p-2" 
                                        onChange={handleImageChange} 
                                    />
                                </div>
                                {newCatImage && (
                                    <div className="mt-4 relative inline-block group">
                                        <img src={newCatImage} alt="Preview" className="h-24 w-24 object-cover rounded-2xl shadow-2xl border border-white/10" />
                                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl"></div>
                                    </div>
                                )}
                            </div>
                            <button 
                                type="submit" 
                                disabled={adding} 
                                className="w-full py-4 px-6 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center"
                            >
                                {adding ? (
                                    'Processing...'
                                ) : editingId ? (
                                    <><Edit className="w-4 h-4 mr-2" /> Sync Changes</>
                                ) : (
                                    <><Plus className="w-4 h-4 mr-2" /> Deploy Category</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Categories List */}
                <div className="lg:col-span-2">
                    <div className="premium-card overflow-hidden shadow-xl shadow-primary/5">
                        {loading ? (
                            <div className="p-24 flex flex-col items-center justify-center gap-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">Retrieving Data...</p>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="p-24 text-center">
                                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                                    <Plus className="h-10 w-10 text-muted-foreground opacity-30" />
                                </div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Categories Defined</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/30">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Classification Entity</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Control Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {categories.map((category) => (
                                            <tr key={category.id} className="hover:bg-primary/5 transition-all duration-300 group">
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {category.imageUrl ? (
                                                            <div className="h-12 w-12 flex-shrink-0 mr-5 relative">
                                                                <img className="h-12 w-12 rounded-xl object-cover shadow-lg border border-white/5" src={category.imageUrl} alt="" />
                                                                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl"></div>
                                                            </div>
                                                        ) : (
                                                            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mr-5 text-muted-foreground">
                                                                <Plus className="w-5 h-5 opacity-30" />
                                                            </div>
                                                        )}
                                                        <div className="text-sm font-black text-foreground tracking-tight">{category.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                                    <div className="flex justify-end items-center space-x-3">
                                                        <button 
                                                            onClick={() => startEdit(category)} 
                                                            className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 shadow-sm"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(category.id)} 
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
            </div>
        </div>
    );
}
