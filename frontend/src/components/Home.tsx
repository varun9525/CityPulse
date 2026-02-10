import React from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Camera, MapPin, ShieldAlert, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export function Home({ onNavigate }: HomeProps) {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/20 z-0"></div>
        <div
          className="absolute inset-0 opacity-20 z-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1760553120324-d3d2bf53852b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbWFydCUyMGNpdHklMjBmdXR1cmlzdGljJTIwYmx1ZSUyMGdyZWVufGVufDF8fHx8MTc2OTkyMzY1NHww&ixlib=rb-4.1.0&q=80&w=1080)' }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-medium mb-6 backdrop-blur-sm">
              Next-Gen Smart City Platform
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              UrbanSeva <span className="text-blue-400">AI</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              AI-powered civic issue detection and city risk prediction. Join us in building a smarter, safer future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => onNavigate('report')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-8 py-6 rounded-full shadow-lg shadow-emerald-500/20"
              >
                <Camera className="mr-2 h-5 w-5" />
                Report an Issue
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onNavigate('login')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-6 rounded-full backdrop-blur-sm"
              >
                <User className="mr-2 h-5 w-5" />
                Login / Signup
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">How UrbanSeva Works</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Leveraging advanced computer vision and machine learning to transform urban management.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Camera className="h-10 w-10 text-blue-500" />}
              title="AI Image Detection"
              description="Simply snap a photo. Our AI automatically identifies the issue type (pothole, trash, lighting) and assesses severity."
            />
            <FeatureCard
              icon={<MapPin className="h-10 w-10 text-emerald-500" />}
              title="Real-time Tracking"
              description="Geo-tagged reports are instantly updated on the city map. Track the status of your report from submission to resolution."
            />
            <FeatureCard
              icon={<ShieldAlert className="h-10 w-10 text-purple-500" />}
              title="Predictive Analytics"
              description="Authorities can view high-risk zones and predict infrastructure failures before they happen using historical data trends."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-16 text-center text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10"
              style={{
                // CSS pattern to replace external texture
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '40px 40px'
              }}
            ></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to improve your city?</h2>
              <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-10">
                Join thousands of citizens who are actively contributing to a cleaner, safer, and more efficient urban environment.
              </p>
              <Button
                onClick={() => onNavigate('report')}
                className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-6 rounded-full font-semibold border-none"
              >
                Start Reporting Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardContent className="pt-8 text-center flex flex-col items-center h-full">
        <div className="p-4 bg-slate-50 rounded-full mb-6">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
