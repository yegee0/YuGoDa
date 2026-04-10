import React, { useState } from 'react';
import {
  Store, Package, Clock, Plus, Trash2,
  Edit3, X, Loader2, CheckCircle, AlertCircle, Zap, Leaf,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Bag } from '@/types';
import { StatCard, TL } from './StorePanel';
import { api } from '@/lib/api';
import { useStore } from '@/app/store/useStore';

// Parse "HH:MM - HH:MM" to { start, end }
function parsePickup(t: string) {
  const parts = (t || '').split(' - ');
  return { start: parts[0]?.trim() || '18:00', end: parts[1]?.trim() || '19:00' };
}
function formatPickup(start: string, end: string) { return `${start} - ${end}`; }

interface NewPackage {
  name: string;
  description: string;
  category: string;
  price: number;
  discount: number;
  available: number;
  pickupTime: string;
  image: string;
}

export interface InventoryTabProps {
  inventory: Bag[];
  setInventory: React.Dispatch<React.SetStateAction<Bag[]>>;
  showAddPackage: boolean;
  setShowAddPackage: React.Dispatch<React.SetStateAction<boolean>>;
}

const inputCls = 'w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-[#1A4D2E] transition-colors';
const selectCls = 'w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#1A4D2E] transition-colors';
const labelCls = 'text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 block';

export default function InventoryTab({
  inventory,
  setInventory,
  showAddPackage,
  setShowAddPackage,
}: InventoryTabProps) {
  const { user } = useStore();

  const [editingBag, setEditingBag] = useState<Bag | null>(null);
  const [newPackage, setNewPackage] = useState<NewPackage>({
    name: '', description: '', category: 'Bakery',
    price: 5.99, discount: 0, available: 5, pickupTime: '18:00 - 19:00', image: '',
  });
  const [addPackageStatus, setAddPackageStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [addPackageError, setAddPackageError] = useState('');

  const handleUpdatePackage = async () => {
    if (!editingBag) return;
    try {
      await api.put(`/bags/${editingBag.id}`, editingBag);
      setInventory(prev => prev.map(b => b.id === editingBag.id ? editingBag : b));
      setEditingBag(null);
    } catch (err) { console.error(err); }
  };

  const handleAddPackage = async () => {
    if (!user) return;
    setAddPackageStatus('loading');
    setAddPackageError('');
    try {
      const data = await api.post('/bags', {
        category: newPackage.category,
        description: newPackage.description || newPackage.name || newPackage.category,
        price: newPackage.price,
        originalPrice: parseFloat((newPackage.price * 3).toFixed(2)),
        discount: newPackage.discount,
        available: newPackage.available,
        pickupTime: newPackage.pickupTime,
        merchantType: newPackage.category,
        ...(newPackage.image.trim() ? { image: newPackage.image.trim() } : {}),
      }) as { bag?: Bag };
      if (data.bag) setInventory(prev => [data.bag!, ...prev]);
      setAddPackageStatus('success');
      setTimeout(() => {
        setShowAddPackage(false);
        setAddPackageStatus('idle');
        setNewPackage({ name: '', description: '', category: 'Bakery', price: 5.99, discount: 0, available: 5, pickupTime: '18:00 - 19:00', image: '' });
      }, 1200);
    } catch (error: unknown) {
      setAddPackageStatus('error');
      setAddPackageError(error instanceof Error ? error.message : 'Failed to create package.');
    }
  };

  const handleDeletePackage = async (id: string) => {
    try { await api.delete(`/bags/${id}`); setInventory(prev => prev.filter(p => p.id !== id)); }
    catch (err) { console.error(err); }
  };

  return (
    <>
      <motion.div key="inventory" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Bags"  value={inventory.filter(b => (b.available ?? 0) > 0).length} icon={<Store className="w-5 h-5" />}   color="bg-[#1A4D2E]/10 text-[#1A4D2E]" />
          <StatCard label="Total Listed" value={inventory.length}                                      icon={<Package className="w-5 h-5" />}  color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" />
          <StatCard label="Sold Out"     value={inventory.filter(b => b.available === 0).length}       icon={<Zap className="w-5 h-5" />}    color="bg-red-50 dark:bg-red-900/20 text-red-500" />
          <StatCard label="Food Saved"   value="42 kg"                                                 icon={<Leaf className="w-5 h-5" />}    color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" />
        </div>

        {inventory.length === 0 ? (
          <div className="bg-white dark:bg-[#111] rounded-2xl py-16 text-center border-2 border-dashed border-gray-100 dark:border-white/5">
            <Store className="w-12 h-12 text-gray-200 dark:text-white/10 mx-auto mb-3" />
            <p className="font-bold text-gray-400 text-sm">No active listings</p>
            <p className="text-xs text-gray-300 dark:text-white/20 mt-1">Create your first surprise bag to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {inventory.map(bag => {
              const discountPct = (bag.discount ?? 0) > 0 ? bag.discount!
                : ((bag.originalPrice ?? 0) > (bag.price ?? 0) ? Math.round((1 - (bag.price ?? 0) / (bag.originalPrice ?? 1)) * 100) : 0);
              return (
                <div key={bag.id} className="bg-white dark:bg-[#111] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm group">
                  <div className="relative h-32 bg-gradient-to-br from-[#1A4D2E]/10 to-[#1A4D2E]/5 overflow-hidden">
                    <img
                      src={bag.image || bag.storeCoverImage || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {discountPct > 0 && (
                      <div className="absolute top-2 right-2 bg-[#1A4D2E] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        -{discountPct}%
                      </div>
                    )}
                    {bag.available === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-black text-xs bg-black/60 px-3 py-1 rounded-full">Sold Out</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{bag.category} Bag</h4>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                          <Clock className="w-3 h-3" /> {bag.pickupTime}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-[#1A4D2E] text-base">{TL((bag.price ?? 0) * (1 - (bag.discount || 0) / 100))}</p>
                        {(bag.discount ?? 0) > 0 && <p className="text-xs line-through text-gray-300">{TL(bag.price ?? 0)}</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-white/5">
                      <span className={`text-xs font-bold ${(bag.available ?? 0) > 2 ? 'text-gray-500' : (bag.available ?? 0) > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                        {bag.available} left
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingBag({ ...bag })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#1A4D2E]/8 dark:bg-[#1A4D2E]/15 text-[#1A4D2E] hover:bg-[#1A4D2E]/15 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeletePackage(bag.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Edit Bag Modal */}
      <AnimatePresence>
        {editingBag && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingBag(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-gray-900 dark:text-white text-lg">Edit Package</h3>
                <button onClick={() => setEditingBag(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={editingBag.category || ''} onChange={e => setEditingBag({ ...editingBag, category: e.target.value })} className={selectCls}>
                    {['Bakery','Vegan','Groceries','Hot Meals','Cafe','Halal','Gluten-Free','Desserts'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Price (&#x20BA;)</label>
                    <input type="number" value={editingBag.price ?? 0} onChange={e => setEditingBag({ ...editingBag, price: parseFloat(e.target.value) })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Available</label>
                    <input type="number" value={editingBag.available ?? 0} onChange={e => setEditingBag({ ...editingBag, available: parseInt(e.target.value) })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Pickup Time</label>
                  <input type="text" value={editingBag.pickupTime || ''} onChange={e => setEditingBag({ ...editingBag, pickupTime: e.target.value })} className={inputCls} placeholder="18:00 - 19:00" />
                </div>
                <div>
                  <label className={labelCls}>Package Image URL <span className="normal-case font-normal text-gray-300">(optional)</span></label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={editingBag.image || ''}
                    onChange={e => setEditingBag({ ...editingBag, image: e.target.value })}
                    className={inputCls}
                  />
                  {(editingBag.image || '').trim() && (
                    <img src={(editingBag.image || '').trim()} alt="preview" referrerPolicy="no-referrer"
                      className="mt-2 h-24 w-full object-cover rounded-xl border border-gray-100 dark:border-white/10"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditingBag(null)} className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold">Cancel</button>
                <button onClick={handleUpdatePackage} className="flex-1 py-3 bg-[#1A4D2E] text-white rounded-xl font-bold hover:bg-[#133b23] transition-colors">Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Package Modal */}
      <AnimatePresence>
        {showAddPackage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowAddPackage(false); setAddPackageStatus('idle'); setAddPackageError(''); }} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-gray-900 dark:text-white text-lg">Create Package</h3>
                <button onClick={() => { setShowAddPackage(false); setAddPackageStatus('idle'); setAddPackageError(''); }}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {addPackageStatus === 'success' && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-bold text-center flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Package created!
                </div>
              )}
              {addPackageStatus === 'error' && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {addPackageError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Package Name</label>
                  <input type="text" placeholder="e.g. Today's Surprise Bag" value={newPackage.name} onChange={e => setNewPackage({ ...newPackage, name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea placeholder="What's inside? (optional)" value={newPackage.description} onChange={e => setNewPackage({ ...newPackage, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={newPackage.category} onChange={e => setNewPackage({ ...newPackage, category: e.target.value })} className={selectCls}>
                    {['Bakery','Vegan','Groceries','Hot Meals','Cafe','Halal','Gluten-Free','Desserts'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Price (&#x20BA;)</label>
                    <input type="number" value={newPackage.price} onChange={e => setNewPackage({ ...newPackage, price: parseFloat(e.target.value) })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Discount %</label>
                    <input type="number" min={0} max={100} value={newPackage.discount} onChange={e => setNewPackage({ ...newPackage, discount: parseInt(e.target.value) || 0 })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Available</label>
                    <input type="number" value={newPackage.available} onChange={e => setNewPackage({ ...newPackage, available: parseInt(e.target.value) })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Pickup Time</label>
                  <div className="flex items-center gap-2">
                    <input type="time" value={parsePickup(newPackage.pickupTime).start}
                      onChange={e => setNewPackage({ ...newPackage, pickupTime: formatPickup(e.target.value, parsePickup(newPackage.pickupTime).end) })}
                      className={inputCls} />
                    <span className="text-gray-400 font-bold flex-shrink-0">&#x2014;</span>
                    <input type="time" value={parsePickup(newPackage.pickupTime).end}
                      onChange={e => setNewPackage({ ...newPackage, pickupTime: formatPickup(parsePickup(newPackage.pickupTime).start, e.target.value) })}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Package Image URL <span className="normal-case font-normal text-gray-300">(optional)</span></label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={newPackage.image}
                    onChange={e => setNewPackage({ ...newPackage, image: e.target.value })}
                    className={inputCls}
                  />
                  {newPackage.image.trim() && (
                    <img src={newPackage.image.trim()} alt="preview" referrerPolicy="no-referrer"
                      className="mt-2 h-24 w-full object-cover rounded-xl border border-gray-100 dark:border-white/10"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowAddPackage(false); setAddPackageStatus('idle'); setAddPackageError(''); }}
                  className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold">
                  Cancel
                </button>
                <button onClick={handleAddPackage} disabled={addPackageStatus === 'loading' || addPackageStatus === 'success'}
                  className="flex-1 py-3 bg-[#1A4D2E] text-white rounded-xl font-bold hover:bg-[#133b23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {addPackageStatus === 'loading' ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Package'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
