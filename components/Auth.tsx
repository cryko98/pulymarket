
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { X, Loader2 } from 'lucide-react';
import { signInWithPhantom } from '../services/walletService';
import { PhantomIcon } from './wallet/PhantomIcon';

interface AuthProps {
  onClose: () => void;
}

const Auth: React.FC<AuthProps> = ({ onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [phantomLoading, setPhantomLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhantomLogin = async () => {
    setPhantomLoading(true);
    setError(null);
    try {
      await signInWithPhantom();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet.');
    } finally {
      setPhantomLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 md:p-10 relative shadow-2xl text-white border border-slate-700">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-300 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors">
          <X size={20} />
        </button>
        
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold tracking-tighter">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <p className="text-blue-400 font-bold uppercase text-xs tracking-widest mt-1">
            {isSignUp ? 'To join the terminal' : 'To access terminal features'}
          </p>
        </div>

        <div className="flex flex-col gap-6">
            <button 
              onClick={handlePhantomLogin}
              disabled={phantomLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#512da8] text-white font-bold py-4 rounded-2xl text-lg hover:bg-[#4527a0] transition-all disabled:opacity-50 uppercase tracking-wider shadow-lg"
            >
              {phantomLoading ? <Loader2 className="animate-spin" /> : <><PhantomIcon /> Connect Phantom</>}
            </button>

            <div className="flex items-center gap-4">
                <hr className="flex-1 border-slate-700" />
                <span className="text-slate-500 font-bold text-xs uppercase">OR</span>
                <hr className="flex-1 border-slate-700" />
            </div>

            <div className="flex bg-slate-800 p-1 rounded-full border border-slate-700">
                <button onClick={() => setIsSignUp(false)} className={`flex-1 py-2 rounded-full text-sm font-bold uppercase ${!isSignUp ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                    Sign In
                </button>
                <button onClick={() => setIsSignUp(true)} className={`flex-1 py-2 rounded-full text-sm font-bold uppercase ${isSignUp ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                    Sign Up
                </button>
            </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-6 mt-6">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Email</label>
            <input 
              required 
              type="email" 
              placeholder="you@example.com"
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-medium text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Password</label>
            <input 
              required 
              type="password"
              placeholder="••••••••"
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-medium text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-center text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}
          {message && <p className="text-center text-green-400 text-xs font-bold bg-green-500/10 p-3 rounded-lg border border-green-500/20">{message}</p>}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl text-xl hover:bg-blue-700 transition-all disabled:opacity-50 uppercase tracking-wider shadow-lg shadow-blue-500/20"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
