import React, { useState, useMemo } from 'react';
import { 
  Table2, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  FileSpreadsheet,
  ArrowUpDown
} from 'lucide-react';

export default function MarketMatrixPage({ filteredRecords, onExport }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('ajax');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter records
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return filteredRecords;
    const q = searchQuery.toLowerCase();
    return filteredRecords.filter(r => 
      r.dist.toLowerCase().includes(q) || 
      r.st.toLowerCase().includes(q) || 
      r.code.toLowerCase().includes(q)
    );
  }, [filteredRecords, searchQuery]);

  // Sort records
  const sorted = useMemo(() => {
    return [...searchFiltered].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [searchFiltered, sortField, sortOrder]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  // Totals for the footer
  const totals = useMemo(() => {
    let ajax = 0, schwing = 0, venus = 0, kyb = 0, apollo = 0, fiori = 0, tot = 0;
    searchFiltered.forEach(r => {
      ajax += r.ajax;
      schwing += r.schwing;
      venus += r.venus;
      kyb += r.kyb;
      apollo += r.apollo;
      fiori += r.fiori;
      tot += r.tot;
    });
    return { ajax, schwing, venus, kyb, apollo, fiori, tot };
  }, [searchFiltered]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Market Matrix (Power BI Fact Model)</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
              19,716 Rows
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Granular district and RTO registration volumes across financial quarters and months
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search RTO, district, state..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-orange-500 w-64 transition placeholder:text-slate-400"
            />
          </div>

          <button 
            onClick={onExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Fact Table</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 select-none">
              <tr>
                <th onClick={() => handleSort('dist')} className="p-3 cursor-pointer hover:text-slate-900">
                  <div className="flex items-center gap-1">District / RTO <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th onClick={() => handleSort('st')} className="p-3 cursor-pointer hover:text-slate-900">
                  <div className="flex items-center gap-1">State <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th onClick={() => handleSort('reg')} className="p-3 cursor-pointer hover:text-slate-900">Region</th>
                <th onClick={() => handleSort('m')} className="p-3 text-center cursor-pointer hover:text-slate-900">Month</th>
                <th onClick={() => handleSort('fq')} className="p-3 text-center cursor-pointer hover:text-slate-900">FQ</th>
                <th onClick={() => handleSort('ajax')} className="p-3 text-right bg-orange-50/60 text-orange-700 font-black cursor-pointer hover:underline">
                  Ajax
                </th>
                <th onClick={() => handleSort('schwing')} className="p-3 text-right text-blue-700 cursor-pointer hover:underline">Schwing</th>
                <th onClick={() => handleSort('venus')} className="p-3 text-right text-emerald-700 cursor-pointer hover:underline">Venus</th>
                <th onClick={() => handleSort('kyb')} className="p-3 text-right text-purple-700 cursor-pointer hover:underline">KYB</th>
                <th onClick={() => handleSort('apollo')} className="p-3 text-right text-amber-700 cursor-pointer hover:underline">Apollo</th>
                <th onClick={() => handleSort('tot')} className="p-3 text-right text-slate-800 cursor-pointer hover:underline">Total Mkt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
              {paginated.map((r, i) => (
                <tr key={i} className="hover:bg-orange-50/20 transition">
                  <td className="p-3 font-semibold text-slate-900">{r.dist}</td>
                  <td className="p-3 text-slate-600">{r.st}</td>
                  <td className="p-3 text-slate-400">{r.reg}</td>
                  <td className="p-3 text-center font-bold text-slate-700">{r.m}</td>
                  <td className="p-3 text-center text-slate-500">{r.fq}</td>
                  <td className="p-3 text-right font-black text-orange-600 bg-orange-50/30">{r.ajax}</td>
                  <td className="p-3 text-right text-blue-600 font-semibold">{r.schwing}</td>
                  <td className="p-3 text-right text-emerald-600 font-semibold">{r.venus}</td>
                  <td className="p-3 text-right text-purple-600 font-semibold">{r.kyb}</td>
                  <td className="p-3 text-right text-amber-600 font-semibold">{r.apollo}</td>
                  <td className="p-3 text-right text-slate-700 font-bold">{r.tot.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            {/* Totals Row */}
            <tfoot className="bg-slate-50/80 font-bold text-xs border-t-2 border-slate-200">
              <tr>
                <td colSpan={5} className="p-3 text-slate-800 font-bold">Filtered Page Subtotals</td>
                <td className="p-3 text-right text-orange-600 font-black">{totals.ajax.toLocaleString()}</td>
                <td className="p-3 text-right text-blue-600">{totals.schwing.toLocaleString()}</td>
                <td className="p-3 text-right text-emerald-600">{totals.venus.toLocaleString()}</td>
                <td className="p-3 text-right text-purple-600">{totals.kyb.toLocaleString()}</td>
                <td className="p-3 text-right text-amber-600">{totals.apollo.toLocaleString()}</td>
                <td className="p-3 text-right text-slate-900 font-black">{totals.tot.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select 
              value={pageSize} 
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-bold outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length.toLocaleString()} records</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 font-semibold transition"
            >
              Previous
            </button>
            <span className="px-2 text-xs font-bold text-slate-800">
              {currentPage} / {totalPages}
            </span>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 font-semibold transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
