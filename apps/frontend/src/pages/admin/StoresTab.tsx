import React from 'react';
import { Store, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import type { StoreProfile } from '@/types';

export interface StoresTabProps {
  stores: StoreProfile[];
  onApproveStore: (storeId: string, approved: boolean) => void;
}

export default function StoresTab({ stores, onApproveStore }: StoresTabProps) {
  return (
    <motion.div key="stores" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                <Store className="w-5 h-5 text-violet-500" />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Active Stores</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stores.filter(s => s.status === 'active').length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Pending Approvals</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stores.filter(s => s.status === 'pending').length}</h3>
            </div>
          </div>
      </div>
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-gray-900 dark:text-white">All Stores ({stores.length})</h3>
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
            <p className="font-bold text-gray-400">No stores found</p>
            <p className="text-xs text-gray-300 mt-1">Stores registered on the platform will appear here.</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stores.map(store => (
              <div key={store.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
                      <Store className="w-5 h-5 text-[#1A4D2E]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{store.name || 'Unnamed Store'}</h4>
                      <p className="text-xs text-gray-400">{store.category || 'Restaurant'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${
                    store.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                    store.status === 'rejected' ? 'bg-red-100 text-red-500' :
                    'bg-amber-100 text-amber-600'
                  }`}>{store.status || 'pending'}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{store.description || 'No description provided.'}</p>
                {(store.status === 'pending' || !store.status) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApproveStore(store.id, true)}
                      className="flex-1 py-2 bg-[#1A4D2E] text-white rounded-xl text-xs font-bold hover:bg-[#1A4D2E]/90 transition-colors flex items-center justify-center gap-1"
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
