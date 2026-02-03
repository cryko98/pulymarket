
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { X, Loader2, LogIn, UserPlus } from 'lucide-react';

interface AuthProps {
  onClose: () => void;
}

const Auth: React.FC<AuthProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (mode: 'signIn' | 'signUp') => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signUp') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // With email confirmation disabled, signUp also logs the user in.
        onClose(); 
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

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 md:p-10 relative shadow-2xl text-white border border-slate-700">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-300 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors z-10">
          <X size={20} />
        </button>
        
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold tracking-tighter">Terminal Access</h2>
          <p className="text-blue-400 font-bold uppercase text-xs tracking-widest mt-1">
            Connect with your Email
          </p>
        </div>

        {error && <p className="mb-4 text-center text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}
        {message && <p className="text-center text-green-400 text-xs font-bold bg-green-500/10 p-3 rounded-lg border border-green-500/20">{message}</p>}

        <div className="flex flex-col gap-4">
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
            <div className="flex gap-4 mt-2">
                <button 
                    onClick={() => handleAuth('signIn')} 
                    disabled={loading} 
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-2xl text-base hover:bg-blue-700 transition-all disabled:opacity-50 uppercase tracking-wider"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={16}/> Sign In</>}
                </button>
                <button 
                    onClick={() => handleAuth('signUp')} 
                    disabled={loading} 
                    className="w-full flex items-center justify-center gap-2 bg-slate-700 text-white font-bold py-3 rounded-2xl text-base hover:bg-slate-600 transition-all disabled:opacity-50 uppercase tracking-wider"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <><UserPlus size={16}/> Sign Up</>}
                </button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Auth;
