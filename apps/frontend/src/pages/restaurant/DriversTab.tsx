import React from 'react';
import { Truck, Star, MessageSquare, MapPin, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import type { Driver, Order } from '@/types';

export interface DriversTabProps {
  drivers: Driver[];
  deliveringOrders: Order[];
  storeLocation?: { lat: number; lng: number };
}

/** Haversine great-circle distance in kilometres. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** ETA in whole minutes, assuming 30 km/h average city speed. */
function etaMinutes(distKm: number): number {
  return Math.max(1, Math.round((distKm / 30) * 60));
}

export default function DriversTab({ drivers, deliveringOrders, storeLocation }: DriversTabProps) {
  return (
    <motion.div key="drivers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

      {/* ── Active Deliveries ── */}
      {deliveringOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Deliveries</h3>
          {deliveringOrders.map(order => {
            const hasCoords = storeLocation && order.deliveryLat && order.deliveryLng;
            const distKm = hasCoords
              ? haversineKm(storeLocation!.lat, storeLocation!.lng, order.deliveryLat!, order.deliveryLng!)
              : null;
            const eta = distKm !== null ? etaMinutes(distKm) : null;

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-600">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        #{order.id.slice(0, 8)}
                        {order.restaurantName && (
                          <span className="ml-2 text-xs font-medium text-gray-400">{order.restaurantName}</span>
                        )}
                      </p>
                      <p className="text-xs text-cyan-600 font-bold mt-0.5">Out for delivery</p>
                    </div>
                  </div>

                  {/* Distance + ETA */}
                  <div className="flex items-center gap-4">
                    {distKm !== null ? (
                      <>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide flex items-center gap-1 justify-end">
                            <MapPin className="w-3 h-3" /> Distance
                          </p>
                          <p className="font-black text-gray-900 dark:text-white text-sm">
                            {distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" /> ETA
                          </p>
                          <p className="font-black text-[#1A4D2E] dark:text-green-400 text-sm">{eta} min</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-300 dark:text-white/20 italic">Coordinates unavailable</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Driver List ── */}
      <div className="space-y-3">
        {deliveringOrders.length > 0 && (
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fleet</h3>
        )}
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
      </div>

    </motion.div>
  );
}
