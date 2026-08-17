import React, { useState } from 'react';
import { useStore } from '../../shared/lib/useStore';
import { useAuth } from '../../shared/lib/AuthContext';
import { useActiveBook, useCashBooks, useBookMembers, useAddBookMember, useUpdateBookMemberRole, useDeleteBookMember, useUserRole } from '../../shared/lib/hooks/useQueries';
import { 
  User, 
  CheckCircle2,
  Mail,
  Shield,
  Building,
  Trash2,
  ArrowRight
} from 'lucide-react';

export function SettingsPage() {
  const { profile } = useAuth();
  const { activeBookId } = useStore();
  
  const activeBook = useActiveBook();
  const { data: cashBooks = [] } = useCashBooks(activeBookId || undefined);
  const { data: members = [] } = useBookMembers(activeBookId || undefined);
  const userRole = useUserRole(activeBookId || undefined);

  const addMemberMutation = useAddBookMember(activeBookId || undefined);
  const updateMemberRoleMutation = useUpdateBookMemberRole(activeBookId || undefined);
  const deleteMemberMutation = useDeleteBookMember(activeBookId || undefined);

  // Profile Form States
  const [profileName, setProfileName] = useState(profile?.full_name || 'Demo User');
  const [profileEmail, setProfileEmail] = useState(profile?.email || 'demo@example.com');

  // Add Member Form States
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'owner' | 'editor' | 'viewer'>('editor');
  const [newMemberAccess, setNewMemberAccess] = useState('All CashBooks');

  const [message, setMessage] = useState('');

  // Get CashBooks under active business
  const currentCashBooks = cashBooks.filter(cb => cb.business_id === activeBook?.id);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Profile settings saved successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'owner') {
      alert('Permission Denied: Only Book Owners can invite members.');
      return;
    }
    if (!newMemberEmail.trim()) return;

    addMemberMutation.mutate({
      email: newMemberEmail.trim(),
      role: newMemberRole,
      accessFor: newMemberAccess
    }, {
      onSuccess: () => {
        setNewMemberEmail('');
        setMessage(`Successfully invited ${newMemberEmail} for ${newMemberAccess}`);
        setTimeout(() => setMessage(''), 3000);
      },
      onError: (err: any) => {
        alert(err.message || 'Failed to invite member.');
      }
    });
  };

  const handleDeleteMember = (memberId: string, email: string) => {
    if (userRole !== 'owner') {
      alert('Permission Denied: Only Book Owners can remove members.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove access for "${email}"?`)) {
      deleteMemberMutation.mutate(memberId, {
        onSuccess: () => {
          setMessage(`Removed member "${email}"`);
          setTimeout(() => setMessage(''), 3000);
        },
        onError: (err: any) => {
          alert(err.message || 'Failed to remove member.');
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fadeIn text-left">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Settings & Collaboration</h1>
        <p className="text-sm text-secondary mt-0.5">
          Manage your personal profile and control team collaboration access for <span className="font-semibold text-primary">{activeBook?.name}</span>
        </p>
      </div>

      {message && (
        <div className="p-3.5 bg-cashin-bg border border-cashin-border/30 rounded-xl text-cashin text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Part 1: Our Profile */}
      <div className="w-full bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-ambient flex flex-col gap-5">
        <div>
          <h3 className="font-bold text-base text-on-surface">Personal Profile Info</h3>
          <p className="text-xs text-secondary mt-0.5">Your personal credentials and role assignments.</p>
        </div>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5" htmlFor="pName">
                <User className="w-3.5 h-3.5 text-secondary" />
                <span>Full Name</span>
              </label>
              <input
                id="pName"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-container-low"
              />
            </div>

            {/* Email input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5" htmlFor="pEmail">
                <Mail className="w-3.5 h-3.5 text-secondary" />
                <span>Email Address</span>
              </label>
              <input
                id="pEmail"
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-container-low"
              />
            </div>
          </div>

          {/* Metadata Badges */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-outline-variant/60">
            <div className="p-3 rounded-xl bg-surface border border-outline-variant/40 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <span className="text-[10px] text-secondary font-medium block uppercase tracking-wider">Account Role</span>
                <span className="text-xs font-bold text-on-surface capitalize">{userRole}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-outline-variant/40 flex items-center gap-2">
              <Building className="w-5 h-5 text-secondary" />
              <div>
                <span className="text-[10px] text-secondary font-medium block uppercase tracking-wider">Active Business</span>
                <span className="text-xs font-bold text-on-surface truncate max-w-[120px] block">{activeBook?.name}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 bg-primary text-on-primary font-bold py-2.5 rounded-xl hover:bg-primary-dark transition-all text-sm shadow-sm cursor-pointer"
          >
            Save Changes
          </button>
        </form>
      </div>

      <div className="border-t border-outline-variant/60 my-2"></div>

      {/* Part 2: Add Members */}
      <div className="flex flex-col gap-6">
        {/* Invite form */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-ambient">
          <div className="mb-4">
            <h3 className="font-bold text-base text-on-surface">Invite Team Member</h3>
            <p className="text-xs text-secondary mt-0.5">Grant access to specific CashBooks under this business profile.</p>
          </div>

          <form onSubmit={handleInviteMember} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Email Address *</label>
              <input
                type="email"
                placeholder="colleague@example.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                disabled={userRole !== 'owner'}
                required
                className="w-full px-3.5 py-2 border border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:border-primary bg-surface-container-low disabled:opacity-50 h-[38px] md:h-[42px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Select Access Role *</label>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as any)}
                disabled={userRole !== 'owner'}
                className="w-full px-3.5 py-2 border border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:border-primary bg-surface-container-low disabled:opacity-50 h-[38px] md:h-[42px]"
              >
                <option value="editor">Editor (Can add/edit)</option>
                <option value="viewer">Viewer (Read-only)</option>
                <option value="owner">Owner (Full access)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Access For *</label>
              <select
                value={newMemberAccess}
                onChange={(e) => setNewMemberAccess(e.target.value)}
                disabled={userRole !== 'owner'}
                className="w-full px-3.5 py-2 border border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:border-primary bg-surface-container-low disabled:opacity-50 h-[38px] md:h-[42px]"
              >
                <option value="All CashBooks">All CashBooks</option>
                {currentCashBooks.map((cb) => (
                  <option key={cb.id} value={cb.name}>{cb.name}</option>
                ))}
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={userRole !== 'owner'}
                className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 text-sm shadow-sm h-[38px] md:h-[42px] cursor-pointer"
              >
                Invite Member
              </button>
            </div>
          </form>
        </div>

        {/* Members Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-ambient overflow-hidden">
          <div className="p-5 border-b border-outline-variant">
            <h3 className="font-bold text-base text-on-surface">Book Members & Permissions ({members.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-outline-variant text-xs text-secondary font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Member Email</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Access For</th>
                  <th className="py-3.5 px-4 text-right">Change Role</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 text-sm">
                {members.map((mem) => (
                  <tr key={mem.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-on-surface">
                      {mem.profile?.email || mem.user_id}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                        mem.role === 'owner' ? 'bg-primary-fixed text-primary' :
                        mem.role === 'editor' ? 'bg-cashin-bg text-cashin' : 'bg-surface-container text-secondary'
                      }`}>
                        {mem.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-secondary font-bold flex items-center gap-1.5 pt-4">
                      <span className="bg-surface-container px-2 py-0.5 rounded text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
                        <Building className="w-3 h-3 text-secondary" />
                        <span>{activeBook?.name}</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-secondary" />
                      <span className="bg-primary-fixed/30 border border-primary/10 px-2 py-0.5 rounded text-[11px] font-bold text-primary">
                        {mem.access_for || 'All CashBooks'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {userRole === 'owner' && mem.role !== 'owner' ? (
                        <select
                          value={mem.role}
                          onChange={(e) => updateMemberRoleMutation.mutate({ memberId: mem.id, role: e.target.value as any })}
                          className="px-2 py-1 border border-outline-variant rounded-lg text-xs font-semibold bg-surface cursor-pointer"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className="text-xs text-secondary/50 font-italic">Locked</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {userRole === 'owner' && mem.role !== 'owner' ? (
                        <button
                          onClick={() => handleDeleteMember(mem.id, mem.profile?.email || mem.user_id)}
                          className="p-1.5 text-secondary hover:text-cashout hover:bg-cashout-bg rounded-lg transition-colors cursor-pointer"
                          title="Remove team member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-secondary/40 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
