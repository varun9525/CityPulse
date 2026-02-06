import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { supabase } from '@/utils/supabaseClient';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import { Loader2, ChevronDown } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('Welcome back!');
      onLoginSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Call our server endpoint which assigns role based on email domain and selection
      await api.signupAdmin(email, password, role);
      
      // Auto login after signup
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      toast.success('Account created successfully!');
      onLoginSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">
            {isSignUp ? 'Create Account' : 'Login'}
          </CardTitle>
          <CardDescription>
            Access CityPulse AI Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {isSignUp ? 'I am a...' : 'Login as...'}
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'citizen' | 'admin')}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                >
                  <option value="citizen">Citizen {isSignUp ? '(Report Issues)' : ''}</option>
                  <option value="admin">City Official {isSignUp ? '(Admin Dashboard)' : ''}</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                placeholder={role === 'admin' ? "admin@city.gov" : "citizen@email.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {isSignUp && role === 'admin' && (
                <p className="text-xs text-amber-600">
                  ⚠️ Admin accounts require verification or .gov/.org email
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
            
            <div className="text-center mt-4">
               <button 
                 type="button"
                 onClick={() => setIsSignUp(!isSignUp)}
                 className="text-sm text-blue-600 hover:underline"
               >
                 {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
               </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
