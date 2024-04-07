import React, { useState } from 'react';
import { 
  Award, 
  ShieldCheck, 
  Truck, 
  Cpu, 
  Wrench, 
  Compass, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  TrendingUp, 
  Star, 
  Layers, 
  Activity, 
  FileText,
  Zap,
  Globe2
} from 'lucide-react';

export default function BrandHubPage({ onNavigate }) {
  const [selectedProduct, setSelectedProduct] = useState('argo4500');
  const [selectedBattlecard, setSelectedBattlecard] = useState('schwing');

  // Product portfolio
  const products = {
    argo4500: {
      id: 'argo4500',
      name: 'ARGO 4500',
      tagline: 'The Flagship Self-Loading Concrete Mixer',
      category: 'Self-Loading Concrete Mixers',
      output: '4.5 m³ per batch',
      drumCapacity: '6,000 Litres',
      engine: '110 HP Bharat Stage IV CEV Diesel',
      transmission: 'Hydrostatic 4-Wheel Drive & 4-Wheel Steer',
      gradeability: '40% (22° incline)',
      features: [
        'Load Cell Weigh-Batching System with dynamic accuracy within ±2%',
        'Electronic Batch Controller with automated additive dosing',
        '3-way Crab steering mode for tight urban alleys and narrow culverts',
        'SmartFleet IoT telematics with live diesel and batch productivity logging'
      ],
      idealFor: 'National Highway EPC, expressways, industrial flooring, canal lining'
    },
    argo2500: {
      id: 'argo2500',
      name: 'ARGO 2500',
      tagline: 'Compact High-Agility Rough Terrain Mixer',
      category: 'Self-Loading Concrete Mixers',
      output: '2.5 m³ per batch',
      drumCapacity: '3,500 Litres',
      engine: '75 HP Bharat Stage IV Turbo Diesel',
      transmission: 'Hydrostatic 4x4 Drive with Off-Highway Differentials',
      gradeability: '42%',
      features: [
        'Ultra-compact turning radius of only 3.8 meters',
        'High ground clearance engineered for rural road development',
        'Dual-direction driving console for reverse shuttle operations',
        'Integrated high-pressure water washing system'
      ],
      idealFor: 'PMGSY rural roads, hilly North-East terrain, bridges, wind farm foundations'
    },
    crb60: {
      id: 'crb60',
      name: 'CRB 60 Batching Plant',
      tagline: 'Compact Planetary Concrete Batching Plant',
      category: 'Concrete Batching Plants',
      output: '60 m³/hour',
      drumCapacity: '1,500 / 1,000 Litres',
      engine: 'Planetary Gear Transmission with High-Torque Electric Drive',
      transmission: 'Stationary Skid-Mounted / Fast Erecting',
      gradeability: 'N/A',
      features: [
        'True planetary mixing motion for ultra-high homogeneity',
        'Quick foundationless setup in under 48 hours',
        'Fully computerized batch management with SCADA integration',
        'Modular aggregate bins with moisture compensation sensors'
      ],
      idealFor: 'Precast manufacturing, commercial RMC supply, railway viaducts'
    },
    pump50: {
      id: 'pump50',
      name: 'Ajax P 50 Concrete Pump',
      tagline: 'Heavy-Duty S-Valve Stationary Line Pump',
      category: 'Concrete Pumps',
      output: '50 m³/hour',
      drumCapacity: '400L Hopper',
      engine: '75 HP Water-Cooled Diesel',
      transmission: 'High-Pressure Hydraulic Twin Cylinder',
      gradeability: 'Trailer Mounted',
      features: [
        'Robust hard-faced S-valve suitable for harsh aggregate grades',
        'Horizontal pumping reach of up to 450 meters',
        'Automatic lubrication system to prevent cylinder wear',
        'Ergonomic remote control console for pour operators'
      ],
      idealFor: 'High-rise residential slabs, metro tunnels, bridge pier casting'
    }
  };

  // Competitive Battlecards
  const battlecards = {
    schwing: {
      opponent: 'Schwing Stetter India',
      subtitle: 'Premium European Challenger (16.4% Share)',
      ourEdge: 'Maneuverability, Fuel Economy & Rural Footprint',
      points: [
        {
          title: 'Diesel Consumption Efficiency',
          desc: 'Ajax ARGO series consumes on average 14-18% less diesel per cubic meter of concrete produced due to load-sensing variable displacement hydraulics.'
        },
        {
          title: 'Steering & Site Agility',
          desc: 'Ajax offers 4-wheel steer with crab mode as standard, enabling full turning inside 4.2m radius compared to Schwing standard two-wheel lock radius.'
        },
        {
          title: 'Parts Cost & Availability',
          desc: '100% indigenous component supply chain with 98% Indian RTO parts coverage prevents costly downtime waiting for imported parts.'
        }
      ]
    },
    kyb: {
      opponent: 'KYB-Conmat',
      subtitle: 'Japanese Joint Venture (3.0% Share)',
      ourEdge: 'Rough Terrain Proven Heritage & Resale Value',
      points: [
        {
          title: 'Chassis & Suspension Ruggedness',
          desc: 'Built specifically for severe off-highway Indian conditions with high tensile Domex steel chassis vs lightweight import frames.'
        },
        {
          title: 'Secondary Resale Market Value',
          desc: 'Ajax equipment commands 50-55% residual value in secondary contractor markets after 4 years, whereas KYB depreciates to under 35%.'
        },
        {
          title: 'Specialist Operator Availability',
          desc: 'Over 25,000 operators trained at Ajax Operator Training Academy, ensuring immediate operator hiring without project delays.'
        }
      ]
    },
    venus: {
      opponent: 'Venus & Regional Assemblers',
      subtitle: 'Budget / Low Cost Challengers (8.7% Share)',
      ourEdge: 'Precision Electronics, Structural Integrity & IoT Telematics',
      points: [
        {
          title: 'Batch Weighing Certification',
          desc: 'Ajax electronic load-cell system passes strict NHAI and MORTH audits with printed batch slips; budget assemblers rely on volumetric guesswork.'
        },
        {
          title: 'Mean Time Between Failures (MTBF)',
          desc: 'Ajax hydraulics operate beyond 6,000 hours without pump overhaul vs frequent valve leakages reported on local regional mixers.'
        },
        {
          title: 'SmartFleet Telematics',
          desc: 'Real-time GPS, diesel theft alerts, concrete cubic meter logging, and remote diagnostic codes accessible on mobile app.'
        }
      ]
    }
  };

  const currentProd = products[selectedProduct];
  const currentCard = battlecards[selectedBattlecard];

  return (
    <div className="space-y-6">
      
      {/* =========================================
          HERO BRAND HEADER
          ========================================= */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-orange-950 text-white rounded-2xl p-7 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
              <Star className="w-3.5 h-3.5 fill-orange-400" />
              <span>India's Undisputed SLCM Pioneer Since 1992</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AJAX Engineering Brand Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Empowering nation-building with over 30,000 machines operational across roads, bridges, solar parks, and metro infrastructure.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center">
            <div>
              <div className="text-2xl font-black text-orange-400">69.2%</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">National Share</div>
            </div>
            <div className="w-[1px] h-8 bg-white/20"></div>
            <div>
              <div className="text-2xl font-black text-white">4,662</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">2024 Units</div>
            </div>
            <div className="w-[1px] h-8 bg-white/20"></div>
            <div>
              <div className="text-2xl font-black text-emerald-400">#1</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Market Rank</div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          ROW 1: PRODUCT SHOWCASE & SPECIFICATIONS
          ========================================= */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Flagship Equipment Lineup</h3>
            <p className="text-xs text-slate-400 font-medium">Select an equipment model to inspect engineering specifications and value propositions</p>
          </div>

          {/* Product selector buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {Object.values(products).map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProduct(p.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedProduct === p.id 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Product Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-xl bg-slate-50 border border-slate-100">
          <div className="lg:col-span-7 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100/70 px-2.5 py-0.5 rounded-full">
                {currentProd.category}
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">{currentProd.name}</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{currentProd.tagline}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Key Engineering Highlights</h4>
              <div className="space-y-2">
                {currentProd.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-600">
              <strong className="text-slate-900">Recommended Applications:</strong> {currentProd.idealFor}
            </div>
          </div>

          {/* Specs Grid */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/80 space-y-3.5 shadow-sm">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Technical Specifications
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold block">Batch Output</span>
                <span className="font-bold text-slate-900">{currentProd.output}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold block">Drum Capacity</span>
                <span className="font-bold text-slate-900">{currentProd.drumCapacity}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold block">Engine Power</span>
                <span className="font-bold text-slate-900">{currentProd.engine}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold block">Gradeability</span>
                <span className="font-bold text-slate-900">{currentProd.gradeability}</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg text-xs">
              <span className="text-[10px] text-slate-400 font-semibold block">Drivetrain</span>
              <span className="font-bold text-slate-900">{currentProd.transmission}</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          ROW 2: SALES BATTLECARDS & COMPETITIVE OBJECTIONS
          ========================================= */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
              <h3 className="text-base font-bold text-slate-900">Competitive Battlecards & Objection Handling</h3>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Field sales playbooks to win deals against key competitors in customer meetings
            </p>
          </div>

          <div className="flex items-center gap-2">
            {Object.entries(battlecards).map(([key, card]) => (
              <button
                key={key}
                onClick={() => setSelectedBattlecard(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedBattlecard === key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                vs {card.opponent.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Battlecard Detail */}
        <div className="p-6 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Battlecard Playbook</span>
              <h3 className="text-lg font-black text-slate-900">AJAX Engineering vs {currentCard.opponent}</h3>
              <p className="text-xs text-slate-500 font-medium">{currentCard.subtitle}</p>
            </div>
            <div className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Core Advantage: {currentCard.ourEdge}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentCard.points.map((pt, i) => (
              <div key={i} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <span>{pt.title}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {pt.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================
          ROW 3: MANUFACTURING & SERVICE INFRASTRUCTURE
          ========================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Building className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">4 State-of-the-Art Plants</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Over 100,000 sq.m manufacturing footprint located across Doddaballapur and Gowribidanur in Karnataka, with automated welding robots and testing tracks.
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">40+ Service Outlets</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Nationwide service vans and factory-trained technicians guaranteeing response within 24 hours anywhere along golden quadrilateral and rural corridors.
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Operator Training Academy</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Over 25,000 certified operators trained in preventive maintenance, eco-driving, and weigh-batching calibration, drastically lowering machine lifecycle costs.
          </p>
        </div>

      </div>

    </div>
  );
}

function Building(props) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/>
      <path d="M16 6h.01"/>
      <path d="M12 6h.01"/>
      <path d="M12 10h.01"/>
      <path d="M12 14h.01"/>
      <path d="M16 10h.01"/>
      <path d="M16 14h.01"/>
      <path d="M8 10h.01"/>
      <path d="M8 14h.01"/>
    </svg>
  );
}
