import React, { useState } from 'react';

// Real-world threat hotspots with accurate latitude/longitude projected to SVG x,y (viewBox 0 0 1000 500)
const HOTSPOTS = [
  {
    id: 1,
    name: 'US-East Data Center (Virginia)',
    ip: '192.168.1.10',
    country: 'United States',
    coords: { x: 260, y: 165 },
    type: 'SQLi - UNION SELECT',
    severity: 'CRITICAL',
    status: 'Blocked',
    count: '342 attacks/min',
    target: true
  },
  {
    id: 2,
    name: 'Silicon Valley Node',
    ip: '198.51.100.23',
    country: 'United States (West)',
    coords: { x: 155, y: 160 },
    type: 'Time-Based SQLi',
    severity: 'HIGH',
    status: 'Blocked',
    count: '189 attacks/min',
    target: true
  },
  {
    id: 3,
    name: 'Frankfurt Hub',
    ip: '185.199.109.8',
    country: 'Germany / EU Central',
    coords: { x: 515, y: 130 },
    type: 'Boolean-Based SQLi',
    severity: 'HIGH',
    status: 'Blocked',
    count: '210 attacks/min',
    target: true
  },
  {
    id: 4,
    name: 'Eastern Europe Threat Origin',
    ip: '203.0.113.45',
    country: 'Romania / Bucharest',
    coords: { x: 570, y: 135 },
    type: 'Stacked Queries',
    severity: 'CRITICAL',
    status: 'Mitigated',
    count: '428 attacks/min',
    origin: true
  },
  {
    id: 5,
    name: 'Mumbai Cloud Region',
    ip: '203.0.113.78',
    country: 'India',
    coords: { x: 705, y: 225 },
    type: 'Error-Based SQLi',
    severity: 'MEDIUM',
    status: 'Blocked',
    count: '95 attacks/min',
    target: true
  },
  {
    id: 6,
    name: 'East Asia Threat Vector',
    ip: '172.16.0.42',
    country: 'East Asia Region',
    coords: { x: 840, y: 175 },
    type: 'Blind SQL Injection',
    severity: 'CRITICAL',
    status: 'Blocked',
    count: '512 attacks/min',
    origin: true
  },
  {
    id: 7,
    name: 'São Paulo Gateway',
    ip: '177.12.89.4',
    country: 'Brazil',
    coords: { x: 345, y: 340 },
    type: 'Auth Bypass Attempt',
    severity: 'MEDIUM',
    status: 'Filtered',
    count: '64 attacks/min',
    origin: true
  },
  {
    id: 8,
    name: 'Sydney Edge Node',
    ip: '139.130.4.5',
    country: 'Australia',
    coords: { x: 875, y: 385 },
    type: 'SQLi Probe',
    severity: 'LOW',
    status: 'Blocked',
    count: '32 attacks/min',
    target: true
  }
];

// Attack Arcs connecting Threat Origins to Target Data Centers
const ATTACK_ARCS = [
  { from: { x: 570, y: 135 }, to: { x: 260, y: 165 }, controlY: 70, color: '#ef4444' }, // Eastern Europe -> US East
  { from: { x: 840, y: 175 }, to: { x: 155, y: 160 }, controlY: 60, color: '#f97316' }, // East Asia -> US West
  { from: { x: 570, y: 135 }, to: { x: 515, y: 130 }, controlY: 100, color: '#ef4444' }, // Eastern Europe -> Frankfurt
  { from: { x: 840, y: 175 }, to: { x: 705, y: 225 }, controlY: 160, color: '#f59e0b' }, // East Asia -> Mumbai
  { from: { x: 345, y: 340 }, to: { x: 260, y: 165 }, controlY: 240, color: '#f59e0b' }, // Brazil -> US East
];

const WorldMap = ({ className = '' }) => {
  const [activeSpot, setActiveSpot] = useState(HOTSPOTS[0]);

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between select-none ${className}`}>
      
      {/* Top Map Header Stats */}
      <div className="w-full flex items-center justify-between px-2 py-1 mb-1 text-[11px] border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-700">Global Threat Intelligence Map</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Attack Origins
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Protected Targets
          </span>
        </div>
      </div>

      {/* Main SVG Vector Map Container */}
      <div className="relative w-full h-[210px] flex items-center justify-center">
        <svg
          className="w-full h-full"
          viewBox="0 0 1000 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradient for Attack Arcs */}
            <linearGradient id="arcRed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="arcOrange" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4" />
            </linearGradient>

            {/* Glowing filter for nodes */}
            <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowIndigo" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Latitude & Longitude Gridlines */}
          <g stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3">
            <line x1="0" y1="100" x2="1000" y2="100" />
            <line x1="0" y1="200" x2="1000" y2="200" stroke="#e2e8f0" strokeDasharray="2 2" />
            <line x1="0" y1="300" x2="1000" y2="300" stroke="#e2e8f0" strokeDasharray="2 2" />
            <line x1="0" y1="400" x2="1000" y2="400" />
            
            <line x1="200" y1="0" x2="200" y2="500" />
            <line x1="400" y1="0" x2="400" y2="500" stroke="#e2e8f0" strokeDasharray="2 2" />
            <line x1="600" y1="0" x2="600" y2="500" stroke="#e2e8f0" strokeDasharray="2 2" />
            <line x1="800" y1="0" x2="800" y2="500" />
          </g>

          {/* ACCURATE WORLD CONTINENT VECTOR PATHS */}
          <g fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" className="transition-all duration-300">
            
            {/* North America & Canada */}
            <path d="M 60,80 L 95,65 L 140,50 L 210,40 L 290,30 L 350,35 L 390,60 L 370,85 L 340,95 L 310,105 L 290,120 L 305,145 L 285,170 L 265,190 L 275,215 L 255,245 L 235,235 L 225,210 L 195,190 L 160,175 L 130,145 L 110,125 L 80,105 L 60,80 Z" />
            
            {/* Greenland */}
            <path d="M 330,25 L 380,20 L 415,35 L 390,70 L 345,60 L 330,40 Z" />

            {/* Central America & Caribbean Islands */}
            <path d="M 235,245 L 255,255 L 280,270 L 265,280 L 245,265 Z" />
            <circle cx="285" cy="245" r="3" />
            <circle cx="305" cy="250" r="2.5" />

            {/* South America */}
            <path d="M 275,275 L 320,270 L 360,290 L 395,335 L 375,395 L 335,445 L 305,465 L 290,440 L 280,390 L 265,345 L 260,305 Z" />

            {/* British Isles / UK */}
            <path d="M 445,95 L 465,85 L 470,105 L 450,115 Z" />
            <path d="M 435,100 L 442,95 L 445,108 L 438,110 Z" />

            {/* Europe Mainland */}
            <path d="M 460,110 L 490,95 L 535,85 L 575,95 L 590,120 L 565,145 L 525,155 L 485,150 L 465,135 Z" />

            {/* Scandinavia */}
            <path d="M 495,45 L 530,35 L 555,55 L 535,80 L 505,70 Z" />

            {/* Africa */}
            <path d="M 450,165 L 525,155 L 585,185 L 615,225 L 595,295 L 565,365 L 530,400 L 495,385 L 475,320 L 435,255 L 425,195 Z" />

            {/* Madagascar */}
            <path d="M 615,335 L 630,330 L 620,375 L 605,380 Z" />

            {/* Middle East & Arabian Peninsula */}
            <path d="M 585,160 L 635,150 L 665,175 L 650,225 L 605,215 L 585,185 Z" />

            {/* Asia & Siberia */}
            <path d="M 585,95 L 660,75 L 760,55 L 880,50 L 945,75 L 915,120 L 845,135 L 875,165 L 905,185 L 875,220 L 825,245 L 775,255 L 745,225 L 715,250 L 690,220 L 650,225 L 595,165 Z" />

            {/* India Subcontinent */}
            <path d="M 675,210 L 735,215 L 745,270 L 710,295 L 680,250 Z" />
            <circle cx="725" cy="305" r="2.5" />

            {/* Japan Arc */}
            <path d="M 900,125 L 920,120 L 930,160 L 905,170 Z" />

            {/* Southeast Asia & Maritime Archipelagos */}
            <path d="M 770,255 L 815,260 L 835,295 L 800,305 Z" />
            <path d="M 850,265 L 865,260 L 860,290 Z" />
            <path d="M 810,315 L 865,320 L 885,335 L 835,345 Z" />

            {/* Australia */}
            <path d="M 795,370 L 885,360 L 920,395 L 900,450 L 825,455 L 780,415 Z" />
            
            {/* New Zealand */}
            <path d="M 935,430 L 950,425 L 945,465 Z" />
            <path d="M 950,470 L 960,465 L 955,490 Z" />

          </g>

          {/* ANIMATED ATTACK ARCS (BEZIER CURVES WITH DASH ANIMATION) */}
          <g>
            {ATTACK_ARCS.map((arc, idx) => {
              const pathD = `M ${arc.from.x} ${arc.from.y} Q ${(arc.from.x + arc.to.x) / 2} ${arc.controlY} ${arc.to.x} ${arc.to.y}`;
              return (
                <g key={idx}>
                  {/* Subtle Background Arc */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth="1.5"
                    strokeOpacity="0.25"
                    strokeDasharray="4 4"
                  />
                  {/* Animated Light Pulse along Arc */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="12 120"
                    className="animate-pulse"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="132"
                      to="0"
                      dur={`${2.5 + idx * 0.6}s`}
                      repeatCount="indefinite"
                    />
                  </path>
                </g>
              );
            })}
          </g>

          {/* DYNAMIC THREAT HOTSPOTS & TARGET DATA CENTERS */}
          {HOTSPOTS.map((spot) => {
            const isSelected = activeSpot?.id === spot.id;
            const isOrigin = spot.origin;

            return (
              <g
                key={spot.id}
                className="cursor-pointer group"
                onClick={() => setActiveSpot(spot)}
              >
                {/* Outer Pulsing Ping Ring */}
                <circle
                  cx={spot.coords.x}
                  cy={spot.coords.y}
                  r={isSelected ? "22" : "14"}
                  fill={isOrigin ? "#ef4444" : "#4f46e5"}
                  fillOpacity={isSelected ? "0.35" : "0.2"}
                  className="animate-ping"
                />

                {/* Secondary Halo */}
                <circle
                  cx={spot.coords.x}
                  cy={spot.coords.y}
                  r={isSelected ? "12" : "8"}
                  fill={isOrigin ? "#ef4444" : "#4f46e5"}
                  fillOpacity="0.4"
                  filter={isOrigin ? "url(#glowRed)" : "url(#glowIndigo)"}
                />

                {/* Core Solid Marker */}
                <circle
                  cx={spot.coords.x}
                  cy={spot.coords.y}
                  r={isSelected ? "6" : "4.5"}
                  fill={isOrigin ? "#dc2626" : "#4338ca"}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* Center White Pin Dot */}
                <circle
                  cx={spot.coords.x}
                  cy={spot.coords.y}
                  r="1.5"
                  fill="#ffffff"
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Glassmorphism Active Threat Detail Popover */}
        {activeSpot && (
          <div className="absolute bottom-2 left-3 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-xl p-3 max-w-[260px] text-[11px] animate-fadeIn z-10">
            <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-100 pb-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${activeSpot.origin ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'}`}></span>
                <span className="font-bold text-slate-900 truncate">{activeSpot.name}</span>
              </div>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                activeSpot.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                activeSpot.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {activeSpot.severity}
              </span>
            </div>

            <div className="space-y-1 text-[10px] text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Node IP:</span>
                <span className="font-mono font-semibold text-slate-800">{activeSpot.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="font-medium text-slate-700">{activeSpot.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attack Type:</span>
                <span className="font-medium text-indigo-600">{activeSpot.type}</span>
              </div>
              <div className="flex justify-between items-center pt-0.5 border-t border-slate-100 mt-1">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  ✓ {activeSpot.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Footer Heatmap Bar */}
      <div className="w-full flex items-center justify-between gap-3 text-[9px] text-slate-500 font-medium px-2 pt-1">
        <span>Low Risk (0 - 30)</span>
        <div className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500"></div>
        <span>High Critical Risk (70 - 100)</span>
      </div>

    </div>
  );
};

export default WorldMap;

