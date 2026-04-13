import { useState, useEffect } from 'react';
import { Sparkles, MapPin, Clock, Tag, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { TL } from '@/lib/formatters';
import { COLORS } from '@/lib/constants';
import type { ChatRecommendation } from '@/types';

interface RecommendationsResponse {
  success: boolean;
  reply: string;
  recommendations: ChatRecommendation[];
}

export default function AiRecommendations() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<ChatRecommendation[]>([]);
  const [aiMessage, setAiMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api.get<RecommendationsResponse>('/chat/recommendations')
      .then((data) => {
        if (cancelled) return;
        setRecommendations(data.recommendations ?? []);
        setAiMessage(data.reply ?? '');
      })
      .catch(() => {
        // Silently fail — section just won't show
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="mb-6 flex items-center gap-3 px-1">
        <Loader2 className="w-4 h-4 animate-spin text-white/50" />
        <span className="text-xs font-medium text-white/50">{t('ai_recommendations_loading')}</span>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-7 h-7 rounded-lg bg-[#FF9F1C] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white tracking-tight">{t('ai_recommendations_title')}</h2>
          <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider">{t('ai_recommendations_subtitle')}</p>
        </div>
      </div>

      {/* AI Message */}
      {aiMessage && (
        <p className="text-xs text-white/70 mb-4 px-1 leading-relaxed line-clamp-2">{aiMessage}</p>
      )}

      {/* Horizontal Scroll Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {recommendations.slice(0, 5).map((rec) => (
          <motion.div
            key={rec.bagId}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/store/${rec.bagId?.split('-').slice(0, -1).join('-') || ''}`)}
            className="flex-shrink-0 w-56 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 cursor-pointer hover:bg-white/15 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-sm font-bold text-white truncate">{rec.restaurantName}</p>
                {rec.category && (
                  <p className="text-[10px] text-white/50 font-medium">{rec.category}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-[#FF9F1C]">{TL(rec.price)}</p>
                {rec.originalPrice && rec.originalPrice > rec.price && (
                  <p className="text-[10px] text-white/40 line-through">{TL(rec.originalPrice)}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-white/50">
              {rec.distance && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" /> {rec.distance}
                </span>
              )}
              {rec.pickupTime && (
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" /> {rec.pickupTime}
                </span>
              )}
              {rec.dietaryType && (
                <span className="flex items-center gap-0.5">
                  <Tag className="w-3 h-3" /> {rec.dietaryType}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
