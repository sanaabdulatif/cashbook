import { useState } from 'react';
import { useStore } from '../../shared/lib/useStore';
import { useActiveBook, useCashBooks, useActiveCashBook, useCategories, useTransactions } from '../../shared/lib/hooks/useQueries';
import { formatCurrency, formatDate } from '../../shared/utils';
import { 
  FileSpreadsheet, 
  FileText, 
  Calendar,
  BookOpen
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

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const currentCashBooks = cashBooks.filter(cb => cb.business_id === activeBook?.id);

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
          <p className="text-base font-bold text-on-surface">No CashBooks found</p>
          <p className="text-xs text-secondary mt-1 px-4">
            Please navigate to the <span className="font-bold text-primary">CashBook</span> tab and create a sub-ledger to export reports.
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions Report');
    XLSX.writeFile(workbook, `${activeBook?.name || 'CashBook'}_${selectedBook?.name}_Report.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`CashBook Financial Report: ${activeBook?.name || 'Business'} - ${selectedBook?.name}`, 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Period: ${startDate || 'Start'} to ${endDate || 'Present'}`, 14, 34);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Summary Totals:`, 14, 46);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Cash In: ₹${totalIn}`, 14, 54);
    doc.text(`Total Cash Out: ₹${totalOut}`, 14, 60);
    doc.text(`Net Cashflow: ₹${netFlow}`, 14, 66);

    let y = 80;
    doc.setFont('helvetica', 'bold');
    doc.text(`Transaction Ledger (${filtered.length} entries):`, 14, y);
    y += 8;

    doc.setFontSize(9);
    filtered.forEach((tx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${tx.date} | ${tx.type.toUpperCase()} | ${tx.description} | ₹${tx.amount}`, 14, y);
      y += 6;
    });

    doc.save(`${activeBook?.name || 'CashBook'}_${selectedBook?.name}_Report.pdf`);
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

        <div className="flex items-center gap-3">
          <button
            onClick={exportToExcel}
            className="bg-surface-container-lowest border border-outline-variant text-on-surface font-semibold px-4 py-2.5 rounded-xl hover:bg-surface-container transition-all flex items-center gap-2 text-sm shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-cashin" />
            <span>Excel / CSV</span>
          </button>
          <button
            onClick={exportToPDF}
            className="bg-primary text-on-primary font-bold px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-all flex items-center gap-2 shadow-ambient text-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Date Range & Book Selector */}
      <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-2xl shadow-ambient">
        <h3 className="font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span>Select Report Scope & Period</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Select CashBook *</label>
            <select
              value={selectedBook?.id || ''}
              onChange={(e) => {
                setActiveCashBookId(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl text-sm font-medium text-on-surface bg-surface-container-low focus:outline-none focus:border-primary"
            >
              {currentCashBooks.map((cb) => (
                <option key={cb.id} value={cb.id}>{cb.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:border-primary bg-surface-container-low"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:border-primary bg-surface-container-low"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="w-full py-2.5 border border-outline-variant rounded-xl text-xs font-semibold text-secondary hover:bg-surface-container transition-colors"
            >
              Reset Date Range
            </button>
          </div>
        </div>
      </div>

      {/* PRD Report Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-2xl shadow-ambient">
          <span className="text-xs font-bold text-cashin uppercase tracking-wider">Total Cash In</span>
          <p className="text-2xl font-bold font-currency text-cashin mt-1">
            {formatCurrency(totalIn, activeBook?.currency)}
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-2xl shadow-ambient">
          <span className="text-xs font-bold text-cashout uppercase tracking-wider">Total Cash Out</span>
          <p className="text-2xl font-bold font-currency text-cashout mt-1">
            {formatCurrency(totalOut, activeBook?.currency)}
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-2xl shadow-ambient">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">Net Cashflow</span>
          <p className={`text-2xl font-bold font-currency mt-1 ${netFlow >= 0 ? 'text-cashin' : 'text-cashout'}`}>
            {formatCurrency(netFlow, activeBook?.currency)}
          </p>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-ambient flex flex-col gap-4">
        <h3 className="font-bold text-base text-on-surface">Transaction History Ledger</h3>
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
    </div>
  );
}
