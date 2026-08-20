import React from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useAddBook } from '../../lib/hooks/useQueries';

interface AddBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddBusinessModal({ isOpen, onClose }: AddBusinessModalProps) {
  const { user } = useAuth();
  const addBookMutation = useAddBook();
  const [newBusinessName, setNewBusinessName] = React.useState('');
  const [addError, setAddError] = React.useState<string | null>(null);

  if (!isOpen) return null;

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
        onClose();
      },
      onError: (err: any) => {
        setAddError(err.message || 'Failed to add business');
      }
    });
  };

  const handleCloseModal = () => {
    setNewBusinessName('');
    setAddError(null);
    onClose();
  };

  return (
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
            <label className="text-xs font-semibold text-on-surface" htmlFor="bizNameModalGlobal">
              Business Name
            </label>
            <input
              id="bizNameModalGlobal"
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
  );
}
