
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Polymarket Prediction Terminal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  // In a real environment, we'd fetch the specific market data by slug here.
  // For the generator, we build the title from the slug.
  const question = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const yesProb = 86; 
  const totalVotes = 420;
  // Use a generic placeholder or the logo as a fallback if specific market image fetching isn't dynamic here
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
        {/* Header Section with the Specific Card Image */}
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', marginBottom: '40px' }}>
          <img src={brandLogo} style={{ width: '140px', height: '140px', borderRadius: '25px', marginRight: '40px', border: '3px solid rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <h1 style={{ fontSize: '64px', fontWeight: '900', color: '#ffffff', lineHeight: '0.9', fontStyle: 'italic', textTransform: 'uppercase', margin: 0 }}>
              {question}?
            </h1>
          </div>
        </div>

        {/* Sentiment Insight Box */}
        <div style={{ 
            display: 'flex', 
            width: '100%', 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            borderRadius: '50px', 
            padding: '40px', 
            flexDirection: 'column', 
            border: '2px solid rgba(255,255,255,0.1)',
            marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', letterSpacing: '2px', marginBottom: '10px' }}>BULLISH SENTIMENT</span>
              <span style={{ fontSize: '80px', fontWeight: '900', color: '#3b82f6', fontStyle: 'italic' }}>{yesProb}% YES</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '20px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', letterSpacing: '2px', marginBottom: '10px' }}>BEARISH SENTIMENT</span>
              <span style={{ fontSize: '80px', fontWeight: '900', color: '#ef4444', fontStyle: 'italic' }}>{100 - yesProb}% NO</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', width: '100%', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${yesProb}%`, height: '100%', backgroundColor: '#3b82f6' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', width: '100%', marginTop: 'auto', justifyContent: 'space-between', alignItems: 'center', opacity: 0.3 }}>
           <span style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', fontStyle: 'italic' }}>POLYMARKET TERMINAL // LIVE SIGNAL</span>
           <span style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', fontStyle: 'italic' }}>{totalVotes} VOTES VERIFIED</span>
        </div>
      </div>
    ),
    { 
      ...size,
    }
  );
}
