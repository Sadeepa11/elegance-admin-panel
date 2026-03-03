'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

type VariantSize = { size: string; quantity: number };
type VariantColor = { color: string; sizes: VariantSize[] };

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        shortDescription: '',
        description: '',
        price: '',
        category: '',
        imageUrl: '',
    });

    const [features, setFeatures] = useState<string[]>(['']);
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    const [variants, setVariants] = useState<VariantColor[]>([
        { color: '', sizes: [{ size: '', quantity: 0 }] }
    ]);

    useEffect(() => {
        const fetchCategories = async () => {
            const snap = await getDocs(collection(db, 'categories'));
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
            setCategories(data);
            if (data.length > 0) {
                setFormData(prev => ({ ...prev, category: data[0].name }));
            }
        };
        fetchCategories();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, imageUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAdditionalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrls(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAdditionalImage = (index: number) => {
        const newImageUrls = [...imageUrls];
        newImageUrls.splice(index, 1);
        setImageUrls(newImageUrls);
    };

    // Variant Builders
    const addColorVariant = () => {
        setVariants([...variants, { color: '', sizes: [{ size: '', quantity: 0 }] }]);
    };

    const removeColorVariant = (cIndex: number) => {
        const newVariants = [...variants];
        newVariants.splice(cIndex, 1);
        setVariants(newVariants);
    };

    const updateColorName = (cIndex: number, color: string) => {
        const newVariants = [...variants];
        newVariants[cIndex].color = color;
        setVariants(newVariants);
    };

    const addSizeToColor = (cIndex: number) => {
        const newVariants = [...variants];
        newVariants[cIndex].sizes.push({ size: '', quantity: 0 });
        setVariants(newVariants);
    };

    const removeSizeFromColor = (cIndex: number, sIndex: number) => {
        const newVariants = [...variants];
        newVariants[cIndex].sizes.splice(sIndex, 1);
        setVariants(newVariants);
    };

    const updateSize = (cIndex: number, sIndex: number, field: 'size' | 'quantity', value: any) => {
        const newVariants = [...variants];
        if (field === 'size') newVariants[cIndex].sizes[sIndex].size = value;
        if (field === 'quantity') newVariants[cIndex].sizes[sIndex].quantity = parseInt(value) || 0;
        setVariants(newVariants);
    };

    // Features Builders
    const addFeature = () => setFeatures([...features, '']);

    const removeFeature = (index: number) => {
        const newFeatures = [...features];
        newFeatures.splice(index, 1);
        setFeatures(newFeatures);
    };

    const updateFeature = (index: number, value: string) => {
        const newFeatures = [...features];
        newFeatures[index] = value;
        setFeatures(newFeatures);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let totalStock = 0;
        variants.forEach(vc => {
            vc.sizes.forEach(vs => {
                totalStock += vs.quantity;
            });
        });

        try {
            await addDoc(collection(db, 'products'), {
                ...formData,
                price: Number(formData.price),
                stock: totalStock, // for backwards compat
                variants: variants,
                features: features.filter(f => f.trim() !== ''),
                imageUrls: imageUrls
            });
            router.push('/products');
        } catch (error) {
            console.error("Error adding product", error);
            alert("Failed to add product.");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center space-x-4">
                <Link href="/products" className="p-2 text-gray-500 hover:text-gray-900 bg-white rounded-full border shadow-sm transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-semibold text-gray-900">Add New Product</h1>
            </div>

            <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                            <input type="text" required className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                            <input type="text" maxLength={100} required className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" value={formData.shortDescription} onChange={e => setFormData({ ...formData, shortDescription: e.target.value })} placeholder="Brief hook (e.g., Slim fitting everyday wear)" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                            <textarea rows={4} required className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (LKR)</label>
                            <input type="number" step="0.01" required className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                required
                                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                {categories.length === 0 && <option value="">Loading categories...</option>}
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                            <input type="file" accept="image/*" className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" onChange={handleImageChange} required={!formData.imageUrl} />
                            {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded shadow-sm border" />}
                        </div>

                        {/* Gallery Images Section */}
                        <div className="md:col-span-2 pt-2 border-t border-gray-100 mt-2">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Gallery Images (Optional)</label>
                                <label className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center cursor-pointer">
                                    <Plus className="w-4 h-4 mr-1" /> Add Image
                                    <input type="file" accept="image/*" className="hidden" onChange={handleAdditionalImageChange} />
                                </label>
                            </div>
                            {imageUrls.length > 0 && (
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 mt-3">
                                    {imageUrls.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <img src={url} alt={`Gallery ${index}`} className="h-20 w-20 object-cover rounded-lg shadow-sm border" />
                                            <button type="button" onClick={() => removeAdditionalImage(index)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Structured Features */}
                        <div className="md:col-span-2 pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Product Features (Bullet Points)</label>
                                <button type="button" onClick={addFeature} className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                                    <Plus className="w-4 h-4 mr-1" /> Add Bullet Point
                                </button>
                            </div>
                            <div className="space-y-3">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <div className="flex-1">
                                            <input type="text" placeholder={`e.g. ${index === 0 ? '100% Organic Cotton' : index === 1 ? 'Machine washable' : 'Feature point'}`} className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" value={feature} onChange={e => updateFeature(index, e.target.value)} />
                                        </div>
                                        <button type="button" onClick={() => removeFeature(index)} className="text-gray-400 hover:text-red-500 p-2" disabled={features.length === 1}>
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Variants Section */}
                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Color & Size Variants</h3>
                            <button type="button" onClick={addColorVariant} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 px-3 rounded-lg flex items-center font-medium transition-colors">
                                <Plus className="w-4 h-4 mr-1" /> Add Color
                            </button>
                        </div>

                        <div className="space-y-4">
                            {variants.map((vc, cIndex) => (
                                <div key={cIndex} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Color Name</label>
                                            <input type="text" required placeholder="e.g. Red, Blue, Navy" className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 sm:text-sm" value={vc.color} onChange={e => updateColorName(cIndex, e.target.value)} />
                                        </div>
                                        <div className="pt-5">
                                            <button type="button" onClick={() => removeColorVariant(cIndex)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors" disabled={variants.length === 1}>
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pl-4 border-l-2 border-blue-200 space-y-3">
                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Sizes & Quantities</label>
                                        {vc.sizes.map((vs, sIndex) => (
                                            <div key={sIndex} className="flex items-center space-x-3">
                                                <div className="w-1/3">
                                                    <input type="text" required placeholder="Size (e.g. S, M, L)" className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 sm:text-sm" value={vs.size} onChange={e => updateSize(cIndex, sIndex, 'size', e.target.value)} />
                                                </div>
                                                <div className="w-1/3">
                                                    <input type="number" required placeholder="Qty" className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 sm:text-sm" value={vs.quantity === 0 ? '' : vs.quantity} onChange={e => updateSize(cIndex, sIndex, 'quantity', e.target.value)} />
                                                </div>
                                                <div>
                                                    <button type="button" onClick={() => removeSizeFromColor(cIndex, sIndex)} className="text-gray-400 hover:text-red-600 p-1" disabled={vc.sizes.length === 1}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => addSizeToColor(cIndex)} className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center mt-1">
                                            <Plus className="w-3 h-3 mr-1" /> Add Size
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                        <Link href="/products" className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                            Cancel
                        </Link>
                        <button type="submit" disabled={loading} className="py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors flex items-center">
                            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : null}
                            {loading ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
