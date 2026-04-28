import React, { useState } from 'react';
import {
  Store, Package, Clock, Plus, Trash2,
  Edit3, X, Loader2, CheckCircle, AlertCircle, Zap, Leaf,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
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

const inputCls = 'w-full px-4 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-sm text-[#1B1B1B] placeholder-gray-300 focus:outline-none focus:border-[#1B5E52] transition-colors';
const selectCls = 'w-full px-4 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-sm text-[#1B1B1B] focus:outline-none focus:border-[#1B5E52] transition-colors';
const labelCls = 'text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block';

export default function InventoryTab({
  inventory,
  setInventory,
  showAddPackage,
  setShowAddPackage,
}: InventoryTabProps) {
  const { t } = useTranslation();
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
          <StatCard label="Active Bags"  value={inventory.filter(b => (b.available ?? 0) > 0).length} icon={<Store className="w-5 h-5" />}   color="bg-[#1B5E52]/10 text-[#1B5E52]" />
          <StatCard label="Total Listed" value={inventory.length}                                      icon={<Package className="w-5 h-5" />}  color="bg-blue-50 text-blue-600" />
          <StatCard label="Sold Out"     value={inventory.filter(b => b.available === 0).length}       icon={<Zap className="w-5 h-5" />}    color="bg-red-50 text-red-500" />
          <StatCard label="Food Saved"   value="42 kg"                                                 icon={<Leaf className="w-5 h-5" />}    color="bg-emerald-50 text-emerald-600" />
        </div>

        {inventory.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center border-2 border-dashed border-[#E8E0D5]">
            <Store className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-[#8FA396] text-sm">{t('rest_inv_empty_title')}</p>
            <p className="text-xs text-[#B0BDB7] mt-1">{t('rest_inv_empty_body')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {inventory.map(bag => {
              const discountPct = (bag.discount ?? 0) > 0 ? bag.discount!
                : ((bag.originalPrice ?? 0) > (bag.price ?? 0) ? Math.round((1 - (bag.price ?? 0) / (bag.originalPrice ?? 1)) * 100) : 0);
              return (
                <div key={bag.id} className="bg-white rounded-2xl overflow-hidden border border-[#E8E0D5] shadow-sm group">
                  <div className="relative h-32 bg-gradient-to-br from-[#1B5E52]/10 to-[#1B5E52]/5 overflow-hidden">
                    <img
                      src={bag.image || bag.storeCoverImage || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {discountPct > 0 && (
                      <div className="absolute top-2 right-2 bg-[#1B5E52] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        -{discountPct}%
                      </div>
                    )}
                    {bag.available === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-black text-xs bg-black/60 px-3 py-1 rounded-full">{t('rest_inv_sold_out')}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-[#1B1B1B] text-sm">{bag.category} Bag</h4>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-[#8FA396]">
                          <Clock className="w-3 h-3" /> {bag.pickupTime}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-[#1B5E52] text-base">{TL((bag.price ?? 0) * (1 - (bag.discount || 0) / 100))}</p>
                        {(bag.discount ?? 0) > 0 && <p className="text-xs line-through text-gray-300">{TL(bag.price ?? 0)}</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E8E0D5]">
                      <span className={`text-xs font-bold ${(bag.available ?? 0) > 2 ? 'text-[#8FA396]' : (bag.available ?? 0) > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                        {bag.available} left
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingBag({ ...bag })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#1B5E52]/8 text-[#1B5E52] hover:bg-[#1B5E52]/15 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeletePackage(bag.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-[#1B1B1B] text-lg">{t('rest_inv_edit_package')}</h3>
                <button onClick={() => setEditingBag(null)} className="w-8 h-8 rounded-full bg-[#F5F0E8] flex items-center justify-center">
                  <X className="w-4 h-4 text-[#8FA396]" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>{t('rest_inv_label_category')}</label>
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
                    <label className={labelCls}>{t('rest_inv_label_available')}</label>
                    <input type="number" value={editingBag.available ?? 0} onChange={e => setEditingBag({ ...editingBag, available: parseInt(e.target.value) })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('rest_inv_label_pickup_time')}</label>
                  <input type="text" value={editingBag.pickupTime || ''} onChange={e => setEditingBag({ ...editingBag, pickupTime: e.target.value })} className={inputCls} placeholder="18:00 - 19:00" />
                </div>
                <div>
                  <label className={labelCls}>{t('rest_inv_label_image_url')} <span className="normal-case font-normal text-gray-300">{t('rest_inv_label_optional')}</span></label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={editingBag.image || ''}
                    onChange={e => setEditingBag({ ...editingBag, image: e.target.value })}
                    className={inputCls}
                  />
                  {(editingBag.image || '').trim() && (
                    <img src={(editingBag.image || '').trim()} alt="preview" referrerPolicy="no-referrer"
                      className="mt-2 h-24 w-full object-cover rounded-xl border border-[#E8E0D5]"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditingBag(null)} className="flex-1 py-3 bg-[#F5F0E8] text-gray-600 rounded-xl font-bold">{t('rest_inv_cancel')}</button>
                <button onClick={handleUpdatePackage} className="flex-1 py-3 bg-[#1B5E52] text-white rounded-xl font-bold hover:bg-[#164d43] transition-colors">{t('rest_action_save_changes')}</button>
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-[#1B1B1B] text-lg">{t('rest_inv_create_package')}</h3>
                <button onClick={() => { setShowAddPackage(false); setAddPackageStatus('idle'); setAddPackageError(''); }}
                  className="w-8 h-8 rounded-full bg-[#F5F0E8] flex items-center justify-center">
                  <X className="w-4 h-4 text-[#8FA396]" />
                </button>
              </div>

              {addPackageStatus === 'success' && (
                <div className="mb-4 p-3 bg-emerald-50 rounded-xl text-emerald-700 text-sm font-bold text-center flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Package created!
                </div>
              )}
              {addPackageStatus === 'error' && (
                <div className="mb-4 p-3 bg-red-50 rounded-xl text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {addPackageError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>{t('rest_inv_label_name')}</label>
                  <input type="text" placeholder="e.g. Today's Surprise Bag" value={newPackage.name} onChange={e => setNewPackage({ ...newPackage, name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('rest_inv_label_description')}</label>
                  <textarea placeholder={t('rest_inv_description_placeholder')} value={newPackage.description} onChange={e => setNewPackage({ ...newPackage, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className={labelCls}>{t('rest_inv_label_category')}</label>
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
                    <label className={labelCls}>{t('rest_inv_label_available')}</label>
                    <input type="number" value={newPackage.available} onChange={e => setNewPackage({ ...newPackage, available: parseInt(e.target.value) })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('rest_inv_label_pickup_time')}</label>
                  <div className="flex items-center gap-2">
                    <input type="time" value={parsePickup(newPackage.pickupTime).start}
                      onChange={e => setNewPackage({ ...newPackage, pickupTime: formatPickup(e.target.value, parsePickup(newPackage.pickupTime).end) })}
                      className={inputCls} />
                    <span className="text-[#8FA396] font-bold flex-shrink-0">&#x2014;</span>
                    <input type="time" value={parsePickup(newPackage.pickupTime).end}
                      onChange={e => setNewPackage({ ...newPackage, pickupTime: formatPickup(parsePickup(newPackage.pickupTime).start, e.target.value) })}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('rest_inv_label_image_url')} <span className="normal-case font-normal text-gray-300">{t('rest_inv_label_optional')}</span></label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={newPackage.image}
                    onChange={e => setNewPackage({ ...newPackage, image: e.target.value })}
                    className={inputCls}
                  />
                  {newPackage.image.trim() && (
                    <img src={newPackage.image.trim()} alt="preview" referrerPolicy="no-referrer"
                      className="mt-2 h-24 w-full object-cover rounded-xl border border-[#E8E0D5]"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowAddPackage(false); setAddPackageStatus('idle'); setAddPackageError(''); }}
                  className="flex-1 py-3 bg-[#F5F0E8] text-gray-600 rounded-xl font-bold">
                  Cancel
                </button>
                <button onClick={handleAddPackage} disabled={addPackageStatus === 'loading' || addPackageStatus === 'success'}
                  className="flex-1 py-3 bg-[#1B5E52] text-white rounded-xl font-bold hover:bg-[#164d43] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {addPackageStatus === 'loading' ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('restaurant_inventory_creating')}</> : t('rest_inv_create_package')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
