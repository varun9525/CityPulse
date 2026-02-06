import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import { supabase } from '@/utils/supabaseClient';
import { format } from 'date-fns';
import { Loader2, MapPin, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function MyReports({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Redirect or show login prompt handled by parent usually, but here we can just stop
          return;
        }
        setUser(user);
        
        const data = await api.getReports(user.id);
        setReports(data);
      } catch (error) {
        console.error("Failed to load reports", error);
        toast.error("Failed to load your reports history");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("ID copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
       <div className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Please Log In</h2>
          <Button onClick={() => onNavigate('login')}>Go to Login</Button>
       </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">My Reports</h1>
           <p className="text-slate-600 mt-2">History of civic issues you have reported.</p>
        </div>
        <Button onClick={() => onNavigate('report')} className="bg-emerald-600 hover:bg-emerald-700">
           New Report
        </Button>
      </div>

      <div className="space-y-6">
        {reports.length > 0 ? (
          reports.map((report) => (
            <Card key={report.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                 <div className="w-full md:w-48 h-48 md:h-auto bg-slate-100 relative">
                    <img 
                       src={report.imageUrl} 
                       alt={report.type} 
                       className="absolute inset-0 w-full h-full object-cover"
                    />
                 </div>
                 <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                       <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-slate-900">{report.type}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                             report.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                             report.status === 'In Progress' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                             'bg-red-100 text-red-800 border-red-200'
                          }`}>
                             {report.status}
                          </span>
                       </div>
                       
                       <div className="flex items-center text-sm text-slate-500 mb-2">
                          <MapPin className="h-4 w-4 mr-1 text-slate-400" />
                          {report.location}
                       </div>
                       
                       <div className="flex items-center text-sm text-slate-500 mb-4">
                          <Clock className="h-4 w-4 mr-1 text-slate-400" />
                          {format(new Date(report.timestamp), 'PPP p')}
                       </div>

                       <p className="text-sm text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded">
                          {report.description || 'No description provided.'}
                       </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                       <div className="text-xs text-slate-400 font-mono">
                          ID: <span className="text-slate-600 cursor-pointer hover:underline" onClick={() => handleCopyId(report.id)}>{report.id}</span>
                       </div>
                       <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto font-medium"
                          onClick={() => {
                             // Navigate to status page with ID? 
                             // Currently status page input is empty, maybe we can prefill or pass query param?
                             // Since we track state in App.tsx, passing data is hard without context. 
                             // But user can copy ID manually as requested.
                             handleCopyId(report.id);
                             toast.info("ID copied! Go to 'Track Status' to view details.");
                             onNavigate('status');
                          }}
                       >
                          Track Status <ArrowRight className="ml-1 h-3 w-3" />
                       </Button>
                    </div>
                 </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
             <AlertTriangle className="h-10 w-10 text-slate-300 mx-auto mb-4" />
             <h3 className="text-lg font-medium text-slate-900 mb-2">No reports yet</h3>
             <p className="text-slate-500 mb-6 max-w-sm mx-auto">You haven't submitted any civic issues yet. Help improve your city by reporting problems you see.</p>
             <Button onClick={() => onNavigate('report')}>Submit First Report</Button>
          </div>
        )}
      </div>
    </div>
  );
}
