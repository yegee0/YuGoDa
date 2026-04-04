import React, { useState, useEffect, useRef } from 'react';
import {
  Store, MapPin, CalendarDays, Edit3, ShoppingBag,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { StoreProfile, OperatingHours } from '@/types';

const DIETARY_TAGS = ['Vegan', 'Vegetarian', 'Halal', 'Gluten-Free', 'Organic', 'Dairy-Free'];

const inputCls = 'w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-[#1A4D2E] transition-colors';
const labelCls = 'text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 block';

export interface ProfileTabProps {
  storeProfile: StoreProfile | null;
  isEditingProfile: boolean;
  editedProfile: StoreProfile | null;
  setEditedProfile: React.Dispatch<React.SetStateAction<StoreProfile | null>>;
  schedule: OperatingHours[];
  setSchedule: React.Dispatch<React.SetStateAction<OperatingHours[]>>;
  logoFileRef: React.RefObject<HTMLInputElement | null>;
  coverFileRef: React.RefObject<HTMLInputElement | null>;
}

export default function ProfileTab({
  storeProfile,
  isEditingProfile,
  editedProfile,
  setEditedProfile,
  schedule,
  setSchedule,
  logoFileRef,
  coverFileRef,
}: ProfileTabProps) {

  return (
    <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl space-y-5">

      {/* Store identity */}
      <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E] overflow-hidden">
              {(isEditingProfile ? editedProfile?.logo : storeProfile?.logo) ? (
                <img src={(isEditingProfile ? editedProfile!.logo : storeProfile!.logo)!} alt="logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Store className="w-8 h-8" />
              )}
            </div>
            {isEditingProfile && (
              <>
                <button
                  type="button"
                  onClick={() => logoFileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1A4D2E] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#133b23] transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <input ref={logoFileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file || !editedProfile) return;
                    const reader = new FileReader();
                    reader.onloadend = () => setEditedProfile({ ...editedProfile, logo: reader.result as string });
                    reader.readAsDataURL(file);
                  }}
                />
              </>
            )}
          </div>
          <div className="flex-1">
            {isEditingProfile ? (
              <input
                type="text"
                value={editedProfile?.name || ''}
                onChange={e => editedProfile && setEditedProfile({ ...editedProfile, name: e.target.value })}
                className={inputCls}
                placeholder="Store name"
              />
            ) : (
              <>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">{storeProfile?.name || 'My Store'}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{storeProfile?.category || 'Restaurant'}</p>
              </>
            )}
          </div>
        </div>

        {/* Cover image */}
        <div className="mb-4">
          <label className={labelCls}>Cover Image <span className="normal-case font-normal text-gray-400">(shown on Discover &amp; store page)</span></label>
          <div className="relative h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1A4D2E]/10 to-[#1A4D2E]/5 border-2 border-dashed border-gray-200 dark:border-white/10">
            {(isEditingProfile ? editedProfile?.coverImage : storeProfile?.coverImage) ? (
              <img
                src={(isEditingProfile ? editedProfile!.coverImage : storeProfile!.coverImage)!}
                alt="cover"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400">
                <ShoppingBag className="w-8 h-8 opacity-30" />
                <span className="text-xs">No cover image</span>
              </div>
            )}
            {isEditingProfile && (
              <button
                type="button"
                onClick={() => coverFileRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity text-white font-bold text-sm gap-2"
              >
                <Edit3 className="w-4 h-4" /> Change Photo
              </button>
            )}
          </div>
          <input ref={coverFileRef} type="file" accept="image/*" className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file || !editedProfile) return;
              const reader = new FileReader();
              reader.onloadend = () => setEditedProfile({ ...editedProfile, coverImage: reader.result as string });
              reader.readAsDataURL(file);
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Address</label>
            {isEditingProfile ? (
              <input type="text" value={editedProfile?.address || ''} onChange={e => editedProfile && setEditedProfile({ ...editedProfile, address: e.target.value })} className={inputCls} placeholder="Store address" />
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 text-sm text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" /> {storeProfile?.address || 'Not set'}
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Description</label>
            {isEditingProfile ? (
              <textarea rows={2} value={editedProfile?.description || ''} onChange={e => editedProfile && setEditedProfile({ ...editedProfile, description: e.target.value })} className={`${inputCls} resize-none`} placeholder="Describe your store" />
            ) : (
              <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {storeProfile?.description || 'No description'}
              </div>
            )}
          </div>
        </div>

        {/* Dietary tags */}
        <div className="pt-2">
          <label className={labelCls}>Dietary Options</label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_TAGS.map(tag => {
              const active = (isEditingProfile ? editedProfile?.dietaryTags : storeProfile?.dietaryTags || [])?.includes(tag);
              return (
                <button key={tag} type="button"
                  disabled={!isEditingProfile}
                  onClick={() => {
                    if (!editedProfile) return;
                    const current: string[] = editedProfile.dietaryTags || [];
                    setEditedProfile({
                      ...editedProfile,
                      dietaryTags: active ? current.filter((t: string) => t !== tag) : [...current, tag],
                    });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                    active
                      ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400'
                  } ${!isEditingProfile ? 'cursor-default' : 'hover:border-[#1A4D2E]/40 cursor-pointer'}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <CalendarDays className="w-4 h-4 text-[#1A4D2E]" />
          <h4 className="font-bold text-gray-900 dark:text-white text-sm">Weekly Schedule</h4>
        </div>
        <div className="space-y-2">
          {schedule.map((slot, index) => {
            if (!isEditingProfile && !slot.isOpen) return null;
            return (
              <div key={slot.day} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                slot.isOpen
                  ? 'bg-gray-50 dark:bg-white/3 border-gray-100 dark:border-white/5'
                  : 'bg-gray-50/50 dark:bg-black/10 border-gray-50 dark:border-white/3 opacity-60'
              }`}>
                <div className="flex items-center gap-3 w-36">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={slot.isOpen} disabled={!isEditingProfile}
                      onChange={e => setSchedule(schedule.map((s, i) => i === index ? { ...s, isOpen: e.target.checked } : s))}
                    />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1A4D2E]" />
                  </label>
                  <span className={`font-bold text-sm ${slot.isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{slot.day.slice(0, 3)}</span>
                </div>
                {slot.isOpen ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={slot.open} disabled={!isEditingProfile}
                      onChange={e => setSchedule(schedule.map((s, i) => i === index ? { ...s, open: e.target.value } : s))}
                      className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold dark:text-white outline-none focus:border-[#1A4D2E] disabled:opacity-70"
                    />
                    <span className="text-gray-400 text-sm">&#x2014;</span>
                    <input type="time" value={slot.close} disabled={!isEditingProfile}
                      onChange={e => setSchedule(schedule.map((s, i) => i === index ? { ...s, close: e.target.value } : s))}
                      className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold dark:text-white outline-none focus:border-[#1A4D2E] disabled:opacity-70"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 font-bold">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
