import React, { useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  BarChart2, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  SlidersHorizontal,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip 
} from 'recharts';

export default function OverviewPage({ 
  kpis, 
  filteredRecords, 
  searchTableQuery, 
  setSearchTableQuery, 
  onNavigate 
}) {
  // Line Chart Trend Data (Matching "Visibility Trend" line chart with 3 curved splines)
  const lineChartData = useMemo(() => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const trendMap = {};
    months.forEach(m => {
      trendMap[m] = { month: m, Ajax: 0, Schwing: 0, VenusKYB: 0 };
    });

    filteredRecords.forEach(r => {
      if (trendMap[r.m]) {
        trendMap[r.m].Ajax += r.ajax;
        trendMap[r.m].Schwing += r.schwing;
        trendMap[r.m].VenusKYB += (r.venus + r.kyb);
      }
    });

    return months.map(m => trendMap[m]);
  }, [filteredRecords]);

  // Share of Voice widget (Middle column)
  const shareOfVoiceWidget = useMemo(() => {
    return [
      { category: 'Self-Loading Concrete Mixers', citations: kpis.ajax, trend: '+28%', up: true },
      { category: 'Transit Mixers & Batching', citations: kpis.schwing, trend: '+22%', up: true },
      { category: 'Stationary Concrete Pumps', citations: kpis.venus, trend: '+16.2%', up: true },
      { category: 'Boom Pumps & Industrial', citations: kpis.kyb, trend: '+6.8%', up: true },
      { category: 'Compact Concrete Mixers', citations: kpis.apollo, trend: '+2.5%', up: true },
    ];
  }, [kpis]);

  // Top States list with percentage bars (Matching "Top Domains" widget on right)
  const topStatesWidget = useMemo(() => {
    const map = {};
    filteredRecords.forEach(r => {
      map[r.st] = (map[r.st] || 0) + r.ajax;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const maxVal = sorted[0] ? sorted[0][1] : 1;
    return sorted.slice(0, 3).map(([state, vol], idx) => ({
      name: state,
      volume: vol,
      pct: Math.min(Math.round((vol / maxVal) * 100), 100),
      color: idx === 0 ? 'bg-orange-500' : idx === 1 ? 'bg-blue-500' : 'bg-slate-700'
    }));
  }, [filteredRecords]);

  // Competitive Landscape Table Data (Matching bottom table of image)
  const competitiveTable = useMemo(() => {
    const list = [
      { id: 1, brand: 'AJAX Engineering', short: 'Ajax', volume: kpis.ajax, share: kpis.ajaxShare, growth: '+12.4%', state: 'Maharashtra (892)', region: 'National', color: '#f97316', bg: 'bg-orange-500', isLeader: true },
      { id: 2, brand: 'Schwing Stetter', short: 'Schwing', volume: kpis.schwing, share: kpis.trackedTotal > 0 ? ((kpis.schwing / kpis.trackedTotal) * 100).toFixed(1) : '0.0', growth: '+3.2%', state: 'Maharashtra (189)', region: 'West & South', color: '#3b82f6', bg: 'bg-blue-500' },
      { id: 3, brand: 'Venus Equipments', short: 'Venus', volume: kpis.venus, share: kpis.trackedTotal > 0 ? ((kpis.venus / kpis.trackedTotal) * 100).toFixed(1) : '0.0', growth: '+2.4%', state: 'Gujarat (123)', region: 'West', color: '#10b981', bg: 'bg-emerald-500' },
      { id: 4, brand: 'KYB-Conmat', short: 'KYB', volume: kpis.kyb, share: kpis.trackedTotal > 0 ? ((kpis.kyb / kpis.trackedTotal) * 100).toFixed(1) : '0.0', growth: '-1.6%', state: 'Rajasthan (46)', region: 'North & West', color: '#a855f7', bg: 'bg-purple-500' },
      { id: 5, brand: 'Apollo Infratech', short: 'Apollo', volume: kpis.apollo, share: kpis.trackedTotal > 0 ? ((kpis.apollo / kpis.trackedTotal) * 100).toFixed(1) : '0.0', growth: '+1.2%', state: 'Gujarat (45)', region: 'West', color: '#eab308', bg: 'bg-amber-500' },
      { id: 6, brand: 'BHS Fiori', short: 'Fiori', volume: 35, share: '0.5', growth: '+0.4%', state: 'Karnataka (12)', region: 'South', color: '#06b6d4', bg: 'bg-cyan-500' },
      { id: 7, brand: 'Elsa Infra', short: 'Elsa', volume: 19, share: '0.3', growth: '-0.2%', state: 'Tamil Nadu (8)', region: 'South', color: '#ec4899', bg: 'bg-pink-500' },
      { id: 8, brand: 'Armix Machinery', short: 'Armix', volume: 9, share: '0.1', growth: '+0.1%', state: 'Kerala (4)', region: 'South', color: '#84cc16', bg: 'bg-lime-500' },
      { id: 9, brand: 'Macons Equipments', short: 'Macons', volume: 2, share: '0.0', growth: '-0.5%', state: 'Madhya Pradesh (2)', region: 'Central', color: '#f43f5e', bg: 'bg-rose-500' },
      { id: 10, brand: 'Universal Civimech', short: 'Civimech', volume: 0, share: '0.0', growth: '0.0%', state: 'Maharashtra (0)', region: 'West', color: '#64748b', bg: 'bg-slate-500' }
    ];

    if (searchTableQuery.trim() !== '') {
      const q = searchTableQuery.toLowerCase();
      return list.filter(item => item.brand.toLowerCase().includes(q) || item.state.toLowerCase().includes(q));
    }
    return list;
  }, [kpis, searchTableQuery]);

  return (
    <div className="space-y-6">
      {/* =========================================
          HORIZONTAL KPI STRIP (Matching Image Top 6 KPIs)
          ========================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 py-2">
        
        {/* KPI 1: Market Share */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3.5 bg-amber-500 rounded-full"></div>
            <span className="text-[11px] font-semibold text-slate-500">Market Share</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{kpis.ajaxShare}%</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              ▲ +12%
            </span>
          </div>
        </div>

        {/* KPI 2: Market Rank */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3.5 bg-yellow-500 rounded-full"></div>
            <span className="text-[11px] font-semibold text-slate-500">Market Rank</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">#1</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              ▲ Leader
            </span>
          </div>
        </div>

        {/* KPI 3: Ajax Volume */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3.5 bg-teal-500 rounded-full"></div>
            <span className="text-[11px] font-semibold text-slate-500">Ajax Volume</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{kpis.ajax.toLocaleString()}</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              ▲ +24%
            </span>
          </div>
        </div>

        {/* KPI 4: Runner-up Share */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3.5 bg-blue-500 rounded-full"></div>
            <span className="text-[11px] font-semibold text-slate-500">Schwing (Runner-up)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{kpis.schwingShare}%</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              ▲ {kpis.schwing} units
            </span>
          </div>
        </div>

        {/* KPI 5: Active Districts */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3.5 bg-purple-500 rounded-full"></div>
            <span className="text-[11px] font-semibold text-slate-500">Active Districts</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{kpis.districtsCount.toLocaleString()}</span>
            <span 
              onClick={() => onNavigate('Regional Hub')}
              className="text-[11px] font-bold text-orange-600 flex items-center gap-0.5 cursor-pointer hover:underline"
            >
              ⓘ 36 States
            </span>
          </div>
        </div>

        {/* KPI 6: Tracked Market */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3.5 bg-rose-500 rounded-full"></div>
            <span className="text-[11px] font-semibold text-slate-500">Tracked Market</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{kpis.trackedTotal.toLocaleString()}</span>
            <span 
              onClick={() => onNavigate('Competitors')}
              className="text-[11px] font-bold text-orange-600 flex items-center gap-0.5 cursor-pointer hover:underline"
            >
              11 Brands ↗
            </span>
          </div>
        </div>

      </div>

      {/* =========================================
          MIDDLE ROW: 3 KEY CARDS (Trend, Share of Voice, Top Markets)
          ========================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* CARD 1 (Col 5): Registration Trend Chart */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">Registration Trend</h3>
            <span className="text-[11px] text-slate-400 font-medium">Monthly Curve (2024)</span>
          </div>

          <div className="h-[210px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '10px', fontSize: '11px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }} 
                />
                <Line type="monotone" dataKey="Ajax" stroke="#ea580c" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Schwing" stroke="#2563eb" strokeWidth={2.2} dot={false} />
                <Line type="monotone" dataKey="VenusKYB" stroke="#0f172a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend dots */}
          <div className="flex items-center justify-center gap-5 pt-3 border-t border-slate-50 text-[11px] font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ea580c]"></span>
              <span>Ajax Engineering</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2563eb]"></span>
              <span>Schwing Stetter</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0f172a]"></span>
              <span>Venus & KYB</span>
            </div>
          </div>
        </div>

        {/* CARD 2 (Col 4): Share of Voice -> Equipment Category */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Share of Voice</h3>
            <span className="text-[11px] text-slate-400 font-medium">By Category</span>
          </div>

          <div className="overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-medium text-[11px] border-b border-slate-100">
                  <th className="pb-2 font-medium">Equipment Category</th>
                  <th className="pb-2 font-medium text-center">Volume</th>
                  <th className="pb-2 font-medium text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {shareOfVoiceWidget.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 font-medium text-slate-700">{row.category}</td>
                    <td className="py-2.5 text-center font-bold text-slate-800">{row.citations}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600">{row.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 font-medium">
            National Tracked Volume: <strong className="text-slate-700">{kpis.trackedTotal.toLocaleString()} units</strong>
          </div>
        </div>

        {/* CARD 3 (Col 3): Top Markets */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Top Markets</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-xl font-black text-slate-900">{kpis.ajax.toLocaleString()}</span>
              <span className="text-[11px] text-slate-400 font-medium">Ajax Units Registered</span>
            </div>

            <div className="space-y-3.5">
              {topStatesWidget.map((st, i) => (
                <div key={st.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${st.color}`}></span>
                      <span className="font-semibold text-slate-800">{st.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 text-xs">{st.pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                      style={{ width: `${st.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onNavigate('Regional Hub')}
            className="w-full mt-4 py-2 text-xs font-bold text-slate-700 border border-slate-200/90 rounded-xl hover:bg-slate-50 transition"
          >
            View All 36 States
          </button>
        </div>

      </div>

      {/* =========================================
          BOTTOM CARD: COMPETITIVE LANDSCAPE TABLE
          ========================================= */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-900">Competitive Landscape</h3>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search brand, state..."
                value={searchTableQuery}
                onChange={(e) => setSearchTableQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-orange-500 w-48 transition placeholder:text-slate-400"
              />
            </div>

            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Sort</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-semibold text-[11px] border-b border-slate-100">
                <th className="pb-3 pl-2 font-semibold">Rank</th>
                <th className="pb-3 font-semibold">Brand</th>
                <th className="pb-3 font-semibold text-right">Market Share</th>
                <th className="pb-3 font-semibold text-right">Volume (Units)</th>
                <th className="pb-3 font-semibold text-right">Growth</th>
                <th className="pb-3 font-semibold pl-6">Dominant State</th>
                <th className="pb-3 font-semibold">Region Base</th>
                <th className="pb-3 text-right pr-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {competitiveTable.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition group">
                  <td className="py-3 pl-2 font-bold text-slate-400 text-[11px]">#{row.id}</td>
                  
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-md ${row.bg} text-white text-[10px] font-black flex items-center justify-center shadow-sm`}>
                        {row.short.slice(0, 1)}
                      </span>
                      <span className="font-bold text-slate-800">{row.brand}</span>
                      {row.isLeader && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-700">
                          Leader
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 text-right font-black text-slate-900">{row.share}%</td>
                  <td className="py-3 text-right font-semibold text-slate-700">{row.volume.toLocaleString()}</td>
                  
                  <td className={`py-3 text-right font-bold ${row.growth.startsWith('+') ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {row.growth}
                  </td>

                  <td className="py-3 pl-6 font-medium text-slate-600">{row.state}</td>
                  
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {row.region}
                    </span>
                  </td>

                  <td className="py-3 text-right pr-2 text-slate-400 group-hover:text-slate-700">
                    <MoreVertical className="w-4 h-4 inline cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50 text-xs text-slate-400">
          <span className="text-[11px]">1-10 of 12</span>
          <div className="flex items-center gap-1">
            <button className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
