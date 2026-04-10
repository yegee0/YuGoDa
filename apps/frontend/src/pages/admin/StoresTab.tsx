import React, { useState } from 'react';
import { Store, Clock, CheckCircle, XCircle, Percent } from 'lucide-react';
import { motion } from 'motion/react';
import type { StoreProfile } from '@/types';
import { api } from '@/lib/api';

export interface StoresTabProps {
  stores: StoreProfile[];
  onApproveStore: (storeId: string, approved: boolean) => void;
  onUpdateStore?: (storeId: string, updates: Partial<StoreProfile>) => void;
}

export default function StoresTab({ stores, onApproveStore, onUpdateStore }: StoresTabProps) {
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [commissionInput, setCommissionInput] = useState('');

  const handleSaveCommission = async (storeId: string) => {
    const rate = parseFloat(commissionInput);
    if (isNaN(rate) || rate < 0 || rate > 100) return;
    await api.put(`/stores/${storeId}`, { commissionRate: rate });
    onUpdateStore?.(storeId, { commissionRate: rate });
    setEditingCommission(null);
  };
  return (
    <motion.div key="stores" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E8E0D5] shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
                <Store className="w-5 h-5 text-violet-500" />
              </div>
            </div>
            <div>
              <p className="text-xs text-[#8FA396] font-medium mb-1">Active Stores</p>
              <h3 className="text-2xl font-black text-[#1B1B1B]">{stores.filter(s => s.status === 'active').length}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E8E0D5] shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div>
              <p className="text-xs text-[#8FA396] font-medium mb-1">Pending Approvals</p>
              <h3 className="text-2xl font-black text-[#1B1B1B]">{stores.filter(s => s.status === 'pending').length}</h3>
            </div>
          </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E0D5] flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-[#1B1B1B]">All Stores ({stores.length})</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-lg font-bold">
              {stores.filter(s => s.status === 'pending').length} Pending
            </span>
            <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-lg font-bold">
              {stores.filter(s => s.status === 'active').length} Active
            </span>
          </div>
        </div>
        {stores.length === 0 ? (
          <div className="py-20 text-center">
            <Store className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-[#8FA396]">No stores found</p>
            <p className="text-xs text-[#8FA396] mt-1">Stores registered on the platform will appear here.</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stores.map(store => (
              <div key={store.id} className="bg-[#F5F0E8] rounded-2xl p-5 border border-[#E8E0D5]">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <Store className="w-5 h-5 text-[#1B5E52]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1B1B1B] text-sm">{store.name || 'Unnamed Store'}</h4>
                      <p className="text-xs text-[#8FA396]">{store.category || 'Restaurant'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${
                    store.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                    store.status === 'rejected' ? 'bg-red-100 text-red-500' :
                    'bg-amber-100 text-amber-600'
                  }`}>{store.status || 'pending'}</span>
                </div>
                <p className="text-xs text-[#8FA396] mb-3 line-clamp-2">{store.description || 'No description provided.'}</p>

                {/* Commission rate */}
                <div className="flex items-center gap-2 mb-3 p-2 rounded-xl bg-white border border-[#E8E0D5]">
                  <Percent className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                  {editingCommission === store.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={commissionInput}
                        onChange={e => setCommissionInput(e.target.value)}
                        className="w-16 px-2 py-1 text-xs font-bold rounded-lg border border-[#E8E0D5] bg-white text-[#1B1B1B] outline-none"
                        autoFocus
                      />
                      <span className="text-xs text-[#8FA396]">%</span>
                      <button onClick={() => handleSaveCommission(store.id)} className="text-xs font-bold text-[#1B5E52] hover:underline ml-auto">Save</button>
                      <button onClick={() => setEditingCommission(null)} className="text-xs font-bold text-[#8FA396] hover:underline">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-xs font-bold text-[#1B1B1B]">Commission: {store.commissionRate ?? 15}%</span>
                      <button
                        onClick={() => { setEditingCommission(store.id); setCommissionInput(String(store.commissionRate ?? 15)); }}
                        className="text-xs font-bold text-[#1B5E52] hover:underline ml-auto"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Banking info */}
                {store.bankingDetails?.iban && (
                  <p className="text-[10px] text-[#8FA396] mb-3 truncate">IBAN: {store.bankingDetails.iban}</p>
                )}

                {(store.status === 'pending' || !store.status) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApproveStore(store.id, true)}
                      className="flex-1 py-2 bg-[#1B5E52] text-white rounded-xl text-xs font-bold hover:bg-[#1B5E52]/90 transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => onApproveStore(store.id, false)}
                      className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
