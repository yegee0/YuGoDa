import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/app/store/useStore';
import toast from 'react-hot-toast';
import {
  Trash2, Plus, Minus, CreditCard, Banknote, Wallet,
  ChevronRight, X, ShoppingBag, Truck, Package, Check, Shield
} from 'lucide-react';
import { api } from '@/lib/api';

const TL = (amount: number) => `₺${amount.toFixed(2)}`;

const STEPS = ['Cart', 'Delivery', 'Payment', 'Confirm'] as const;
type Step = typeof STEPS[number];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateCartQuantity, clearCart } = useStore();
  const [step, setStep] = useState<Step>('Cart');
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'takeaway'>('delivery');
  const [tip, setTip] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'wallet'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [show3DSecure, setShow3DSecure] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = deliveryOption === 'delivery' ? 15.00 : 0;
  const total = subtotal + deliveryFee + tip;

  const stepIndex = STEPS.indexOf(step);

  const handleConfirmOrder = async () => {
    setIsProcessing(true);
    try {
      const restaurantGroups = cart.reduce((acc, item) => {
        if (!acc[item.restaurantId]) acc[item.restaurantId] = [];
        acc[item.restaurantId].push(item);
        return acc;
      }, {} as Record<string, typeof cart>);

      for (const [restaurantId, items] of Object.entries(restaurantGroups)) {
        await api.post('/orders', {
          restaurantId,
          bagId: items[0].id,
          restaurantName: items[0].restaurantName,
          items,
          price: items.reduce((s, i) => s + i.price * i.quantity, 0),
          tipAmount: tip,
          deliveryFee,
          total,
          deliveryType: deliveryOption,
          paymentMethod,
        });
      }

      if (paymentMethod === 'card') {
        setShow3DSecure(true);
      } else {
        clearCart();
        toast.success('Your order has been received!');
        navigate('/discover');
      }
    } catch (error) {
      console.error('Order creation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d]">
      {/* Top bar */}
      <div className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-white/5 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <span className="font-bold text-gray-900 dark:text-white text-lg">Checkout</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  i === stepIndex
                    ? 'bg-[#1A4D2E] text-white'
                    : i < stepIndex
                    ? 'text-[#1A4D2E] dark:text-green-400'
                    : 'text-gray-300 dark:text-white/20'
                }`}>
                  {i < stepIndex ? <Check className="w-3 h-3" /> : null}
                  <span className="hidden sm:inline">{s}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-px ${i < stepIndex ? 'bg-[#1A4D2E]' : 'bg-gray-200 dark:bg-white/10'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

        {/* ── Main panel ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >

            {/* STEP 1 — Cart */}
            {step === 'Cart' && (
              <>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Your Items</h2>
                {cart.length === 0 ? (
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-12 text-center">
                    <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 flex items-center gap-4 shadow-sm"
                      >
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">{item.name}</h3>
                          <p className="text-xs text-gray-400 mb-1">{item.restaurantName}</p>
                          <span className="text-sm font-bold text-[#1A4D2E] dark:text-green-400">{TL(item.price)}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 rounded-xl p-1">
                          <button
                            onClick={() => item.quantity > 1 ? updateCartQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-white/10 transition-colors text-gray-500"
                          >
                            {item.quantity > 1 ? <Minus className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5 text-red-400" />}
                          </button>
                          <span className="w-7 text-center font-bold text-sm dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-white/10 transition-colors text-gray-500"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* STEP 2 — Delivery */}
            {step === 'Delivery' && (
              <>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Delivery Options</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'delivery', label: 'Delivery', sub: `+${TL(15)} fee`, icon: Truck },
                    { id: 'takeaway', label: 'Take Away', sub: 'Free', icon: Package },
                  ].map(({ id, label, sub, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setDeliveryOption(id as any)}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${
                        deliveryOption === id
                          ? 'border-[#1A4D2E] bg-[#1A4D2E]/5 dark:bg-[#1A4D2E]/10'
                          : 'border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a1a1a]'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-3 ${deliveryOption === id ? 'text-[#1A4D2E]' : 'text-gray-400'}`} />
                      <p className="font-bold text-gray-900 dark:text-white">{label}</p>
                      <p className={`text-xs mt-0.5 font-medium ${deliveryOption === id ? 'text-[#1A4D2E]' : 'text-gray-400'}`}>{sub}</p>
                    </button>
                  ))}
                </div>

                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1 pt-2">Add a Tip</h2>
                <div className="grid grid-cols-4 gap-3">
                  {[0, 10, 20, 50].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setTip(amount)}
                      className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                        tip === amount
                          ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white'
                          : 'bg-white dark:bg-[#1a1a1a] border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {amount === 0 ? 'None' : `₺${amount}`}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* STEP 3 — Payment */}
            {step === 'Payment' && (
              <>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Payment Method</h2>
                <div className="space-y-3">
                  {[
                    { id: 'card',   label: 'Credit / Debit Card',  sub: 'Secure via İyzico infrastructure', icon: CreditCard },
                    { id: 'wallet', label: 'YuGoPay Wallet',        sub: 'Pay from your YuGoDa balance',     icon: Wallet },
                    { id: 'cash',   label: 'Cash on Delivery',      sub: 'Pay when you receive your order',  icon: Banknote },
                  ].map(({ id, label, sub, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id as any)}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                        paymentMethod === id
                          ? 'border-[#1A4D2E] bg-[#1A4D2E]/5 dark:bg-[#1A4D2E]/10'
                          : 'border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a1a1a]'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === id ? 'bg-[#1A4D2E] text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                      </div>
                      {paymentMethod === id && (
                        <div className="w-5 h-5 rounded-full bg-[#1A4D2E] flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* STEP 4 — Confirm */}
            {step === 'Confirm' && (
              <>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Review Order</h2>
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl divide-y divide-gray-50 dark:divide-white/5 shadow-sm">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-4">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">×{item.quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{TL(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 space-y-2 shadow-sm text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery</span>
                    <span className="font-medium dark:text-gray-300">{deliveryOption === 'delivery' ? TL(deliveryFee) : 'Free'}</span>
                  </div>
                  {tip > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Tip</span>
                      <span className="font-medium dark:text-gray-300">{TL(tip)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-dashed border-gray-100 dark:border-white/10 text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span className="text-[#1A4D2E] dark:text-green-400">{TL(total)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span>Your payment is protected by İyzico's secure payment infrastructure.</span>
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Order summary sidebar ── */}
        <div className="space-y-4 lg:sticky lg:top-24 self-start">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Order Summary</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-medium dark:text-gray-300">{TL(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery fee</span>
                <span className="font-medium dark:text-gray-300">{deliveryOption === 'delivery' ? TL(deliveryFee) : 'Free'}</span>
              </div>
              {tip > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Tip</span>
                  <span className="font-medium dark:text-gray-300">{TL(tip)}</span>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 dark:border-white/10 pt-3 flex justify-between font-bold text-gray-900 dark:text-white">
              <span>Total</span>
              <span className="text-[#1A4D2E] dark:text-green-400 text-lg">{TL(total)}</span>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {stepIndex > 0 && (
              <button
                onClick={() => setStep(STEPS[stepIndex - 1])}
                className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 dark:border-white/10 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm"
              >
                Back
              </button>
            )}
            {stepIndex < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(STEPS[stepIndex + 1])}
                disabled={cart.length === 0}
                className="flex-1 py-3.5 rounded-xl bg-[#1A4D2E] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#133b23] transition-colors disabled:opacity-40 text-sm"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleConfirmOrder}
                disabled={isProcessing || cart.length === 0}
                className="flex-1 py-3.5 rounded-xl bg-[#1A4D2E] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#133b23] transition-colors disabled:opacity-40 text-sm"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>Place Order <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3D Secure Modal */}
      <AnimatePresence>
        {show3DSecure && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-[#161616] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="bg-[#0d0d0d] px-6 py-5 flex items-center justify-between">
                <span className="text-white font-black italic text-xl tracking-tight">iyzico</span>
                <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                  <Shield className="w-3 h-3 text-green-400" />
                  <span className="text-xs font-bold text-white/70 uppercase tracking-widest">3D Secure</span>
                </div>
              </div>

              <div className="p-7 space-y-6">
                <div className="text-center">
                  <p className="text-xs text-gray-400 font-medium mb-1">YuGoDa Food Prevention</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{TL(total)}</p>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 space-y-3">
                  <p className="text-xs text-center text-gray-400 leading-relaxed">
                    Verification code sent to<br />
                    <span className="font-bold text-gray-600 dark:text-gray-300">+90 5** *** 12 34</span>
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="_ _ _ _ _ _"
                    className="w-full text-center tracking-[0.6em] font-black text-xl p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border-2 border-gray-100 dark:border-white/10 focus:border-[#1A4D2E] outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-300"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShow3DSecure(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { clearCart(); toast.success('Your order has been received!'); navigate('/discover'); }}
                    className="flex-1 py-3 rounded-xl bg-[#1A4D2E] text-white font-bold hover:bg-[#133b23] transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Verify
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
