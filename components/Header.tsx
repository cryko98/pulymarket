
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface HeaderProps {
  onLogoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  const [copied, setCopied] = useState(false);
  const ca = "xxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  const logoUrl = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

  const handleCopy = () => {
    navigator.clipboard.writeText(ca);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo & Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onLogoClick}>
            <div className="w-10 h-10 rounded-full border-2 border-slate-700 overflow-hidden shadow-lg bg-slate-800">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-tighter text-slate-100 uppercase">
                Polymarket
            </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
            
            {/* Contract Address Box */}
            <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full pl-4 pr-1 py-1 shadow-inner">
                <span className="text-slate-400 text-sm font-bold">CA:</span>
                <span className="text-slate-200 text-sm font-mono font-medium truncate max-w-[150px]">{ca}</span>
                <button 
                    onClick={handleCopy}
                    className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors shadow-sm border border-slate-700"
                    title="Copy Address"
                >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-slate-300" />}
                </button>
            </div>

            {/* Follow on X Link */}
            <a 
                href="https://x.com" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-full transition-all group shadow-md font-bold text-sm border border-slate-700"
                title="Follow us"
            >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="hidden sm:inline">Follow</span>
            </a>
        </div>
      </div>
      
      {/* Mobile CA bar */}
      <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-2 flex justify-between items-center">
        <span className="text-xs font-mono text-slate-300 truncate mr-2">{ca}</span>
        <button onClick={handleCopy} className="text-slate-300">
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
