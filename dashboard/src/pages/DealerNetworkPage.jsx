import React, { useState, useMemo } from 'react';
import vahanData from '../data/vahanMaster.json';
import { 
  Network, 
  MapPin, 
  Search, 
  TrendingUp, 
  Award, 
  Target, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Download, 
  SlidersHorizontal,
  Compass,
  AlertTriangle,
  Building,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip 
} from 'recharts';

export default function DealerNetworkPage({ filteredRecords }) {
  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState('ajax');
  const [sortOrder, setSortOrder] = useState('desc');

  // Roll up records by District / RTO territory
  const territoryMap = useMemo(() => {
    const map = {};
    vahanData.records.forEach(r => {
      const key = `${r.code}-${r.dist}`;
      if (!map[key]) {
        map[key] = {
          code: r.code,
          dist: r.dist,
          st: r.st,
          reg: r.reg,
          ajax: 0,
          schwing: 0,
          venus: 0,
          kyb: 0,
          apollo: 0,
          competitors: 0,
          total: 0
        };
      }
      map[key].ajax += r.ajax;
      map[key].schwing += r.schwing;
      map[key].venus += r.venus;
      map[key].kyb += r.kyb;
      map[key].apollo += r.apollo;
      map[key].competitors += (r.schwing + r.venus + r.kyb + r.apollo + r.fiori + r.elsa + r.armix + r.macons);
      map[key].total += r.tot;
    });

    return Object.values(map).map(t => {
      const segTotal = t.ajax + t.competitors;
      const share = segTotal > 0 ? Math.round((t.ajax / segTotal) * 100) : 0;
      
      let tier = 'Inactive';
      let tierColor = 'bg-slate-100 text-slate-600';
      if (t.ajax >= 50) {
        tier = 'Superhub (Tier 1)';
        tierColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      } else if (t.ajax >= 15) {
        tier = 'Growth Hub (Tier 2)';
        tierColor = 'bg-blue-100 text-blue-800 border border-blue-200';
      } else if (t.ajax >= 1) {
        tier = 'Niche Hub (Tier 3)';
        tierColor = 'bg-amber-100 text-amber-800 border border-amber-200';
      } else if (t.competitors > 0) {
        tier = 'White Space';
        tierColor = 'bg-rose-100 text-rose-800 border border-rose-200';
      }

      return {
        ...t,
        segTotal,
        share,
        tier,
        tierColor
      };
    });
  }, []);

  // Filtered territories
  const filteredTerritories = useMemo(() => {
    return territoryMap.filter(t => {
      if (selectedRegion !== 'All' && t.reg !== selectedRegion) return false;
      if (selectedTier !== 'All') {
        if (selectedTier === 'Superhub' && !t.tier.includes('Tier 1')) return false;
        if (selectedTier === 'Growth' && !t.tier.includes('Tier 2')) return false;
        if (selectedTier === 'Niche' && !t.tier.includes('Tier 3')) return false;
        if (selectedTier === 'WhiteSpace' && t.tier !== 'White Space') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!t.dist.toLowerCase().includes(q) && !t.code.toLowerCase().includes(q) && !t.st.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [territoryMap, selectedRegion, selectedTier, searchQuery]);

  // Sorted territories
  const sortedTerritories = useMemo(() => {
    return [...filteredTerritories].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredTerritories, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedTerritories.length / pageSize) || 1;
  const paginatedTerritories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTerritories.slice(start, start + pageSize);
  }, [sortedTerritories, currentPage, pageSize]);

  // Top 8 Superhubs for Chart
  const topHubsChartData = useMemo(() => {
    const list = [...territoryMap]
      .filter(t => t.ajax > 0)
      .sort((a, b) => b.ajax - a.ajax)
      .slice(0, 8);
    return list.map(t => {
      // Clean display name, e.g. "Bhubaneswar" instead of long string
      let cleanName = t.dist.split('-')[0].replace('RTO', '').replace('DTO', '').trim();
      if (!cleanName || cleanName.length < 3) cleanName = t.dist.slice(0, 14);
      return {
        name: cleanName,
        code: t.code,
        Ajax: t.ajax,
        Competitors: t.competitors
      };
    });
  }, [territoryMap]);

  // White Spaces (High competitor volume, 0 Ajax registrations)
  const whiteSpaces = useMemo(() => {
    return [...territoryMap]
      .filter(t => t.ajax === 0 && t.competitors > 0)
      .sort((a, b) => b.competitors - a.competitors)
      .slice(0, 6);
  }, [territoryMap]);

  // Tier counts
  const tierStats = useMemo(() => {
    let superhubs = 0, growth = 0, niche = 0, white = 0;
    territoryMap.forEach(t => {
      if (t.ajax >= 50) superhubs++;
      else if (t.ajax >= 15) growth++;
      else if (t.ajax >= 1) niche++;
      else if (t.competitors > 0) white++;
    });
    return { superhubs, growth, niche, white };
  }, [territoryMap]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExport = () => {
    const headers = ['RTO_Code', 'District', 'State', 'Region', 'Ajax_Volume', 'Competitor_Volume', 'Total_Market', 'Market_Share_Pct', 'Territory_Tier'];
    const rows = sortedTerritories.map(t => [
      `"${t.code}"`, `"${t.dist}"`, `"${t.st}"`, `"${t.reg}"`,
      t.ajax, t.competitors, t.total, `${t.share}%`, `"${t.tier}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AJAX_Dealer_Territory_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* =========================================
          PAGE HEADER & TIER SUMMARY CARDS
          ========================================= */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Dealer Network & Territory Penetration Hub</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                1,674 RTOs Tracked
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              District dealership performance tiers, white space opportunity radar, and footprint expansion
            </p>
          </div>

          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Territory Directory</span>
          </button>
        </div>

        {/* 4 Interactive Tier Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            onClick={() => { setSelectedTier(selectedTier === 'Superhub' ? 'All' : 'Superhub'); setCurrentPage(1); }}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              selectedTier === 'Superhub' 
                ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20' 
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-emerald-50/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-emerald-800">Tier 1 Superhubs</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{tierStats.superhubs} RTOs</div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">&gt;50 Ajax units/year</p>
          </div>

          <div 
            onClick={() => { setSelectedTier(selectedTier === 'Growth' ? 'All' : 'Growth'); setCurrentPage(1); }}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              selectedTier === 'Growth' 
                ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20' 
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-blue-50/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-blue-800">Tier 2 Growth Hubs</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{tierStats.growth} RTOs</div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">15 to 49 Ajax units/year</p>
          </div>

          <div 
            onClick={() => { setSelectedTier(selectedTier === 'Niche' ? 'All' : 'Niche'); setCurrentPage(1); }}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              selectedTier === 'Niche' 
                ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20' 
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-amber-50/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-amber-800">Tier 3 Niche Hubs</span>
              <MapPin className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{tierStats.niche} RTOs</div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">1 to 14 Ajax units/year</p>
          </div>

          <div 
            onClick={() => { setSelectedTier(selectedTier === 'WhiteSpace' ? 'All' : 'WhiteSpace'); setCurrentPage(1); }}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              selectedTier === 'WhiteSpace' 
                ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-500/20' 
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-rose-50/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-rose-800">White Space Targets</span>
              <Target className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{tierStats.white} RTOs</div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">0 Ajax, Competitors active</p>
          </div>
        </div>
      </div>

      {/* =========================================
          ROW 1: TOP DEALER HUBS CHART & WHITE SPACE OPPORTUNITY RADAR
          ========================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Top 8 Dealer Power Hubs Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">National Superhub Volume Leaderboard</h3>
              <p className="text-xs text-slate-400 font-medium">Top 8 highest-performing dealer territories</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              High Dominance
            </span>
          </div>

          <div className="h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topHubsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '10px', fontSize: '11px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }} 
                />
                <Bar dataKey="Ajax" fill="#ea580c" radius={[4, 4, 0, 0]} name="Ajax Units" />
                <Bar dataKey="Competitors" fill="#94a3b8" radius={[4, 4, 0, 0]} name="All Competitors" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: White Space Expansion Radar */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">White Space Opportunity Radar</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-3">
              Districts where competitors have logged sales but Ajax has zero registrations. Prime candidates for appointing sub-dealers:
            </p>

            <div className="space-y-2.5">
              {whiteSpaces.map((ws, i) => (
                <div key={ws.code} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-rose-50/30 transition flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span>{ws.dist}</span>
                      <span className="text-[10px] font-semibold text-slate-400">({ws.code})</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{ws.st} • {ws.reg} Region</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-600 block">{ws.competitors} units</span>
                    <span className="text-[9px] font-semibold text-slate-400">Competitor Sales</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>Total White Space Opportunity:</span>
            <strong className="text-slate-800">~150 Potential Mixers</strong>
          </div>
        </div>

      </div>

      {/* =========================================
          ROW 2: FULL SEARCHABLE TERRITORY DIRECTORY
          ========================================= */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Territory Directory</h3>
            <span className="text-xs text-slate-400">({sortedTerritories.length.toLocaleString()} matching RTOs)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Region Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">Region:</span>
              <select
                value={selectedRegion}
                onChange={(e) => { setSelectedRegion(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold outline-none cursor-pointer"
              >
                <option value="All">All Regions</option>
                <option value="West">West</option>
                <option value="South">South</option>
                <option value="North">North</option>
                <option value="Central">Central</option>
                <option value="East">East</option>
                <option value="North-East">North-East</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search district, RTO code..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-orange-500 w-52 transition placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 select-none">
              <tr>
                <th onClick={() => handleSort('code')} className="p-3 cursor-pointer hover:text-slate-900">
                  <div className="flex items-center gap-1">RTO Code <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th onClick={() => handleSort('dist')} className="p-3 cursor-pointer hover:text-slate-900">
                  <div className="flex items-center gap-1">District Territory <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th onClick={() => handleSort('st')} className="p-3 cursor-pointer hover:text-slate-900">State</th>
                <th onClick={() => handleSort('reg')} className="p-3 cursor-pointer hover:text-slate-900">Region</th>
                <th onClick={() => handleSort('ajax')} className="p-3 text-right bg-orange-50/60 text-orange-700 font-black cursor-pointer hover:underline">
                  Ajax Volume
                </th>
                <th onClick={() => handleSort('competitors')} className="p-3 text-right text-slate-600 cursor-pointer hover:underline">
                  Competitors
                </th>
                <th onClick={() => handleSort('share')} className="p-3 text-right cursor-pointer hover:underline">
                  Market Share
                </th>
                <th className="p-3">Performance Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
              {paginatedTerritories.map((t, i) => (
                <tr key={`${t.code}-${i}`} className="hover:bg-orange-50/20 transition">
                  <td className="p-3 font-bold text-slate-900">{t.code}</td>
                  <td className="p-3 font-semibold text-slate-800">{t.dist}</td>
                  <td className="p-3 text-slate-600">{t.st}</td>
                  <td className="p-3 text-slate-400">{t.reg}</td>
                  <td className="p-3 text-right font-black text-orange-600 bg-orange-50/30">{t.ajax}</td>
                  <td className="p-3 text-right text-slate-600">{t.competitors}</td>
                  <td className="p-3 text-right font-bold text-slate-900">{t.share}%</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.tierColor}`}>
                      {t.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedTerritories.length)} of {sortedTerritories.length.toLocaleString()} territories
          </span>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-200 transition"
            >
              Prev
            </button>
            <span className="text-slate-600 font-bold">{currentPage} / {totalPages}</span>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-200 transition"
            >
              Next
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
