import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useStore } from '../lib/useStore';
import { useBooks, useActiveBook, useAddBook, useUserRole } from '../lib/hooks/useQueries';
import { 
  LayoutDashboard, 
  Wallet, 
  BarChart3, 
  Settings as SettingsIcon, 
  Plus, 
  LogOut, 
  ChevronDown
} from 'lucide-react';


export function Sidebar() {
  const { profile, signOut, user } = useAuth();
  const { activeBookId, setActiveBookId } = useStore();
  const { data: books = [] } = useBooks();
  const activeBook = useActiveBook();
  const userRole = useUserRole(activeBookId || undefined);
  const addBookMutation = useAddBook();

  const [showBookDropdown, setShowBookDropdown] = React.useState(false);
  const [isAddingBusiness, setIsAddingBusiness] = React.useState(false);
  const [newBusinessName, setNewBusinessName] = React.useState('');
  const [addError, setAddError] = React.useState<string | null>(null);

  const handleAddBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessName.trim()) return;
    if (!user) {
      setAddError('Not authenticated');
      return;
    }

    setAddError(null);
    addBookMutation.mutate({
      name: newBusinessName.trim(),
      currency: '₹',
      opening_balance: 0,
      user_id: user.id,
    }, {
      onSuccess: () => {
        setNewBusinessName('');
        setIsAddingBusiness(false);
        setShowBookDropdown(false);
      },
      onError: (err: any) => {
        setAddError(err.message || 'Failed to add business');
      }
    });
  };

  const handleCloseModal = () => {
    setIsAddingBusiness(false);
    setNewBusinessName('');
    setAddError(null);
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'CashBook', icon: Wallet },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-[240px] bg-surface dark:bg-surface-container-low border-r border-outline-variant dark:border-outline flex-col py-6 px-4 z-40">
      {/* Brand Header & Book Switcher */}
      <div className="mb-6 px-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold shadow-ambient">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-primary leading-tight tracking-tight">CashBook</h1>
          </div>
        </div>

        {/* Active Cash Book Selector */}
        <div className="relative">
          <button 
            onClick={() => setShowBookDropdown(!showBookDropdown)}
            className="w-full flex items-center justify-between p-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl hover:border-primary transition-all text-left"
          >
            <div className="min-w-0">
              <p className="text-xs text-secondary font-medium uppercase tracking-wider">Your Business</p>
              <p className="font-semibold text-sm text-on-surface truncate">{activeBook?.name || 'Select Business'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-secondary shrink-0" />
          </button>

          {showBookDropdown && (
            <div className="absolute top-full left-0 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-ambient z-50 py-1">
              <div className="max-h-[160px] overflow-y-auto">
                {books.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setActiveBookId(b.id); setShowBookDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-container transition-colors truncate ${activeBook?.id === b.id ? 'font-bold text-primary bg-primary-fixed/20' : 'text-on-surface'}`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
              <div className="border-t border-outline-variant my-1"></div>
              <button
                onClick={() => { setIsAddingBusiness(true); }}
                className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-surface-container transition-colors font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Business</span>
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Navigation Links */}
      <nav className="flex flex-col gap-1 flex-grow">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-full flex items-center gap-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-secondary hover:bg-secondary-container hover:text-on-surface'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>


      {/* User Profile Footer */}
      <div className="border-t border-outline-variant pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold shrink-0 text-xs">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-xs text-on-surface truncate">{profile?.full_name || 'User'}</span>
            <span className="text-[10px] text-secondary capitalize truncate font-semibold">{userRole}</span>
          </div>
        </div>
        <button
          onClick={signOut}
          title="Sign Out"
          className="p-1.5 text-secondary hover:text-cashout transition-colors rounded-lg"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
      {isAddingBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-lg text-on-surface">Add New Business</h3>
            
            {addError && (
              <div className="p-3 rounded-lg bg-cashout/10 border border-cashout/20 text-cashout text-xs font-semibold text-center" role="alert">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddBusinessSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-on-surface" htmlFor="bizName">
                  Business Name
                </label>
                <input
                  id="bizName"
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  disabled={addBookMutation.isPending}
                  required
                  autoFocus
                  className="w-full h-[40px] px-3 rounded-lg border border-outline-variant focus:border-primary focus:outline-none text-sm text-on-surface bg-surface-container-lowest disabled:opacity-50"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={addBookMutation.isPending}
                  className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-surface-container transition-colors text-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBookMutation.isPending}
                  className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-on-primary hover:bg-primary-dark transition-colors disabled:opacity-75"
                >
                  {addBookMutation.isPending ? 'Adding...' : 'Add Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}

export function Navbar() {
  const { profile, user } = useAuth();
  const { setActiveBookId } = useStore();
  const { data: books = [] } = useBooks();
  const activeBook = useActiveBook();
  const addBookMutation = useAddBook();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [isAddingBusiness, setIsAddingBusiness] = React.useState(false);
  const [newBusinessName, setNewBusinessName] = React.useState('');
  const [addError, setAddError] = React.useState<string | null>(null);

  const handleAddBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessName.trim()) return;
    if (!user) {
      setAddError('Not authenticated');
      return;
    }

    setAddError(null);
    addBookMutation.mutate({
      name: newBusinessName.trim(),
      currency: '₹',
      opening_balance: 0,
      user_id: user.id
    }, {
      onSuccess: () => {
        setNewBusinessName('');
        setIsAddingBusiness(false);
        setShowDropdown(false);
      },
      onError: (err: any) => {
        setAddError(err.message || 'Failed to add business');
      }
    });
  };

  const handleCloseModal = () => {
    setIsAddingBusiness(false);
    setNewBusinessName('');
    setAddError(null);
  };

  return (
    <nav className="md:hidden fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 bg-surface border-b border-outline-variant h-[64px]">
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 cursor-pointer text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs text-primary block leading-tight">CashBook</span>
            <span className="text-[11px] text-on-surface font-semibold flex items-center gap-0.5">
              <span>{activeBook?.name || 'Select Business'}</span>
              <ChevronDown className="w-3 h-3 text-secondary" />
            </span>
          </div>
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 w-48 mt-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 py-1">
            <div className="max-h-[160px] overflow-y-auto">
              {books.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveBookId(b.id);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-surface-container transition-colors truncate block ${
                    activeBook?.id === b.id ? 'font-bold text-primary bg-primary-fixed/20' : 'text-on-surface'
                }`}
              >
                {b.name}
              </button>
            ))}
            </div>
            <div className="border-t border-outline-variant my-1"></div>
            <button
              onClick={() => { setIsAddingBusiness(true); setShowDropdown(false); }}
              className="w-full text-left px-3.5 py-2 text-xs text-primary hover:bg-surface-container transition-colors font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Business</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs">
          {profile?.full_name?.charAt(0) || 'U'}
        </div>
      </div>

      {isAddingBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-lg text-on-surface">Add New Business</h3>
            
            {addError && (
              <div className="p-3 rounded-lg bg-cashout/10 border border-cashout/20 text-cashout text-xs font-semibold text-center" role="alert">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddBusinessSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-on-surface" htmlFor="bizNameMobile">
                  Business Name
                </label>
                <input
                  id="bizNameMobile"
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  disabled={addBookMutation.isPending}
                  required
                  autoFocus
                  className="w-full h-[40px] px-3 rounded-lg border border-outline-variant focus:border-primary focus:outline-none text-sm text-on-surface bg-surface-container-lowest disabled:opacity-50"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={addBookMutation.isPending}
                  className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-surface-container transition-colors text-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBookMutation.isPending}
                  className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-on-primary hover:bg-primary-dark transition-colors disabled:opacity-75"
                >
                  {addBookMutation.isPending ? 'Adding...' : 'Add Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}

export function BottomNavigation() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'CashBook', icon: Wallet },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant/60 h-[64px] flex justify-around items-center z-50 shadow-lg pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all py-1 w-16 ${
                isActive
                  ? 'text-primary'
                  : 'text-secondary hover:text-on-surface'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
