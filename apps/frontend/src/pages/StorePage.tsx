import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Heart, ShoppingBag, Plus, Minus, ChevronRight, ChevronDown, MapPin, Clock, FileText, CreditCard, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/app/store/useStore';
import { useParams, useNavigate } from 'react-router-dom';

const storeData = {
  name: 'Pizza Bulls',
  rating: 4.7,
  logo: 'https://picsum.photos/seed/pizza/100/100',
  badges: ['Free Delivery', 'Surplus Deal'],
  hours: 'Monday-Sunday: 00:00 - 03:00 & 11:00 - 23:59',
  address: 'Esentepe Mah. Atom Sok. Kanyon Apt. No: 20 Şişli/İstanbul',
  legalInfo: {
    kep: 'bogagida@hs01.kep.tr',
    mersis: '179062320600028',
    title: 'Boğa Gıda San. ve Tic. A.Ş.',
  },
  paymentMethods: ['Wallet', 'Credit Card', 'Cash', 'Sodexo', 'MultiNet', 'SetCard'],
  deliveryPolicy: 'Fee calculated based on distance.',
  categories: [
    {
      id: 'popular',
      name: 'Popular',
      items: [
        { id: 1, name: 'Margherita', description: 'Classic tomato and mozzarella', price: 12.99, originalPrice: 15.99, image: 'https://picsum.photos/seed/margherita/100/100', stock: 5 },
        { id: 2, name: 'Pepperoni', description: 'Spicy pepperoni and cheese', price: 14.99, originalPrice: 18.99, image: 'https://picsum.photos/seed/pepperoni/100/100', stock: 2 },
      ]
    },
    {
      id: 'surplus',
      name: 'Surplus Bags',
      items: [
        { id: 3, name: 'Mystery Bag', description: 'A surprise selection of items', price: 5.99, originalPrice: 15.99, image: 'https://picsum.photos/seed/mystery/100/100', stock: 10 },
      ]
    },
    {
      id: 'drinks',
      name: 'Drinks',
      items: [
        { id: 5, name: 'Cola', description: 'Refreshing cola', price: 2.99, originalPrice: 2.99, image: 'https://picsum.photos/seed/cola/100/100', stock: 20 },
      ]
    },
  ]
};

function StoreInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm font-bold text-[#1A4D2E] dark:text-green-500"
      >
        <span>Store Info</span>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> {storeData.hours}</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {storeData.address}</div>
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> {storeData.legalInfo.title}</div>
              <div className="text-xs text-gray-500 ml-6">KEP: {storeData.legalInfo.kep} | MERSIS: {storeData.legalInfo.mersis}</div>
              <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-400" /> {storeData.paymentMethods.join(', ')}</div>
              <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-gray-400" /> {storeData.deliveryPolicy}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cart, addToCart, removeFromCart, updateCartQuantity } = useStore();
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const scrollToCategory = (id: string) => {
    categoryRefs.current[id]?.scrollIntoView({ behavior: 'smooth' });
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="flex h-full bg-white dark:bg-black text-gray-900 dark:text-white">
      {/* Left/Center Column (70%) */}
      <div className="flex-1 overflow-y-auto">
        {/* Store Header */}
        <div className="p-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <img src={storeData.logo} alt={storeData.name} className="w-20 h-20 rounded-2xl" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{storeData.name}</h1>
              <div className="flex items-center gap-2 text-[#1A4D2E] dark:text-green-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-lg font-bold">{storeData.rating}</span>
              </div>
            </div>
            <button className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <Heart className="w-6 h-6" />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            {storeData.badges.map(badge => (
              <span key={badge} className="px-3 py-1 bg-[#1A4D2E]/10 dark:bg-green-900/50 text-[#1A4D2E] dark:text-green-300 rounded-full text-xs font-bold">{badge}</span>
            ))}
          </div>
          <StoreInfo />
        </div>

        {/* Category Navigation (Sticky) */}
        <div className="sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-10 p-4 flex gap-4">
          {storeData.categories.map(cat => (
            <button key={cat.id} onClick={() => scrollToCategory(cat.id)} className="px-4 py-2 hover:text-[#1A4D2E] dark:hover:text-green-500 font-bold text-sm transition-colors">
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="p-8 space-y-8">
          {storeData.categories.map(cat => (
            <div key={cat.id} ref={el => categoryRefs.current[cat.id] = el}>
              <h2 className="text-2xl font-bold mb-4">{cat.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cat.items.map(item => (
                  <div key={item.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl flex items-center justify-between border border-gray-200 dark:border-gray-800 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[#1A4D2E] dark:text-green-500 font-bold">${item.price.toFixed(2)}</span>
                        {item.price < item.originalPrice && <span className="text-gray-400 line-through text-xs">${item.originalPrice.toFixed(2)}</span>}
                        {item.stock <= 2 && <span className="text-red-500 text-xs font-bold">Only {item.stock} Left</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                      <button onClick={() => addToCart({ 
                        id: item.id.toString(), 
                        restaurantId: id || 'pizza-bulls-id', 
                        restaurantName: storeData.name, 
                        name: item.name, 
                        price: item.price, 
                        quantity: 1, 
                        image: item.image 
                      })} className="w-10 h-10 bg-[#1A4D2E] dark:bg-green-500 text-white dark:text-black rounded-full flex items-center justify-center hover:bg-[#1A4D2E]/90 dark:hover:bg-green-400 transition-colors">
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar (30%) */}
      <div className="w-[30%] bg-white dark:bg-gray-900 p-6 flex flex-col sticky top-0 h-screen border-l border-gray-200 dark:border-gray-800 transition-colors">
        <h2 className="text-xl font-bold mb-6">{t('Your Basket')}</h2>
        
        {/* Delivery/Pickup Toggle */}
        <div className="flex p-1 bg-gray-100 dark:bg-black rounded-xl mb-6">
          <button onClick={() => setDeliveryType('delivery')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${deliveryType === 'delivery' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500'}`}>Delivery</button>
          <button onClick={() => setDeliveryType('pickup')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${deliveryType === 'pickup' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500'}`}>Pickup</button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('Your basket is empty')}</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-gray-50 dark:bg-black p-3 rounded-xl">
                <div className="flex-1">
                  <h4 className="text-sm font-bold">{item.name}</h4>
                  <p className="text-xs text-[#1A4D2E] dark:text-green-500">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => item.quantity > 1 ? updateCartQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)} className="p-1 bg-gray-200 dark:bg-gray-800 rounded"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="p-1 bg-gray-200 dark:bg-gray-800 rounded"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
          <div className="flex justify-between font-bold text-lg mb-4">
            <span>{t('Subtotal')}</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <button onClick={() => navigate('/checkout')} className="w-full py-4 bg-[#1A4D2E] dark:bg-green-500 text-white dark:text-black rounded-2xl font-bold hover:bg-[#1A4D2E]/90 dark:hover:bg-green-400 transition-colors">
            {t('Go to Checkout')}
          </button>
        </div>
      </div>
    </div>
  );
}
