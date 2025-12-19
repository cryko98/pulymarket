
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Pulymerket Prediction';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Mock function - in a real Next.js environment, this would fetch from Supabase
// mimicking the logic from marketService.ts
async function getMerketData(slug: string) {
  // Normally we would fetch from Supabase here. For the generator, we'll parse the slug or fetch.
  // This is a placeholder for the logic.
  return {
    question: slug.split('-').join(' ').toUpperCase(),
    yesProb: 65, // Dynamic values would come from DB
    votes: 420,
    image: "https://pbs.twimg.com/media/G8b8OArXYAAkpHf?format=jpg&name=medium"
  };
}

export default async function Image({ params }: { params: { slug: string } }) {
  const data = await getMerketData(params.slug);

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
          backgroundColor: '#fff',
          padding: '40px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Left Side: Subject Image */}
        <div style={{ display: 'flex', width: '45%', height: '100%', padding: '20px' }}>
          <img
            src={data.image}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '40px',
              border: '8px solid #000',
              boxShadow: '20px 20px 0px #2563eb',
            }}
          />
        </div>

        {/* Right Side: Market Card Info */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '55%', paddingLeft: '40px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb', letterSpacing: '2px' }}>PULYMERKET TERMINAL</span>
          </div>
          
          <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#000', lineHeight: '1.1', marginBottom: '30px', textTransform: 'uppercase', fontStyle: 'italic' }}>
            {data.question}
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', background: '#f3f4f6', padding: '30px', borderRadius: '30px', border: '4px solid #000' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1d4ed8' }}>BULLISH</span>
                <span style={{ fontSize: '42px', fontWeight: '900', color: '#2563eb' }}>{data.yesProb}%</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#b91c1c' }}>BEARISH</span>
                <span style={{ fontSize: '42px', fontWeight: '900', color: '#ef4444' }}>{100 - data.yesProb}%</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', width: '100%', height: '20px', background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden', border: '2px solid #000' }}>
              <div style={{ width: `${data.yesProb}%`, height: '100%', background: '#2563eb' }} />
            </div>

            <div style={{ display: 'flex', marginTop: '20px', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#6b7280' }}>{data.votes} VOTES VERIFIED BY ORACLE</span>
            </div>
          </div>

          <div style={{ display: 'flex', marginTop: '30px' }}>
             <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#9ca3af' }}>SOLANA NETWORK // CA: C1JS...pump</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
