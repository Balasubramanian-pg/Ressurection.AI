import React, { useState, useMemo } from 'react';
import vahanData from '../data/vahanMaster.json';
import { 
  MapPin, 
  Building2, 
  ChevronRight, 
  TrendingUp, 
  Compass, 
  Search,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

export default function RegionalHubPage({ filteredRecords }) {
  const [activeRegion, setActiveRegion] = useState('All');
  const [selectedState, setSelectedState] = useState('Maharashtra');

  // Compute state rankings from the data
  const stateSummary = useMemo(() => {
    const map = {};
    vahanData.records.forEach(r => {
      if (!map[r.st]) {
        map[r.st] = { 
          state: r.st, 
          region: r.reg, 
          ajax: 0, 
          schwing: 0, 
          kyb: 0, 
          venus: 0, 
          apollo: 0, 
          competitors: 0,
          total: 0,
          districts: new Set() 
        };
      }
      map[r.st].ajax += r.ajax;
      map[r.st].schwing += r.schwing;
      map[r.st].kyb += r.kyb;
      map[r.st].venus += r.venus;
      map[r.st].apollo += r.apollo;
      map[r.st].competitors += (r.schwing + r.kyb + r.venus + r.apollo + r.fiori + r.elsa + r.armix + r.macons);
      map[r.st].total += r.tot;
      map[r.st].districts.add(r.dist);
    });

    return Object.values(map).map(s => {
      const segTotal = s.ajax + s.competitors;
      const share = segTotal > 0 ? ((s.ajax / segTotal) * 100).toFixed(1) : '0.0';
      return {
        ...s,
        districtsCount: s.districts.size,
        share: parseFloat(share)
      };
    }).sort((a, b) => b.ajax - a.ajax);
  }, []);

  const filteredStates = useMemo(() => {
    if (activeRegion === 'All') return stateSummary;
    return stateSummary.filter(s => s.region === activeRegion);
  }, [stateSummary, activeRegion]);

  // Selected State Details & RTOs
  const currentStateData = useMemo(() => {
    return stateSummary.find(s => s.state === selectedState) || stateSummary[0] || {};
  }, [stateSummary, selectedState]);

  const stateRtos = useMemo(() => {
    const rtoMap = {};
    vahanData.records.filter(r => r.st === selectedState).forEach(r => {
      if (!rtoMap[r.dist]) {
        rtoMap[r.dist] = { dist: r.dist, code: r.code, ajax: 0, schwing: 0, kyb: 0, tot: 0 };
      }
      rtoMap[r.dist].ajax += r.ajax;
      rtoMap[r.dist].schwing += r.schwing;
      rtoMap[r.dist].kyb += r.kyb;
      rtoMap[r.dist].tot += r.tot;
    });

    return Object.values(rtoMap).sort((a, b) => b.ajax - a.ajax);
  }, [selectedState]);

  // Regional Comparison Bar Chart
  const regionalBarData = useMemo(() => {
    const regMap = {};
    stateSummary.forEach(s => {
      if (!regMap[s.region]) regMap[s.region] = { region: s.region, Ajax: 0, Schwing: 0, Others: 0 };
      regMap[s.region].Ajax += s.ajax;
      regMap[s.region].Schwing += s.schwing;
      regMap[s.region].Others += s.competitors;
    });
    return Object.values(regMap).sort((a, b) => b.Ajax - a.Ajax);
  }, [stateSummary]);

  return (
    <div className="space-y-6">
      {/* Top Regional Strip */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Regional Hub & State Intelligence</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
              36 States & UTs Covered
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Geographic penetration, district cluster concentration, and market share per state
          </p>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          {['All', 'West', 'South', 'North', 'Central', 'East', 'North East'].map((reg) => (
            <button
              key={reg}
              onClick={() => setActiveRegion(reg)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeRegion === reg 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Regional Performance Chart + State Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left (Col 7): Regional Comparison Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-orange-500" /> Regional Volume Distribution
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Units by Territory</span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalBarData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="region" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Ajax" fill="#ea580c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Schwing" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Others" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Strongest Region: <strong className="text-slate-900">West (1,372 units)</strong></span>
            <span>Emerging Growth: <strong className="text-emerald-600">Central & North East</strong></span>
          </div>
        </div>

        {/* Right (Col 5): State Quick Selector */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">States in {activeRegion}</h3>
              <span className="text-xs text-slate-400">{filteredStates.length} States</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {filteredStates.map((st) => (
                <div
                  key={st.state}
                  onClick={() => setSelectedState(st.state)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    selectedState === st.state 
                      ? 'border-orange-500 bg-orange-50/40 shadow-sm' 
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="leading-tight">
                    <div className="font-bold text-xs text-slate-800">{st.state}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{st.region} &bull; {st.districtsCount} RTOs</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm text-orange-600">{st.ajax}</div>
                    <div className="text-[10px] font-bold text-emerald-600">{st.share}% Share</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-50 text-[11px] text-slate-400">
            Click any state to drill into district-level registrations below.
          </div>
        </div>

      </div>

      {/* Selected State Drilldown: Key Districts */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{selectedState} District Deep Dive</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                {stateRtos.length} Active RTOs
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Total State Ajax Volume: <strong className="text-orange-600">{currentStateData.ajax} units</strong> ({currentStateData.share}% segment share)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>Ajax: {currentStateData.ajax}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Schwing: {currentStateData.schwing}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>KYB: {currentStateData.kyb}</span>
            </div>
          </div>
        </div>

        {/* RTO District Grid */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 font-bold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3">RTO / District Name</th>
                <th className="p-3 text-center">RTO Code</th>
                <th className="p-3 text-right bg-orange-50/50 text-orange-700 font-black">Ajax Units</th>
                <th className="p-3 text-right text-blue-700">Schwing</th>
                <th className="p-3 text-right text-purple-700">KYB</th>
                <th className="p-3 text-right text-slate-800">Total Commercial Market</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
              {stateRtos.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-semibold text-slate-900">{r.dist}</td>
                  <td className="p-3 text-center text-slate-500 font-mono">{r.code}</td>
                  <td className="p-3 text-right font-black text-orange-600 bg-orange-50/20">{r.ajax}</td>
                  <td className="p-3 text-right text-blue-600 font-semibold">{r.schwing}</td>
                  <td className="p-3 text-right text-purple-600 font-semibold">{r.kyb}</td>
                  <td className="p-3 text-right text-slate-700 font-bold">{r.tot.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
