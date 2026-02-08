import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { ReportIssue } from './components/ReportIssue2';
import { ComplaintStatus } from './components/ComplaintStatus';
import { CityMap } from './components/CityMap';
import { AdminDashboard } from './components/AdminDashboard';
import { PredictionDashboard } from './components/PredictionDashboard';
import { Login } from './components/Login';
import { MyReports } from './components/MyReports';
import { Toaster, toast } from 'sonner';
import { supabase } from './utils/supabaseClient';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (page: string) => {
    // If user is not logged in and tries to access restricted pages, redirect to login
    const restrictedPages = ['report', 'status', 'map', 'admin', 'predictions', 'my-reports'];
    if (restrictedPages.includes(page) && !session) {
      if (page !== 'login') {
        toast.info("Please login to access this feature");
        setCurrentPage('login');
        return;
      }
    }

    if (page === 'admin' && !session) {
      setCurrentPage('login');
    } else {
      setCurrentPage(page);
    }
    window.scrollTo(0, 0);
  };

  const handleReportSuccess = () => {
    if (session) {
      handleNavigate('my-reports');
    } else {
      handleNavigate('status');
    }
  };

  const handleLoginSuccess = () => {
    if (isAdmin()) {
      handleNavigate('admin');
    } else {
      handleNavigate('my-reports');
    }
  };

  const isAdmin = () => {
    if (!session?.user) return false;
    const email = session.user.email || '';
    // Role check from metadata or email domain for demo
    return (
      session.user.user_metadata?.role === 'admin' ||
      email.endsWith('.gov') ||
      email.endsWith('.org') ||
      email === 'admin@citypulse.ai'
    );
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'report':
        return <ReportIssue onSuccess={handleReportSuccess} />;
      case 'status':
        return <ComplaintStatus />;
      case 'my-reports':
        return <MyReports onNavigate={handleNavigate} />;
      case 'map':
        return <CityMap />;
      case 'admin':
        if (!session) return <Login onLoginSuccess={handleLoginSuccess} />;
        if (!isAdmin()) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
              <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
              <p className="text-slate-600 max-w-md mb-6">
                The Administrator Dashboard is restricted to authorized municipal and government personnel only.
              </p>
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                Sign Out
              </button>
            </div>
          );
        }
        return <AdminDashboard />;
      case 'predictions':
        return <PredictionDashboard />;
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="antialiased text-slate-900 bg-white">
      <ErrorBoundary>
        <Layout currentPage={currentPage} onNavigate={handleNavigate}>
          {renderPage()}
        </Layout>
      </ErrorBoundary>
      <Toaster position="top-center" />
    </div>
  );
}
