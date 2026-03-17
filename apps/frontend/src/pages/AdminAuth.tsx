import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { authAdmin } from '@/shared/lib/firebase';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStore } from '@/app/store/useStore';
import AuthFormLayout from '@/shared/ui/AuthFormLayout';

export default function AdminAuth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (userProfile && !isLoading && !error) {
      if (userProfile.role === 'admin') navigate('/admin', { replace: true });
      else if (userProfile.role === 'restaurant') navigate('/restaurant', { replace: true });
      else navigate('/discover', { replace: true });
    }
  }, [userProfile, navigate, isLoading, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(authAdmin, formData.email, formData.password);
      navigate('/admin');
    } catch (err: any) {
      toast.error(err.message || t('Login failed. Please verify your credentials.'));
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormLayout
      headerContent={
        <>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Admin Portal</h2>
          <p className="text-emerald-100/80 text-sm mt-2">Authorized Personnel Only</p>
        </>
      }
    >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-[#1A4D2E] text-sm dark:text-white transition-all"
                  placeholder="admin@example.com"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-[#1A4D2E] text-sm dark:text-white transition-all"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#1A4D2E] text-white rounded-xl font-bold hover:bg-[#143d24] transition-colors mt-6 flex items-center justify-center gap-2 shadow-lg shadow-[#1A4D2E]/20"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Secure Login <ShieldCheck className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
    </AuthFormLayout>
  );
}
