import React, { useState, useEffect } from 'react';
import { Menu, X, LayoutDashboard, AlertCircle, FileText, Activity, ShieldCheck, Map, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/utils/supabaseClient';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
         checkAdmin(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
         checkAdmin(session.user);
      } else {
         setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = (user: any) => {
     const email = user.email || '';
     const isAdm = user.user_metadata?.role === 'admin' || 
                   email.endsWith('.gov') || 
                   email.endsWith('.org') || 
                   email === 'admin@citypulse.ai';
     setIsAdmin(isAdm);
  };

  const navItems = [
    { name: 'Home', id: 'home', icon: Activity, public: true },
    { name: 'Report Issue', id: 'report', icon: AlertCircle, public: false, requiresUser: true },
    { name: 'Track Status', id: 'status', icon: FileText, public: false, requiresUser: true },
    { name: 'City Map', id: 'map', icon: Map, public: false, requiresUser: true },
    { name: 'My Reports', id: 'my-reports', icon: User, public: false, requiresUser: true },
    { name: 'Admin', id: 'admin', icon: LayoutDashboard, public: false, requiresAdmin: true },
    { name: 'Predictions', id: 'predictions', icon: ShieldCheck, public: false, requiresAdmin: true },
  ];

  const visibleNavItems = navItems.filter(item => {
     if (item.public) return true;
     if (item.requiresAdmin && isAdmin) return true;
     if (item.requiresUser && user && !isAdmin) return true;
     return false;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
              <Activity className="h-8 w-8 text-blue-600 mr-2" />
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-slate-900">CityPulse AI</span>
                <span className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider">Smart City OS</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-1 items-center">
              {visibleNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.name}
                </button>
              ))}
              <div className="ml-4 pl-4 border-l border-slate-200">
                {user ? (
                   <button 
                      onClick={() => {
                         supabase.auth.signOut();
                         onNavigate('home');
                      }}
                      className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                   >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                   </button>
                ) : (
                   <button 
                      onClick={() => onNavigate('login')}
                      className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
                   >
                      Login
                   </button>
                )}
              </div>
            </nav>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {visibleNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium ${
                      currentPage === item.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </button>
                ))}
                {user ? (
                   <button
                     onClick={() => {
                        supabase.auth.signOut();
                        onNavigate('home');
                        setIsMobileMenuOpen(false);
                     }}
                     className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                   >
                     <LogOut className="h-5 w-5 mr-3" />
                     Logout
                   </button>
                ) : (
                   <button
                     onClick={() => {
                        onNavigate('login');
                        setIsMobileMenuOpen(false);
                     }}
                     className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50"
                   >
                     <User className="h-5 w-5 mr-3" />
                     Login
                   </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Activity className="h-6 w-6 text-blue-500 mr-2" />
                <span className="font-bold text-lg text-white">CityPulse AI</span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm">
                Empowering citizens and authorities with AI-driven insights for a safer, cleaner, and smarter city.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => onNavigate('report')} className="hover:text-white transition-colors">Report Issue</button></li>
                <li><button onClick={() => onNavigate('map')} className="hover:text-white transition-colors">Live Map</button></li>
                <li><button onClick={() => onNavigate('predictions')} className="hover:text-white transition-colors">Risk Analytics</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Emergency Contacts</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
            &copy; 2026 CityPulse AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
