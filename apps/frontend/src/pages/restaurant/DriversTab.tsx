import React from 'react';
import { Truck, Star, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import type { Driver } from '@/types';

export interface DriversTabProps {
  drivers: Driver[];
}

export default function DriversTab({ drivers }: DriversTabProps) {
  return (
    <motion.div key="drivers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
      {drivers.length === 0 ? (
        <div className="bg-white dark:bg-[#111] rounded-2xl py-16 text-center border-2 border-dashed border-gray-100 dark:border-white/5">
          <Truck className="w-12 h-12 text-gray-200 dark:text-white/10 mx-auto mb-3" />
          <p className="font-bold text-gray-400 text-sm">No active drivers</p>
        </div>
      ) : (
        drivers.map(driver => (
          <div key={driver.uid} className="bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1A4D2E] text-white flex items-center justify-center font-black text-lg">
                {(driver.name || driver.displayName || 'D').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">{driver.name || driver.displayName}</h4>
                <p className="text-xs text-gray-400">{driver.vehicle} · <span className="capitalize">{driver.status}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">Rating</p>
                <div className="flex items-center gap-1 text-amber-500 font-black text-sm">
                  <Star className="w-3 h-3 fill-amber-500" /> {driver.rating || '5.0'}
                </div>
              </div>
              <button className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-[#1A4D2E] hover:bg-[#1A4D2E]/10 transition-colors">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
}
