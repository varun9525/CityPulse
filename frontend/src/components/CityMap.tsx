import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Filter, Layers, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/utils/api';

export function CityMap() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.getReports();
        setReports(data);
      } catch (error) {
        console.error("Failed to load map data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = activeFilter === 'all'
    ? reports
    : reports.filter(r => r.type?.toLowerCase().includes(activeFilter));

  const getRiskType = (risk: string) => {
    return (risk || '').toLowerCase() as 'critical' | 'moderate' | 'low';
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar Filters */}
      <div className="w-80 bg-white border-r border-slate-200 z-10 flex flex-col shadow-lg">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Layers className="mr-2 h-5 w-5 text-blue-600" /> Map Layers
          </h2>
        </div>

        <div className="p-4 space-y-6 flex-grow overflow-y-auto">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Issue Type</h3>
            <div className="space-y-2">
              {[
                { id: 'all', label: 'All Issues', count: reports.length },
                { id: 'pothole', label: 'Road Damage', count: reports.filter(r => r.type.includes('Pothole')).length },
                { id: 'trash', label: 'Sanitation', count: reports.filter(r => r.type.includes('Dumping') || r.type.includes('Trash')).length },
                { id: 'light', label: 'Lighting', count: reports.filter(r => r.type.includes('Light')).length },
                { id: 'traffic', label: 'Traffic Signal', count: reports.filter(r => r.type.includes('Traffic')).length },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex justify-between items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${activeFilter === filter.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <span>{filter.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${activeFilter === filter.id ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Risk Level</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-slate-700">
                <span className="w-3 h-3 rounded-full bg-red-500 mr-2 shadow-sm"></span> Critical
              </div>
              <div className="flex items-center text-sm text-slate-700">
                <span className="w-3 h-3 rounded-full bg-amber-500 mr-2 shadow-sm"></span> Moderate
              </div>
              <div className="flex items-center text-sm text-slate-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2 shadow-sm"></span> Low
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <Button className="w-full bg-slate-900 text-white" onClick={() => window.location.reload()}>
            {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-grow relative bg-slate-200">
        {/* Mock Map Background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1542382257-80dedb725088?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwbWFwJTIwdmlldyUyMHRvcCUyMGRvd258ZW58MXx8fHwxNzY5ODQyNzAwfDA&ixlib=rb-4.1.0&q=80&w=1600)',
            filter: 'grayscale(30%) contrast(110%) brightness(110%)'
          }}
        />

        {/* Map Overlay Gradient */}
        <div className="absolute inset-0 bg-blue-900/10 pointer-events-none"></div>

        {/* Real Data Markers */}
        {filteredReports.map((report) => (
          <MapMarker
            key={report.id}
            // Normalize lat/lng to roughly fit on screen for demo purposes since we don't have a real map
            // We use the stored coords if they exist, or random if not (should exist)
            x={50 + (report.lng || 0) * 1000 + (Math.random() * 40 - 20)}
            y={50 + (report.lat || 0) * 1000 + (Math.random() * 40 - 20)}
            type={getRiskType(report.risk)}
            label={report.type}
          />
        ))}

        {/* Floating Controls */}
        <div className="absolute top-6 right-6 flex flex-col gap-2">
          <Button variant="secondary" size="icon" className="shadow-lg bg-white hover:bg-slate-100">
            <span className="text-xl font-bold text-slate-700">+</span>
          </Button>
          <Button variant="secondary" size="icon" className="shadow-lg bg-white hover:bg-slate-100">
            <span className="text-xl font-bold text-slate-700">-</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function MapMarker({ x, y, type, label }: { x: number, y: number, type: 'critical' | 'moderate' | 'low', label: string }) {
  const colors = {
    critical: 'bg-red-500 ring-red-300',
    moderate: 'bg-amber-500 ring-amber-300',
    low: 'bg-emerald-500 ring-emerald-300'
  };

  return (
    <motion.div
      className="absolute group cursor-pointer"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      whileHover={{ scale: 1.2, zIndex: 50 }}
    >
      <div className={`w-4 h-4 rounded-full ${colors[type]} ring-4 ring-opacity-50 shadow-lg relative`}>
        <div className={`absolute -inset-2 rounded-full ${colors[type]} opacity-20 animate-ping`}></div>
      </div>

      {/* Tooltip */}
      <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
        <div className="bg-slate-900 text-white text-xs py-1 px-2 rounded shadow-lg flex items-center">
          {type === 'critical' && <AlertCircle className="w-3 h-3 mr-1 text-red-400" />}
          {label}
        </div>
        <div className="w-2 h-2 bg-slate-900 rotate-45 absolute left-1/2 -bottom-1 -translate-x-1/2"></div>
      </div>
    </motion.div>
  );
}
