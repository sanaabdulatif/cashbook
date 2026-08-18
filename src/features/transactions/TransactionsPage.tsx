import { useState } from 'react';
import { useStore } from '../../shared/lib/useStore';
import { useActiveBook, useCashBooks, useActiveCashBook, useCategories, useTransactions, useUserRole, useAddCashBook, useDeleteTransaction } from '../../shared/lib/hooks/useQueries';
import { formatCurrency, formatDate } from '../../shared/utils';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  ArrowLeft,
  BookOpen,
  ChevronRight
} from 'lucide-react';

interface TransactionsPageProps {
  onOpenAddModal: () => void;
}

export function TransactionsPage({ onOpenAddModal }: TransactionsPageProps) {
  const { 
    activeBookId,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    paymentMethodFilter,
    setPaymentMethodFilter,
    setActiveCashBookId
  } = useStore();

  const activeBook = useActiveBook();
  const { data: cashBooks = [] } = useCashBooks(activeBookId || undefined);
  const activeCashBook = useActiveCashBook(activeBookId || undefined);
  const { data: categories = [] } = useCategories(activeBookId || undefined);
  const { data: transactions = [] } = useTransactions(activeBookId || undefined);
  const userRole = useUserRole(activeBookId || undefined);

  const addCashBookMutation = useAddCashBook(activeBookId || undefined);
  const deleteTransactionMutation = useDeleteTransaction(activeBookId || undefined);

  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Sub-book creation form state
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newBookOpeningBalance, setNewBookOpeningBalance] = useState('');

  // Get only CashBooks belonging to the active business
  const currentCashBooks = cashBooks.filter(cb => cb.business_id === activeBook?.id);

  // Helper to calculate total balance for a cashbook
  const getCashBookBalance = (cbId: string, opening: number) => {
    const cbTransactions = transactions.filter(t => t.book_id === cbId);
    const totalIn = cbTransactions.filter(t => t.type === 'cash_in').reduce((sum, t) => sum + t.amount, 0);
    const totalOut = cbTransactions.filter(t => t.type === 'cash_out').reduce((sum, t) => sum + t.amount, 0);
    return opening + totalIn - totalOut;
  };

  // Helper to calculate transaction count for a cashbook
  const getCashBookTxCount = (cbId: string) => {
    return transactions.filter(t => t.book_id === cbId).length;
  };

  // Create new cashbook under the active business
  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookName.trim() || !activeBook) return;

    const opening = parseFloat(newBookOpeningBalance) || 0;
    addCashBookMutation.mutate({
      business_id: activeBook.id,
      name: newBookName.trim(),
      opening_balance: opening,
    }, {
      onSuccess: () => {
        setNewBookName('');
        setNewBookOpeningBalance('');
        setIsAddingBook(false);
      }
    });
  };

  // Filtering Logic for transactions in the active CashBook
  const filteredTransactions = transactions.filter((tx) => {
    // Only show transactions for active CashBook
    if (tx.book_id !== activeCashBook?.id) return false;

    // Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchNote = tx.note?.toLowerCase().includes(q);
      const matchAmt = tx.amount.toString().includes(q);
      if (!matchDesc && !matchNote && !matchAmt) return false;
    }

    // Type filter
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && tx.category_id !== categoryFilter) return false;

    // Payment method filter
    if (paymentMethodFilter !== 'all' && tx.payment_method !== paymentMethodFilter) return false;

    // Date range filter
    if (dateStart && tx.date < dateStart) return false;
    if (dateEnd && tx.date > dateEnd) return false;

    return true;
  });

  const handleDelete = (id: string, desc: string) => {
    if (userRole === 'viewer') {
      alert('Permission Denied: Viewers cannot delete transactions.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${desc}"?`)) {
      deleteTransactionMutation.mutate(id);
    }
  };

  // ================= VIEW 1: SELECTION VIEW =================
  if (!activeCashBook) {
    return (
      <div className="flex flex-col gap-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Business CashBooks</h1>
            <p className="text-sm text-secondary mt-0.5">
              Select a book under <span className="font-semibold text-primary">{activeBook?.name}</span> to view transactions.
            </p>
          </div>
          {userRole !== 'viewer' && (
            <button
              onClick={() => setIsAddingBook(true)}
              className="self-start md:self-auto bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-all flex items-center gap-2 shadow-ambient text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Book</span>
            </button>
          )}
        </div>

        {/* CashBooks Grid */}
        {currentCashBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentCashBooks.map((cb) => {
              const currentBalance = getCashBookBalance(cb.id, cb.opening_balance);
              const txCount = getCashBookTxCount(cb.id);
              return (
                <div
                  key={cb.id}
                  onClick={() => setActiveCashBookId(cb.id)}
                  className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-ambient hover:shadow-lg hover:border-primary transition-all cursor-pointer flex flex-col gap-4 group text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-secondary group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-on-surface truncate">{cb.name}</h3>
                    <p className="text-[11px] text-secondary mt-0.5 font-medium">{txCount} transactions ledger</p>
                  </div>
                  <div className="pt-2 border-t border-outline-variant/60">
                    <p className="text-xs text-secondary font-medium uppercase tracking-wider">Current Balance</p>
                    <p className="text-xl font-bold font-currency text-on-surface mt-0.5">
                      {formatCurrency(currentBalance, activeBook?.currency)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-secondary font-medium pt-1">
                    <span>Opening Balance:</span>
                    <span className="font-currency font-semibold text-on-surface">
                      {formatCurrency(cb.opening_balance, activeBook?.currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-ambient">
            <BookOpen className="w-12 h-12 text-secondary/40 mx-auto mb-3" />
            <p className="text-base font-bold text-on-surface">No cashbooks found</p>
            <p className="text-sm text-secondary mt-1 px-4">Click '+ Add Book' to create your first book.</p>
            {userRole !== 'viewer' && (
              <button
                onClick={() => setIsAddingBook(true)}
                className="mt-4 bg-primary text-on-primary font-bold px-4 py-2 rounded-xl text-xs hover:bg-primary-dark transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Book</span>
              </button>
            )}
          </div>
        )}

        {/* Add Book Modal */}
        {isAddingBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4">
              <h3 className="font-bold text-lg text-on-surface">Create New CashBook</h3>
              <form onSubmit={handleCreateBook} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="bookName">
                    Book Name
                  </label>
                  <input
                    id="bookName"
                    type="text"
                    placeholder="e.g. General Ledger"
                    value={newBookName}
                    onChange={(e) => setNewBookName(e.target.value)}
                    required
                    autoFocus
                    className="w-full h-[40px] px-3 rounded-lg border border-outline-variant focus:border-primary focus:outline-none text-sm text-on-surface bg-surface-container-lowest"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="openingBal">
                    Opening Balance
                  </label>
                  <input
                    id="openingBal"
                    type="number"
                    placeholder="e.g. 5000"
                    value={newBookOpeningBalance}
                    onChange={(e) => setNewBookOpeningBalance(e.target.value)}
                    className="w-full h-[40px] px-3 rounded-lg border border-outline-variant focus:border-primary focus:outline-none text-sm text-on-surface bg-surface-container-lowest"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingBook(false);
                      setNewBookName('');
                      setNewBookOpeningBalance('');
                    }}
                    className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-surface-container transition-colors text-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-on-primary hover:bg-primary-dark transition-colors"
                  >
                    Create Book
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= VIEW 2: LEDGER VIEW =================
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Back to list link & Header */}
      <div>
        <button
          onClick={() => setActiveCashBookId(null)}
          className="flex items-center gap-1 text-xs text-secondary hover:text-primary font-bold transition-colors mb-2.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Books</span>
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Transactions Ledger</h1>
            <p className="text-sm text-secondary mt-0.5">
              Full Cash In and Cash Out history for <span className="font-semibold text-primary">{activeCashBook?.name}</span>
            </p>
          </div>
          {userRole !== 'viewer' && (
            <button
              onClick={onOpenAddModal}
              className="self-start md:self-auto bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-all flex items-center gap-2 shadow-ambient text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* PRD Search & Filtering Toolbar */}
      <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl shadow-ambient flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-secondary absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by description, note, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:border-primary bg-surface-container-low"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3.5 py-2 border border-outline-variant rounded-xl text-sm font-medium text-on-surface bg-surface-container-low focus:outline-none focus:border-primary"
            >
              <option value="all">All Entry Types</option>
              <option value="cash_in">Cash In Only (+)</option>
              <option value="cash_out">Cash Out Only (-)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2 border border-outline-variant rounded-xl text-sm font-medium text-on-surface bg-surface-container-low focus:outline-none focus:border-primary"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date & Payment Method Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-outline-variant/60">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
              <Filter className="w-3.5 h-3.5" />
              <span>Date Range:</span>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="px-2 py-1 border border-outline-variant rounded-lg text-xs"
              />
              <span>to</span>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="px-2 py-1 border border-outline-variant rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
              <span>Payment:</span>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="px-2 py-1 border border-outline-variant rounded-lg text-xs"
              >
                <option value="all">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-secondary font-medium">
            Found <span className="font-bold text-on-surface">{filteredTransactions.length}</span> matching records
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-ambient overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-outline-variant text-xs text-secondary font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Receipt</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 text-sm">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-medium text-secondary whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        tx.type === 'cash_in' 
                          ? 'bg-cashin-bg text-cashin border border-cashin-border/30' 
                          : 'bg-cashout-bg text-cashout border border-cashout-border/30'
                      }`}>
                        {tx.type === 'cash_in' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {tx.type === 'cash_in' ? 'Cash In' : 'Cash Out'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-on-surface">
                      <div>{tx.description}</div>
                      {tx.note && <div className="text-xs text-secondary font-normal italic mt-0.5">{tx.note}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium">
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">
                        {categories.find(c => c.id === tx.category_id)?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-secondary font-medium">{tx.payment_method || 'Cash'}</td>
                    <td className={`py-3.5 px-4 text-right font-currency font-bold ${tx.type === 'cash_in' ? 'text-cashin' : 'text-cashout'}`}>
                      {tx.type === 'cash_in' ? '+' : '-'}{formatCurrency(tx.amount, activeBook?.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {tx.attachment_name ? (
                        <a
                          href={tx.attachment_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary font-semibold bg-primary-fixed/30 px-2.5 py-1 rounded-lg border border-primary/20 hover:bg-primary-fixed/50 hover:text-primary transition-all cursor-pointer"
                          title="View receipt"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[100px]">{tx.attachment_name}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-secondary/40 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {userRole !== 'viewer' ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDelete(tx.id, tx.description)}
                            className="p-1.5 text-secondary hover:text-cashout hover:bg-cashout-bg rounded-lg transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-secondary font-italic">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-base font-bold text-on-surface">No transactions found</p>
            <p className="text-xs text-secondary mt-1">Try adjusting your search query or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
