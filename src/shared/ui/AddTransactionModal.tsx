import React, { useState } from 'react';
import { useStore } from '../lib/useStore';
import { useActiveBook, useActiveCashBook, useCategories, useAddTransaction, useUserRole } from '../lib/hooks/useQueries';
import { X, Upload, FileText } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'cash_in' | 'cash_out';
}

export function AddTransactionModal({ isOpen, onClose, initialType = 'cash_in' }: AddTransactionModalProps) {
  const { activeBookId } = useStore();
  const activeBook = useActiveBook();
  const activeCashBook = useActiveCashBook(activeBookId || undefined);
  const { data: categories = [] } = useCategories(activeBookId || undefined);
  const userRole = useUserRole(activeBookId || undefined);
  const addTransactionMutation = useAddTransaction(activeBookId || undefined);
  
  const [type, setType] = useState<'cash_in' | 'cash_out'>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'Card' | 'UPI' | 'Other'>('Bank');
  const [note, setNote] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  // Filter categories by type
  const availableCategories = categories.filter(
    (c) => c.type === 'both' || c.type === type
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (userRole === 'viewer') {
      setError('Permission Denied: Viewers cannot create transactions.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a short description.');
      return;
    }

    if (!activeCashBook) {
      setError('No active CashBook selected.');
      return;
    }

    addTransactionMutation.mutate({
      book_id: activeCashBook.id,
      type,
      amount: numAmount,
      description,
      date,
      category_id: categoryId || availableCategories[0]?.id,
      payment_method: paymentMethod,
      note,
      attachment_name: attachmentName || undefined,
    }, {
      onSuccess: () => {
        setAmount('');
        setDescription('');
        setNote('');
        setAttachmentName('');
        onClose();
      },
      onError: (err: any) => {
        setError(err.message || 'Failed to add transaction.');
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface">
          <h2 className="font-bold text-lg text-on-surface">New Transaction Entry</h2>
          <button 
            onClick={onClose}
            className="text-secondary hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-cashout-bg border border-cashout-border rounded-xl text-cashout text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Type Toggle: Cash In vs Cash Out */}
          <div className="grid grid-cols-2 gap-2 bg-surface-container p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('cash_in')}
              className={`py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                type === 'cash_in'
                  ? 'bg-cashin text-white shadow-md'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span>+ Cash In</span>
            </button>
            <button
              type="button"
              onClick={() => setType('cash_out')}
              className={`py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                type === 'cash_out'
                  ? 'bg-cashout text-white shadow-md'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span>- Cash Out</span>
            </button>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">
                Amount ({activeBook?.currency || '₹'}) *
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl font-currency font-bold text-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl font-medium text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Description / Title *</label>
            <input
              type="text"
              placeholder="e.g. Sales, Client Deposit, Office Fuel"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:border-primary"
            />
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:border-primary bg-surface-container-lowest"
              >
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:border-primary bg-surface-container-lowest"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Optional Note</label>
            <textarea
              rows={2}
              placeholder="Additional details..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Receipt File Upload */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Receipt Attachment (PDF / Image)</label>
            <div className="border-2 border-dashed border-outline-variant rounded-xl p-3 text-center hover:border-primary transition-colors cursor-pointer relative bg-surface-container-low">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center gap-2 text-xs text-secondary font-medium">
                {attachmentName ? (
                  <>
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-bold text-primary truncate">{attachmentName}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Click to attach image or PDF receipt</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-outline-variant text-secondary text-sm font-medium hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary-dark transition-all shadow-md"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
