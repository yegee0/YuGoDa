import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Ticket, CheckCircle2, Loader2, Paperclip, ChevronDown } from 'lucide-react';
import { useStore } from '@/app/store/useStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORIES = ['Order Issue', 'Payment Problem', 'Account Access', 'Quality Complaint', 'Feature Request', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function SupportTicketModal({ isOpen, onClose }: Props) {
    const { user, userProfile } = useStore();
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [ticketId, setTicketId] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);

    const [form, setForm] = useState({
        category: '',
        priority: 'Medium',
        subject: '',
        description: '',
        orderRef: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.category) e.category = 'Please select a category.';
        if (!form.subject.trim()) e.subject = 'Subject is required.';
        if (form.description.trim().length < 20) e.description = 'Please describe your issue in at least 20 characters.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);

        try {
            console.log('TODO: Custom backend API - addDoc support ticket', form);

            const shortId = `TKT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            setTicketId(shortId);
            setStep('success');
        } catch (err) {
            console.error('Error creating ticket:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep('form');
        setForm({ category: '', priority: 'Medium', subject: '', description: '', orderRef: '' });
        setAttachments([]);
        setErrors({});
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...newFiles]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }}
                        className="bg-white dark:bg-[#121212] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-br from-[#1A4D2E] to-[#2D6A4F] p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                                <Ticket className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg">Open a Support Ticket</h2>
                                <p className="text-white/60 text-xs">Our team responds within 24 hours</p>
                            </div>
                            <button onClick={handleClose} className="ml-auto p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Body */}
                        <AnimatePresence mode="wait">
                            {step === 'form' ? (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
                                >
                                    {/* Category */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Category *</label>
                                        <div className="relative">
                                            <select
                                                value={form.category}
                                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                                className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-[#1A4D2E] rounded-2xl px-4 py-3 text-sm font-medium dark:text-white outline-none transition-all"
                                            >
                                                <option value="">Select a category...</option>
                                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                                    </div>

                                    {/* Priority */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Priority</label>
                                        <div className="flex gap-2">
                                            {PRIORITIES.map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setForm(f => ({ ...f, priority: p }))}
                                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2 ${form.priority === p
                                                            ? p === 'Urgent' ? 'bg-red-500 border-red-500 text-white'
                                                                : p === 'High' ? 'bg-orange-500 border-orange-500 text-white'
                                                                    : p === 'Medium' ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white'
                                                                        : 'bg-gray-200 border-gray-200 text-gray-700'
                                                            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Subject *</label>
                                        <input
                                            type="text"
                                            value={form.subject}
                                            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                            placeholder="Brief summary of your issue..."
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-[#1A4D2E] rounded-2xl px-4 py-3 text-sm dark:text-white outline-none transition-all"
                                        />
                                        {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Description *</label>
                                        <textarea
                                            value={form.description}
                                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                            placeholder="Please describe the issue in detail. Include steps to reproduce, what you expected, and what happened instead..."
                                            rows={4}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-[#1A4D2E] rounded-2xl px-4 py-3 text-sm dark:text-white outline-none transition-all resize-none"
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            {errors.description
                                                ? <p className="text-red-500 text-xs">{errors.description}</p>
                                                : <span />
                                            }
                                            <p className={`text-[10px] font-medium ml-auto ${form.description.length < 20 ? 'text-gray-400' : 'text-green-500'}`}>
                                                {form.description.length} / 20 min
                                            </p>
                                        </div>
                                    </div>

                                    {/* Order Ref (optional) */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                            Order Reference <span className="text-gray-400 font-normal">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.orderRef}
                                            onChange={e => setForm(f => ({ ...f, orderRef: e.target.value }))}
                                            placeholder="e.g. ECO-1234"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-[#1A4D2E] rounded-2xl px-4 py-3 text-sm dark:text-white outline-none transition-all"
                                        />
                                    </div>

                                    {/* Attachment UI */}
                                    <div className="space-y-3">
                                        <label className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-[#1A4D2E] transition-colors">
                                            <Paperclip className="w-5 h-5 text-gray-400" />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Attach files</p>
                                                <p className="text-[11px] text-gray-400">PNG, JPG, PDF up to 10MB</p>
                                            </div>
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>

                                        {attachments.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {attachments.map((file, i) => (
                                                    <div key={i} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl text-xs">
                                                        <span className="max-w-[120px] truncate dark:text-gray-300">{file.name}</span>
                                                        <button
                                                            onClick={() => removeAttachment(i)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="w-full py-4 bg-[#1A4D2E] text-white rounded-2xl font-bold text-sm hover:bg-[#133b23] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#1A4D2E]/20"
                                    >
                                        {loading ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                                        ) : (
                                            <><Ticket className="w-4 h-4" /> Submit Ticket</>
                                        )}
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    className="p-10 text-center space-y-5"
                                >
                                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold dark:text-white">Ticket Submitted!</h3>
                                        <p className="text-gray-500 mt-2 text-sm">We'll get back to you within 24 hours at <span className="font-bold text-[#1A4D2E]">{user?.email}</span></p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Ticket ID</p>
                                        <p className="text-2xl font-mono font-black text-[#1A4D2E] dark:text-[#2D6A4F]">{ticketId}</p>
                                    </div>
                                    <button onClick={handleClose} className="w-full py-3 bg-[#1A4D2E] text-white rounded-2xl font-bold text-sm hover:bg-[#133b23] transition-all">
                                        Back to App
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
