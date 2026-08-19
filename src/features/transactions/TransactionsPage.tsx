import { useState } from 'react';
import { useStore } from '../../shared/lib/useStore';
import { 
  useActiveBook, 
  useCashBooks, 
  useActiveCashBook, 
  useCategories, 
  useTransactions, 
  useUserRole, 
  useAddCashBook, 
  useDeleteTransaction,
  useBookMembers
} from '../../shared/lib/hooks/useQueries';
import { formatCurrency, formatDate } from '../../shared/utils';
import { useAuth } from '../../shared/lib/AuthContext';
import { AddTransactionModal } from '../../shared/ui/AddTransactionModal';
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
  ChevronRight,
  Calendar,
  ChevronLeft,
  Pencil
} from 'lucide-react';
import type { Transaction } from '../../shared/types';

export function TransactionsPage() {
  const { 
    activeBookId,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    paymentMethodFilter,
    setActiveCashBookId
  } = useStore();

  const activeBook = useActiveBook();
  const { data: cashBooks = [] } = useCashBooks(activeBookId || undefined);
  const activeCashBook = useActiveCashBook(activeBookId || undefined);
  const { data: categories = [] } = useCategories(activeBookId || undefined);
  const { data: transactions = [] } = useTransactions(activeBookId || undefined);
  const { data: members = [] } = useBookMembers(activeBookId || undefined);
  const { user } = useAuth();
  const userRole = useUserRole(activeBookId || undefined);

  const addCashBookMutation = useAddCashBook(activeBookId || undefined);
  const deleteTransactionMutation = useDeleteTransaction(activeBookId || undefined);

  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<Transaction | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Custom Calendar picker state
  const [tempStart, setTempStart] = useState<string | null>(null);
  const [tempEnd, setTempEnd] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (y: number, m: number) => {
    return new Date(y, m, 1).getDay();
  };

  const generateDays = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDayIndex = getFirstDayOfMonth(viewYear, viewMonth);
    const daysArray = [];

    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const prevMonthDaysCount = getDaysInMonth(prevYear, prevMonth);

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      daysArray.push({
        day: prevMonthDaysCount - i,
        isCurrentMonth: false,
        month: prevMonth,
        year: prevYear
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push({
        day: i,
        isCurrentMonth: true,
        month: viewMonth,
        year: viewYear
      });
    }

    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const remaining = 42 - daysArray.length;
    for (let i = 1; i <= remaining; i++) {
      daysArray.push({
        day: i,
        isCurrentMonth: false,
        month: nextMonth,
        year: nextYear
      });
    }

    return daysArray;
  };

  const formatDateString = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const handleDateClick = (y: number, m: number, d: number) => {
    const dateStr = formatDateString(y, m, d);
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd(null);
    } else {
      if (dateStr < tempStart) {
        setTempStart(dateStr);
        setTempEnd(null);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  const isDateInRange = (dateStr: string) => {
    if (tempStart && tempEnd) {
      return dateStr >= tempStart && dateStr <= tempEnd;
    }
    if (tempStart && hoveredDate) {
      return dateStr >= tempStart && dateStr <= hoveredDate;
    }
    return false;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Sub-book creation form state
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newBookOpeningBalance, setNewBookOpeningBalance] = useState('');

  // Get only CashBooks belonging to the active business
  let currentCashBooks = cashBooks.filter(cb => cb.business_id === activeBook?.id);

  // Filter based on user membership restriction
  const currentMember = members.find((m) => m.user_id === user?.id);
  const isBusinessOwner = activeBook && user && activeBook.user_id === user.id;

  if (!isBusinessOwner && currentMember && currentMember.access_for && currentMember.access_for !== 'All CashBooks') {
    currentCashBooks = currentCashBooks.filter(cb => cb.name === currentMember.access_for);
  }

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
              className="fixed bottom-20 right-4 md:static w-14 h-14 md:w-auto md:h-auto rounded-full md:rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg md:shadow-ambient text-sm cursor-pointer z-40"
              title="Add CashBook"
            >
              <Plus className="w-6 h-6 md:w-4 md:h-4" />
              <span className="hidden md:inline">Add Book</span>
            </button>
          )}
        </div>

        {/* CashBooks Grid */}
        {currentCashBooks.length > 0 ? (
          <div className="flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-6">
            {currentCashBooks.map((cb) => {
              const currentBalance = getCashBookBalance(cb.id, cb.opening_balance);
              const txCount = getCashBookTxCount(cb.id);
              return (
                <div
                  key={cb.id}
                  onClick={() => setActiveCashBookId(cb.id)}
                  className="bg-surface-container-lowest border border-outline-variant p-4 md:p-6 rounded-xl md:rounded-2xl shadow-ambient hover:shadow-lg hover:border-primary transition-all cursor-pointer flex flex-row items-center justify-between gap-3 group text-left min-w-0 md:flex-col md:items-start md:gap-4"
                >
                  {/* Icon and Book Info (Left side on mobile, top on desktop) */}
                  <div className="flex items-center gap-3 min-w-0 md:w-full md:flex-row md:justify-between md:items-center">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary-fixed flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all shrink-0">
                      <BookOpen className="w-4.5 h-4.5 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0 md:hidden">
                      <h3 className="font-bold text-sm text-on-surface truncate">{cb.name}</h3>
                      <p className="text-[10px] text-secondary mt-0.5 font-medium">{txCount} entries</p>
                    </div>
                    <ChevronRight className="hidden md:block w-5 h-5 text-secondary group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1 shrink-0" />
                  </div>

                  {/* Desktop Only Book Info block */}
                  <div className="hidden md:block">
                    <h3 className="font-bold text-base text-on-surface truncate">{cb.name}</h3>
                    <p className="text-[11px] text-secondary mt-0.5 font-medium">{txCount} entries</p>
                  </div>

                  {/* Balance block (Right side on mobile, middle on desktop) */}
                  <div className="text-right md:text-left pt-0 md:pt-2 md:border-t md:border-outline-variant/40 md:w-full min-w-0 shrink-0">
                    <p className="text-[9px] md:text-xs text-secondary font-medium uppercase tracking-wider truncate">Balance</p>
                    <p className="text-sm sm:text-base md:text-xl font-bold font-currency text-on-surface mt-0.5 truncate">
                      {formatCurrency(currentBalance, activeBook?.currency)}
                    </p>
                  </div>

                  {/* Desktop Only Opening Balance footer */}
                  <div className="hidden md:flex justify-between items-center text-xs text-secondary font-medium pt-1 w-full border-t border-outline-variant/30 md:border-t-0">
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
                className="mt-4 bg-primary text-on-primary font-bold px-4 py-2 rounded-xl text-xs hover:bg-primary-dark transition-colors inline-flex items-center gap-1.5 cursor-pointer"
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
              onClick={() => {
                setSelectedTxForEdit(null);
                setIsAddModalOpen(true);
              }}
              className="fixed bottom-20 right-4 md:static w-14 h-14 md:w-auto md:h-auto rounded-full md:rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg md:shadow-ambient text-sm cursor-pointer z-40"
              title="Add Entry"
            >
              <Plus className="w-6 h-6 md:w-4 md:h-4" />
              <span className="hidden md:inline">Add Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* PRD Search & Filtering Toolbar */}
      <div className="flex items-center justify-end bg-surface-container-lowest border border-outline-variant p-2.5 rounded-2xl shadow-ambient">
        {/* Right Side: Horizontal Icons list */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search toggle */}
          <div className="relative flex items-center">
            {showSearchInput && (
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-24 sm:w-48 px-3 py-1.5 mr-1.5 border border-outline-variant rounded-xl text-xs focus:outline-none focus:border-primary bg-surface-container-low animate-fadeIn"
                autoFocus
              />
            )}
            <button
              type="button"
              onClick={() => setShowSearchInput(!showSearchInput)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                showSearchInput || searchQuery
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-surface-container-lowest text-primary border-outline-variant hover:bg-surface-container/50'
              }`}
              title="Search Ledger"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Picker dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowCalendarMenu(!showCalendarMenu);
                setShowFilterMenu(false);
                setTempStart(dateStart || null);
                setTempEnd(dateEnd || null);
                const initialDate = dateStart ? new Date(dateStart) : new Date();
                setViewYear(initialDate.getFullYear());
                setViewMonth(initialDate.getMonth());
              }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                showCalendarMenu || dateStart || dateEnd
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-surface-container-lowest text-primary border-outline-variant hover:bg-surface-container/50'
              }`}
              title="Date Range Selector"
            >
              <Calendar className="w-4 h-4" />
            </button>
            {showCalendarMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCalendarMenu(false)} />
                <div className="absolute right-0 mt-2 p-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-20 animate-fadeIn w-72 text-left flex flex-col gap-3">
                  <div className="text-center bg-surface-container-low p-2 rounded-xl border border-outline-variant/40">
                    <p className="text-[10px] font-bold text-secondary">
                      {!tempStart && 'Select start date'}
                      {tempStart && !tempEnd && `Select end date (Start: ${formatDate(tempStart)})`}
                      {tempStart && tempEnd && `Range: ${formatDate(tempStart)} to ${formatDate(tempEnd)}`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 hover:bg-surface-container rounded-lg text-secondary transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-on-surface">
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-surface-container rounded-lg text-secondary transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center" onMouseLeave={() => setHoveredDate(null)}>
                    {WEEKDAY_NAMES.map((d) => (
                      <div key={d} className="text-[10px] font-bold text-secondary/60 py-1 uppercase tracking-wider">
                        {d}
                      </div>
                    ))}
                    {generateDays().map(({ day, isCurrentMonth, month, year }, idx) => {
                      const dateStr = formatDateString(year, month, day);
                      const isStart = dateStr === tempStart;
                      const isEnd = dateStr === tempEnd;
                      const inRange = isDateInRange(dateStr);
                      const isSelected = isStart || isEnd;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onMouseEnter={() => tempStart && !tempEnd && setHoveredDate(dateStr)}
                          onClick={() => handleDateClick(year, month, day)}
                          className={`h-7 w-7 text-[10px] font-semibold rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            !isCurrentMonth 
                              ? 'text-secondary/20 hover:bg-surface-container/50' 
                              : isSelected
                                ? 'bg-primary text-on-primary font-bold shadow-sm'
                                : inRange
                                  ? 'bg-primary/15 text-primary rounded-none first:rounded-l-full last:rounded-r-full'
                                  : 'text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 justify-between pt-2 border-t border-outline-variant/60">
                    <button
                      type="button"
                      onClick={() => {
                        setDateStart('');
                        setDateEnd('');
                        setTempStart(null);
                        setTempEnd(null);
                        setShowCalendarMenu(false);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-secondary hover:text-cashout hover:bg-cashout-bg/20 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear Range
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (tempStart && tempEnd) {
                          setDateStart(tempStart);
                          setDateEnd(tempEnd);
                        } else if (tempStart) {
                          setDateStart(tempStart);
                          setDateEnd(tempStart);
                        }
                        setShowCalendarMenu(false);
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-primary text-on-primary hover:bg-primary-dark transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Filter dropdown (All Entry Types & All Categories) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowFilterMenu(!showFilterMenu);
                setShowCalendarMenu(false);
              }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                showFilterMenu || typeFilter !== 'all' || categoryFilter !== 'all'
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-surface-container-lowest text-primary border-outline-variant hover:bg-surface-container/50'
              }`}
              title="Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute right-0 mt-2 p-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-20 animate-fadeIn w-56 text-left">
                  <h4 className="font-bold text-xs text-on-surface mb-2.5 uppercase tracking-wider">Filter Ledger</h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-secondary">Entry Type</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 border border-outline-variant rounded-lg text-xs text-on-surface bg-surface-container-low focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Entry Types</option>
                        <option value="cash_in">Cash In Only (+)</option>
                        <option value="cash_out">Cash Out Only (-)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-secondary">Category</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-outline-variant rounded-lg text-xs text-on-surface bg-surface-container-low focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTypeFilter('all');
                        setCategoryFilter('all');
                        setShowFilterMenu(false);
                      }}
                      className="w-full py-1.5 mt-1 bg-surface border border-outline-variant text-secondary rounded-lg text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer text-center"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </>
            )}
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
                            onClick={() => {
                              setSelectedTxForEdit(tx);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 text-secondary hover:text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                            title="Edit transaction"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id, tx.description)}
                            className="p-1.5 text-secondary hover:text-cashout hover:bg-cashout-bg rounded-lg transition-colors cursor-pointer"
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

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedTxForEdit(null);
        }}
        transactionToEdit={selectedTxForEdit}
      />
    </div>
  );
}
