import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BrainCircuit, TrendingUp, AlertOctagon, Map as MapIcon } from 'lucide-react';

export function PredictionDashboard() {
  const [predictionData, setPredictionData] = React.useState<any[]>([]);
  const [riskZones, setRiskZones] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch from our new backend endpoint
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/analytics/predict`);
        const data = await response.json();

        if (data.forecast) {
          setPredictionData(data.forecast);
        }
        if (data.risk_zones) {
          setRiskZones(data.risk_zones);
        }
      } catch (error) {
        console.error("Failed to fetch predictions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const highRiskZone = riskZones.length > 0 ? riskZones[0] : null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="mb-6">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
          <BrainCircuit className="w-4 h-4 mr-2" /> AI Predictive Model v3.0 (Random Forest)
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Risk Prediction & Analytics</h1>
        <p className="text-slate-500 max-w-3xl mt-2">
          Our AI model analyzes historical patterns (synthetic + real) to forecast future infrastructure risks.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-indigo-100">Forecasted High Risks</h3>
              <AlertOctagon className="text-indigo-200" />
            </div>
            <div className="text-4xl font-bold mb-2">
              {predictionData.length > 0 ? predictionData.reduce((acc, curr) => acc + (curr.type === 'Predicted' ? curr.risk : 0), 0) : '...'}
            </div>
            <p className="text-indigo-100 text-sm">Predicted critical issues for the upcoming quarter.</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-600">Highest Risk Zone</h3>
              <MapIcon className="text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {highRiskZone?.area_name || 'Analyzing...'}
            </div>
            <div className="text-xs text-slate-500 mb-2">
              {highRiskZone ? `Lat: ${highRiskZone.lat.toFixed(3)}, Lng: ${highRiskZone.lng.toFixed(3)}` : ''}
            </div>
            <div className="flex items-center text-sm text-red-500 font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              {highRiskZone ? `Risk Score: ${highRiskZone.risk_score}` : '...'}
            </div>
            <p className="text-slate-500 text-sm mt-2">
              {highRiskZone?.weather_forecast === 'Rainy' ? '⚠️ High Rain Forecast: potential waterlogging.' : 'Area requiring immediate preventative maintenance.'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-600">Model Status</h3>
              <BrainCircuit className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">Active</div>
            <p className="text-slate-500 text-sm">
              Region: <strong>Vadodara</strong><br />
              Features: Weather (Open-Meteo), History
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Infrastructure Risk Forecast</CardTitle>
              <CardDescription>Historical data vs AI Predictions (Random Forest).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={predictionData}>
                    <defs>
                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="risk"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorRisk)"
                      strokeWidth={3}
                      name="Risk Level"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Risk Heatmap</CardTitle>
              <CardDescription>Top high-risk coordinates in Vadodara.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow relative overflow-hidden rounded-b-xl min-h-[300px] p-4">
              <div className="space-y-4">
                {riskZones.slice(0, 5).map((zone, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs mr-3">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-900">
                          {zone.area_name || `${zone.lat.toFixed(4)}, ${zone.lng.toFixed(4)}`}
                        </div>
                        <div className="text-xs text-slate-500">
                          {zone.weather_forecast === 'Rainy' ? '🌧️ Rain Impact' : 'Critical Zone'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">{zone.risk_score}</div>
                      <div className="text-[10px] text-slate-400">Risk Score</div>
                    </div>
                  </div>
                ))}

                {riskZones.length === 0 && (
                  <div className="text-center text-slate-400 mt-10">
                    No high risk zones detected yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
