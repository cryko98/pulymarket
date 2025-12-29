
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Polymarket Prediction';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  const question = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Simulated live stats
  const yesProb = 72; 
  const totalVotes = 1524;
  const brandLogo = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          padding: '50px',
        }}
      >
        {/* Main Subject Image Container */}
        <div style={{ display: 'flex', width: '45%', height: '100%' }}>
          <img
            src={brandLogo}
            style={{
              width: '100%',
              height: '530px',
              objectFit: 'cover',
              borderRadius: '35px',
              border: '10px solid #000000',
              boxShadow: '30px 30px 0px #2563eb',
            }}
          />
        </div>

        {/* Info Card Container */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          width: '55%', 
          paddingLeft: '60px', 
          justifyContent: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ 
              width: '15px', 
              height: '15px', 
              borderRadius: '50%', 
              backgroundColor: '#22c55e', 
              marginRight: '12px',
              boxShadow: '0 0 10px #22c55e' 
            }} />
            <span style={{ 
              fontSize: '22px', 
              fontWeight: '900', 
              color: '#2563eb', 
              letterSpacing: '4px', 
              textTransform: 'uppercase' 
            }}>
              LIVE PREDICTION TERMINAL
            </span>
          </div>
          
          <h1 style={{ 
            fontSize: '56px', 
            fontWeight: '900', 
            color: '#000000', 
            lineHeight: '1.0', 
            marginBottom: '35px', 
            textTransform: 'uppercase', 
            fontStyle: 'italic',
            letterSpacing: '-2px'
          }}>
            {question}?
          </h1>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            width: '100%', 
            background: '#f8fafc', 
            padding: '40px', 
            borderRadius: '45px', 
            border: '6px solid #000000',
            boxShadow: '12px 12px 0px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#1e40af', marginBottom: '5px' }}>BULLISH</span>
                <span style={{ fontSize: '64px', fontWeight: '900', color: '#2563eb', lineHeight: '1' }}>{yesProb}%</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#991b1b', marginBottom: '5px' }}>BEARISH</span>
                <span style={{ fontSize: '64px', fontWeight: '900', color: '#ef4444', lineHeight: '1' }}>{100 - yesProb}%</span>
              </div>
            </div>
            
            {/* Visual Progress Bar */}
            <div style={{ 
              display: 'flex', 
              width: '100%', 
              height: '30px', 
              background: '#e2e8f0', 
              borderRadius: '15px', 
              overflow: 'hidden', 
              border: '4px solid #000000' 
            }}>
              <div style={{ width: `${yesProb}%`, height: '100%', background: '#2563eb' }} />
              <div style={{ width: `${100 - yesProb}%`, height: '100%', background: '#ef4444' }} />
            </div>

            <div style={{ 
              display: 'flex', 
              marginTop: '30px', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#475569' }}>{totalVotes} REGISTERED VOTES</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#2563eb' }}>VERIFIED ORACLE ✓</span>
            </div>
          </div>

          <div style={{ display: 'flex', marginTop: '40px', justifyContent: 'space-between', opacity: 0.5 }}>
             <span style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px' }}>SOLANA NETWORK // $POLY</span>
             <span style={{ fontSize: '16px', fontWeight: 'bold' }}>POLYMARKET.COM</span>
          </div>
        </div>
      </div>
    ),
    { 
      ...size,
    }
  );
}
