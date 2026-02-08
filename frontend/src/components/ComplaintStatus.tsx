import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Search, CheckCircle2, Clock, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/utils/api';
import { format } from 'date-fns';

export function ComplaintStatus() {
  const [complaintId, setComplaintId] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId.trim()) return;

    setHasSearched(true);
    setIsLoading(true);
    setError('');
    setReport(null);

    try {
      const data = await api.getReport(complaintId.trim());
      setReport(data);
    } catch (err) {
      setError('Report not found. Please check the ID and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    if (status === 'RESOLVED' || status === 'APPROVED') return 2;
    if (status === 'PENDING') return 1;
    return 0; // Open
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Track Complaint Status</h1>
        <p className="text-slate-600">Enter your Complaint ID to check the real-time status of your report.</p>
      </div>

      <div className="max-w-xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Enter Complaint ID (e.g., CP-2026-892)"
            className="h-12 text-lg"
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
          />
          <Button type="submit" className="h-12 px-6 bg-slate-900 hover:bg-slate-800" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5 mr-2" />}
            Track
          </Button>
        </form>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
      </div>

      {report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`overflow-hidden border-t-4 shadow-lg ${report.status === 'RESOLVED' || report.status === 'APPROVED' ? 'border-t-emerald-500' :
              report.status === 'PENDING' ? 'border-t-amber-500' :
                'border-t-red-500'
            }`}>
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">Complaint #{report.id}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    Submitted on {report.created_at ? format(new Date(report.created_at), 'MMM d, yyyy') : 'Date unavailable'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${report.status === 'RESOLVED' || report.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    report.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      'bg-red-100 text-red-800 border-red-200'
                  }`}>
                  {report.status}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              {/* Progress Bar */}
              <div className="mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
                <div
                  className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 z-0 transition-all duration-1000 ${report.status === 'RESOLVED' || report.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                  style={{ width: `${(getStatusStep(report.status) / 2) * 100}%` }}
                ></div>

                <div className="relative z-10 flex justify-between">
                  {['Received', 'In Progress', 'Resolved'].map((label, index) => {
                    const isComplete = index <= getStatusStep(report.status);
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${isComplete
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white border-slate-200 text-slate-300'
                          } ${(report.status === 'RESOLVED' || report.status === 'APPROVED') && isComplete ? '!bg-emerald-500 !border-emerald-500' : ''}`}>
                          {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-slate-300" />}
                        </div>
                        <span className={`mt-3 text-sm font-medium ${isComplete ? 'text-slate-900' : 'text-slate-400'}`}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm h-48 bg-slate-100 relative group">
                    <img
                      src={report.image_url || report.imageUrl}
                      alt="Issue"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-xs">
                      Original Photo
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <span className="block text-sm font-medium text-slate-500">Issue Type</span>
                      <span className="text-lg font-semibold text-slate-900">{report.type}</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <span className="block text-sm font-medium text-slate-500">Location</span>
                      <span className="text-base text-slate-900">{report.location}</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-purple-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <span className="block text-sm font-medium text-slate-500">Description</span>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md mt-1 border border-slate-100">
                        {report.description || 'No additional description provided.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
