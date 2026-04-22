import React, { useState } from 'react';
import {
  Store, MapPin, CalendarDays, Edit3, ShoppingBag, Landmark, Map,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { StoreProfile, OperatingHours, BankingDetails } from '@/types';
import { AddressAutocomplete } from '@/components/shared';
import LocationPickerMap from '@/components/LocationPickerMap';

// Dietary tags double as backend enum values — kept as English literals; UI
// surfaces them verbatim (short, recognizable, already brand-common).
const DIETARY_TAGS = ['Vegan', 'Vegetarian', 'Halal', 'Gluten-Free', 'Organic', 'Dairy-Free'];

const inputCls = 'w-full px-4 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-sm text-[#1B1B1B] placeholder-gray-300 focus:outline-none focus:border-[#1B5E52] transition-colors';
const labelCls = 'text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block';

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
  const { t } = useTranslation();
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  return (
    <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-4xl space-y-5">

      {/* Store identity + Banking side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* Store identity */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E0D5] shadow-sm">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-[#1B5E52]/10 flex items-center justify-center text-[#1B5E52] overflow-hidden">
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
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1B5E52] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#164d43] transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <input ref={logoFileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => setEditedProfile(prev => prev ? { ...prev, logo: reader.result as string } : prev);
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
                placeholder={t('rest_profile_store_name_placeholder')}
              />
            ) : (
              <>
                <h3 className="text-xl font-black text-[#1B1B1B]">{storeProfile?.name || t('rest_profile_fallback_name')}</h3>
                <p className="text-sm text-[#8FA396] mt-0.5">{storeProfile?.category || t('rest_profile_fallback_category')}</p>
              </>
            )}
          </div>
        </div>

        {/* Cover image */}
        <div className="mb-4">
          <label className={labelCls}>{t('rest_profile_cover_label')} <span className="normal-case font-normal text-[#8FA396]">{t('rest_profile_cover_hint')}</span></label>
          <div className="relative h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1B5E52]/10 to-[#1B5E52]/5 border-2 border-dashed border-[#E8E0D5]">
            {(isEditingProfile ? editedProfile?.coverImage : storeProfile?.coverImage) ? (
              <img
                src={(isEditingProfile ? editedProfile!.coverImage : storeProfile!.coverImage)!}
                alt="cover"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-[#8FA396]">
                <ShoppingBag className="w-8 h-8 opacity-30" />
                <span className="text-xs">{t('rest_profile_cover_empty')}</span>
              </div>
            )}
            {isEditingProfile && (
              <button
                type="button"
                onClick={() => coverFileRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity text-white font-bold text-sm gap-2"
              >
                <Edit3 className="w-4 h-4" /> {t('rest_profile_change_photo')}
              </button>
            )}
          </div>
          <input ref={coverFileRef} type="file" accept="image/*" className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onloadend = () => setEditedProfile(prev => prev ? { ...prev, coverImage: reader.result as string } : prev);
              reader.readAsDataURL(file);
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t('rest_profile_address_label')}</label>
            {isEditingProfile ? (
              <div className="space-y-2">
                <AddressAutocomplete
                  value={editedProfile?.address || ''}
                  onChange={(addr, coords) => {
                    if (!editedProfile) return;
                    const update: Partial<StoreProfile> = { address: addr };
                    if (coords) update.location = coords;
                    setEditedProfile({ ...editedProfile, ...update });
                  }}
                  placeholder={t('rest_profile_address_placeholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#1B5E52] hover:underline"
                >
                  <Map className="w-3.5 h-3.5" /> {t('rest_profile_pick_on_map')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#F5F0E8] text-sm text-gray-700">
                <MapPin className="w-4 h-4 text-[#8FA396] flex-shrink-0" /> {storeProfile?.address || t('rest_profile_not_set')}
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>{t('rest_profile_description_label')}</label>
            {isEditingProfile ? (
              <textarea rows={2} value={editedProfile?.description || ''} onChange={e => editedProfile && setEditedProfile({ ...editedProfile, description: e.target.value })} className={`${inputCls} resize-none`} placeholder={t('rest_profile_description_placeholder')} />
            ) : (
              <div className="px-4 py-3 rounded-xl bg-[#F5F0E8] text-sm text-gray-700 line-clamp-2">
                {storeProfile?.description || t('rest_profile_no_description')}
              </div>
            )}
          </div>
        </div>

        {/* Dietary tags */}
        <div className="pt-2">
          <label className={labelCls}>{t('rest_profile_dietary_label')}</label>
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
                      ? 'bg-[#1B5E52] border-[#1B5E52] text-white'
                      : 'bg-[#F5F0E8] border-[#E8E0D5] text-[#8FA396]'
                  } ${!isEditingProfile ? 'cursor-default' : 'hover:border-[#1B5E52]/40 cursor-pointer'}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Banking Details */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E0D5] shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Landmark className="w-4 h-4 text-[#1B5E52]" />
          <h4 className="font-bold text-[#1B1B1B] text-sm">{t('rest_profile_banking_heading')}</h4>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[
            { key: 'iban' as const,          labelKey: 'rest_profile_banking_iban',          placeholderKey: 'rest_profile_banking_iban_placeholder' },
            { key: 'accountHolder' as const, labelKey: 'rest_profile_banking_account_holder', placeholderKey: 'rest_profile_banking_account_holder_placeholder' },
            { key: 'bankName' as const,      labelKey: 'rest_profile_banking_bank_name',     placeholderKey: 'rest_profile_banking_bank_name_placeholder' },
            { key: 'branchCode' as const,    labelKey: 'rest_profile_banking_branch_code',   placeholderKey: 'rest_profile_banking_branch_code_placeholder' },
            { key: 'taxId' as const,         labelKey: 'rest_profile_banking_tax_id',        placeholderKey: 'rest_profile_banking_tax_id_placeholder' },
          ].map(({ key, labelKey, placeholderKey }) => (
            <div key={key}>
              <label className={labelCls}>{t(labelKey)}</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={(editedProfile?.bankingDetails as BankingDetails)?.[key] || ''}
                  onChange={e => {
                    if (!editedProfile) return;
                    setEditedProfile({
                      ...editedProfile,
                      bankingDetails: {
                        ...(editedProfile.bankingDetails || {}),
                        [key]: e.target.value,
                      },
                    });
                  }}
                  className={inputCls}
                  placeholder={t(placeholderKey)}
                />
              ) : (
                <div className="px-4 py-3 rounded-xl bg-[#F5F0E8] text-sm text-gray-700">
                  {(storeProfile?.bankingDetails as BankingDetails)?.[key] || t('rest_profile_not_set')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      </div>{/* end grid */}

      {/* Schedule */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E0D5] shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <CalendarDays className="w-4 h-4 text-[#1B5E52]" />
          <h4 className="font-bold text-[#1B1B1B] text-sm">{t('rest_profile_schedule_heading')}</h4>
        </div>
        <div className="space-y-2">
          {schedule.map((slot, index) => {
            if (!isEditingProfile && !slot.isOpen) return null;
            return (
              <div key={slot.day} className={`flex flex-wrap items-center justify-between gap-2 p-4 rounded-xl border transition-colors ${
                slot.isOpen
                  ? 'bg-[#F5F0E8] border-[#E8E0D5]'
                  : 'bg-[#F5F0E8]/50 border-[#E8E0D5] opacity-60'
              }`}>
                <div className="flex items-center gap-3 w-28 shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={slot.isOpen} disabled={!isEditingProfile}
                      onChange={e => setSchedule(schedule.map((s, i) => i === index ? { ...s, isOpen: e.target.checked } : s))}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1B5E52]" />
                  </label>
                  <span className={`font-bold text-sm ${slot.isOpen ? 'text-[#1B1B1B]' : 'text-[#8FA396]'}`}>{slot.day.slice(0, 3)}</span>
                </div>
                {slot.isOpen ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={slot.open} disabled={!isEditingProfile}
                      onChange={e => setSchedule(schedule.map((s, i) => i === index ? { ...s, open: e.target.value } : s))}
                      className="bg-white border border-[#E8E0D5] rounded-lg px-3 py-1.5 text-sm font-bold text-[#1B1B1B] outline-none focus:border-[#1B5E52] disabled:opacity-70"
                    />
                    <span className="text-[#8FA396] text-sm">&#x2014;</span>
                    <input type="time" value={slot.close} disabled={!isEditingProfile}
                      onChange={e => setSchedule(schedule.map((s, i) => i === index ? { ...s, close: e.target.value } : s))}
                      className="bg-white border border-[#E8E0D5] rounded-lg px-3 py-1.5 text-sm font-bold text-[#1B1B1B] outline-none focus:border-[#1B5E52] disabled:opacity-70"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-[#8FA396] font-bold">{t('rest_profile_closed')}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-[120]">
          <LocationPickerMap
            mode="restaurant"
            initialLocation={editedProfile?.location}
            initialName={editedProfile?.address}
            onConfirm={(coords, name) => {
              if (editedProfile) {
                setEditedProfile({ ...editedProfile, address: name, location: coords });
              }
              setShowLocationPicker(false);
            }}
            onClose={() => setShowLocationPicker(false)}
          />
        </div>
      )}
    </motion.div>
  );
}
