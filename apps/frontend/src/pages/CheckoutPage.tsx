import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/app/store/useStore';
import { Trash2, Plus, Minus, CreditCard, Banknote, Wallet, ChevronRight, X } from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateCartQuantity } = useStore();
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'takeaway'>('delivery');
  const [tip, setTip] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'wallet'>('card');

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = deliveryOption === 'delivery' ? 15.00 : 0;
  const total = subtotal + deliveryFee + tip;

  const [isProcessing, setIsProcessing] = useState(false);
  const [show3DSecure, setShow3DSecure] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Your Cart</h1>
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="space-y-4 mb-8">
          {cart.map(item => (
            <div key={item.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl flex items-center gap-4">
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1">
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.restaurantName}</p>
                <p className="font-bold text-[#1A4D2E] dark:text-green-500">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-black rounded-lg p-1">
                <button onClick={() => item.quantity > 1 ? updateCartQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><Minus className="w-4 h-4" /></button>
                <span className="w-8 text-center font-bold">{item.quantity}</span>
                <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><Plus className="w-4 h-4" /></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Delivery Options */}
        <div className="mb-8">
          <h2 className="font-bold mb-4">DELIVERY OPTIONS</h2>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setDeliveryOption('delivery')} className={`p-4 rounded-2xl border-2 ${deliveryOption === 'delivery' ? 'border-[#1A4D2E] bg-[#1A4D2E]/10' : 'border-gray-200 dark:border-gray-800'}`}>Delivery</button>
            <button onClick={() => setDeliveryOption('takeaway')} className={`p-4 rounded-2xl border-2 ${deliveryOption === 'takeaway' ? 'border-[#1A4D2E] bg-[#1A4D2E]/10' : 'border-gray-200 dark:border-gray-800'}`}>Take Away</button>
          </div>
        </div>

        {/* Tip */}
        <div className="mb-8">
          <h2 className="font-bold mb-4">ADD A TIP</h2>
          <div className="grid grid-cols-4 gap-4">
            {[0, 10, 20, 50].map(amount => (
              <button key={amount} onClick={() => setTip(amount)} className={`p-4 rounded-2xl border-2 font-bold ${tip === amount ? 'border-[#1A4D2E] bg-[#1A4D2E] text-white' : 'border-gray-200 dark:border-gray-800'}`}>
                {amount === 0 ? 'None' : `${amount} TL`}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-8">
          <h2 className="font-bold mb-4">PAYMENT METHOD</h2>
          <div className="space-y-4">
            {[
              { id: 'card', name: 'Credit / Debit Card (İyzico)', icon: CreditCard },
              { id: 'wallet', name: 'Wallet Balance (YuGoPay)', icon: Wallet },
              { id: 'cash', name: 'Cash on Delivery', icon: Banknote },
            ].map(method => (
              <button key={method.id} onClick={() => setPaymentMethod(method.id as any)} className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 ${paymentMethod === method.id ? 'border-[#1A4D2E] bg-[#1A4D2E]/10' : 'border-gray-200 dark:border-gray-800'}`}>
                <method.icon className="w-6 h-6 text-[#1A4D2E]" />
                <div className="text-left">
                  <span className="font-bold border-none">{method.name}</span>
                  {method.id === 'card' && <p className="text-[10px] text-gray-500">Secure payment via iyzico infrastructure</p>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 space-y-2 mb-8">
          <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{subtotal.toFixed(2)} TL</span></div>
          <div className="flex justify-between text-gray-500"><span>Delivery Fee</span><span>{deliveryFee.toFixed(2)} TL</span></div>
          {tip > 0 && <div className="flex justify-between text-gray-500"><span>Tip</span><span>{tip.toFixed(2)} TL</span></div>}
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-dashed border-gray-200 dark:border-gray-800">
            <span>Total</span>
            <span className="text-[#1A4D2E]">{total.toFixed(2)} TL</span>
          </div>
        </div>

        <button
          onClick={() => {
            setIsProcessing(true);
            setTimeout(() => {
              setIsProcessing(false);
              if (paymentMethod === 'card') setShow3DSecure(true);
              else navigate('/discover');
            }, 2000);
          }}
          disabled={isProcessing}
          className="w-full py-4 bg-[#1A4D2E] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#133b23] transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <>Confirm Order <ChevronRight className="w-5 h-5" /></>
          )}
        </button>
      </div>

      <AnimatePresence>
        {show3DSecure && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden text-black"
            >
              <div className="bg-[#1C1C1C] text-white p-6 flex justify-between items-center text-center">
                <div className="text-xl font-black italic">iyzico</div>
                <div className="text-xs font-bold uppercase tracking-widest opacity-50">3D Secure Verification</div>
              </div>
              <div className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-gray-500">Merchant: YuGoDa Prevention Platform</p>
                  <p className="text-2xl font-bold">{total.toFixed(2)} TL</p>
                </div>
                <div className="space-y-4">
                  <p className="text-xs text-center text-gray-500">A verification code has been sent to your mobile phone (+90 5** *** 12 34)</p>
                  <input
                    type="text"
                    placeholder="ENTER 6-DIGIT CODE"
                    className="w-full text-center tracking-[1em] font-bold text-lg p-4 bg-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    maxLength={6}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShow3DSecure(false)}
                      className="flex-1 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => navigate('/discover')}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
