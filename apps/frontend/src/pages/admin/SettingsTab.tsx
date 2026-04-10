import React, { useState } from 'react';
import { motion } from 'motion/react';

export interface SettingsTabProps {
  initialPlatformCut: number;
  initialAutoApprove: boolean;
}

export default function SettingsTab({ initialPlatformCut, initialAutoApprove }: SettingsTabProps) {
  const [settingsPlatformCut, setSettingsPlatformCut] = useState(initialPlatformCut);
  const [settingsAutoApprove, setSettingsAutoApprove] = useState(initialAutoApprove);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveSettings = () => {
    localStorage.setItem('yugoda_settings', JSON.stringify({ platformCut: settingsPlatformCut, autoApprove: settingsAutoApprove }));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  return (
    <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 max-w-2xl">
      <div className="bg-white rounded-2xl p-6 border border-[#E8E0D5] shadow-sm">
        <h3 className="font-bold text-[#1B1B1B] mb-1">System Configuration</h3>
        <p className="text-sm text-[#8FA396] mb-6">Manage global platform fees and policies.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#1B1B1B] mb-2">Platform Cut (%)</label>
            <input
              type="number"
              value={settingsPlatformCut}
              onChange={e => setSettingsPlatformCut(Number(e.target.value))}
              className="w-full max-w-xs bg-[#F5F0E8] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#1B5E52] text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1B1B1B] mb-2">Auto-Approve Partner Stores</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settingsAutoApprove}
                onChange={e => setSettingsAutoApprove(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B5E52]"></div>
            </label>
          </div>
          <button
            onClick={handleSaveSettings}
            className={`py-2.5 px-6 rounded-xl font-bold text-sm transition-colors ${settingsSaved ? 'bg-emerald-500 text-white' : 'bg-[#1B5E52] text-white hover:bg-[#164d43]'}`}
          >
            {settingsSaved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
