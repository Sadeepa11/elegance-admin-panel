'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyMasterPassword } from '../actions/auth';
import { ShieldCheck, Lock, ChevronRight, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await verifyMasterPassword(password);

            if (result.success) {
                sessionStorage.setItem('adminAuthenticated', 'true');
                sessionStorage.setItem('superAdminAuthenticated', result.isSuperAdmin ? 'true' : 'false');
                router.push('/');
            } else {
                setError(result.error || 'Invalid master password');
                setLoading(false);
            }
        } catch (err) {
            setError('An error occurred during authentication');
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="w-full max-w-md p-10 glass-panel rounded-3xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-xl shadow-primary/25 ring-4 ring-white/10">
                        <ShieldCheck className="text-white h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2">
                        ELEGANCE
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium tracking-wide border-y border-white/5 py-2">
                        ADMINISTRATIVE PORTAL
                    </p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-semibold flex items-center animate-in slide-in-from-top-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 shadow-sm animate-pulse"></div>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">
                            Access Key
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-20" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="block w-full !pl-14 !pr-12 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/50 text-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                placeholder="••••••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors p-1 z-20"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center py-4 px-6 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 group"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                Verifying Security...
                            </>
                        ) : (
                            <>
                                Initialize Access
                                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-muted-foreground tracking-widest font-bold uppercase opacity-50">
                        &copy; {new Date().getFullYear()} Elegance Admin Systems
                    </p>
                </div>
            </div>
        </div>
    );
}
