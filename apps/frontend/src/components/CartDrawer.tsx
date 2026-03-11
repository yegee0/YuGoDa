import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight, 
  CreditCard, 
  Wallet, 
  Truck, 
  Store,
  ShieldCheck,
  Gift
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: (data: any) => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { t } = useTranslation();
  const { cart, removeFromCart, updateCartQuantity, userProfile } = useStore();
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [pickupTime, setPickupTime] = useState<'today' | 'tomorrow'>('today');
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [tip, setTip] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'wallet'>('card');

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const bookingFee = deliveryType === 'delivery' ? 2.50 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + bookingFee + tax + tip;

  const handleCheckout = () => {
    onCheckout({
      items: cart,
      subtotal,
      bookingFee,
      tax,
      tip,
      total,
      deliveryType,
      pickupTime,
      leaveAtDoor,
      paymentMethod,
      promoCode
    });
  };

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
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-[#1A1A1A] shadow-2xl z-[101] flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Your Cart')}</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('Your cart is empty')}</h3>
                  <p className="text-sm text-gray-500 max-w-[200px]">{t('Add some delicious surprise bags to get started!')}</p>
                  <button 
                    onClick={onClose}
                    className="px-8 py-3 bg-[#1A4D2E] text-white rounded-2xl font-bold shadow-lg shadow-[#1A4D2E]/20"
                  >
                    {t('Browse Bags')}
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-4 p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <img src={item.image} alt={item.name} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-white truncate text-base">{item.name}</h4>
                          <p className="text-xs text-gray-500 mb-3">{item.restaurantName}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#1A4D2E] text-sm">${item.price.toFixed(2)}</span>
                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-1 shadow-inner border border-gray-100 dark:border-gray-700">
                              <button 
                                onClick={() => item.quantity > 1 ? updateCartQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
                              >
                                {item.quantity > 1 ? <Minus className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                              </button>
                              <span className="text-xs font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Options */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Delivery Options')}</h3>
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                      <button
                        onClick={() => setDeliveryType('delivery')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                          deliveryType === 'delivery' ? 'bg-white dark:bg-gray-700 text-[#1A4D2E] shadow-sm' : 'text-gray-500'
                        }`}
                      >
                        <Truck className="w-4 h-4" /> {t('Delivery')}
                      </button>
                      <button
                        onClick={() => setDeliveryType('pickup')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                          deliveryType === 'pickup' ? 'bg-white dark:bg-gray-700 text-[#1A4D2E] shadow-sm' : 'text-gray-500'
                        }`}
                      >
                        <Store className="w-4 h-4" /> {t('Take Away')}
                      </button>
                    </div>
                    {deliveryType === 'pickup' && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-500 uppercase">{t('Pickup Time')}</h4>
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                          <button
                            onClick={() => setPickupTime('today')}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                              pickupTime === 'today' ? 'bg-white dark:bg-gray-700 text-[#1A4D2E] shadow-sm' : 'text-gray-500'
                            }`}
                          >
                            {t('Today')}
                          </button>
                          <button
                            onClick={() => setPickupTime('tomorrow')}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                              pickupTime === 'tomorrow' ? 'bg-white dark:bg-gray-700 text-[#1A4D2E] shadow-sm' : 'text-gray-500'
                            }`}
                          >
                            {t('Tomorrow')}
                          </button>
                        </div>
                      </div>
                    )}
                    {deliveryType === 'delivery' && (
                      <label className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={leaveAtDoor}
                          onChange={(e) => setLeaveAtDoor(e.target.checked)}
                          className="w-5 h-5 rounded-lg border-gray-300 text-[#1A4D2E] focus:ring-[#1A4D2E]" 
                        />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-[#1A4D2E] transition-colors">{t('Contactless Delivery')}</p>
                          <p className="text-[10px] text-gray-500">{t('Leave package outside the door')}</p>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Promo Code */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Promo Code')}</h3>
                    <div className="relative">
                      <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" 
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder={t('Enter code')}
                        className="w-full pl-12 pr-24 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm dark:text-white"
                      />
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#1A4D2E] text-white text-xs font-bold rounded-xl">
                        {t('Apply')}
                      </button>
                    </div>
                  </div>

                  {/* Tipping */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Add a Tip')}</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {[2, 5, 10].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setTip(amount)}
                          className={`py-3 rounded-2xl text-sm font-bold transition-all border ${
                            tip === amount 
                              ? 'bg-[#1A4D2E] text-white border-[#1A4D2E]' 
                              : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-100 dark:border-gray-700'
                          }`}
                        >
                          ${amount}
                        </button>
                      ))}
                      <button
                        onClick={() => setTip(0)}
                        className={`py-3 rounded-2xl text-sm font-bold transition-all border ${
                          tip === 0 
                            ? 'bg-[#1A4D2E] text-white border-[#1A4D2E]' 
                            : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-100 dark:border-gray-700'
                        }`}
                      >
                        {t('None')}
                      </button>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Payment Method')}</h3>
                    <div className="space-y-2">
                      {[
                        { id: 'card', label: 'Credit Card', icon: <CreditCard className="w-5 h-5" /> },
                        { id: 'cash', label: 'Cash on Delivery', icon: <ShoppingBag className="w-5 h-5" /> },
                        { id: 'wallet', label: 'Wallet Balance', icon: <Wallet className="w-5 h-5" />, balance: userProfile?.walletBalance }
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                            paymentMethod === method.id 
                              ? 'bg-[#1A4D2E]/5 border-[#1A4D2E] text-[#1A4D2E]' 
                              : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {method.icon}
                            <div className="text-left">
                              <p className="text-sm font-bold">{t(method.label)}</p>
                              {method.id === 'wallet' && (
                                <p className="text-[10px] opacity-70">${method.balance?.toFixed(2) || '0.00'} available</p>
                              )}
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === method.id ? 'border-[#1A4D2E]' : 'border-gray-300'
                          }`}>
                            {paymentMethod === method.id && <div className="w-2.5 h-2.5 bg-[#1A4D2E] rounded-full" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A]/50 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{t('Subtotal')}</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{t('Booking Fee')}</span>
                    <span>${bookingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{t('Tax')}</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  {tip > 0 && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{t('Tip')}</span>
                      <span>${tip.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>{t('Total')}</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-4 bg-[#1A4D2E] text-white rounded-2xl font-bold shadow-lg shadow-[#1A4D2E]/20 flex items-center justify-center gap-3 group"
                >
                  {t('Confirm Order')}
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
