import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BrainCircuit, TrendingUp, AlertOctagon, Map as MapIcon } from 'lucide-react';

export function PredictionDashboard() {
  const predictionData = [
    { month: 'Jan', risk: 30 },
    { month: 'Feb', risk: 45 },
    { month: 'Mar', risk: 35 },
    { month: 'Apr', risk: 55 },
    { month: 'May', risk: 70 },
    { month: 'Jun', risk: 85 },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="mb-6">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
          <BrainCircuit className="w-4 h-4 mr-2" /> AI Predictive Model v2.4
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Risk Prediction & Analytics</h1>
        <p className="text-slate-500 max-w-3xl mt-2">
          Our AI analyzes historical data, weather patterns, and urban density to predict future infrastructure failures and high-risk zones.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-indigo-100">Predicted Critical Failures</h3>
              <AlertOctagon className="text-indigo-200" />
            </div>
            <div className="text-4xl font-bold mb-2">12</div>
            <p className="text-indigo-100 text-sm">Expected in next 30 days based on current wear patterns.</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
           <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-600">High Risk Zone</h3>
              <MapIcon className="text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">Downtown Sector 4</div>
            <div className="flex items-center text-sm text-red-500 font-medium">
              <TrendingUp className="w-4 h-4 mr-1" /> +15% Risk Increase
            </div>
            <p className="text-slate-500 text-sm mt-2">Due to heavy construction traffic and recent storms.</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
           <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-600">Prevention Savings</h3>
              <TrendingUp className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">$45,200</div>
            <p className="text-slate-500 text-sm">Estimated savings this month by addressing predicted issues early.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Infrastructure Stress Forecast</CardTitle>
              <CardDescription>Projected strain on city infrastructure for the next 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={predictionData}>
                    <defs>
                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Area type="monotone" dataKey="risk" stroke="#8884d8" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />
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
              <CardDescription>Areas requiring preventative maintenance.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow relative overflow-hidden rounded-b-xl min-h-[300px] p-0">
               {/* CSS Heatmap Simulation */}
               <div className="absolute inset-0 bg-slate-900">
                  <div className="absolute top-[20%] left-[30%] w-32 h-32 bg-red-500 rounded-full blur-3xl opacity-60 animate-pulse"></div>
                  <div className="absolute bottom-[20%] right-[30%] w-40 h-40 bg-orange-500 rounded-full blur-3xl opacity-50"></div>
                  <div className="absolute top-[50%] right-[50%] w-24 h-24 bg-yellow-500 rounded-full blur-2xl opacity-40"></div>
                  
                  {/* Grid Lines Overlay */}
                  <div className="absolute inset-0" style={{ 
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', 
                    backgroundSize: '40px 40px' 
                  }}></div>
                  
                  {/* Labels */}
                  <div className="absolute top-[25%] left-[35%] text-white text-xs font-bold bg-black/50 px-2 py-1 rounded backdrop-blur-md">Sector 7 (High)</div>
                  <div className="absolute bottom-[25%] right-[35%] text-white text-xs font-bold bg-black/50 px-2 py-1 rounded backdrop-blur-md">Sector 3 (Med)</div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
