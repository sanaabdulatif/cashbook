import { useState } from 'react';
import { useStore } from '../../shared/lib/useStore';
import { useActiveBook, useCashBooks, useActiveCashBook, useCategories, useTransactions, useBookMembers } from '../../shared/lib/hooks/useQueries';
import { formatCurrency, formatDate } from '../../shared/utils';
import { useAuth } from '../../shared/lib/AuthContext';
import { 
  FileSpreadsheet, 
  FileText, 
  Calendar,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export function ReportsPage() {
  const { activeBookId, setActiveCashBookId } = useStore();
  const activeBook = useActiveBook();
  const { data: cashBooks = [] } = useCashBooks(activeBookId || undefined);
  const activeCashBook = useActiveCashBook(activeBookId || undefined);
  const { data: categories = [] } = useCategories(activeBookId || undefined);
  const { data: transactions = [] } = useTransactions(activeBookId || undefined);
  const { data: members = [] } = useBookMembers(activeBookId || undefined);
  const { user } = useAuth();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
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

  const openDatePicker = () => {
    setTempStart(startDate || null);
    setTempEnd(endDate || null);
    const initialDate = startDate ? new Date(startDate) : new Date();
    setViewYear(initialDate.getFullYear());
    setViewMonth(initialDate.getMonth());
    setShowDatePicker(true);
  };

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
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Financial Reports</h1>
            <p className="text-sm text-secondary mt-0.5">
              Export and download transaction data for <span className="font-semibold text-primary">{activeBook?.name}</span>
            </p>
          </div>
        </div>
        <div className="py-16 text-center bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-ambient">
          <BookOpen className="w-12 h-12 text-secondary/40 mx-auto mb-3" />
          <p className="text-base font-bold text-on-surface">No CashTracks found</p>
          <p className="text-xs text-secondary mt-1 px-4">
            Please navigate to the <span className="font-bold text-primary">CashTrack</span> tab and create a sub-ledger to export reports.
          </p>
        </div>
      </div>
    );
  }

  const selectedBook = activeCashBook || currentCashBooks[0];

  // Filter transactions by date range & active cashbook
  const filtered = transactions.filter((tx) => {
    if (tx.book_id !== selectedBook?.id) return false;
    if (startDate && tx.date < startDate) return false;
    if (endDate && tx.date > endDate) return false;
    return true;
  });

  const totalIn = filtered.filter(t => t.type === 'cash_in').reduce((sum, t) => sum + t.amount, 0);
  const totalOut = filtered.filter(t => t.type === 'cash_out').reduce((sum, t) => sum + t.amount, 0);
  const netFlow = totalIn - totalOut;

  // Category breakdown for report
  const categoryTotals: Record<string, { name: string; type: string; total: number }> = {};
  filtered.forEach((tx) => {
    const catName = categories.find(c => c.id === tx.category_id)?.name || 'General';
    if (!categoryTotals[catName]) {
      categoryTotals[catName] = { name: catName, type: tx.type, total: 0 };
    }
    categoryTotals[catName].total += tx.amount;
  });

  // Export to CSV / Excel
  const exportToExcel = () => {
    const data = filtered.map((tx) => ({
      Date: formatDate(tx.date),
      Type: tx.type === 'cash_in' ? 'Cash In' : 'Cash Out',
      Description: tx.description,
      Category: categories.find(c => c.id === tx.category_id)?.name || 'General',
      PaymentMethod: tx.payment_method || 'Cash',
      Amount: tx.amount,
      Note: tx.note || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');    // Save Excel file
    XLSX.writeFile(workbook, `${activeBook?.name || 'CashTrack'}_${selectedBook?.name}_Report.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Top burgundy header strip
    doc.setFillColor(101, 8, 31); // #65081F Burgundy
    doc.rect(0, 0, 210, 15, 'F');

    // Title Section
    doc.setTextColor(101, 8, 31);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text("Financial Statement Report", 14, 32);

    // Metadata Details
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(93, 95, 95); // Secondary grey
    doc.text("Business Name:", 14, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(`${activeBook?.name || 'N/A'}`, 48, 42);

    doc.setFont("Helvetica", "bold");
    doc.text("CashTrack Ledger:", 14, 48);
    doc.setFont('helvetica', 'normal');
    doc.text(`${selectedBook?.name || 'N/A'}`, 48, 48);

    doc.setFont('helvetica', 'bold');
    doc.text("Report Period:", 14, 54);
    doc.setFont('helvetica', 'normal');
    doc.text(`${startDate || 'Start'} to ${endDate || 'Present'}`, 48, 54);

    doc.setFont('helvetica', 'bold');
    doc.text("Generated on:", 14, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`${new Date().toLocaleDateString()}`, 48, 60);

    // Card 1: Total Cash In
    doc.setFillColor(230, 244, 234); // Soft Green
    doc.roundedRect(14, 68, 56, 22, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 174, 121); // CashIn Green
    doc.text("TOTAL CASH IN", 18, 74);
    doc.setFontSize(13);
    doc.text(`${formatCurrency(totalIn, activeBook?.currency)}`, 18, 83);

    // Card 2: Total Cash Out
    doc.setFillColor(252, 232, 230); // Soft Red
    doc.roundedRect(75, 68, 56, 22, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(186, 26, 26); // CashOut Red
    doc.text("TOTAL CASH OUT", 79, 74);
    doc.setFontSize(13);
    doc.text(`${formatCurrency(totalOut, activeBook?.currency)}`, 79, 83);

    // Card 3: Net Cashflow
    if (netFlow >= 0) {
      doc.setFillColor(230, 244, 234);
      doc.setTextColor(0, 174, 121);
    } else {
      doc.setFillColor(252, 232, 230);
      doc.setTextColor(186, 26, 26);
    }
    doc.roundedRect(136, 68, 60, 22, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text("NET CASHFLOW", 140, 74);
    doc.setFontSize(13);
    doc.text(`${formatCurrency(netFlow, activeBook?.currency)}`, 140, 83);

    // Ledger Title
    let y = 102;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(101, 8, 31);
    doc.setFontSize(11);
    doc.text(`Transaction Ledger (${filtered.length} entries)`, 14, y);
    y += 6;

    // Draw Column Headers
    doc.setFillColor(101, 8, 31); // Burgundy background
    doc.rect(14, y, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.text("Date", 16, y + 5.5);
    doc.text("Type", 42, y + 5.5);
    doc.text("Description", 64, y + 5.5);
    doc.text("Category", 124, y + 5.5);
    doc.text("Payment", 152, y + 5.5);
    doc.text("Amount", 194, y + 5.5, { align: 'right' });
    y += 8;

    // Rows iteration
    filtered.forEach((tx, index) => {
      // Check page boundary
      if (y > 270) {
        doc.addPage();
        
        // Page header strip
        doc.setFillColor(101, 8, 31);
        doc.rect(0, 0, 210, 15, 'F');
        y = 25;

        // Repeat table header row
        doc.setFillColor(101, 8, 31);
        doc.rect(14, y, 182, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text("Date", 16, y + 5.5);
        doc.text("Type", 42, y + 5.5);
        doc.text("Description", 64, y + 5.5);
        doc.text("Category", 124, y + 5.5);
        doc.text("Payment", 152, y + 5.5);
        doc.text("Amount", 194, y + 5.5, { align: 'right' });
        y += 8;
      }

      // Alternate row backgrounds
      if (index % 2 === 1) {
        doc.setFillColor(248, 249, 250); // very light grey/white
        doc.rect(14, y, 182, 8, 'F');
      }

      // Thin bottom gridline
      doc.setDrawColor(230, 232, 234);
      doc.setLineWidth(0.15);
      doc.line(14, y + 8, 196, y + 8);

      // Value font setup
      doc.setTextColor(25, 28, 29);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      const dateStr = formatDate(tx.date);
      const typeStr = tx.type === 'cash_in' ? 'Cash In' : 'Cash Out';
      const descStr = tx.description.length > 34 ? tx.description.substring(0, 32) + '..' : tx.description;
      const catName = categories.find(c => c.id === tx.category_id)?.name || 'General';
      const payStr = tx.payment_method || 'Cash';
      const amtStr = formatCurrency(tx.amount, activeBook?.currency);

      // Render columns text
      doc.text(dateStr, 16, y + 5.5);

      // Color-coded Type column
      if (tx.type === 'cash_in') {
        doc.setTextColor(0, 174, 121);
      } else {
        doc.setTextColor(186, 26, 26);
      }
      doc.text(typeStr, 42, y + 5.5);
      doc.setTextColor(25, 28, 29);

      doc.text(descStr, 64, y + 5.5);
      doc.text(catName, 124, y + 5.5);
      doc.text(payStr, 152, y + 5.5);

      // Render bold colored amount column
      doc.setFont('helvetica', 'bold');
      if (tx.type === 'cash_in') {
        doc.setTextColor(0, 174, 121);
        doc.text(`+${amtStr}`, 194, y + 5.5, { align: 'right' });
      } else {
        doc.setTextColor(186, 26, 26);
        doc.text(`-${amtStr}`, 194, y + 5.5, { align: 'right' });
      }

      y += 8;
    });

    // Save PDF
    doc.save(`${activeBook?.name || 'CashTrack'}_${selectedBook?.name}_Report.pdf`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Financial Reports</h1>
          <p className="text-sm text-secondary mt-0.5">
            Generate and export custom statement reports for <span className="font-semibold text-primary">{activeBook?.name} / {selectedBook?.name}</span>
          </p>
        </div>
      </div>

      {/* Date Range & Book Selector */}
      <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-2xl shadow-ambient">
        <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2 border-b border-outline-variant/60 pb-2.5">
          <Calendar className="w-4 h-4 text-primary" />
          <span>Select Report Scope & Period</span>
        </h3>
        <div className="flex flex-col gap-1 w-full">
          <div className="flex items-end gap-3 w-full">
            {/* Select CashBook */}
            <div className="flex-1 min-w-0">
              <label className="text-xs font-semibold text-on-surface block mb-1">
                Select CashTrack *
              </label>
              <select
                value={selectedBook?.id || ''}
                onChange={(e) => {
                  setActiveCashBookId(e.target.value);
                }}
                className="w-full px-3.5 py-2 border border-outline-variant rounded-xl text-sm font-medium text-on-surface bg-surface-container-low focus:outline-none focus:border-primary cursor-pointer h-[42px]"
              >
                {currentCashBooks.map((cb) => (
                  <option key={cb.id} value={cb.id}>{cb.name}</option>
                ))}
              </select>
            </div>

            {/* Pick Range (Calendar Button) */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <span className="block text-[11px] font-semibold text-secondary mb-1.5 text-center whitespace-nowrap">
                Pick Range
              </span>
              <button
                type="button"
                onClick={openDatePicker}
                className={`w-[42px] h-[42px] border rounded-xl flex items-center justify-center transition-colors shadow-sm cursor-pointer ${
                  startDate || endDate 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-surface-container-low border-outline-variant text-secondary hover:bg-surface-container'
                }`}
                title={startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'Pick Date Range'}
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Range Indicator & Reset option */}
          {(startDate || endDate) && (
            <div className="text-xs text-secondary font-medium mt-1 flex items-center gap-1.5 animate-fadeIn">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Report Period: <strong className="text-on-surface">{formatDate(startDate)} - {formatDate(endDate)}</strong></span>
              <button
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs font-bold text-cashout hover:underline cursor-pointer ml-1"
                title="Clear date range filter"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PRD Report Totals */}
      <div className="grid grid-cols-3 gap-1.5 md:gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant p-2 md:p-5 rounded-xl md:rounded-2xl shadow-ambient min-w-0">
          <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-cashin uppercase tracking-wider truncate block">
            <span className="hidden sm:inline">Total </span>Cash In
          </span>
          <p className="text-xs sm:text-base md:text-2xl font-bold font-currency text-cashin mt-1 truncate">
            {formatCurrency(totalIn, activeBook?.currency)}
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-2 md:p-5 rounded-xl md:rounded-2xl shadow-ambient min-w-0">
          <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-cashout uppercase tracking-wider truncate block">
            <span className="hidden sm:inline">Total </span>Cash Out
          </span>
          <p className="text-xs sm:text-base md:text-2xl font-bold font-currency text-cashout mt-1 truncate">
            {formatCurrency(totalOut, activeBook?.currency)}
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-2 md:p-5 rounded-xl md:rounded-2xl shadow-ambient min-w-0">
          <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-secondary uppercase tracking-wider truncate block">
            <span className="hidden sm:inline">Net </span>Cashflow
          </span>
          <p className={`text-xs sm:text-base md:text-2xl font-bold font-currency mt-1 truncate ${netFlow >= 0 ? 'text-cashin' : 'text-cashout'}`}>
            {formatCurrency(netFlow, activeBook?.currency)}
          </p>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-ambient flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-on-surface">Transaction History Ledger</h3>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="bg-primary text-on-primary p-2.5 rounded-xl hover:bg-primary-dark transition-all flex items-center justify-center shadow-ambient cursor-pointer w-[42px] h-[42px]"
              title="Download Options"
            >
              <Download className="w-5 h-5" />
            </button>
            
            {showDownloadMenu && (
              <>
                {/* Overlay backdrop to dismiss dropdown on click outside */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDownloadMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg py-1.5 z-20 animate-fadeIn text-left">
                  <button
                    type="button"
                    onClick={() => {
                      exportToExcel();
                      setShowDownloadMenu(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2.5 font-medium cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-cashin" />
                    <span>Excel / CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportToPDF();
                      setShowDownloadMenu(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2.5 font-medium cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-outline-variant text-xs text-secondary font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 text-sm">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="py-3 px-4 text-xs font-medium text-secondary whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        tx.type === 'cash_in' 
                          ? 'bg-cashin-bg text-cashin border border-cashin-border/20' 
                          : 'bg-cashout-bg text-cashout border border-cashout-border/20'
                      }`}>
                        {tx.type === 'cash_in' ? 'Cash In' : 'Cash Out'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-on-surface">
                      <div>{tx.description}</div>
                      {tx.note && <div className="text-xs text-secondary font-normal italic mt-0.5">{tx.note}</div>}
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
        ) : (
          <div className="py-12 text-center bg-surface rounded-xl">
            <p className="text-sm font-bold text-on-surface">No records found for this period</p>
          </div>
        )}
      </div>

      {/* Calendar Date Range Picker Dialog */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-[340px] shadow-2xl p-5 flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-on-surface">Select Date Range</h4>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="text-secondary hover:text-on-surface text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="text-center bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/40">
              <p className="text-[11px] font-bold text-secondary">
                {!tempStart && 'Select start date'}
                {tempStart && !tempEnd && `Select end date (Start: ${formatDate(tempStart)})`}
                {tempStart && tempEnd && `Range: ${formatDate(tempStart)} to ${formatDate(tempEnd)}`}
              </p>
            </div>

            <div className="flex items-center justify-between mb-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-surface-container rounded-lg text-secondary transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-on-surface">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-surface-container rounded-lg text-secondary transition-colors cursor-pointer"
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
                    className={`h-8 w-8 text-xs font-semibold rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      !isCurrentMonth 
                        ? 'text-secondary/20 hover:bg-surface-container/50' 
                        : isSelected
                          ? 'bg-primary text-on-primary font-bold shadow-md'
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
                  setStartDate('');
                  setEndDate('');
                  setTempStart(null);
                  setTempEnd(null);
                  setShowDatePicker(false);
                }}
                className="px-3 py-2 text-xs font-semibold text-secondary hover:text-cashout hover:bg-cashout-bg/20 rounded-lg transition-colors cursor-pointer"
              >
                Clear Range
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tempStart && tempEnd) {
                    setStartDate(tempStart);
                    setEndDate(tempEnd);
                  } else if (tempStart) {
                    setStartDate(tempStart);
                    setEndDate(tempStart);
                  }
                  setShowDatePicker(false);
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:bg-primary-dark transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
