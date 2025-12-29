
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Polymarket Prediction Terminal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  const question = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Simulated stats for the preview
  const yesProb = 86; 
  const totalVotes = 420;
  const brandLogo = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0f1d',
          padding: '60px',
        }}
      >
        {/* Header Section */}
        <div style={{ display: 'flex', width: '100%', alignItems: 'flex-start', marginBottom: '40px' }}>
          <img src={brandLogo} style={{ width: '100px', height: '100px', borderRadius: '20px', marginRight: '30px', border: '2px solid rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <h1 style={{ fontSize: '56px', fontWeight: '900', color: '#ffffff', lineHeight: '0.9', fontStyle: 'italic', textTransform: 'uppercase', margin: 0 }}>
              {question}?
            </h1>
          </div>
        </div>

        {/* Sentiment Box */}
        <div style={{ 
            display: 'flex', 
            width: '100%', 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            borderRadius: '40px', 
            padding: '40px', 
            flexDirection: 'column', 
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '18px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', letterSpacing: '2px', marginBottom: '10px' }}>BULLISH SENTIMENT</span>
              <span style={{ fontSize: '72px', fontWeight: '900', color: '#3b82f6', fontStyle: 'italic' }}>{yesProb}% YES</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '18px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', letterSpacing: '2px', marginBottom: '10px' }}>BEARISH SENTIMENT</span>
              <span style={{ fontSize: '72px', fontWeight: '900', color: '#ef4444', fontStyle: 'italic' }}>{100 - yesProb}% NO</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', width: '100%', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden', marginBottom: '40px' }}>
            <div style={{ width: `${yesProb}%`, height: '100%', backgroundColor: '#3b82f6' }} />
          </div>

          {/* Simulated Graph Line */}
          <div style={{ display: 'flex', width: '100%', height: '60px', position: 'relative' }}>
             <svg width="100%" height="100%" viewBox="0 0 1000 60" style={{ overflow: 'visible' }}>
                <path d="M0,45 L100,35 L200,50 L300,40 L400,30 L500,45 L600,35 L700,20 L800,40 L900,30 L1000,25" fill="none" stroke="#10b981" strokeWidth="4" />
             </svg>
             <span style={{ position: 'absolute', top: '-10px', right: '0', fontSize: '12px', fontWeight: '900', color: '#10b981', opacity: 0.4 }}>SENTIMENT TREND</span>
          </div>
        </div>

        {/* Footer Info */}
        <div style={{ display: 'flex', width: '100%', marginTop: 'auto', justifyContent: 'space-between', alignItems: 'center', opacity: 0.3 }}>
           <span style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', fontStyle: 'italic' }}>GLOBAL FEED // TERMINAL_ACTIVE</span>
           <span style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', fontStyle: 'italic' }}>{totalVotes} VERIFIED SIGNALS</span>
        </div>
      </div>
    ),
    { 
      ...size,
    }
  );
}
