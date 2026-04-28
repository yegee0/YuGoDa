import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/app/store/useStore';
import toast from 'react-hot-toast';
import {
  Trash2, Plus, Minus, CreditCard, Banknote, Wallet,
  ChevronRight, X, ShoppingBag, Truck, Package, Check, Shield
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { TL } from '@/lib/formatters';

const STEP_KEYS = ['Cart', 'Delivery', 'Payment', 'Confirm'] as const;
type Step = typeof STEP_KEYS[number];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cart, removeFromCart, updateCartQuantity, clearCart, userProfile } = useStore();
  const [step, setStep] = useState<Step>('Cart');

  const STEPS = useMemo(() => [
    { key: 'Cart' as const,     label: t('checkout_step_cart') },
    { key: 'Delivery' as const, label: t('checkout_step_delivery') },
    { key: 'Payment' as const,  label: t('checkout_step_payment') },
    { key: 'Confirm' as const,  label: t('checkout_step_confirm') },
  ], [t]);
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'takeaway'>('delivery');
  const [tip, setTip] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'wallet'>('card');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '' });
  const [cardErrors, setCardErrors] = useState({ number: '', expiry: '', cvv: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [show3DSecure, setShow3DSecure] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = deliveryOption === 'delivery' ? 15.00 : 0;
  const total = subtotal + deliveryFee + tip;

  const stepIndex = STEPS.findIndex(s => s.key === step);

  const validateCard = (): boolean => {
    const errors = { number: '', expiry: '', cvv: '' };
    const digits = cardDetails.number.replace(/\s/g, '');
    if (digits.length !== 16 || !/^\d+$/.test(digits)) errors.number = t('checkout_validation_card_invalid');
    const expiryMatch = cardDetails.expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!expiryMatch) {
      errors.expiry = t('checkout_validation_expiry_invalid');
    } else {
      const month = parseInt(expiryMatch[1]);
      if (month < 1 || month > 12) errors.expiry = t('checkout_validation_month_invalid');
    }
    if (!/^\d{3,4}$/.test(cardDetails.cvv)) errors.cvv = t('checkout_validation_cvc_invalid');
    setCardErrors(errors);
    return !errors.number && !errors.expiry && !errors.cvv;
  };

  const handleConfirmOrder = async () => {
    if (paymentMethod === 'card' && !validateCard()) return;
    setIsProcessing(true);
    try {
      const restaurantGroups = cart.reduce((acc, item) => {
        if (!acc[item.restaurantId]) acc[item.restaurantId] = [];
        acc[item.restaurantId].push(item);
        return acc;
      }, {} as Record<string, typeof cart>);

      // Attach customer delivery coordinates if available and delivery is selected
      const deliveryAddr = deliveryOption === 'delivery'
        ? (userProfile?.addresses ?? []).find(a => a.latitude && a.longitude)
        : undefined;

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
          ...(deliveryAddr ? { deliveryLat: deliveryAddr.latitude, deliveryLng: deliveryAddr.longitude } : {}),
        });
      }

      if (paymentMethod === 'card') {
        setShow3DSecure(true);
      } else {
        clearCart();
        toast.success(t('Order received'));
        navigate('/discover');
      }
    } catch (error) {
      console.error('Order creation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1b5e52' }}>
      {/* Top bar */}
      <div className="border-b sticky top-0 z-10" style={{ backgroundColor: '#1b5e52', borderColor: 'rgba(0,0,0,0.12)' }}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/15"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <span className="font-bold text-white text-lg">{t('Checkout')}</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.key}>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  i === stepIndex
                    ? 'bg-[#164d43] text-white ring-1 ring-white/30'
                    : i < stepIndex
                    ? 'text-white'
                    : 'text-white/40'
                }`}>
                  {i < stepIndex ? <Check className="w-3 h-3" /> : null}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-px ${i < stepIndex ? 'bg-white/50' : 'bg-white/20'}`} />
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
                <h2 className="text-sm font-bold text-[#8FA396] uppercase tracking-widest px-1">{t('Your Items')}</h2>
                {cart.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center">
                    <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-[#8FA396] font-medium">{t('Your cart is empty')}</p>
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
                        className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm"
                      >
                        <img src={item.image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'; }} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[#1B1B1B] truncate">{item.name}</h3>
                          <p className="text-xs text-[#8FA396] mb-1">{item.restaurantName}</p>
                          <span className="text-sm font-bold text-[#1B5E52]">{TL(item.price)}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-[#F5F0E8] rounded-xl p-1">
                          <button
                            onClick={() => item.quantity > 1 ? updateCartQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-[#8FA396]"
                          >
                            {item.quantity > 1 ? <Minus className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5 text-red-400" />}
                          </button>
                          <span className="w-7 text-center font-bold text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-[#8FA396]"
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
                <h2 className="text-sm font-bold text-[#8FA396] uppercase tracking-widest px-1">{t('Delivery Options')}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'delivery', label: t('Delivery'), sub: `+${TL(15)} fee`, icon: Truck },
                    { id: 'takeaway', label: t('Take Away'), sub: t('Free'), icon: Package },
                  ].map(({ id, label, sub, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setDeliveryOption(id as 'delivery' | 'takeaway')}
                      className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                        deliveryOption === id
                          ? 'border-[#1B5E52] bg-[#ffffff]'
                          : 'border-[#748f2b] bg-[#748f2b]'
                      }`}
                    >
                      <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        deliveryOption === id
                          ? 'border-[#1B5E52] bg-[#1B5E52]'
                          : 'border-white/50 bg-transparent'
                      }`}>
                        {deliveryOption === id && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <Icon className={`w-6 h-6 mb-3 ${deliveryOption === id ? 'text-[#1B5E52]' : 'text-white'}`} />
                      <p className={`font-bold ${deliveryOption === id ? 'text-[#1B1B1B]' : 'text-white'}`}>{label}</p>
                      <p className={`text-xs mt-0.5 font-medium ${deliveryOption === id ? 'text-[#8FA396]' : 'text-white/70'}`}>{sub}</p>
                    </button>
                  ))}
                </div>

                <h2 className="text-sm font-bold text-[#8FA396] uppercase tracking-widest px-1 pt-2">Add a Tip</h2>
                <div className="grid grid-cols-4 gap-3">
                  {[0, 10, 20, 50].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setTip(amount)}
                      className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                        tip === amount
                          ? 'bg-[#ffffff] border-[#1B5E52] text-[#1B1B1B]'
                          : 'bg-[#748f2b] border-[#748f2b] text-white'
                      }`}
                    >
                      {amount === 0 ? t('None') : `₺${amount}`}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* STEP 3 — Payment */}
            {step === 'Payment' && (
              <>
                <h2 className="text-sm font-bold text-[#8FA396] uppercase tracking-widest px-1">{t('Payment Method')}</h2>
                <div className="space-y-3">
                  {[
                    { id: 'card',   label: t('Credit / Debit Card'),  sub: t('Secure via iyzico'), icon: CreditCard },
                    { id: 'wallet', label: t('YuGoPay Wallet'),        sub: t('Pay from balance'),     icon: Wallet },
                    { id: 'cash',   label: t('Cash on Delivery'),      sub: t('Pay on receive'),  icon: Banknote },
                  ].map(({ id, label, sub, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id as 'card' | 'cash' | 'wallet')}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                        paymentMethod === id
                          ? 'border-[#1B5E52] bg-[#ffffff]'
                          : 'border-[#748f2b] bg-[#748f2b]'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === id ? 'bg-[#1B5E52] text-white' : 'bg-[#5a7a1a] text-white'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className={`font-bold text-sm ${paymentMethod === id ? 'text-[#1B1B1B]' : 'text-white'}`}>{label}</p>
                        <p className={`text-xs mt-0.5 ${paymentMethod === id ? 'text-[#8FA396]' : 'text-white/70'}`}>{sub}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === id
                          ? 'border-[#1B5E52] bg-[#1B5E52]'
                          : 'border-white/50 bg-transparent'
                      }`}>
                        {paymentMethod === id && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Card details form — shown only when card is selected */}
                {paymentMethod === 'card' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-5 border-2 border-[#1B5E52]/20 space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-[#1B5E52]" />
                      <span className="text-sm font-bold text-gray-700">Card Details</span>
                    </div>

                    {/* Card number */}
                    <div>
                      <label className="text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block">Card Number</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        value={cardDetails.number}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                          const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
                          setCardDetails(d => ({ ...d, number: formatted }));
                          setCardErrors(er => ({ ...er, number: '' }));
                        }}
                        className={`w-full px-4 py-3 rounded-xl bg-[#F5F0E8] border text-sm text-[#1B1B1B] placeholder-gray-300 focus:outline-none transition-colors tracking-widest ${cardErrors.number ? 'border-red-400' : 'border-[#E8E0D5] focus:border-[#1B5E52]'}`}
                      />
                      {cardErrors.number && <p className="text-xs text-red-500 mt-1">{cardErrors.number}</p>}
                    </div>

                    {/* Expiry + CVV */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block">Expiry</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardDetails.expiry}
                          onChange={e => {
                            let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
                            setCardDetails(d => ({ ...d, expiry: val }));
                            setCardErrors(er => ({ ...er, expiry: '' }));
                          }}
                          className={`w-full px-4 py-3 rounded-xl bg-[#F5F0E8] border text-sm text-[#1B1B1B] placeholder-gray-300 focus:outline-none transition-colors ${cardErrors.expiry ? 'border-red-400' : 'border-[#E8E0D5] focus:border-[#1B5E52]'}`}
                        />
                        {cardErrors.expiry && <p className="text-xs text-red-500 mt-1">{cardErrors.expiry}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block">CVV</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          placeholder="•••"
                          maxLength={4}
                          value={cardDetails.cvv}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setCardDetails(d => ({ ...d, cvv: val }));
                            setCardErrors(er => ({ ...er, cvv: '' }));
                          }}
                          className={`w-full px-4 py-3 rounded-xl bg-[#F5F0E8] border text-sm text-[#1B1B1B] placeholder-gray-300 focus:outline-none transition-colors ${cardErrors.cvv ? 'border-red-400' : 'border-[#E8E0D5] focus:border-[#1B5E52]'}`}
                        />
                        {cardErrors.cvv && <p className="text-xs text-red-500 mt-1">{cardErrors.cvv}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {/* STEP 4 — Confirm */}
            {step === 'Confirm' && (
              <>
                <h2 className="text-sm font-bold text-[#8FA396] uppercase tracking-widest px-1">{t('Review Order')}</h2>
                <div className="bg-white rounded-2xl divide-y divide-[#F5F0E8] shadow-sm">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-4">
                      <img src={item.image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'} alt={item.name} className="w-10 h-10 rounded-lg object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'; }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#1B1B1B] truncate">{item.name}</p>
                        <p className="text-xs text-[#8FA396]">×{item.quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-700">{TL(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl p-4 space-y-2 shadow-sm text-sm">
                  <div className="flex justify-between text-[#8FA396]">
                    <span>{t('Delivery')}</span>
                    <span className="font-medium">{deliveryOption === 'delivery' ? TL(deliveryFee) : t('Free')}</span>
                  </div>
                  {tip > 0 && (
                    <div className="flex justify-between text-[#8FA396]">
                      <span>{t('Tip')}</span>
                      <span className="font-medium">{TL(tip)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-dashed border-[#E8E0D5] text-[#1B1B1B]">
                    <span>{t('Total')}</span>
                    <span className="text-[#1B5E52]">{TL(total)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#8FA396] px-1">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span>{t('Payment protected')}</span>
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Order summary sidebar ── */}
        <div className="space-y-4 lg:sticky lg:top-24 self-start">
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-[#1B1B1B] text-sm">{t('Order Summary')}</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#8FA396]">
                <span>{t('Subtotal')} ({cart.reduce((s, i) => s + i.quantity, 0)} {t('items')})</span>
                <span className="font-medium">{TL(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#8FA396]">
                <span>{t('Delivery fee')}</span>
                <span className="font-medium">{deliveryOption === 'delivery' ? TL(deliveryFee) : t('Free')}</span>
              </div>
              {tip > 0 && (
                <div className="flex justify-between text-[#8FA396]">
                  <span>{t('Tip')}</span>
                  <span className="font-medium">{TL(tip)}</span>
                </div>
              )}
            </div>
            <div className="border-t border-[#E8E0D5] pt-3 flex justify-between font-bold text-[#1B1B1B]">
              <span>{t('Total')}</span>
              <span className="text-[#1B5E52] text-lg">{TL(total)}</span>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {stepIndex > 0 && (
              <button
                onClick={() => setStep(STEPS[stepIndex - 1].key)}
                className="flex-1 py-3.5 rounded-xl bg-white/15 border border-white/25 font-bold text-white hover:bg-white/25 transition-colors text-sm"
              >
                {t('Back')}
              </button>
            )}
            {stepIndex < STEPS.length - 1 ? (
              <button
                onClick={() => {
                  if (step === 'Payment' && paymentMethod === 'card' && !validateCard()) return;
                  setStep(STEPS[stepIndex + 1].key);
                }}
                disabled={cart.length === 0}
                className="flex-1 py-3.5 rounded-xl bg-[#1B5E52] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#164d43] transition-colors disabled:opacity-40 text-sm"
              >
                {t('Continue')} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleConfirmOrder}
                disabled={isProcessing || cart.length === 0}
                className="flex-1 py-3.5 rounded-xl bg-[#1B5E52] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#164d43] transition-colors disabled:opacity-40 text-sm"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    {t('Processing')}
                  </>
                ) : (
                  <>{t('Place Order')} <ChevronRight className="w-4 h-4" /></>
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
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
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
                  <p className="text-3xl font-black text-[#1B1B1B]">{TL(total)}</p>
                </div>

                <div className="bg-[#F5F0E8] rounded-2xl p-4 space-y-3">
                  <p className="text-xs text-center text-[#8FA396] leading-relaxed">
                    Verification code sent to<br />
                    <span className="font-bold text-gray-600">+90 5** *** 12 34</span>
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="_ _ _ _ _ _"
                    className="w-full text-center tracking-[0.6em] font-black text-xl p-4 bg-white rounded-xl border-2 border-[#E8E0D5] focus:border-[#1B5E52] outline-none transition-colors text-[#1B1B1B] placeholder-gray-300"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShow3DSecure(false)}
                    className="flex-1 py-3 rounded-xl bg-[#F5F0E8] font-bold text-gray-600 hover:bg-[#E8E0D5] transition-colors text-sm"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    // TODO(#74): wire to real iyzico 3DS before production payment cutover
                    onClick={() => { clearCart(); toast.success(t('Order received')); navigate('/discover'); }}
                    className="flex-1 py-3 rounded-xl bg-[#1B5E52] text-white font-bold hover:bg-[#164d43] transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> {t('Verify')}
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
