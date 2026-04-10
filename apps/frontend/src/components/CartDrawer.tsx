import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { X, ShoppingBag, Plus, Minus, Trash2, ChevronRight, ShieldCheck } from 'lucide-react';
import { useStore } from '@/app/store/useStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onProceedToCheckout }: CartDrawerProps) {
  const { t } = useTranslation();
  const { cart, removeFromCart, updateCartQuantity } = useStore();

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#E8E0D5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B5E52]/10 flex items-center justify-center text-[#1B5E52]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1B1B1B]">{t('Your Basket')}</h2>
                  {totalItems > 0 && (
                    <p className="text-xs text-[#8FA396]">{totalItems} {totalItems === 1 ? t('item') : t('items')}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#F5F0E8] rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-[#8FA396]" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-[#F5F0E8] flex items-center justify-center text-gray-300">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1B1B1B]">{t('Your basket is empty')}</h3>
                  <p className="text-sm text-[#8FA396] max-w-[200px]">{t('Add some delicious surprise bags to get started!')}</p>
                  <button
                    onClick={onClose}
                    className="px-8 py-3 bg-[#1B5E52] text-white rounded-2xl font-bold shadow-lg shadow-[#1B5E52]/20"
                  >
                    {t('Browse Bags')}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-[#F5F0E8] border border-[#E8E0D5]">
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover shadow-sm flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[#1B1B1B] text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-[#8FA396] mb-2">{item.restaurantName}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1B5E52] text-sm">₺{item.price.toFixed(2)}</span>
                          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-[#E8E0D5]">
                            <button
                              onClick={() => item.quantity > 1 ? updateCartQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                              className="p-1 hover:bg-[#F5F0E8] rounded-md transition-colors text-[#8FA396]"
                            >
                              {item.quantity > 1 ? <Minus className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-[#F5F0E8] rounded-md transition-colors text-[#8FA396]"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-[#E8E0D5] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8FA396]">{t('Subtotal')}</span>
                  <span className="text-lg font-bold text-[#1B1B1B]">₺{subtotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-[#8FA396]">{t('Taxes and delivery fees calculated at checkout')}</p>

                <button
                  onClick={onProceedToCheckout}
                  className="w-full py-4 bg-[#1B5E52] text-white rounded-2xl font-bold shadow-lg shadow-[#1B5E52]/20 flex items-center justify-center gap-3 group"
                >
                  {t('Proceed to Checkout')}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-[#8FA396] font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  {t('Secure payment powered by YuGoDa')}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
