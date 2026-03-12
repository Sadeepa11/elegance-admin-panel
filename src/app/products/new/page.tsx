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
        <div className="max-w-4xl mx-auto space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-5 duration-1000">
            <div className="flex items-center space-x-6">
                <Link 
                    href="/products" 
                    className="p-3 text-muted-foreground hover:text-primary bg-muted/50 rounded-2xl border border-border shadow-sm transition-all hover:scale-110 active:scale-90"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter">New Asset</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Configure and deploy a new inventory entity.</p>
                </div>
            </div>

            <div className="premium-card p-10 shadow-2xl shadow-primary/5">
                <form onSubmit={handleSubmit} className="space-y-12">
                    {/* Identification Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Asset Identity</label>
                            <input 
                                type="text" 
                                required 
                                className="block w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground text-sm font-medium placeholder:text-muted-foreground/30" 
                                value={formData.name} 
                                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                placeholder="Enter asset name..."
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Market Hook (Short Description)</label>
                            <input 
                                type="text" 
                                maxLength={100} 
                                required 
                                className="block w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground text-sm font-medium placeholder:text-muted-foreground/30" 
                                value={formData.shortDescription} 
                                onChange={e => setFormData({ ...formData, shortDescription: e.target.value })} 
                                placeholder="Brief hook (e.g., Slim fitting everyday wear)" 
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Full Technical Specification</label>
                            <textarea 
                                rows={5} 
                                required 
                                className="block w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground text-sm font-medium placeholder:text-muted-foreground/30" 
                                value={formData.description} 
                                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                placeholder="Detailed asset description..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Valuation (LKR)</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                required 
                                className="block w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground text-sm font-medium" 
                                value={formData.price} 
                                onChange={e => setFormData({ ...formData, price: e.target.value })} 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Taxonomy Classification</label>
                            <select
                                required
                                className="block w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground text-sm font-medium appearance-none cursor-pointer"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                {categories.length === 0 && <option value="">Loading categories...</option>}
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name} className="bg-surface">{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2 space-y-4 pt-4 border-t border-border mt-4">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Primary Cover Media</label>
                            <div className="flex items-start space-x-6">
                                <div className="flex-1">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer bg-muted/30 rounded-2xl border border-border p-2" 
                                        onChange={handleImageChange} 
                                        required={!formData.imageUrl} 
                                    />
                                </div>
                                {formData.imageUrl && (
                                    <div className="relative group shrink-0">
                                        <img src={formData.imageUrl} alt="Preview" className="h-24 w-24 object-cover rounded-2xl shadow-xl border border-white/10" />
                                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gallery Media */}
                        <div className="md:col-span-2 space-y-4 pt-4 border-t border-border">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Extended Media Gallery</label>
                                <label className="text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-widest inline-flex items-center cursor-pointer px-4 py-2 bg-primary/10 rounded-xl transition-colors">
                                    <Plus className="w-3 h-3 mr-2" /> Inject Media
                                    <input type="file" accept="image/*" className="hidden" onChange={handleAdditionalImageChange} />
                                </label>
                            </div>
                            {imageUrls.length > 0 && (
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-6 mt-4">
                                    {imageUrls.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <img src={url} alt={`Gallery ${index}`} className="h-20 w-20 object-cover rounded-xl shadow-lg border border-white/5" />
                                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl"></div>
                                            <button 
                                                type="button" 
                                                onClick={() => removeAdditionalImage(index)} 
                                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 shadow-xl text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Features */}
                        <div className="md:col-span-2 space-y-4 pt-4 border-t border-border">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Premium Feature Highlights</label>
                                <button 
                                    type="button" 
                                    onClick={addFeature} 
                                    className="text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-widest inline-flex items-center px-4 py-2 bg-primary/10 rounded-xl transition-colors"
                                >
                                    <Plus className="w-3 h-3 mr-2" /> Add Bullet
                                </button>
                            </div>
                            <div className="space-y-4">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-center space-x-4 animate-in slide-in-from-left-2 duration-300">
                                        <div className="flex-1">
                                            <input 
                                                type="text" 
                                                placeholder={`e.g. 100% Organic Cotton...`} 
                                                className="block w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground text-sm" 
                                                value={feature} 
                                                onChange={e => updateFeature(index, e.target.value)} 
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeFeature(index)} 
                                            className="text-muted-foreground hover:text-red-500 p-2 transition-colors" 
                                            disabled={features.length === 1}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Variants Section */}
                    <div className="pt-10 border-t border-border">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black text-foreground tracking-tight uppercase">Configuration Variants</h3>
                                <p className="text-xs text-muted-foreground font-medium">Define color and size matrix for this asset.</p>
                            </div>
                            <button 
                                type="button" 
                                onClick={addColorVariant} 
                                className="text-[10px] font-black bg-muted hover:bg-muted/80 text-foreground py-2.5 px-5 rounded-xl flex items-center transition-all border border-border tracking-widest uppercase shadow-sm"
                            >
                                <Plus className="w-3 h-3 mr-2" /> Add Color Vector
                            </button>
                        </div>

                        <div className="space-y-8">
                            {variants.map((vc, cIndex) => (
                                <div key={cIndex} className="bg-muted/20 border border-border rounded-[2rem] p-8 animate-in zoom-in-95 duration-500">
                                    <div className="flex items-center space-x-6 mb-8">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Color Identity</label>
                                            <input 
                                                type="text" 
                                                required 
                                                placeholder="e.g. Midnight Navy, Crimson" 
                                                className="block w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground text-sm font-bold" 
                                                value={vc.color} 
                                                onChange={e => updateColorName(cIndex, e.target.value)} 
                                            />
                                        </div>
                                        <div className="pt-6">
                                            <button 
                                                type="button" 
                                                onClick={() => removeColorVariant(cIndex)} 
                                                className="text-muted-foreground hover:text-red-500 p-3 rounded-2xl hover:bg-red-500/10 transition-all" 
                                                disabled={variants.length === 1}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pl-6 border-l-2 border-primary/20 space-y-4">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Size & Stock Distribution</label>
                                        <div className="space-y-3">
                                            {vc.sizes.map((vs, sIndex) => (
                                                <div key={sIndex} className="flex items-center space-x-4 animate-in slide-in-from-left-2 duration-300">
                                                    <div className="w-1/3">
                                                        <input 
                                                            type="text" 
                                                            required 
                                                            placeholder="Size (e.g. XL)" 
                                                            className="block w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground text-sm font-bold" 
                                                            value={vs.size} 
                                                            onChange={e => updateSize(cIndex, sIndex, 'size', e.target.value)} 
                                                        />
                                                    </div>
                                                    <div className="w-1/3">
                                                        <input 
                                                            type="number" 
                                                            required 
                                                            placeholder="Qty" 
                                                            className="block w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground text-sm font-bold" 
                                                            value={vs.quantity === 0 ? '' : vs.quantity} 
                                                            onChange={e => updateSize(cIndex, sIndex, 'quantity', e.target.value)} 
                                                        />
                                                    </div>
                                                    <div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeSizeFromColor(cIndex, sIndex)} 
                                                            className="text-muted-foreground hover:text-red-500 p-2 transition-colors" 
                                                            disabled={vc.sizes.length === 1}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => addSizeToColor(cIndex)} 
                                            className="text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-widest inline-flex items-center mt-2 px-4 py-2 hover:bg-primary/5 rounded-xl transition-all"
                                        >
                                            <Plus className="w-3 h-3 mr-2" /> Inject Size Spec
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end items-center space-x-6 pt-10 border-t border-border">
                        <Link 
                            href="/products" 
                            className="py-4 px-8 border border-border rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-sm"
                        >
                            Abort Configuration
                        </Link>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="py-4 px-10 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center"
                        >
                            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>}
                            {loading ? 'Processing...' : 'Deploy Asset to Cloud'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
