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
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Category Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 sticky top-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium text-gray-900">
                                {editingId ? 'Edit Category' : 'Add New Category'}
                            </h2>
                            {editingId && (
                                <button type="button" onClick={cancelEdit} className="text-sm text-gray-500 hover:text-gray-900 border rounded-full px-3 py-1 bg-gray-50">
                                    Cancel
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input type="text" required className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Winter Wear" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Image (Optional)</label>
                                <input type="file" accept="image/*" className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" onChange={handleImageChange} />
                                {newCatImage && <img src={newCatImage} alt="Preview" className="mt-2 h-16 w-16 object-cover rounded" />}
                            </div>
                            <button type="submit" disabled={adding} className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex justify-center items-center transition-colors">
                                {adding ? 'Saving...' : editingId ? <><Edit className="w-4 h-4 mr-2" /> Update Category</> : <><Plus className="w-4 h-4 mr-2" /> Add Category</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Categories List */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="p-12 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">No categories found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {categories.map((category) => (
                                            <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {category.imageUrl && (
                                                            <div className="h-10 w-10 flex-shrink-0 mr-4">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img className="h-10 w-10 rounded-lg object-cover bg-gray-100" src={category.imageUrl} alt="" />
                                                            </div>
                                                        )}
                                                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-4">
                                                    <button onClick={() => startEdit(category)} className="text-blue-600 hover:text-blue-900 inline-flex items-center">
                                                        <Edit className="w-4 h-4 mr-1" /> Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900 inline-flex items-center ml-4">
                                                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                                                    </button>
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
