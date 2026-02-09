import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BrainCircuit, TrendingUp, AlertOctagon, Map as MapIcon, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight, Activity, ChevronRight, ChevronDown } from 'lucide-react';

export function PredictionDashboard() {
  const [predictionData, setPredictionData] = useState<any[]>([]);
  const [riskZones, setRiskZones] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [simulateDelay, setSimulateDelay] = useState(false);
  const [expandedZone, setExpandedZone] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const delayDays = simulateDelay ? 3 : 0;
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/analytics/predict?delay_days=${delayDays}`);
        const data = await response.json();

        if (data.forecast) setPredictionData(data.forecast);
        if (data.risk_zones) setRiskZones(data.risk_zones);
        if (data.trends) setTrends(data.trends);
      } catch (error) {
        console.error("Failed to fetch predictions:", error);
      }
    };

    fetchData();
  }, [simulateDelay]);

  const totalProjectedCost = riskZones.reduce((acc, curr) => acc + (curr.projected_cost || 0), 0);
  const criticalCount = riskZones.filter(z => z.risk_score > 7).length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen font-sans">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <BrainCircuit className="w-6 h-6 mr-2 text-indigo-600" />
            Strategic Decision Support
          </h1>
          <p className="text-slate-500 text-sm mt-1">AI-powered forecast & risk simulation for Vadodara.</p>
        </div>

        {/* Simulation Toggle */}
        <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all ${simulateDelay ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`p-1.5 rounded-full ${simulateDelay ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Simulation Mode</span>
            <span className={`text-sm font-semibold ${simulateDelay ? 'text-amber-700' : 'text-slate-700'}`}>
              {simulateDelay ? 'Delay Action (+3 Days)' : 'Current Status'}
            </span>
          </div>
          <button
            onClick={() => setSimulateDelay(!simulateDelay)}
            className={`ml-2 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${simulateDelay ? 'bg-amber-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${simulateDelay ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Risk Zones</div>
          <div className="text-3xl font-bold text-slate-900">{riskZones.length}</div>
          <div className="text-xs text-slate-400 mt-2">Identified areas needing attention</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Critical Hotspots</div>
          <div className={`text-3xl font-bold ${criticalCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{criticalCount}</div>
          <div className="text-xs text-red-100 bg-red-600 inline-block px-1.5 py-0.5 rounded mt-2">Requires Immediate Action</div>
        </div>
        <div className={`p-5 rounded-xl border shadow-sm transition-colors ${simulateDelay ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <div className={`${simulateDelay ? 'text-amber-800' : 'text-slate-500'} text-xs font-bold uppercase tracking-wider mb-1`}>
            {simulateDelay ? 'Projected Cost of Delay' : 'Current Est. Cost'}
          </div>
          <div className={`text-3xl font-bold ${simulateDelay ? 'text-amber-700' : 'text-slate-900'}`}>
            {totalProjectedCost > 0 ? `₹${(totalProjectedCost / 1000).toFixed(1)}k` : '—'}
          </div>
          <div className="text-xs mt-2 flex items-center">
            {simulateDelay && <AlertTriangle className="w-3 h-3 text-amber-600 mr-1" />}
            <span className={simulateDelay ? 'text-amber-700 font-medium' : 'text-slate-400'}>
              {simulateDelay ? '+15% escalation predicted' : 'Based on resource allocation'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* LEFT: Risk Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg text-slate-800 flex items-center">
                <AlertOctagon className="w-5 h-5 mr-2 text-indigo-600" />
                Priority Attention List
              </CardTitle>
              <CardDescription>High-risk areas ranked by severity and growth potential.</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Area</th>
                    <th className="px-6 py-3">Risk Score</th>
                    <th className="px-6 py-3">Growth</th>
                    <th className="px-6 py-3">Primary Issue</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {riskZones.map((zone, idx) => (
                    <React.Fragment key={idx}>
                      <tr
                        onClick={() => setExpandedZone(expandedZone === idx ? null : idx)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center">
                          {expandedZone === idx ? <ChevronDown className="w-4 h-4 mr-2 text-slate-400" /> : <ChevronRight className="w-4 h-4 mr-2 text-slate-400" />}
                          {zone.area_name}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${zone.risk_score > 7 ? 'bg-red-500' : 'bg-orange-400'}`}></div>
                            <span className={`font-bold ${zone.risk_score > 7 ? 'text-red-700' : 'text-orange-700'}`}>{zone.risk_score}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center font-medium ${zone.growth_pct > 20 ? 'text-red-600' : 'text-slate-600'}`}>
                            {zone.growth_pct > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {zone.growth_pct}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{zone.dominant_issue}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded group-hover:bg-indigo-100 transition-colors">
                            View Plan
                          </span>
                        </td>
                      </tr>
                      {expandedZone === idx && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="font-semibold text-slate-900 mb-1">Root Cause Analysis</div>
                                <p className="text-slate-600 italic">{zone.reason}</p>
                                <div className="mt-2 flex gap-2">
                                  {zone.likely_issues?.map((iss: string, k: number) => (
                                    <span key={k} className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[10px] rounded">{iss}</span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="font-semibold text-emerald-700 mb-1">Recommended Strategy</div>
                                <div className="bg-emerald-50 border border-emerald-100 p-2 rounded text-emerald-800 flex items-start">
                                  <span className="mr-2">💡</span>
                                  {zone.suggestion}
                                </div>
                                {simulateDelay && (
                                  <div className="mt-2 text-xs text-amber-700 font-medium">
                                    ⚠️ Delaying this action will cost approx ₹{(zone.projected_cost).toLocaleString()} more.
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT: Charts */}
        <div className="lg:col-span-1 space-y-6">
          {/* Projected Load Chart */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Activity className="w-4 h-4 mr-2 text-indigo-600" /> Projected Load
              </CardTitle>
              <CardDescription>Issue volume forecast (6 months)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 w-full mt-2">
                {predictionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={predictionData}>
                      <defs>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="risk"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fill="url(#colorRisk)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading forecast...</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trends List */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-slate-600" /> Emerging Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trends.map((trend, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700">{trend.name}</span>
                    <span className="text-[10px] text-slate-400 max-w-[140px] truncate">{trend.prediction}</span>
                  </div>
                  <div className={`flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${trend.trend === 'up' ? 'bg-red-50 text-red-600' :
                    trend.trend === 'down' ? 'bg-green-50 text-green-600' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                    {trend.trend === 'up' ? '↑' : trend.trend === 'down' ? '↓' : '→'} {trend.value}%
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
