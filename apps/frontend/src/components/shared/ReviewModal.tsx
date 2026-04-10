import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  orderId: string;
  onSubmitted: () => void;
}

export default function ReviewModal({ isOpen, onClose, restaurantId, restaurantName, orderId, onSubmitted }: ReviewModalProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    try {
      await api.post('/reviews', { restaurantId, orderId, rating, comment: comment.trim() || undefined });
      toast.success(t('Review submitted'));
      onSubmitted();
      onClose();
    } catch {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative bg-white dark:bg-[#161616] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{t('Rate your order')}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{restaurantName}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              {/* Star rating */}
              <div className="flex justify-center gap-2">
                {Array.from({ length: 5 }, (_, i) => {
                  const starValue = i + 1;
                  const isFilled = starValue <= (hoveredStar || rating);
                  return (
                    <button
                      key={i}
                      onMouseEnter={() => setHoveredStar(starValue)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(starValue)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          isFilled
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200 dark:text-white/10'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Comment */}
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={t('Write a comment (optional)')}
                rows={3}
                className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]/30 transition-all"
              />

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={rating < 1 || submitting}
                className="w-full py-3.5 bg-[#1A4D2E] text-white rounded-xl font-bold text-sm hover:bg-[#133b23] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t('Submit Review')
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
