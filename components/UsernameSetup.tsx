
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, Save } from 'lucide-react';

interface UsernameSetupProps {
  onClose: () => void;
}

const updateUsername = async (username: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim(), updated_at: new Date() })
        .eq('id', user.id);
    
    if (error) {
        if (error.code === '23505') { // unique constraint violation
            throw new Error("Username is already taken.");
        }
        throw error;
    }
};


const UsernameSetupModal: React.FC<UsernameSetupProps> = ({ onClose }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (username.trim().length > 15) {
      setError("Username must be 15 characters or less.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateUsername(username);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 md:p-10 relative shadow-2xl text-white border border-slate-700">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter">Welcome!</h2>
          <p className="text-blue-400 font-bold uppercase text-xs tracking-widest mt-1">
            Set up your public username
          </p>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Choose a username..."
            value={username}
            maxLength={15}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-medium text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600"
          />
          {error && <p className="text-center text-red-400 text-xs font-bold bg-red-500/10 p-2 rounded-lg">{error}</p>}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-lg hover:bg-blue-700 transition-all disabled:opacity-50 uppercase tracking-wider shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : <div className="flex items-center justify-center gap-2"><Save size={18} /> Save Username</div>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsernameSetupModal;
