import { useState, useMemo, useRef, useEffect, type ReactNode } from 'react';
import { Users, Search, MoreVertical, Eye, Pause, Ban, Check, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { ACCOUNT_STATUS_CONFIG } from '@/lib/constants';
import { formatDate } from '@/lib/formatters';
import type { AccountStatus, AdminUser, UserRole } from '@/types';

export interface CustomersTabProps {
  users: AdminUser[];
  onUpdateUser?: (uid: string, patch: Partial<AdminUser>) => void;
}

type RoleFilter = 'all' | UserRole;
const ROLE_FILTER_OPTIONS: readonly RoleFilter[] = ['all', 'customer', 'restaurant', 'admin', 'driver'] as const;

const ROLE_I18N_KEY: Record<RoleFilter, string> = {
  all:        'admin_role_filter_all',
  customer:   'role_customer',
  restaurant: 'role_restaurant',
  admin:      'role_admin',
  driver:     'role_driver',
};

export default function CustomersTab({ users, onUpdateUser }: CustomersTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [contactTarget, setContactTarget] = useState<AdminUser | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visibleUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(u => {
      const matchesSearch = (u.displayName || u.email || '').toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' ? true : (u.role || 'customer') === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const performStatusChange = async (uid: string, action: 'suspend' | 'ban' | 'reinstate', confirmKey: string) => {
    if (!window.confirm(t(confirmKey))) return;
    setOpenMenuId(null);
    setPending(uid);
    try {
      const res = await api.post<{ success: boolean; user: AdminUser }>(`/users/${uid}/${action}`, {});
      if (onUpdateUser) onUpdateUser(uid, { accountStatus: res.user.accountStatus });
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : t('live_chat_generic_error'));
    } finally {
      setPending(null);
    }
  };

  return (
    <motion.div key="customers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E8E0D5] shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div>
              <p className="text-xs text-[#8FA396] font-medium mb-1">{t('admin_customers_total')}</p>
              <h3 className="text-2xl font-black text-[#1B1B1B]">{users.filter(u => u.role === 'customer').length}</h3>
            </div>
          </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E0D5] flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-[#1B1B1B]">{t('admin_customers_heading', { count: visibleUsers.length })}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label={t('admin_role_filter_label')}
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as RoleFilter)}
              className="bg-[#F5F0E8] border-none rounded-xl py-2 pl-3 pr-8 text-sm font-medium text-[#1B1B1B] outline-none focus:ring-2 focus:ring-[#1B5E52]/20 cursor-pointer"
            >
              {ROLE_FILTER_OPTIONS.map(r => (
                <option key={r} value={r}>{t(ROLE_I18N_KEY[r])}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8FA396]" />
              <input
                type="text"
                placeholder={t('admin_customers_search_placeholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#F5F0E8] border-none rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#1B5E52]/20 w-56"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[550px]">
          <thead>
            <tr className="text-xs font-bold text-[#8FA396] uppercase tracking-wider border-b border-[#E8E0D5]">
              <th className="px-6 py-4">{t('admin_col_customer')}</th>
              <th className="px-6 py-4">{t('admin_col_role')}</th>
              <th className="px-6 py-4">{t('admin_col_status')}</th>
              <th className="px-6 py-4">{t('admin_col_joined')}</th>
              <th className="px-6 py-4 text-right">{t('admin_col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F0E8]">
            {visibleUsers.map(u => {
              const status: AccountStatus = (u.accountStatus ?? 'active');
              const statusCfg = ACCOUNT_STATUS_CONFIG[status];
              const isInactive = status !== 'active';
              return (
                <tr key={u.uid} className="hover:bg-[#F5F0E8] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1B5E52]/10 flex items-center justify-center text-[#1B5E52] font-bold">
                        {u.displayName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1B1B1B]">{u.displayName || t('admin_customers_unknown')}</p>
                        <p className="text-xs text-[#8FA396]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                      u.role === 'restaurant' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>{u.role || 'customer'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${statusCfg.textCls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${statusCfg.dotCls}`} />
                      {t(statusCfg.labelKey)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#8FA396]">
                    {u.createdAt ? formatDate(u.createdAt) : '—'}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === u.uid ? null : u.uid)}
                      disabled={pending === u.uid}
                      className="p-2 hover:bg-[#F5F0E8] rounded-lg text-[#8FA396] transition-colors disabled:opacity-50"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {openMenuId === u.uid && (
                        <motion.div
                          ref={menuRef}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-4 top-10 w-52 bg-white rounded-2xl border border-[#E8E0D5] shadow-xl z-30 overflow-hidden"
                        >
                          <MenuItem
                            icon={<Eye className="w-3.5 h-3.5" />}
                            label={t('admin_action_view_orders')}
                            onClick={() => { setOpenMenuId(null); navigate(`/admin/orders?userId=${u.uid}`); }}
                          />
                          <MenuItem
                            icon={<Mail className="w-3.5 h-3.5" />}
                            label={t('admin_action_contact_info')}
                            onClick={() => { setOpenMenuId(null); setContactTarget(u); }}
                          />
                          {isInactive && (
                            <MenuItem
                              icon={<Check className="w-3.5 h-3.5" />}
                              label={t('admin_action_reinstate')}
                              tone="success"
                              onClick={() => void performStatusChange(u.uid, 'reinstate', 'admin_action_confirm_reinstate')}
                            />
                          )}
                          {status === 'active' && (
                            <>
                              <MenuItem
                                icon={<Pause className="w-3.5 h-3.5" />}
                                label={t('admin_action_suspend')}
                                tone="warning"
                                onClick={() => void performStatusChange(u.uid, 'suspend', 'admin_action_confirm_suspend')}
                              />
                              <MenuItem
                                icon={<Ban className="w-3.5 h-3.5" />}
                                label={t('admin_action_ban')}
                                tone="danger"
                                onClick={() => void performStatusChange(u.uid, 'ban', 'admin_action_confirm_ban')}
                              />
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <AnimatePresence>
        {contactTarget && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setContactTarget(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 bg-white dark:bg-[#111] rounded-3xl shadow-2xl p-6 w-full max-w-sm"
            >
              <h3 className="font-black text-base text-[#1B1B1B] dark:text-white mb-4">
                {t('admin_contact_info_title')}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#8FA396]" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#8FA396]">{t('admin_contact_info_email')}</p>
                    <p className="text-[#1B1B1B] dark:text-white font-medium">{contactTarget.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#8FA396]" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#8FA396]">{t('admin_contact_info_phone')}</p>
                    <p className="text-[#1B1B1B] dark:text-white font-medium">{contactTarget.mobileNumber || '—'}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setContactTarget(null)}
                className="mt-6 w-full py-2.5 rounded-full bg-[#1B5E52] text-white font-black text-xs hover:bg-[#164d43] transition-colors"
              >
                {t('Close')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type MenuItemTone = 'default' | 'success' | 'warning' | 'danger';
interface MenuItemProps {
  icon: ReactNode;
  label: string;
  tone?: MenuItemTone;
  onClick: () => void;
}
function MenuItem({ icon, label, tone = 'default', onClick }: MenuItemProps) {
  const toneCls: Record<MenuItemTone, string> = {
    default: 'text-[#1B1B1B] hover:bg-[#F5F0E8]',
    success: 'text-emerald-600 hover:bg-emerald-50',
    warning: 'text-amber-600 hover:bg-amber-50',
    danger:  'text-eco-secondary hover:bg-eco-secondary/10',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2 transition-colors ${toneCls[tone]}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
