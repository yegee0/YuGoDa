import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, MapPin, Phone, Mail, User, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/shared/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function RestaurantAuth() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    const faqs = [
        { q: "How much does it cost?", a: "Joining YuGoDa is free. We only charge a small commission on the surprise bags you successfully sell through our platform." },
        { q: "What kind of food can I sell?", a: "Any surplus food that is still perfectly good! This includes baked goods, prepared meals, produce, and packaged items." },
        { q: "How do I pack a Surprise Bag?", a: "You simply pack surplus food into a bag. The contents are a surprise, but the value should be roughly 3x the price paid." },
        { q: "When do customers pick up?", a: "You set a specific pickup window (e.g., the last 30 minutes before closing) that works best for your operations." }
    ];


    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        address: '',
        aptUrl: '',
        businessName: '',
        brandName: '',
        businessType: 'Restoran',
        cuisineType: '',
        branches: '1'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMsg('');
        setLoading(true);

        try {
            if (!formData.email || !formData.password || !formData.businessName) {
                throw new Error('Please fill in the required fields: Email, Password, and Business Name');
            }

            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            const displayName = `${formData.firstName} ${formData.lastName}`.trim();
            await updateProfile(user, { displayName });

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: formData.businessName,
                ownerName: displayName,
                phone: formData.phone,
                address: formData.address,
                brandName: formData.brandName,
                businessType: formData.businessType,
                cuisineType: formData.cuisineType,
                branches: formData.branches,
                role: 'restaurant',
                createdAt: serverTimestamp(),
            });

            setMsg('Business account created successfully! You are being redirected...');
            setTimeout(() => {
                navigate('/restaurant');
            }, 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex relative bg-cover bg-center bg-fixed w-full" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=2070')" }}>
            {/* Global Dark Overlay */}
            <div className="absolute inset-0 bg-black/60" />

            <div className="relative z-10 w-full flex flex-col lg:flex-row h-screen">
                {/* Left Panel (Content + FAQ) */}
                <div className="w-full lg:w-1/2 flex flex-col p-8 md:py-16 md:px-20 text-white overflow-y-auto">
                    <div className="max-w-2xl mt-8 lg:mt-12">
                        <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                            Reach Millions of Users with the #1 On-Demand Delivery App
                        </h1>
                        <p className="text-lg text-white/90 mb-10">
                            Sign up to list your business on the YuGoDa platform. Reach more users, reduce food waste, and increase your revenue.
                        </p>
                        <div className="flex gap-4 items-center mb-16">
                            <span className="w-12 h-1 bg-emerald-400" />
                            <span className="text-sm font-bold uppercase tracking-widest text-white/80">
                                Partner Portal
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Panel (Form) */}
                <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto items-center p-4 md:p-8 relative">
                    <div className="w-full max-w-xl bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 shadow-2xl border border-white/20">
                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Get Started</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm">Already have an account?</span>
                                <button onClick={() => navigate('/auth?mode=login')} className="text-[#1A4D2E] text-sm font-bold hover:underline">
                                    Log In
                                </button>
                            </div>

                            {(error || msg) && (
                                <div className={`mt-4 p-4 rounded-xl text-sm font-bold ${error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    {error || msg}
                                </div>
                            )}
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">First Name</label>
                                    <input
                                        type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
                                        className="w-full bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1A4D2E] outline-none transition-all text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Last Name</label>
                                    <input
                                        type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                                        className="w-full bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1A4D2E] outline-none transition-all text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Email address *</label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email" name="email" value={formData.email} onChange={handleChange} required
                                        className="w-full bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#1A4D2E] outline-none transition-all text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Password *</label>
                                <div className="relative">
                                    <ShieldCheck className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="password" name="password" value={formData.password} onChange={handleChange} required
                                        className="w-full bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#1A4D2E] outline-none transition-all text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Phone number</label>
                                <div className="flex gap-2">
                                    <select className="bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-[#1A4D2E] outline-none text-gray-900 dark:text-white">
                                        <option value="US">US +1</option>
                                        <option value="UK">UK +44</option>
                                        <option value="TR">TR +90</option>
                                    </select>
                                    <input
                                        type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                                        className="w-full flex-1 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1A4D2E] outline-none transition-all text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Business name *</label>
                                <div className="relative">
                                    <Store className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text" name="businessName" placeholder="E.g: Sam's Pizza" value={formData.businessName} onChange={handleChange} required
                                        className="w-full bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#1A4D2E] outline-none transition-all text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Business address</label>
                                <div className="relative">
                                    <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text" name="address" placeholder="Start typing..." value={formData.address} onChange={handleChange} required
                                        className="w-full bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#1A4D2E] outline-none transition-all text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Business type</label>
                                <select
                                    name="businessType" value={formData.businessType} onChange={handleChange} required
                                    className="w-full bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1A4D2E] outline-none transition-all appearance-none text-gray-900 dark:text-white"
                                >
                                    <option value="Restaurant">Restaurant</option>
                                    <option value="Grocery Store">Grocery Store</option>
                                    <option value="Bakery & Patisserie">Bakery & Patisserie</option>
                                    <option value="Cafe">Cafe</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#1A4D2E] text-white rounded-xl py-4 font-bold hover:bg-[#133b23] transition-colors shadow-lg disabled:opacity-50 mt-4"
                            >
                                {loading ? 'Processing...' : 'Create Account'}
                            </button>
                            <p className="text-[10px] text-gray-500 text-center mt-4">
                                By continuing, you agree to the Terms and Conditions.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
