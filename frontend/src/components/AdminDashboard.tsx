import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, Users, Loader2, LogOut } from 'lucide-react';
import { api } from '@/utils/api';
import { supabase } from '@/utils/supabaseClient';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { MapPin } from 'lucide-react';

export function AdminDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.getReports();
        setReports(data || []);
      } catch (error) {
        console.error("Failed to load reports", error);
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const totalComplaints = reports?.length || 0;
  const openIssues = reports?.filter(r => r.status === 'PENDING').length || 0;
  const resolvedIssues = reports?.filter(r => r.status === 'RESOLVED').length || 0;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Calculate trends for charts (simplified)
  // Calculate trends for charts (simplified)
  const issueDistribution = [
    { name: 'Roads', value: reports?.filter(r => r.type?.includes('Pothole')).length || 0, color: '#3b82f6' },
    { name: 'Sanitation', value: reports?.filter(r => r.type?.includes('Dumping') || r.type?.includes('Trash')).length || 0, color: '#10b981' },
    { name: 'Lighting', value: reports?.filter(r => r.type?.includes('Light')).length || 0, color: '#f59e0b' },
    { name: 'Other', value: reports?.filter(r => !r.type?.includes('Pothole') && !r.type?.includes('Dumping') && !r.type?.includes('Light')).length || 0, color: '#6366f1' },
  ].filter(d => d.value > 0);

  // If no data, use placeholders for charts to look good
  const chartData = issueDistribution.length > 0 ? issueDistribution : [
    { name: 'No Data', value: 100, color: '#e2e8f0' }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">City Admin Dashboard</h1>
          <p className="text-slate-500">Overview of civic issues and department performance.</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> System Operational
          </span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Refresh Data</Button>
          <Button
            variant="outline"
            size="sm"
            className="text-slate-600 hover:text-slate-900 border-slate-200"
            onClick={() => {
              supabase.auth.signOut();
              // window.location.reload(); // App.tsx listener will handle redirect
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Complaints"
          value={totalComplaints.toString()}
          change="All time"
          icon={<AlertTriangle className="h-5 w-5 text-blue-600" />}
          trend="up"
        />
        <StatCard
          title="Open Issues"
          value={openIssues.toString()}
          change="Needing attention"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          trend="down"
        />
        <StatCard
          title="Resolved"
          value={resolvedIssues.toString()}
          change="Completed"
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
          trend="up"
        />
        <StatCard
          title="Completion Rate"
          value={totalComplaints ? `${Math.round((resolvedIssues / totalComplaints) * 100)}%` : '0%'}
          change="Efficiency"
          icon={<Users className="h-5 w-5 text-indigo-600" />}
          trend="up"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Issue Distribution</CardTitle>
            <CardDescription>Breakdown of reported issues by category.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {issueDistribution.map((item, index) => (
                <div key={index} className="flex items-center text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: item.color }}></span>
                  {item.name} ({item.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for weekly trends since we don't store historical metrics efficiently yet */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest submissions stream.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {reports.slice(0, 5).map((report) => (
                <div key={report.id} className="flex items-start pb-3 border-b border-slate-100 last:border-0">
                  <div className={`p-2 rounded-full mr-3 ${report.riskLevel === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900">{report.type}</p>
                    <p className="text-xs text-slate-500">
                      {report.location} • {report.created_at ? format(new Date(report.created_at), 'MMM d, h:mm a') : 'No date'}
                    </p>
                  </div>
                </div>
              ))}
              {reports.length === 0 && <p className="text-center text-slate-400 py-10">No recent activity</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Complaints Table */}
      <IssueTable reports={reports} onUpdate={() => {
        setIsLoading(true);
        api.getReports().then(data => {
          setReports(data);
          setIsLoading(false);
        });
      }} />

    </div>
  );
}

function IssueTable({ reports, onUpdate }: { reports: any[], onUpdate: () => void }) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveFile, setResolveFile] = useState<File | null>(null);

  const handleResolve = async (id: string) => {
    if (!resolveFile) return;

    // Optimistic UI update or loading state could be added here
    const toastId = toast.loading("Verifying resolution evidence...");

    try {
      // 1. Verify resolution with AI
      const verifyRes = await api.verifyResolution(resolveFile);

      if (!verifyRes.resolved) {
        toast.dismiss(toastId);
        toast.error("Verification Failed", {
          description: verifyRes.message || "Issue still detected in the photo."
        });
        return;
      }

      toast.dismiss(toastId);
      toast.loading("Verification passed. Resolving issue...", { id: toastId });

      // 2. Proceed to resolve
      await api.resolveIssue(id, resolveFile);
      toast.dismiss(toastId);
      toast.success("Issue resolved successfully!");
      setResolvingId(null);
      setResolveFile(null);
      onUpdate();
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error("Failed to resolve issue", { description: e.message });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approveIssue(id);
      toast.success("Issue approved!");
      onUpdate();
    } catch (e) {
      toast.error("Failed to approve issue");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complaint Log</CardTitle>
        <CardDescription>Real-time feed of citizen reports.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Issue</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {row.type}
                    {row.risk === 'Critical' && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Critical</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                    {row.lat && row.lng ? (
                      <a
                        href={`https://www.google.com/maps?q=${row.lat},${row.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {row.location || `${row.lat.toFixed(4)}, ${row.lng.toFixed(4)}`}
                      </a>
                    ) : (
                      <span>{row.location || 'No location'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'PENDING' ? 'bg-red-100 text-red-700' :
                      row.status === 'RESOLVED' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2 items-center">
                    <Button variant="ghost" size="sm" className="h-8 text-blue-600" onClick={() => window.open(row.image_url, '_blank')}>View</Button>

                    {row.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        {resolvingId === row.id ? (
                          <div className="flex items-center gap-2">
                            <input type="file" className="text-xs w-24" onChange={e => setResolveFile(e.target.files?.[0] || null)} />
                            <Button size="sm" onClick={() => handleResolve(row.id)}>Upload</Button>
                            <Button size="sm" variant="ghost" onClick={() => setResolvingId(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setResolvingId(row.id)}>Resolve</Button>
                        )}
                      </div>
                    )}

                    {row.status === 'RESOLVED' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => window.open(row.resolved_image_url, '_blank')}>Fixed Img</Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(row.id)}>Approve</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, change, icon, trend }: { title: string, value: string, change: string, icon: React.ReactNode, trend: 'up' | 'down' }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-500 text-sm font-medium">{title}</span>
          <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
        <div className={`text-xs font-medium ${trend === 'up' && title !== 'Open Issues' ? 'text-emerald-600' : 'text-slate-500'}`}>
          {change}
        </div>
      </CardContent>
    </Card>
  );
}
