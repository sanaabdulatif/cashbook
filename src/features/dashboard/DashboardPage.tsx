import { useStore } from '../../shared/lib/useStore';
import { 
  useActiveBook, 
  useCashBooks, 
  useActiveCashBook, 
  useCategories, 
  useTransactions,
  useBookMembers
} from '../../shared/lib/hooks/useQueries';
import { formatCurrency, formatDate } from '../../shared/utils';
import { useAuth } from '../../shared/lib/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  FileText,
  BookOpen
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export function DashboardPage() {
  const { activeBookId, setActiveCashBookId } = useStore();
  const activeBook = useActiveBook();
  const { data: cashBooks = [] } = useCashBooks(activeBookId || undefined);
  const activeCashBook = useActiveCashBook(activeBookId || undefined);
  const { data: categories = [] } = useCategories(activeBookId || undefined);
  const { data: transactions = [] } = useTransactions(activeBookId || undefined);
  const { data: members = [] } = useBookMembers(activeBookId || undefined);
  const { user } = useAuth();

  // Get only CashBooks belonging to the active business
  let currentCashBooks = cashBooks.filter(cb => cb.business_id === activeBook?.id);

  // Filter based on user membership restriction
  const currentMember = members.find((m) => m.user_id === user?.id);
  const isBusinessOwner = activeBook && user && activeBook.user_id === user.id;

  if (!isBusinessOwner && currentMember && currentMember.access_for && currentMember.access_for !== 'All CashBooks') {
    currentCashBooks = currentCashBooks.filter(cb => cb.name === currentMember.access_for);
  }

  // If no cashbooks exist under this business
  if (currentCashBooks.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Dashboard</h1>
            <p className="text-sm text-secondary mt-0.5">
              Real-time financial overview for <span className="font-semibold text-primary">{activeBook?.name}</span>
            </p>
          </div>
        </div>
        <div className="py-16 text-center bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-ambient">
          <BookOpen className="w-12 h-12 text-secondary/40 mx-auto mb-3" />
          <p className="text-base font-bold text-on-surface">No CashTracks found</p>
          <p className="text-xs text-secondary mt-1 px-4">
            Please navigate to the <span className="font-bold text-primary">CashTrack</span> tab and create a sub-ledger to view metrics.
          </p>
        </div>
      </div>
    );
  }

  const selectedBook = activeCashBook || currentCashBooks[0];
  const openingBalance = selectedBook?.opening_balance || 0;
  const activeTransactions = transactions.filter(tx => tx.book_id === selectedBook?.id);

  const totalCashIn = activeTransactions.filter(t => t.type === 'cash_in').reduce((sum, t) => sum + t.amount, 0);
  const totalCashOut = activeTransactions.filter(t => t.type === 'cash_out').reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = openingBalance + totalCashIn - totalCashOut;
  const summary = {
    openingBalance,
    totalCashIn,
    totalCashOut,
    currentBalance
  };

  const recentTransactions = activeTransactions.slice(0, 5);

  // Prepare chart data for Cash In vs Cash Out by Date
  const dateMap: Record<string, { date: string; cashIn: number; cashOut: number }> = {};
  activeTransactions.forEach((tx) => {
    const formatted = formatDate(tx.date);
    if (!dateMap[formatted]) {
      dateMap[formatted] = { date: formatted, cashIn: 0, cashOut: 0 };
    }
    if (tx.type === 'cash_in') dateMap[formatted].cashIn += tx.amount;
    if (tx.type === 'cash_out') dateMap[formatted].cashOut += tx.amount;
  });
  const barChartData = Object.values(dateMap).slice(-7);

  // Category Pie Chart data
  const categoryMap: Record<string, number> = {};
  activeTransactions.filter(t => t.type === 'cash_out').forEach((tx) => {
    const cat = categories.find(c => c.id === tx.category_id)?.name || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + tx.amount;
  });
  const pieChartData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ['#BA1A1A', '#65081F', '#5D5F5F', '#897172', '#00AE79'];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Dashboard</h1>
          <p className="text-sm text-secondary mt-0.5">
            Real-time financial overview for <span className="font-semibold text-primary">{activeBook?.name} / {activeCashBook?.name || currentCashBooks[0]?.name}</span>
          </p>
        </div>
        <div>
          <select
            value={activeCashBook?.id || currentCashBooks[0]?.id || ''}
            onChange={(e) => {
              setActiveCashBookId(e.target.value);
            }}
            className="px-3.5 py-2 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface bg-surface-container-lowest focus:outline-none focus:border-primary cursor-pointer shadow-sm"
          >
            {currentCashBooks.map((cb) => (
              <option key={cb.id} value={cb.id}>
                {cb.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PRD Rule 5.5 Metric Cards */}
      <div className="grid grid-cols-4 gap-1.5 md:gap-4">
        {/* Net Current Balance Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-2 md:p-5 rounded-xl md:rounded-2xl shadow-ambient relative overflow-hidden flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between mb-1 md:mb-3">
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-secondary uppercase tracking-wider truncate">
              <span className="hidden md:inline">Current </span>Balance
            </span>
            <div className="hidden md:flex w-8 h-8 rounded-xl bg-primary-fixed items-center justify-center text-primary">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs sm:text-base md:text-2xl font-bold font-currency text-on-surface truncate">
            {formatCurrency(summary.currentBalance, activeBook?.currency)}
          </p>
          <div className="mt-2 hidden md:flex items-center gap-2 text-xs text-secondary font-medium">
            <span>Opening Balance:</span>
            <span className="font-currency font-bold text-on-surface">
              {formatCurrency(summary.openingBalance, activeBook?.currency)}
            </span>
          </div>
        </div>

        {/* Total Cash In Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-2 md:p-5 rounded-xl md:rounded-2xl shadow-ambient flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between mb-1 md:mb-3">
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-cashin uppercase tracking-wider truncate">
              <span className="hidden md:inline">Total </span>Cash In
            </span>
            <div className="hidden md:flex w-8 h-8 rounded-xl bg-cashin-bg items-center justify-center text-cashin">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs sm:text-base md:text-2xl font-bold font-currency text-cashin truncate">
            {formatCurrency(summary.totalCashIn, activeBook?.currency)}
          </p>
          <p className="mt-2 hidden md:block text-xs text-secondary font-medium">
            {transactions.filter(t => t.type === 'cash_in').length} entries recorded
          </p>
        </div>

        {/* Total Cash Out Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-2 md:p-5 rounded-xl md:rounded-2xl shadow-ambient flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between mb-1 md:mb-3">
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-cashout uppercase tracking-wider truncate">
              <span className="hidden md:inline">Total </span>Cash Out
            </span>
            <div className="hidden md:flex w-8 h-8 rounded-xl bg-cashout-bg items-center justify-center text-cashout">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs sm:text-base md:text-2xl font-bold font-currency text-cashout truncate">
            {formatCurrency(summary.totalCashOut, activeBook?.currency)}
          </p>
          <p className="mt-2 hidden md:block text-xs text-secondary font-medium">
            {transactions.filter(t => t.type === 'cash_out').length} entries recorded
          </p>
        </div>

        {/* Net Flow Ratio Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-2 md:p-5 rounded-xl md:rounded-2xl shadow-ambient flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between mb-1 md:mb-3">
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-secondary uppercase tracking-wider truncate">
              <span className="hidden md:inline">Net </span>Cashflow
            </span>
            <div className="hidden md:flex w-8 h-8 rounded-xl items-center justify-center bg-[#0EA5E9]/10 text-[#0EA5E9]">
              {summary.totalCashIn >= summary.totalCashOut ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <p className="text-xs sm:text-base md:text-2xl font-bold font-currency text-[#0EA5E9] truncate">
            {formatCurrency(summary.totalCashIn - summary.totalCashOut, activeBook?.currency)}
          </p>
          <p className="mt-2 hidden md:block text-xs text-secondary font-medium">
            Calculated dynamically
          </p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash In vs Cash Out Comparison */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-ambient">
          <h3 className="font-bold text-base text-on-surface mb-4">Cash In vs Cash Out Overview</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#897172" />
                <YAxis tick={{ fontSize: 12 }} stroke="#897172" />
                <Tooltip 
                  formatter={(val: any) => [`₹${val}`, '']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DCC0C1' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cashIn" 
                  name="Cash In" 
                  stroke="#00AE79" 
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#00AE79', strokeWidth: 0 }}
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cashOut" 
                  name="Cash Out" 
                  stroke="#F43F5E" 
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#F43F5E', strokeWidth: 0 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-ambient flex flex-col justify-between">
          <h3 className="font-bold text-base text-on-surface mb-2">Expense Category Breakdown</h3>
          {pieChartData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`₹${val}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-secondary font-medium">No expenses recorded yet</div>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {pieChartData.slice(0, 4).map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-secondary">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-ambient overflow-hidden">
        <div className="p-5 border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-bold text-base text-on-surface">Recent Transactions</h3>
          <span className="text-xs text-secondary font-semibold">Showing latest 5 entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-outline-variant text-xs text-secondary font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60 text-sm">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface-container/50 transition-colors">
                  <td className="py-3 px-4 text-xs font-medium text-secondary">{formatDate(tx.date)}</td>
                  <td className="py-3 px-4 font-semibold text-on-surface">
                    <div className="flex items-center gap-2">
                      {tx.attachment_name && <FileText className="w-3.5 h-3.5 text-primary" />}
                      <span>{tx.description}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium">
                    <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">
                      {categories.find(c => c.id === tx.category_id)?.name || 'General'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-secondary font-medium">{tx.payment_method || 'Cash'}</td>
                  <td className={`py-3 px-4 text-right font-currency font-bold ${tx.type === 'cash_in' ? 'text-cashin' : 'text-cashout'}`}>
                    {tx.type === 'cash_in' ? '+' : '-'}{formatCurrency(tx.amount, activeBook?.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
