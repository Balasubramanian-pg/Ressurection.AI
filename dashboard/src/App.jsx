import React, { useState, useMemo } from 'react';
import vahanData from './data/vahanMaster.json';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  BarChart2, 
  Table2, 
  Download, 
  RotateCcw, 
  Search, 
  ChevronDown, 
  ChevronsUpDown,
  Bell, 
  Settings, 
  HelpCircle, 
  Network, 
  Award, 
  LayoutGrid, 
  FileSpreadsheet,
  Globe
} from 'lucide-react';

import OverviewPage from './pages/OverviewPage';
import MarketMatrixPage from './pages/MarketMatrixPage';
import RegionalHubPage from './pages/RegionalHubPage';
import CompetitorsPage from './pages/CompetitorsPage';
import DealerNetworkPage from './pages/DealerNetworkPage';
import BrandHubPage from './pages/BrandHubPage';

export default function App() {
  const [activeNav, setActiveNav] = useState('Overview');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedPeriod, setSelectedPeriod] = useState('All Periods');
  const [selectedQuarter, setSelectedQuarter] = useState('All Quarters');
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [rtoSearchQuery, setRtoSearchQuery] = useState('');

  // Regions hierarchy
  const regions = useMemo(() => {
    return ['All Regions', ...Object.keys(vahanData.hierarchy || {}).sort()];
  }, []);

  // States hierarchy
  const states = useMemo(() => {
    if (selectedRegion === 'All Regions') {
      const all = new Set();
      Object.values(vahanData.hierarchy || {}).forEach(obj => {
        Object.keys(obj).forEach(s => all.add(s));
      });
      return ['All States', ...Array.from(all).sort()];
    }
    const regStates = vahanData.hierarchy[selectedRegion] || {};
    return ['All States', ...Object.keys(regStates).sort()];
  }, [selectedRegion]);

  // Filter records based on top filter bar
  const filteredRecords = useMemo(() => {
    return vahanData.records.filter(r => {
      if (selectedPeriod !== 'All Periods') {
        if (selectedPeriod.startsWith('FY ') && r.fy !== selectedPeriod) return false;
        if (selectedPeriod.startsWith('CY ') && r.yr !== parseInt(selectedPeriod.replace('CY ', ''))) return false;
        if (selectedPeriod === 'Full Year 2024' && r.yr !== 2024) return false;
        if (selectedPeriod === 'Full Year 2025' && r.yr !== 2025) return false;
        if (selectedPeriod === '2026 (Till Date)' && r.yr !== 2026) return false;
      }
      if (selectedRegion !== 'All Regions' && r.reg !== selectedRegion) return false;
      if (selectedState !== 'All States' && r.st !== selectedState) return false;
      if (selectedQuarter !== 'All Quarters' && r.fq !== selectedQuarter) return false;
      if (rtoSearchQuery.trim() !== '') {
        const q = rtoSearchQuery.toLowerCase();
        if (!r.dist.toLowerCase().includes(q) && !r.code.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [selectedPeriod, selectedRegion, selectedState, selectedQuarter, rtoSearchQuery]);

  // Aggregated KPIs
  const kpis = useMemo(() => {
    let ajax = 0, schwing = 0, venus = 0, kyb = 0, apollo = 0;
    let fiori = 0, elsa = 0, armix = 0, macons = 0, civimech = 0, john = 0;
    let others = 0, total = 0;
    const districts = new Set();
    const statesCovered = new Set();

    filteredRecords.forEach(r => {
      ajax += r.ajax;
      schwing += r.schwing;
      venus += r.venus;
      kyb += r.kyb;
      apollo += r.apollo;
      fiori += r.fiori;
      elsa += r.elsa;
      armix += r.armix;
      macons += r.macons;
      civimech += r.civimech;
      john += r.john;
      others += r.others;
      total += r.tot;
      districts.add(r.dist);
      statesCovered.add(r.st);
    });

    const competitors = schwing + venus + kyb + apollo + fiori + elsa + armix + macons + civimech + john;
    const trackedTotal = ajax + competitors;
    const ajaxShare = trackedTotal > 0 ? ((ajax / trackedTotal) * 100).toFixed(1) : '0.0';
    const schwingShare = trackedTotal > 0 ? ((schwing / trackedTotal) * 100).toFixed(1) : '0.0';

    return {
      ajax,
      schwing,
      venus,
      kyb,
      apollo,
      competitors,
      trackedTotal,
      ajaxShare,
      schwingShare,
      total,
      districtsCount: districts.size,
      statesCount: statesCovered.size
    };
  }, [filteredRecords]);

  // Export CSV function
  const handleExport = () => {
    const headers = ['Region', 'State', 'District', 'RTO_Code', 'Month', 'FY', 'FQ', 'Ajax', 'Schwing', 'Venus', 'KYB', 'Apollo', 'Others', 'Total Market'];
    const rows = filteredRecords.map(r => [
      `"${r.reg}"`, `"${r.st}"`, `"${r.dist}"`, `"${r.code}"`, `"${r.m}"`, `"${r.fy}"`, `"${r.fq}"`,
      r.ajax, r.schwing, r.venus, r.kyb, r.apollo, r.others, r.tot
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AJAX_Vahan_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Nav metadata
  const navItems = [
    { name: 'Overview', icon: LayoutGrid, subtitle: 'National Commercial Vehicle Registration & Market Share Monitor' },
    { name: 'Market Matrix', icon: Table2, subtitle: 'Power BI Fact Model Pivot (19,716 Granular District × Month Rows)' },
    { name: 'Regional Hub', icon: MapPin, subtitle: '36 States & Union Territories Regional Penetration & District Drilldown' },
    { name: 'Competitors', icon: BarChart2, subtitle: 'Head-to-Head Arena: Schwing, Venus, KYB, Apollo displacement analytics' },
    { name: 'Dealer Network', icon: Network, subtitle: '1,674 RTO Territory Dealer Tiers & White Space Hunter' },
    { name: 'Brand Hub', icon: Award, subtitle: 'SLCM Product Engineering Specs, Equipment Lineup & Sales Battlecards' },
  ];

  const currentNavMeta = navItems.find(n => n.name === activeNav) || navItems[0];

  return (
    <div className="min-h-screen bg-[#eef1f6] p-2.5 sm:p-4 lg:p-6 flex items-center justify-center font-['Red_Hat_Display']">
      
      {/* Outer Card Container */}
      <div className="w-full max-w-[1560px] bg-white rounded-[24px] shadow-[0_12px_45px_rgba(15,23,42,0.06)] border border-slate-200/80 overflow-hidden flex flex-col lg:flex-row min-h-[920px]">
        
        {/* =========================================
            LEFT SIDEBAR NAVIGATION
            ========================================= */}
        <aside className="w-full lg:w-[245px] bg-white border-r border-slate-100 flex flex-col justify-between p-4 flex-shrink-0 min-h-[880px]">
          <div>
            {/* Organization Switcher Header */}
            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ea580c] to-[#f97316] flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-black text-lg">
                  A
                </div>
                <div className="leading-tight">
                  <h2 className="text-[13px] font-bold text-slate-900 tracking-tight">AJAX Studio</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Market Intelligence</p>
                </div>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Nav Menu */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => setActiveNav(item.name)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition text-left ${
                      isActive 
                        ? 'bg-gradient-to-r from-orange-50 to-orange-100/40 text-orange-600 shadow-sm border border-orange-200/50' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </button>
                );
              })}

              <div className="pt-4 pb-1.5 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">System</div>

              <button className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>Vahan Updates</span>
                </div>
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                  36
                </span>
              </button>

              <button className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>ETL Config</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Documentation</span>
              </button>
            </nav>
          </div>

          {/* User Profile Footer */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                  AM
                </div>
                <div className="leading-tight">
                  <div className="text-[12px] font-bold text-slate-800">Ajax Analytics</div>
                  <div className="text-[10px] text-slate-400">vahan4.national@ajax.in</div>
                </div>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </aside>

        {/* =========================================
            MAIN DASHBOARD WORKSPACE
            ========================================= */}
        <div className="flex-1 flex flex-col p-5 sm:p-6 lg:p-8 overflow-y-auto bg-white max-h-[920px]">
          
          {/* Top Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{currentNavMeta.name}</h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{currentNavMeta.subtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleExport}
                className="bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-md shadow-orange-500/25 hover:opacity-95 transition flex items-center gap-1.5 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Master Model</span>
              </button>
            </div>
          </div>

          {/* Sub-Header Filter Slicer Bar (Only for relevant pages) */}
          {activeNav !== 'Brand Hub' && (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Brand Selector Pill */}
                <div className="relative inline-flex items-center bg-white border border-slate-200/90 rounded-lg px-2.5 py-1.5 shadow-sm text-slate-700 font-semibold cursor-pointer hover:border-slate-300">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                  <span>AJAX Engineering</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
                </div>

                {/* Period Slicer */}
                <div className="relative inline-flex items-center bg-white border border-slate-200/90 rounded-lg px-2.5 py-1.5 shadow-sm text-slate-600 font-medium">
                  <span className="text-slate-400 mr-1.5 font-normal">Period:</span>
                  <select 
                    value={selectedPeriod} 
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer pr-1"
                  >
                    <option value="All Periods">All Periods</option>
                    <option value="FY 24-25">FY 2024-25</option>
                    <option value="FY 25-26">FY 2025-26</option>
                    <option value="FY 26-27">FY 2026-Till Date</option>
                    <option value="Full Year 2024">CY 2024 (Full Year)</option>
                    <option value="Full Year 2025">CY 2025 (Full Year)</option>
                    <option value="2026 (Till Date)">CY 2026 (Till Date)</option>
                  </select>
                </div>

                {/* Region Slicer */}
                <div className="relative inline-flex items-center bg-white border border-slate-200/90 rounded-lg px-2.5 py-1.5 shadow-sm text-slate-600 font-medium">
                  <span className="text-slate-400 mr-1.5 font-normal">Region:</span>
                  <select 
                    value={selectedRegion} 
                    onChange={(e) => { setSelectedRegion(e.target.value); setSelectedState('All States'); }}
                    className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer pr-1"
                  >
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* State Slicer */}
                <div className="relative inline-flex items-center bg-white border border-slate-200/90 rounded-lg px-2.5 py-1.5 shadow-sm text-slate-600 font-medium">
                  <span className="text-slate-400 mr-1.5 font-normal">State:</span>
                  <select 
                    value={selectedState} 
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer pr-1"
                  >
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Quarter Slicer */}
                <div className="relative inline-flex items-center bg-white border border-slate-200/90 rounded-lg px-2.5 py-1.5 shadow-sm text-slate-600 font-medium">
                  <span className="text-slate-400 mr-1.5 font-normal">Quarter:</span>
                  <select 
                    value={selectedQuarter} 
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                    className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer pr-1"
                  >
                    <option value="All Quarters">All Quarters</option>
                    <option value="Q1">Q1 (Apr-Jun)</option>
                    <option value="Q2">Q2 (Jul-Sep)</option>
                    <option value="Q3">Q3 (Oct-Dec)</option>
                    <option value="Q4">Q4 (Jan-Mar)</option>
                  </select>
                </div>

                {(selectedRegion !== 'All Regions' || selectedState !== 'All States' || selectedQuarter !== 'All Quarters') && (
                  <button 
                    onClick={() => { setSelectedRegion('All Regions'); setSelectedState('All States'); setSelectedQuarter('All Quarters'); }}
                    className="text-orange-600 hover:text-orange-700 font-semibold text-xs flex items-center gap-1 ml-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>

              {/* Right Export Actions */}
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <button onClick={handleExport} className="flex items-center gap-1 hover:text-slate-900 transition">
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
                <span className="text-slate-300">|</span>
                <button onClick={handleExport} className="flex items-center gap-1 text-slate-800 font-semibold hover:text-orange-600 transition">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel Model</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================
              ACTIVE PAGE CONTENT
              ========================================= */}
          {activeNav === 'Overview' && (
            <OverviewPage 
              kpis={kpis} 
              filteredRecords={filteredRecords} 
              searchTableQuery={searchTableQuery} 
              setSearchTableQuery={setSearchTableQuery} 
              onNavigate={setActiveNav}
            />
          )}

          {activeNav === 'Market Matrix' && (
            <MarketMatrixPage 
              filteredRecords={filteredRecords} 
              onExport={handleExport} 
            />
          )}

          {activeNav === 'Regional Hub' && (
            <RegionalHubPage 
              filteredRecords={filteredRecords} 
            />
          )}

          {activeNav === 'Competitors' && (
            <CompetitorsPage 
              filteredRecords={filteredRecords} 
            />
          )}

          {activeNav === 'Dealer Network' && (
            <DealerNetworkPage 
              filteredRecords={filteredRecords} 
            />
          )}

          {activeNav === 'Brand Hub' && (
            <BrandHubPage 
              onNavigate={setActiveNav} 
            />
          )}

        </div>

      </div>

    </div>
  );
}
