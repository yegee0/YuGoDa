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
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-[#1A1A1A] shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Your Basket')}</h2>
                  {totalItems > 0 && (
                    <p className="text-xs text-gray-500">{totalItems} {totalItems === 1 ? t('item') : t('items')}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('Your basket is empty')}</h3>
                  <p className="text-sm text-gray-500 max-w-[200px]">{t('Add some delicious surprise bags to get started!')}</p>
                  <button
                    onClick={onClose}
                    className="px-8 py-3 bg-[#1A4D2E] text-white rounded-2xl font-bold shadow-lg shadow-[#1A4D2E]/20"
                  >
                    {t('Browse Bags')}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover shadow-sm flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500 mb-2">{item.restaurantName}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1A4D2E] text-sm">₺{item.price.toFixed(2)}</span>
                          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg p-1 border border-gray-100 dark:border-gray-700">
                            <button
                              onClick={() => item.quantity > 1 ? updateCartQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-500"
                            >
                              {item.quantity > 1 ? <Minus className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                            </button>
                            <span className="text-xs font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-500"
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
              <div className="p-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t('Subtotal')}</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">₺{subtotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-400">{t('Taxes and delivery fees calculated at checkout')}</p>

                <button
                  onClick={onProceedToCheckout}
                  className="w-full py-4 bg-[#1A4D2E] text-white rounded-2xl font-bold shadow-lg shadow-[#1A4D2E]/20 flex items-center justify-center gap-3 group"
                >
                  {t('Proceed to Checkout')}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium">
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
