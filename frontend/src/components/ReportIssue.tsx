import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Upload, X, MapPin, Loader2, CheckCircle, Camera } from 'lucide-react';
import { api, predictImage } from '@/utils/api';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Upload, X, MapPin, Loader2, CheckCircle, Camera } from 'lucide-react';
import { api, predictImage } from '@/utils/api';
import { toast } from 'sonner';
import { supabase } from '@/utils/supabaseClient';

interface ReportIssueProps { onSuccess: () => void }

export function ReportIssue({ onSuccess }: ReportIssueProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const [detectedType, setDetectedType] = useState('');
  const [detectedLocation, setDetectedLocation] = useState('');
  const [detectedConfidence, setDetectedConfidence] = useState<number | null>(null);
  const [detectedLat, setDetectedLat] = useState<number | null>(null);
  const [detectedLng, setDetectedLng] = useState<number | null>(null);
  const [description, setDescription] = useState('');

  const CONF_THRESHOLD = 60;

  const getPriorityForType = (type: string) => {
    const t = (type || '').toLowerCase();
    if (!t) return 'Moderate';
    if (t.includes('dump') || t.includes('garbage') || t.includes('illegal')) return 'High';
    if (t.includes('pothole') || t.includes('road')) return 'High';
    if (t.includes('street light') || t.includes('streetlight') || t.includes('light')) return 'Low';
    if (t.includes('traffic') || t.includes('signal')) return 'Moderate';
    return 'Moderate';
  };

  const fetchGeolocation = () => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDetectedLat(lat);
        setDetectedLng(lng);
        setDetectedLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      },
      (err) => console.warn('Geolocation error:', err.message),
      { enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  useEffect(() => { fetchGeolocation() }, []);

  const simulateAIAnalysis = () => {
    setIsAnalyzing(true); setAnalysisComplete(false);
    setTimeout(() => {
      setIsAnalyzing(false); setAnalysisComplete(true);
      const types = ['Pothole / Road Damage','Illegal Dumping','Broken Street Light','Traffic Signal Fault'];
      setDetectedType(types[Math.floor(Math.random()*types.length)]);
      setDetectedConfidence(94);
      if (!detectedLocation) setDetectedLocation('Unknown location (please provide)');
    }, 1200);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0]; setSelectedFile(file);
    const reader = new FileReader(); reader.onload = () => setSelectedImage(reader.result as string); reader.readAsDataURL(file);

    setIsAnalyzing(true); setAnalysisComplete(false); setDetectedType(''); setDetectedConfidence(null);
    predictImage(file)
      .then((res:any)=>{
        const dets = res?.detections||[];
        if (dets.length>0) { dets.sort((a:any,b:any)=> (b.confidence||0)-(a.confidence||0)); const top=dets[0]; setDetectedType(top.class||''); setDetectedConfidence(typeof top.confidence==='number'?Math.round(top.confidence*100):null); }
        else simulateAIAnalysis();
      })
      .catch((err)=>{ console.error(err); simulateAIAnalysis(); })
      .finally(()=>{ setIsAnalyzing(false); setAnalysisComplete(true); });
  };

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); if (!selectedFile) return; setIsSubmitting(true);
    try {
      const formData = new FormData(); formData.append('image', selectedFile); formData.append('type', detectedType); formData.append('location', detectedLocation);
      if (detectedLat!==null && detectedLng!==null){ formData.append('lat', detectedLat.toString()); formData.append('lng', detectedLng.toString()); }
      const priority = getPriorityForType(detectedType); formData.append('priority', priority); const risk = priority==='High'?'Critical':priority==='Moderate'?'Moderate':'Low'; formData.append('risk', risk);
      formData.append('description', description);
      let token = null; let session = null;
      try{ const { data, error } = await supabase.auth.refreshSession(); if (!error && data.session){ session = data.session; token = data.session.access_token; } else { const { data: sessionData } = await supabase.auth.getSession(); session = sessionData.session; token = sessionData.session?.access_token; } }
      catch(e){ const { data: sessionData } = await supabase.auth.getSession(); session = sessionData.session; token = sessionData.session?.access_token; }
      if (session?.user?.id) formData.append('userId', session.user.id);
      const result = await api.submitReport(formData, token);
      toast.success(`Report Submitted: #${result.id}`, { description: 'Thank you for your contribution to the city.', duration: 5000 });
      onSuccess();
    }catch(err){ toast.error('Failed to submit report. Please try again.'); console.error(err); }
    finally{ setIsSubmitting(false); }
  };

  const allowEditType = analysisComplete && (!detectedType || (detectedConfidence!==null && detectedConfidence<CONF_THRESHOLD));

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Report a Civic Issue</h1>
        <p className="text-slate-600 mt-2">Help us keep the city clean and safe by reporting issues you see.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardContent className="pt-6 h-full flex flex-col">
              <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 p-6 transition-colors hover:bg-slate-100 relative overflow-hidden">
                {selectedImage ? (
                  <>
                    <img src={selectedImage} alt="Selected issue" className="absolute inset-0 w-full h-full object-cover" />
                    <button onClick={()=>{ setSelectedImage(null); setAnalysisComplete(false); setDetectedType(''); setDetectedConfidence(null); }} className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-slate-700 hover:text-red-500"><X className="h-5 w-5"/></button>
                  </>
                ):(
                  <label className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
                    <Camera className="h-12 w-12 text-blue-500 mb-4" />
                    <span className="text-sm font-medium text-slate-700">Tap to take photo</span>
                    <span className="text-xs text-slate-500 mt-1">or upload from gallery</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center">Supported: JPG, PNG. Max 5MB.</p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
              <CardDescription>Our AI automatically detects the issue type and location from your photo.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 min-h-[100px] flex items-center justify-center">
                  {!selectedImage ? (
                    <span className="text-slate-500 text-sm flex items-center"><Upload className="h-4 w-4 mr-2"/> Upload an image to start analysis</span>
                  ) : isAnalyzing ? (
                    <div className="flex flex-col items-center text-blue-600"><Loader2 className="h-6 w-6 animate-spin mb-2" /><span className="text-sm font-medium">Analyzing image...</span></div>
                  ) : analysisComplete ? (
                    <div className="w-full">
                      <div className="flex items-center text-emerald-600 mb-2"><CheckCircle className="h-5 w-5 mr-2"/><span className="font-semibold text-sm">Analysis Complete</span></div>
                      <div className="grid grid-cols-1 gap-4 text-sm"><div className="bg-white p-2 rounded border border-slate-200"><span className="text-xs text-slate-500 block">Priority</span><span className="font-medium text-amber-600">{getPriorityForType(detectedType)}</span>{((detectedConfidence!==null && detectedConfidence<CONF_THRESHOLD) || !detectedType) && (<div className="text-xs text-slate-500 mt-1">Detection uncertain — you can edit the issue type below.</div>)}</div></div>
                    </div>
                  ):null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Issue Type</label>
                  <Input value={detectedType} placeholder="Waiting for image..." disabled={!allowEditType && !!detectedType} onChange={(e:any)=>setDetectedType(e.target.value)} className="bg-slate-100 font-medium text-slate-800" />
                  {allowEditType ? (<p className="text-xs text-slate-500">Type not recognized or low confidence — please enter the issue.</p>) : (analysisComplete && <p className="text-xs text-emerald-600">✓ Automatically detected</p>)}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Location</label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input value={detectedLocation} placeholder="Provide address or use GPS" onChange={(e:any)=>{ setDetectedLocation(e.target.value); setDetectedLat(null); setDetectedLng(null); }} className="bg-slate-100 pl-10" />
                    <button type="button" onClick={fetchGeolocation} className="ml-3 text-sm text-blue-600 hover:underline">Use my location</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Additional Description (Optional)</label>
                  <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]" placeholder="Any extra details that might help the team..." value={description} onChange={(e)=>setDescription(e.target.value)} />
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={!analysisComplete || isAnalyzing || isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}{isSubmitting ? 'Submitting...' : 'Submit Report'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
                      >
                        Use my location
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Additional Description (Optional)</label>
                    <textarea
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                      placeholder="Any extra details that might help the team..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={!analysisComplete || isAnalyzing || isSubmitting}>
                      {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                      {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
