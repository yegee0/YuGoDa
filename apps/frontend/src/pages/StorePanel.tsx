import React, { useState, useEffect } from 'react';
import { Store, Package, Clock, Truck, BarChart3, Plus, Search, Filter, MoreVertical, CheckCircle, XCircle, ChevronRight, MapPin, Camera, MessageSquare, Star, TrendingUp, DollarSign } from 'lucide-react';
import { db } from '@/shared/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, limit, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/app/store/useStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StorePanel() {
  const { t } = useTranslation();
  const { user, userProfile } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'inventory' | 'drivers' | 'profile'>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [storeProfile, setStoreProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddBag, setShowAddBag] = useState(false);
  const [newBag, setNewBag] = useState({ category: 'Bakery', price: 5.99, available: 5, pickupTime: '18:00 - 19:00' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any>(null);

  useEffect(() => {
    if (storeProfile) setEditedProfile(storeProfile);
  }, [storeProfile]);

  const handleUpdateProfile = async () => {
    if (!user || !editedProfile) return;
    try {
      await updateDoc(doc(db, 'stores', user.uid), {
        ...editedProfile,
        updatedAt: serverTimestamp()
      });
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), where('restaurantId', '==', user.uid), orderBy('createdAt', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubInv = onSnapshot(query(collection(db, 'bags'), where('restaurantId', '==', user.uid)), (snapshot) => {
      setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubDrivers = onSnapshot(collection(db, 'drivers'), (snapshot) => {
      setDrivers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubProfile = onSnapshot(doc(db, 'stores', user.uid), (snapshot) => {
      if (snapshot.exists()) setStoreProfile(snapshot.data());
    });

    setLoading(false);
    return () => {
      unsubOrders();
      unsubInv();
      unsubDrivers();
      unsubProfile();
    };
  }, [user]);

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleAddBag = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'bags'), {
        ...newBag,
        restaurantId: user.uid,
        restaurantName: storeProfile?.name || userProfile?.displayName || 'My Store',
        image: 'https://picsum.photos/seed/food/400/300',
        createdAt: serverTimestamp()
      });
      setShowAddBag(false);
    } catch (error) {
      console.error('Error adding bag:', error);
    }
  };

  const stats = [
    { label: 'Today\'s Sales', value: `$${orders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + (o.price || 0), 0).toFixed(2)}`, icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Active Orders', value: orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length.toString(), icon: Package, color: 'text-blue-500' },
    { label: 'Food Saved', value: '42 kg', icon: Store, color: 'text-[#1A4D2E]' },
    { label: 'Rating', value: '4.8', icon: Star, color: 'text-amber-500' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F9F9F9] dark:bg-[#0A0A0A] overflow-hidden">
      {/* Stats Bar */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t(stat.label)}</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-8 pb-8 overflow-hidden flex flex-col gap-6">
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl">
              {(['dashboard', 'orders', 'inventory', 'drivers', 'profile'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-[#1A4D2E] shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  {t(tab.charAt(0).toUpperCase() + tab.slice(1))}
                </button>
              ))}
            </div>
            {activeTab === 'inventory' && (
              <button 
                onClick={() => setShowAddBag(true)}
                className="eco-button-primary px-4 py-2 flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> {t('Add Magic Bag')}
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-8 space-y-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg dark:text-white">{t('Recent Orders')}</h3>
                      <div className="space-y-3">
                        {orders.slice(0, 5).map(order => (
                          <div key={order.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center text-[#1A4D2E]">
                                <Package className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold dark:text-white">#{order.id.slice(0, 6)}</p>
                                <p className="text-xs text-gray-500">{order.status}</p>
                              </div>
                            </div>
                            <span className="font-bold dark:text-white">${order.price?.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg dark:text-white">{t('Sales Analytics')}</h3>
                      <div className="h-64 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={orders.slice(0, 10).reverse()}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis dataKey="createdAt" hide />
                            <YAxis hide />
                            <Tooltip />
                            <Line type="monotone" dataKey="price" stroke="#1A4D2E" strokeWidth={3} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div 
                  key="orders"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-6"
                >
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-[#1A4D2E]">
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold dark:text-white">Order #{order.id.slice(0, 8)}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                order.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                order.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{order.createdAt?.toDate().toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{t('Total')}</p>
                            <p className="font-bold dark:text-white">${order.price?.toFixed(2)}</p>
                          </div>
                          <div className="flex gap-2">
                            {order.status === 'pending' && (
                              <button 
                                onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                                className="px-4 py-2 bg-[#1A4D2E] text-white rounded-xl text-xs font-bold hover:bg-[#1A4D2E]/90 transition-colors"
                              >
                                {t('Accept')}
                              </button>
                            )}
                            {order.status === 'preparing' && (
                              <button 
                                onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                                className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors"
                              >
                                {t('Mark as Ready')}
                              </button>
                            )}
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'inventory' && (
                <motion.div 
                  key="inventory"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {inventory.map(bag => (
                    <div key={bag.id} className="eco-card overflow-hidden">
                      <img src={bag.image} alt="" className="w-full h-32 object-cover" referrerPolicy="no-referrer" />
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold dark:text-white">{bag.category}</h4>
                          <span className="font-bold text-[#1A4D2E]">${bag.price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                          <Clock className="w-3 h-3" /> {bag.pickupTime}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{bag.available} {t('left')}</span>
                          <button className="text-xs font-bold text-[#1A4D2E] hover:underline">{t('Edit')}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'drivers' && (
                <motion.div 
                  key="drivers"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-6 space-y-4"
                >
                  {drivers.map(driver => (
                    <div key={driver.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#1A4D2E] flex items-center justify-center text-white">
                          <Truck className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold dark:text-white">{driver.name}</h4>
                          <p className="text-xs text-gray-500">{driver.vehicleInfo} • {driver.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{t('Rating')}</p>
                          <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                            <Star className="w-3 h-3 fill-current" /> {driver.rating || '5.0'}
                          </div>
                        </div>
                        <button className="p-2 bg-gray-50 dark:bg-gray-700 rounded-xl text-[#1A4D2E]">
                          <MessageSquare className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div 
                  key="profile"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-8 max-w-2xl mx-auto space-y-8"
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-3xl bg-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E]">
                        <Store className="w-12 h-12" />
                      </div>
                      <div className="flex-1">
                        {isEditingProfile ? (
                          <input 
                            type="text" 
                            value={editedProfile?.name || ''}
                            onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                            className="text-2xl font-bold bg-transparent border-b border-[#1A4D2E] outline-none dark:text-white w-full"
                          />
                        ) : (
                          <h3 className="text-2xl font-bold dark:text-white">{storeProfile?.name || t('My Store')}</h3>
                        )}
                        <p className="text-gray-500">{storeProfile?.category || t('Restaurant')}</p>
                      </div>
                      <button 
                        onClick={() => isEditingProfile ? handleUpdateProfile() : setIsEditingProfile(true)}
                        className="eco-button-primary px-6 py-2"
                      >
                        {isEditingProfile ? t('Save Changes') : t('Edit Profile')}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('Operating Hours')}</label>
                        {isEditingProfile ? (
                          <input 
                            type="text" 
                            value={editedProfile?.hours || ''}
                            onChange={(e) => setEditedProfile({...editedProfile, hours: e.target.value})}
                            className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-[#1A4D2E]/20"
                            placeholder="e.g. 09:00 AM - 10:00 PM"
                          />
                        ) : (
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-sm dark:text-white">
                            {storeProfile?.hours || '09:00 AM - 10:00 PM'}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('Address')}</label>
                        {isEditingProfile ? (
                          <input 
                            type="text" 
                            value={editedProfile?.address || ''}
                            onChange={(e) => setEditedProfile({...editedProfile, address: e.target.value})}
                            className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-[#1A4D2E]/20"
                          />
                        ) : (
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-sm dark:text-white flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" /> {storeProfile?.address || '123 Eco Street, Green City'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('Description')}</label>
                      {isEditingProfile ? (
                        <textarea 
                          value={editedProfile?.description || ''}
                          onChange={(e) => setEditedProfile({...editedProfile, description: e.target.value})}
                          className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-sm dark:text-white min-h-[100px] outline-none focus:ring-2 focus:ring-[#1A4D2E]/20"
                        />
                      ) : (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-sm dark:text-white min-h-[100px]">
                          {storeProfile?.description || t('No description provided.')}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Add Bag Modal */}
      <AnimatePresence>
        {showAddBag && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddBag(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 p-8"
            >
              <h3 className="text-2xl font-bold mb-6 dark:text-white">{t('Add Magic Bag')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-600 dark:text-gray-400">{t('Category')}</label>
                  <select 
                    value={newBag.category}
                    onChange={(e) => setNewBag({...newBag, category: e.target.value})}
                    className="w-full mt-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 outline-none dark:text-white"
                  >
                    <option>Bakery</option>
                    <option>Vegan</option>
                    <option>Groceries</option>
                    <option>Hot Meals</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-400">{t('Price')}</label>
                    <input 
                      type="number" 
                      value={newBag.price}
                      onChange={(e) => setNewBag({...newBag, price: parseFloat(e.target.value)})}
                      className="w-full mt-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-400">{t('Available')}</label>
                    <input 
                      type="number" 
                      value={newBag.available}
                      onChange={(e) => setNewBag({...newBag, available: parseInt(e.target.value)})}
                      className="w-full mt-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 outline-none dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-600 dark:text-gray-400">{t('Pickup Time')}</label>
                  <input 
                    type="text" 
                    value={newBag.pickupTime}
                    onChange={(e) => setNewBag({...newBag, pickupTime: e.target.value})}
                    className="w-full mt-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 outline-none dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowAddBag(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl font-bold"
                >
                  {t('Cancel')}
                </button>
                <button 
                  onClick={handleAddBag}
                  className="flex-1 py-3 bg-[#1A4D2E] text-white rounded-xl font-bold"
                >
                  {t('Create')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
