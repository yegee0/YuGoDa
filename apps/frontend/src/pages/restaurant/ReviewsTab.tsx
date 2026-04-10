import React from 'react';
import { Star, MessageSquare, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { Review } from '@/types';
import { StatCard } from './StorePanel';

export interface ReviewsTabProps {
  reviews: Review[];
  avgRating: string;
}

export default function ReviewsTab({ reviews, avgRating }: ReviewsTabProps) {
  const { t } = useTranslation();
  return (
    <motion.div key="reviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label={t('Average Rating')} value={`${avgRating} / 5.0`} icon={<Star className="w-5 h-5" />}        color="bg-amber-50 text-amber-500" />
        <StatCard label={t('Total Reviews')}  value={reviews.length}       icon={<MessageSquare className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
        <StatCard
          label={t('5-Star Reviews')}
          value={reviews.filter(r => r.rating === 5).length}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-emerald-50 text-emerald-600"
          sub={`${reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === 5).length / reviews.length) * 100) : 0}%`}
        />
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl py-16 text-center border-2 border-dashed border-[#E8E0D5]">
          <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-bold text-[#8FA396] text-sm">{t('No reviews yet')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="bg-white border border-[#E8E0D5] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1B5E52]/10 text-[#1B5E52] font-black text-sm flex items-center justify-center">
                    {(review.userName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-[#1B1B1B] text-sm">{review.userName || t('Anonymous')}</p>
                    <p className="text-[10px] text-[#8FA396]">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>
              {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
