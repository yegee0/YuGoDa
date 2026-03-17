import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowRight, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const faqs = [
        { q: "How much does it cost?", a: "Joining YuGoDa is free. We only charge a small commission on the surprise bags you successfully sell through our platform." },
        { q: "What kind of food can I sell?", a: "Any surplus food that is still perfectly good! This includes baked goods, prepared meals, produce, and packaged items." },
        { q: "How do I pack a Surprise Bag?", a: "You simply pack surplus food into a bag. The contents are a surprise, but the value should be roughly 3x the price paid." },
        { q: "When do customers pick up?", a: "You set a specific pickup window (e.g., the last 30 minutes before closing) that works best for your operations." }
    ];


    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col overflow-x-hidden">
            {/* Navbar */}
            <header className="flex items-center justify-between px-6 py-4 fixed top-0 w-full bg-white z-[50] shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold tracking-tight text-[#1A4D2E]">YuGoDa</h1>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/business-auth?mode=login')} className="hidden sm:block px-4 py-2 font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors text-sm">
                        Partner Portal
                    </button>
                    <button onClick={() => navigate('/auth?mode=login')} className="hidden sm:block px-4 py-2 font-medium hover:bg-gray-100 rounded-full transition-colors">
                        Log in
                    </button>
                    <button onClick={() => navigate('/auth?mode=signup')} className="hidden sm:block px-4 py-2 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-colors">
                        Sign up
                    </button>
                </div>
            </header>

            {/* Side Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-[60]"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-[300px] bg-white z-[70] shadow-2xl flex flex-col"
                        >
                            <div className="p-6">
                                <button onClick={() => setIsMenuOpen(false)} className="mb-6 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                                <div className="flex flex-col gap-3">
                                    <button onClick={() => navigate('/auth?mode=signup')} className="w-full py-4 bg-[#0a0a0a] text-white text-[15px] font-bold rounded-xl hover:bg-gray-900 transition-colors">
                                        Sign up
                                    </button>
                                    <button onClick={() => navigate('/auth?mode=login')} className="w-full py-4 bg-[#f3f4f6] text-black text-[15px] font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                        Log in
                                    </button>
                                </div>

                                <div className="mt-10 flex flex-col gap-6 pl-1 flex-1">
                                    <Link to="/business-auth?mode=signup" className="flex items-center text-[15px] font-medium text-gray-900 hover:text-black transition-colors">
                                        Create a business account
                                    </Link>
                                </div>
                                
                                <div className="mt-auto pt-6 border-t border-gray-100">
                                    <Link to="/admin-auth" className="flex items-center gap-2 text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
                                        <Lock className="w-4 h-4" /> Admin Access
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <main className="flex-1 mt-[72px] relative flex flex-col">
                {/* Background image covering everything (fixed) */}
                <div className="fixed inset-0 z-0">
                    <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop" alt="Background" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay */}
                </div>

                {/* Hero Section */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[calc(100vh-72px)] relative z-10 w-full">
                    <div className="max-w-xl mx-auto space-y-8">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                            Save food. Save money.
                        </h2>
                        <p className="text-lg text-white/90 max-w-md mx-auto">
                            Join millions of users helping to reduce food waste by rescuing delicious surplus food at a fraction of the cost from local restaurants.
                        </p>

                        <div className="pt-4">
                            <button onClick={() => navigate('/auth?mode=signup')} className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-2xl flex items-center justify-center gap-2 mx-auto">
                                Get Started for Free <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="relative z-10 w-full max-w-4xl mx-auto p-4 md:p-8 pb-24">
                    <div className="bg-[#111111]/90 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border border-white/5">
                        <h2 className="text-2xl font-bold mb-8 text-white tracking-tight">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <details key={i} className="group bg-transparent rounded-2xl p-5 cursor-pointer border border-[#333333] hover:border-gray-500 transition-colors">
                                    <summary className="font-bold text-[15px] list-none flex justify-between items-center text-white outline-none">
                                        {faq.q} <span className="text-[#00cc99] text-2xl font-light leading-[0] pt-1 group-open:rotate-45 transition-transform">+</span>
                                    </summary>
                                    <p className="mt-4 text-sm text-gray-300 leading-relaxed">{faq.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
