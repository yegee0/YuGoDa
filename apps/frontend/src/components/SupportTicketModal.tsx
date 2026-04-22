import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Ticket, CheckCircle2, Loader2, Paperclip, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useStore } from '@/app/store/useStore';
import { api } from '@/lib/api';
import { COLORS, TICKET_PRIORITIES, TICKET_PRIORITY_CONFIG, type TicketPriority } from '@/lib/constants';
import type { Ticket as TicketModel } from '@/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORY_KEYS = [
    { value: 'Order Issue',       i18n: 'ticket_category_order' },
    { value: 'Payment Problem',   i18n: 'ticket_category_payment' },
    { value: 'Account Access',    i18n: 'ticket_category_account' },
    { value: 'Quality Complaint', i18n: 'ticket_category_quality' },
    { value: 'Feature Request',   i18n: 'ticket_category_feature' },
    { value: 'Other',             i18n: 'ticket_category_other' },
] as const;

const PRIORITY_I18N: Record<TicketPriority, string> = {
    Low: 'ticket_priority_low',
    Medium: 'ticket_priority_medium',
    High: 'ticket_priority_high',
    Urgent: 'ticket_priority_urgent',
};

export default function SupportTicketModal({ isOpen, onClose }: Props) {
    const { t } = useTranslation();
    const { user } = useStore();
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [ticketId, setTicketId] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);

    const [form, setForm] = useState<{
        category: string;
        priority: TicketPriority;
        subject: string;
        description: string;
        orderRef: string;
    }>({
        category: '',
        priority: 'Medium',
        subject: '',
        description: '',
        orderRef: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.category) e.category = t('ticket_category_required');
        if (!form.subject.trim()) e.subject = t('ticket_subject_required');
        if (form.description.trim().length < 20) e.description = t('ticket_description_required');
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const data = await api.post<{ success: boolean; ticket: TicketModel }>('/tickets', {
                category: form.category,
                priority: form.priority,
                subject: form.subject.trim(),
                description: form.description.trim(),
                orderRef: form.orderRef.trim() || null,
            });
            setTicketId(data.ticket.id);
            setStep('success');
        } catch {
            // Do NOT fake success. Leave `step` on 'form' so the user can retry with their input intact.
            toast.error(t('ticket_submit_failed'));
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

    const inputCls =
        'w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-[#1B5E52] rounded-2xl px-4 py-3 text-sm outline-none transition-all text-[#1B1B1B] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40';
    const labelCls =
        'text-xs font-bold text-gray-500 dark:text-white/60 uppercase tracking-wider mb-1.5 block';

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
                        className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
                    >
                        {/* Header */}
                        <div
                            className="p-6 flex items-center gap-4"
                            style={{ background: `linear-gradient(135deg, ${COLORS.forest} 0%, ${COLORS.forestDark} 100%)` }}
                        >
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                                <Ticket className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg">{t('ticket_modal_title')}</h2>
                                <p className="text-white/70 text-xs">{t('ticket_modal_subtitle')}</p>
                            </div>
                            <button
                                onClick={handleClose}
                                aria-label={t('Cancel')}
                                className="ml-auto p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
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
                                        <label className={labelCls}>{t('ticket_category')} *</label>
                                        <div className="relative">
                                            <select
                                                value={form.category}
                                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                                className={`${inputCls} appearance-none pr-10`}
                                            >
                                                <option value="">{t('ticket_category_placeholder')}</option>
                                                {CATEGORY_KEYS.map(c => (
                                                    <option key={c.value} value={c.value}>{t(c.i18n)}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40 pointer-events-none" />
                                        </div>
                                        {errors.category && <p className="text-eco-secondary text-xs mt-1">{errors.category}</p>}
                                    </div>

                                    {/* Priority */}
                                    <div>
                                        <label className={labelCls}>{t('ticket_priority')}</label>
                                        <div className="flex gap-2">
                                            {TICKET_PRIORITIES.map(p => {
                                                const { activeCls, idleCls } = TICKET_PRIORITY_CONFIG[p];
                                                const isActive = form.priority === p;
                                                return (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setForm(f => ({ ...f, priority: p }))}
                                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2 ${isActive ? activeCls : idleCls}`}
                                                    >
                                                        {t(PRIORITY_I18N[p])}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label className={labelCls}>{t('ticket_subject')} *</label>
                                        <input
                                            type="text"
                                            value={form.subject}
                                            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                            placeholder={t('ticket_subject_placeholder')}
                                            className={inputCls}
                                        />
                                        {errors.subject && <p className="text-eco-secondary text-xs mt-1">{errors.subject}</p>}
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className={labelCls}>{t('ticket_description')} *</label>
                                        <textarea
                                            value={form.description}
                                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                            placeholder={t('ticket_description_placeholder')}
                                            rows={4}
                                            className={`${inputCls} resize-none`}
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            {errors.description
                                                ? <p className="text-eco-secondary text-xs">{errors.description}</p>
                                                : <span />
                                            }
                                            <p
                                                className={`text-[10px] font-medium ml-auto ${form.description.length < 20 ? 'text-gray-400 dark:text-white/40' : 'text-[#1B5E52] dark:text-eco-lime'}`}
                                            >
                                                {t('ticket_description_count', { count: form.description.length })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Order Ref (optional) */}
                                    <div>
                                        <label className={labelCls}>
                                            {t('ticket_order_ref')}{' '}
                                            <span className="text-gray-400 dark:text-white/40 font-normal normal-case">
                                                {t('ticket_order_ref_optional')}
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.orderRef}
                                            onChange={e => setForm(f => ({ ...f, orderRef: e.target.value }))}
                                            placeholder={t('ticket_order_ref_placeholder')}
                                            className={inputCls}
                                        />
                                    </div>

                                    {/* Attachment UI — File[] collection is inert server-side; the POST body does not include attachments.
                                        Kept the dropzone interactive so users can still stage files locally, but the coming-soon note
                                        signals that nothing is actually uploaded. */}
                                    <div className="space-y-3">
                                        <label className="border-2 border-dashed border-gray-200 dark:border-white/15 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-[#1B5E52] transition-colors">
                                            <Paperclip className="w-5 h-5 text-gray-400 dark:text-white/40" />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-700 dark:text-white">{t('ticket_attach_title')}</p>
                                                <p className="text-[11px] text-gray-400 dark:text-white/40">{t('ticket_attach_hint')}</p>
                                                <p className="text-[10px] italic text-amber-600 dark:text-amber-400 mt-1">{t('ticket_attachments_coming_soon')}</p>
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
                                                    <div key={i} className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 text-[#1B1B1B] dark:text-white px-3 py-1.5 rounded-xl text-xs">
                                                        <span className="max-w-[120px] truncate">{file.name}</span>
                                                        <button
                                                            onClick={() => removeAttachment(i)}
                                                            className="text-gray-400 hover:text-eco-secondary transition-colors"
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
                                        className="w-full py-4 bg-[#1B5E52] text-white rounded-2xl font-bold text-sm hover:bg-[#164d43] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#1B5E52]/20"
                                    >
                                        {loading ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> {t('ticket_submitting')}</>
                                        ) : (
                                            <><Ticket className="w-4 h-4" /> {t('ticket_submit')}</>
                                        )}
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    className="p-10 text-center space-y-5"
                                >
                                    <div className="w-20 h-20 bg-[#1B5E52]/10 dark:bg-[#1B5E52]/25 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="w-10 h-10 text-[#1B5E52]" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-[#1B1B1B] dark:text-white">{t('ticket_success_title')}</h3>
                                        <p className="text-gray-500 dark:text-white/60 mt-2 text-sm">
                                            {t('ticket_success_body')}{' '}
                                            <span className="font-bold text-[#1B5E52] dark:text-eco-lime">{user?.email}</span>
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4">
                                        <p className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-widest mb-1">{t('ticket_id_label')}</p>
                                        <p className="text-2xl font-mono font-black text-[#1B5E52] dark:text-eco-lime">{ticketId}</p>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="w-full py-3 bg-[#1B5E52] text-white rounded-2xl font-bold text-sm hover:bg-[#164d43] transition-all"
                                    >
                                        {t('ticket_back_to_app')}
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
