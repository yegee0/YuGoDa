import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Camera, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function ProfileView() {
  const { t, i18n } = useTranslation();
  const { userProfile, setUserProfile } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    displayName: userProfile?.displayName || '',
    email: userProfile?.email || '',
    countryCode: userProfile?.countryCode || '+1',
    mobileNumber: userProfile?.mobileNumber || '',
  });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', address: '' });

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    const userRef = doc(db, 'users', userProfile.uid);
    try {
      await updateDoc(userRef, formData);
      setUserProfile({ ...userProfile, ...formData });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAddAddress = async () => {
    if (!userProfile) return;
    const userRef = doc(db, 'users', userProfile.uid);
    const updatedAddresses = [
      ...(userProfile.addresses || []),
      { id: Math.random().toString(36).substr(2, 9), ...newAddress, isDefault: (userProfile.addresses?.length || 0) === 0 }
    ];
    try {
      await updateDoc(userRef, { addresses: updatedAddresses });
      setUserProfile({ ...userProfile, addresses: updatedAddresses });
      setShowAddressModal(false);
      setNewAddress({ label: '', address: '' });
    } catch (error) {
      console.error('Error adding address:', error);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!userProfile) return;
    const userRef = doc(db, 'users', userProfile.uid);
    const updatedAddresses = userProfile.addresses.filter(a => a.id !== id);
    try {
      await updateDoc(userRef, { addresses: updatedAddresses });
      setUserProfile({ ...userProfile, addresses: updatedAddresses });
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-[#0A0A0A] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('My Profile')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('Manage your account settings and preferences')}</p>
          </div>
          <button
            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
              isEditing 
                ? 'bg-[#1A4D2E] text-white shadow-lg shadow-[#1A4D2E]/20' 
                : 'bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800'
            }`}
          >
            {isEditing ? <Save className="w-5 h-5" /> : <User className="w-5 h-5" />}
            {isEditing ? t('Save Changes') : t('Edit Profile')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Wallet */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 border border-gray-100 dark:border-gray-800 text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full bg-[#1A4D2E] flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 border-4 border-white dark:border-[#1A1A1A] shadow-xl">
                  {userProfile?.displayName?.charAt(0) || userProfile?.email?.charAt(0).toUpperCase()}
                </div>
                <button className="absolute bottom-4 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 text-[#1A4D2E]">
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{userProfile?.displayName}</h2>
              <p className="text-gray-500 text-sm">{userProfile?.email}</p>
              
              <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                <div className="bg-[#1A4D2E]/5 dark:bg-[#1A4D2E]/10 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1A4D2E] flex items-center justify-center text-white">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-[#1A4D2E] uppercase tracking-wider">{t('Wallet Balance')}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">${userProfile?.walletBalance?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-[#1A4D2E]/10 rounded-xl transition-colors text-[#1A4D2E]">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 border border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t('Settings')}</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400 group-hover:text-[#1A4D2E]" />
                    <span className="text-sm font-medium dark:text-gray-300">{t('Language')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1A4D2E] uppercase">{i18n.language}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gray-400 group-hover:text-[#1A4D2E]" />
                    <span className="text-sm font-medium dark:text-gray-300">{t('Notifications')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Forms & Addresses */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 border border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('Personal Information')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('First Name')}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#1A4D2E] disabled:opacity-50 dark:text-white"
                      placeholder="John"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Last Name')}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#1A4D2E] disabled:opacity-50 dark:text-white"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Display Name')}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#1A4D2E] disabled:opacity-50 dark:text-white"
                      placeholder="johndoe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Email Address')}</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      disabled={true}
                      value={formData.email}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm opacity-50 dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Mobile Number')}</label>
                  <div className="flex gap-2">
                    <select
                      disabled={!isEditing}
                      value={formData.countryCode}
                      onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                      className="w-24 px-3 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#1A4D2E] disabled:opacity-50 dark:text-white"
                    >
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+90">+90</option>
                      <option value="+971">+971</option>
                    </select>
                    <div className="relative flex-1">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        disabled={!isEditing}
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#1A4D2E] disabled:opacity-50 dark:text-white"
                        placeholder="555-0123"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('Saved Addresses')}</h3>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="flex items-center gap-2 text-sm font-bold text-[#1A4D2E] hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  {t('Add New')}
                </button>
              </div>
              
              <div className="space-y-4">
                {userProfile?.addresses?.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
                    <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{t('No addresses saved yet')}</p>
                  </div>
                ) : (
                  userProfile?.addresses?.map((addr) => (
                    <div key={addr.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 dark:text-white">{addr.label}</p>
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold bg-[#1A4D2E]/10 text-[#1A4D2E] px-2 py-0.5 rounded-full uppercase">
                                {t('Default')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate max-w-xs">{addr.address}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddressModal(false)} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('Add New Address')}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Label (e.g. Home, Office)')}</label>
                <input
                  type="text"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm dark:text-white"
                  placeholder="Home"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Full Address')}</label>
                <textarea
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm h-24 resize-none dark:text-white"
                  placeholder="123 Eco Street, Green City"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleAddAddress}
                  className="flex-1 py-3 bg-[#1A4D2E] text-white rounded-2xl font-bold shadow-lg shadow-[#1A4D2E]/20"
                >
                  {t('Add Address')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
