import React, { useState, useMemo } from 'react';
import vahanData from '../data/vahanMaster.json';
import { 
  BarChart2, 
  TrendingUp, 
  ShieldAlert, 
  Crosshair, 
  Zap, 
  Award, 
  MapPin, 
  ChevronRight, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart as PieIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function CompetitorsPage({ filteredRecords }) {
  const [selectedCompetitor, setSelectedCompetitor] = useState('schwing');
  const [battlegroundFilter, setBattlegroundFilter] = useState('All');

  // Competitor metadata definitions
  const competitorProfiles = {
    schwing: {
      name: 'Schwing Stetter India',
      short: 'Schwing',
      rank: 2,
      origin: 'Germany / XCMG Group',
      keyProduct: 'Self-loading mixers, Transit Mixers, Stetter Batching',
      nationalVolume: 1106,
      marketShare: '16.4%',
      ratio: '4.2x',
      growth: '+3.2%',
      primaryHub: 'Maharashtra & Tamil Nadu',
      color: '#2563eb',
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      threatLevel: 'High',
      threatBadge: 'bg-red-100 text-red-700',
      strengths: [
        'Massive global brand recognition and German engineering pedigree',
        'Strong corporate ties with tier-1 EPC contractors (L&T, Tata Projects)',
        'Extensive product ecosystem spanning batching plants and boom pumps'
      ],
      weaknesses: [
        'Significantly higher acquisition cost and maintenance overhead',
        'Heavier machine footprint, less agile on rural Indian job sites',
        'Longer lead time for specialized spare parts in tier-2/tier-3 regions'
      ],
      ajaxWinStrategy: 'Highlight Ajax ARGO 4.5 4-wheel steer agility, 18% lower diesel consumption, and 24-hour service guarantee within 100km anywhere in India.'
    },
    venus: {
      name: 'Venus Equipments',
      short: 'Venus',
      rank: 3,
      origin: 'Ahmedabad, Gujarat (India)',
      keyProduct: 'Reversible & Self-Loading Mixers, Mini Batching',
      nationalVolume: 584,
      marketShare: '8.7%',
      ratio: '8.0x',
      growth: '+2.4%',
      primaryHub: 'Gujarat & Western India',
      color: '#10b981',
      bgColor: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      threatLevel: 'Moderate',
      threatBadge: 'bg-amber-100 text-amber-700',
      strengths: [
        'Aggressive pricing structure (12-15% cheaper upfront cost)',
        'Deep local relationships across Gujarat and Western EPC sub-contractors',
        'Custom localized modifications for local stone aggregate qualities'
      ],
      weaknesses: [
        'Lower hydraulic component lifecycle and higher breakdown frequency',
        'Sparse dealer and service footprint outside Western India',
        'Low resale value in secondary equipment market compared to Ajax'
      ],
      ajaxWinStrategy: 'Demonstrate Ajax high residual value (55% after 4 years vs 25% for Venus) and Ajax SmartFleet IoT telematics telemetry.'
    },
    kyb: {
      name: 'KYB-Conmat',
      short: 'KYB',
      rank: 4,
      origin: 'Japan / Vadodara',
      keyProduct: 'Transit Mixers, Compact Batching Plants, Pumps',
      nationalVolume: 203,
      marketShare: '3.0%',
      ratio: '23.0x',
      growth: '-1.6%',
      primaryHub: 'Rajasthan & Gujarat',
      color: '#9333ea',
      bgColor: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      borderColor: 'border-purple-200',
      threatLevel: 'Moderate',
      threatBadge: 'bg-purple-100 text-purple-700',
      strengths: [
        'Japanese precision engineering and electronic drum rotation controls',
        'Very high reliability on continuous transit mixer operations',
        'Strong presence in ready-mix concrete (RMC) commercial plants'
      ],
      weaknesses: [
        'Limited penetration and product lineup in true rough-terrain SLCM segment',
        'Higher spare parts price index',
        'Slow rural service mobilization times'
      ],
      ajaxWinStrategy: 'Focus on Ajax purpose-built rough terrain chassis and off-highway load-sensing hydraulic transmission.'
    },
    apollo: {
      name: 'Apollo Infratech',
      short: 'Apollo',
      rank: 5,
      origin: 'Mehsana, Gujarat',
      keyProduct: 'Concrete Mixers, Batching Plants, Slipform Pavers',
      nationalVolume: 116,
      marketShare: '1.7%',
      ratio: '40.2x',
      growth: '+1.2%',
      primaryHub: 'Gujarat & Madhya Pradesh',
      color: '#d97706',
      bgColor: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      borderColor: 'border-amber-200',
      threatLevel: 'Low',
      threatBadge: 'bg-slate-100 text-slate-700',
      strengths: [
        'Broad road construction portfolio (paving + mixing combo sales)',
        'Good financing tie-ups with NBFCs in Northern and Western belts'
      ],
      weaknesses: [
        'Small market share in SLCM',
        'Reliance on tie-ups with foreign suppliers',
        'Minimal presence in South India'
      ],
      ajaxWinStrategy: 'Leverage Ajax single-source customer support and nationwide training centers.'
    },
    fiori: {
      name: 'BHS Fiori India',
      short: 'Fiori',
      rank: 6,
      origin: 'Italy / India',
      keyProduct: 'Self-loading concrete mixers, articulated dumpers',
      nationalVolume: 35,
      marketShare: '0.5%',
      ratio: '133x',
      growth: '+0.4%',
      primaryHub: 'Karnataka & Maharashtra',
      color: '#06b6d4',
      bgColor: 'bg-cyan-500',
      lightBg: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      threatLevel: 'Low',
      threatBadge: 'bg-slate-100 text-slate-700',
      strengths: [
        'Premium European drum geometry and patented weigh-batching system',
        'Strong niche among high-spec tunnel and dam infrastructure projects'
      ],
      weaknesses: [
        'Very high import duty component and costly Italian components',
        'Very small service network; long turnaround times for parts'
      ],
      ajaxWinStrategy: 'Position Ajax as indigenous high-precision alternative with 10x larger service engineer force.'
    }
  };

  const currentComp = competitorProfiles[selectedCompetitor] || competitorProfiles.schwing;

  // Monthly head-to-head trend
  const monthlyComparison = useMemo(() => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const map = {};
    months.forEach(m => {
      map[m] = { month: m, Ajax: 0, Competitor: 0 };
    });

    filteredRecords.forEach(r => {
      if (map[r.m]) {
        map[r.m].Ajax += r.ajax;
        map[r.m].Competitor += (r[selectedCompetitor] || 0);
      }
    });

    return months.map(m => map[m]);
  }, [filteredRecords, selectedCompetitor]);

  // State-by-State Battleground comparison
  const battlegroundStates = useMemo(() => {
    const map = {};
    filteredRecords.forEach(r => {
      if (!map[r.st]) {
        map[r.st] = { state: r.st, region: r.reg, ajax: 0, comp: 0, total: 0 };
      }
      map[r.st].ajax += r.ajax;
      map[r.st].comp += (r[selectedCompetitor] || 0);
      map[r.st].total += (r.ajax + (r[selectedCompetitor] || 0));
    });

    let list = Object.values(map).filter(s => s.ajax > 0 || s.comp > 0);

    if (battlegroundFilter !== 'All') {
      list = list.filter(s => s.region === battlegroundFilter);
    }

    list.sort((a, b) => (b.ajax + b.comp) - (a.ajax + a.comp));
    return list.slice(0, 10).map(s => {
      const combined = s.ajax + s.comp;
      const ajaxShare = combined > 0 ? Math.round((s.ajax / combined) * 100) : 0;
      const compShare = combined > 0 ? 100 - ajaxShare : 0;
      const margin = s.ajax - s.comp;
      return {
        ...s,
        ajaxShare,
        compShare,
        margin
      };
    });
  }, [filteredRecords, selectedCompetitor, battlegroundFilter]);

  // Market share pie chart data
  const pieData = [
    { name: 'AJAX Engineering', value: 4662, color: '#f97316' },
    { name: 'Schwing Stetter', value: 1106, color: '#2563eb' },
    { name: 'Venus Equipments', value: 584, color: '#10b981' },
    { name: 'KYB-Conmat', value: 203, color: '#9333ea' },
    { name: 'Apollo Infratech', value: 116, color: '#d97706' },
    { name: 'Others & Niche', value: 65, color: '#64748b' }
  ];

  return (
    <div className="space-y-6">
      
      {/* =========================================
          PAGE HEADER & COMPETITOR SELECTOR PILLS
          ========================================= */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Competitor Intelligence & Head-to-Head Arena</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                11 Tracked OEMs
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Real-time Vahan 4 registration battleground analysis, displacement tracking, and sales battlecards
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Select Opponent:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              {Object.entries(competitorProfiles).map(([key, comp]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCompetitor(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedCompetitor === key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${comp.bgColor}`}></span>
                  <span>{comp.short}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Competitor Quick Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] text-slate-400 font-semibold block">Market Rank</span>
            <span className="text-lg font-black text-slate-900">#{currentComp.rank} Nationally</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] text-slate-400 font-semibold block">2024 Vahan Volume</span>
            <span className="text-lg font-black text-slate-900">{currentComp.nationalVolume.toLocaleString()} units</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] text-slate-400 font-semibold block">Segment Share</span>
            <span className="text-lg font-black text-slate-900">{currentComp.marketShare}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] text-slate-400 font-semibold block">Ajax Advantage</span>
            <span className="text-lg font-black text-orange-600">Ajax {currentComp.ratio}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] text-slate-400 font-semibold block">Threat Assessment</span>
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${currentComp.threatBadge}`}>
              {currentComp.threatLevel} Threat
            </span>
          </div>
        </div>
      </div>

      {/* =========================================
          ROW 1: HEAD-TO-HEAD BATTLECARD ARENA
          ========================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Ajax vs Opponent Comparison Card */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold text-slate-900">Head-to-Head Registration Trajectory</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Monthly Run Rate (2024)</span>
          </div>

          {/* Line Chart */}
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '10px', fontSize: '11px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" name="AJAX Engineering" dataKey="Ajax" stroke="#ea580c" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" name={currentComp.name} dataKey="Competitor" stroke={currentComp.color} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Tactical Win Strategy Box */}
          <div className="p-4 bg-orange-50/50 border border-orange-200/60 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-700">
              <Zap className="w-3.5 h-3.5 text-orange-600" />
              <span>Recommended Field Battle Strategy vs {currentComp.short}</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {currentComp.ajaxWinStrategy}
            </p>
          </div>
        </div>

        {/* Right: National Market Share Donut & Strengths/Weaknesses */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">National Market Dominance</h3>
              <span className="text-[11px] text-slate-400 font-medium">6,725 Total Units</span>
            </div>

            {/* Donut Chart */}
            <div className="h-[180px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(val) => [`${val} units (${((val/6725)*100).toFixed(1)}%)`, 'Volume']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '10px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with percentages */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span className="text-slate-800">Ajax: 69.2%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-slate-800">Schwing: 16.4%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-800">Venus: 8.7%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span className="text-slate-800">KYB: 3.0%</span>
              </div>
            </div>
          </div>

          {/* Competitor Profile Snippet */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{currentComp.short} Profile</h4>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Their Key Claim</span>
                <p className="text-slate-700 font-medium">{currentComp.strengths[0]}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-red-500 block">Their Critical Flaw</span>
                <p className="text-slate-700 font-medium">{currentComp.weaknesses[0]}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* =========================================
          ROW 2: STATE-BY-STATE BATTLEGROUND BREAKDOWN
          ========================================= */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Key Battleground States: Ajax vs {currentComp.name}</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Head-to-head share of registrations in the top 10 highest-volume contested states
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Filter Region:</span>
            {['All', 'West', 'South', 'North', 'Central'].map(reg => (
              <button
                key={reg}
                onClick={() => setBattlegroundFilter(reg)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  battlegroundFilter === reg
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>
        </div>

        {/* State Battleground Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {battlegroundStates.map((st, i) => (
            <div key={st.state} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block truncate">{st.state}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{st.region} Region</span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${st.ajaxShare >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                  {st.ajaxShare}% Ajax
                </span>
              </div>

              {/* Stacked comparison bar */}
              <div className="space-y-1">
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-orange-500" 
                    style={{ width: `${st.ajaxShare}%` }}
                    title={`Ajax: ${st.ajax} units`}
                  ></div>
                  <div 
                    className={`h-full ${currentComp.bgColor}`} 
                    style={{ width: `${st.compShare}%` }}
                    title={`${currentComp.short}: ${st.comp} units`}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold pt-1">
                  <span className="text-orange-600">{st.ajax} Ajax</span>
                  <span className="text-slate-600">{st.comp} {currentComp.short}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>Advantage:</span>
                <span className="font-bold text-emerald-600">+{st.margin} units</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================
          ROW 3: COMPREHENSIVE COMPETITIVE MATRIX
          ========================================= */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <h3 className="text-sm font-bold text-slate-900">National Competitor Matrix & Product Positioning</h3>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Brand Name</th>
                <th className="p-3">HQ / Origin</th>
                <th className="p-3 text-right">2024 Units</th>
                <th className="p-3 text-right">National Share</th>
                <th className="p-3">Primary Equipment Segment</th>
                <th className="p-3">Core Geographic Fortresses</th>
                <th className="p-3">Sales Threat Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              <tr className="bg-orange-50/30 hover:bg-orange-50/50 transition">
                <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span>AJAX Engineering</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-orange-200 text-orange-800">LEADER</span>
                </td>
                <td className="p-3 font-medium text-slate-600">Bengaluru, Karnataka</td>
                <td className="p-3 text-right font-black text-orange-600">4,662</td>
                <td className="p-3 text-right font-black text-orange-600">69.2%</td>
                <td className="p-3 text-slate-700">Self-Loading Mixers, Batching, Pumps</td>
                <td className="p-3 text-slate-600">Maharashtra, Gujarat, MP, Rajasthan, UP</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Category Master
                  </span>
                </td>
              </tr>
              {Object.entries(competitorProfiles).map(([key, comp]) => (
                <tr key={key} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${comp.bgColor}`}></span>
                    <span>{comp.name}</span>
                  </td>
                  <td className="p-3 text-slate-500">{comp.origin}</td>
                  <td className="p-3 text-right font-bold text-slate-800">{comp.nationalVolume.toLocaleString()}</td>
                  <td className="p-3 text-right font-bold text-slate-700">{comp.marketShare}</td>
                  <td className="p-3 text-slate-600">{comp.keyProduct}</td>
                  <td className="p-3 text-slate-600">{comp.primaryHub}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${comp.threatBadge}`}>
                      {comp.threatLevel}
                    </span>
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
