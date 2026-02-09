import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Filter, Layers, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/utils/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for Risk Levels
const createCustomIcon = (colorClass: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${colorClass}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const icons = {
  critical: createCustomIcon('#ef4444'), // Red-500
  moderate: createCustomIcon('#f59e0b'), // Amber-500
  low: createCustomIcon('#10b981')       // Emerald-500
};

export function CityMap() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Vadodara Center Coords
  const VADODARA_CENTER: [number, number] = [22.3072, 73.1812];

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.getReports();
        setReports(data || []);
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
                { id: 'pothole', label: 'Road Damage', count: reports.filter(r => r.type?.toLowerCase().includes('pothole') || r.type?.toLowerCase().includes('road')).length },
                { id: 'garbage', label: 'Sanitation', count: reports.filter(r => r.type?.toLowerCase().includes('garbage') || r.type?.toLowerCase().includes('trash') || r.type?.toLowerCase().includes('dump')).length },
                { id: 'light', label: 'Lighting', count: reports.filter(r => r.type?.toLowerCase().includes('light') || r.type?.toLowerCase().includes('street')).length },
                { id: 'water', label: 'Water Supply', count: reports.filter(r => r.type?.toLowerCase().includes('water') || r.type?.toLowerCase().includes('leak')).length },
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
      <div className="flex-grow relative bg-slate-200 z-0">
        <MapContainer
          center={VADODARA_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {filteredReports.map((report) => (
            report.lat && report.lng ? (
              <Marker
                key={report.id}
                position={[report.lat, report.lng]}
                icon={icons[getRiskType(report.risk)] || icons.moderate}
              >
                <Popup>
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <div className="font-bold text-sm border-b pb-1 mb-1">{report.type}</div>
                    {report.image_url && <img src={report.image_url} alt="Issue" className="w-full h-32 object-cover rounded" />}
                    <div className="text-xs text-slate-600">{report.location || `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`}</div>
                    <div className={`text-xs font-bold ${report.risk === 'Critical' ? 'text-red-600' : report.risk === 'Moderate' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      Risk: {report.risk}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ) : null
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
