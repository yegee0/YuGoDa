import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, Shield, ChevronDown, ChevronUp, X, Check } from 'lucide-react';

interface CookiePreferences {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
}

const COOKIE_KEY = 'yugoda_cookie_consent';

export default function ConsentNotice() {
    const [show, setShow] = useState(false);
    const [showCustomize, setShowCustomize] = useState(false);
    const [prefs, setPrefs] = useState<CookiePreferences>({
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
    });

    useEffect(() => {
        const saved = localStorage.getItem(COOKIE_KEY);
        if (!saved) {
            setTimeout(() => setShow(true), 1200);
        }
    }, []);

    const saveConsent = (preferences: CookiePreferences) => {
        localStorage.setItem(COOKIE_KEY, JSON.stringify({ preferences, timestamp: Date.now() }));
        setShow(false);
    };

    const acceptAll = () => saveConsent({ necessary: true, analytics: true, marketing: true, functional: true });
    const rejectAll = () => saveConsent({ necessary: true, analytics: false, marketing: false, functional: false });
    const saveCustom = () => saveConsent(prefs);

    const CATEGORIES = [
        {
            key: 'necessary' as const,
            label: 'Necessary Cookies',
            desc: 'Required for the website to function. Cannot be disabled.',
            locked: true,
        },
        {
            key: 'functional' as const,
            label: 'Functional Cookies',
            desc: 'Enable personalized features like language preferences and your saved theme.',
            locked: false,
        },
        {
            key: 'analytics' as const,
            label: 'Analytics Cookies',
            desc: 'Help us understand how visitors interact with our platform to improve the experience.',
            locked: false,
        },
        {
            key: 'marketing' as const,
            label: 'Marketing Cookies',
            desc: 'Used to deliver targeted ads and track campaign performance across platforms.',
            locked: false,
        },
    ];

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 120, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-2xl px-4"
                >
                    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#1A4D2E] to-[#2D6A4F] p-5 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                                <Cookie className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base leading-tight">We value your privacy 🍃</h3>
                                <p className="text-white/70 text-xs mt-0.5">YuGoDa uses cookies to improve your experience and help reduce food waste even better.</p>
                            </div>
                            <button onClick={() => setShow(false)} className="ml-auto p-1.5 hover:bg-white/10 rounded-xl transition-colors">
                                <X className="w-4 h-4 text-white/70" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                We and our partners use cookies and similar technologies to store information on your device. Some are essential for the site to work; others help us improve your experience.
                                You can choose what to allow below, or visit our{' '}
                                <a href="#" className="text-[#1A4D2E] font-semibold hover:underline">Cookie Policy</a> and{' '}
                                <a href="#" className="text-[#1A4D2E] font-semibold hover:underline">Privacy Policy</a>.
                            </p>

                            {/* Customize Section */}
                            <AnimatePresence>
                                {showCustomize && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mb-4 space-y-2 overflow-hidden"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <div key={cat.key} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{cat.label}</p>
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{cat.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => !cat.locked && setPrefs(p => ({ ...p, [cat.key]: !p[cat.key] }))}
                                                    className={`relative w-11 h-6 rounded-full transition-all duration-200 shrink-0 ${prefs[cat.key] ? 'bg-[#1A4D2E]' : 'bg-gray-200 dark:bg-gray-700'
                                                        } ${cat.locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${prefs[cat.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    {cat.locked && <Shield className="absolute inset-0 m-auto w-2.5 h-2.5 text-white/60" />}
                                                </button>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Buttons */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setShowCustomize(!showCustomize)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {showCustomize ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    {showCustomize ? 'Hide options' : 'Customize'}
                                </button>

                                {showCustomize && (
                                    <button
                                        onClick={saveCustom}
                                        className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-[#1A4D2E] text-[#1A4D2E] rounded-2xl text-xs font-bold hover:bg-[#1A4D2E]/5 transition-colors"
                                    >
                                        <Check className="w-3.5 h-3.5" /> Save Preferences
                                    </button>
                                )}

                                <button
                                    onClick={rejectAll}
                                    className="px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Reject Non-Essential
                                </button>

                                <button
                                    onClick={acceptAll}
                                    className="ml-auto flex items-center gap-1.5 px-6 py-2.5 bg-[#1A4D2E] text-white rounded-2xl text-xs font-bold hover:bg-[#133b23] transition-colors shadow-lg shadow-[#1A4D2E]/20"
                                >
                                    <Check className="w-3.5 h-3.5" /> Allow All Cookies
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
