
import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const alt = 'Polymarket Prediction Terminal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BRAND_LOGO = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

// Ebben a környezetben az Edge function közvetlenül lekéri az adatokat a Supabase-ből a slug alapján
async function getMarketBySlug(slug: string) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Mivel a slug a kérdésből készül, megpróbáljuk visszafejteni vagy keresni
  // Ebben a demóban feltételezzük, hogy a Supabase-ben van egy slug mező, 
  // vagy a kérdésre szűrünk (egyszerűsített logika)
  const { data } = await supabase
    .from('markets')
    .select('*')
    .order('created_at', { ascending: false });

  if (!data) return null;

  // Slug matching logic (kliens oldali slugify-val megegyezően)
  const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-').substring(0, 50);
  
  return data.find(m => slugify(m.question) === slug) || data[0];
}

export default async function Image({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const market = await getMarketBySlug(slug);

  const question = market ? market.question : slug.split('-').join(' ').toUpperCase();
  const image = market?.image || BRAND_LOGO;
  const yesVotes = market?.yes_votes || 0;
  const noVotes = market?.no_votes || 0;
  const total = yesVotes + noVotes;
  const yesProb = total === 0 ? 50 : Math.round((yesVotes / total) * 100);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0f1d',
          padding: '50px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }}>
          
          {/* Left Side: The Specific Market Image */}
          <div style={{ display: 'flex', width: '400px', height: '100%', paddingRight: '40px' }}>
             <img 
               src={image} 
               style={{ 
                 width: '100%', 
                 height: '100%', 
                 objectFit: 'cover', 
                 borderRadius: '30px', 
                 border: '4px solid rgba(255,255,255,0.1)',
                 boxShadow: '0 20px 50px rgba(0,0,0,0.5)' 
               }} 
             />
          </div>

          {/* Right Side: Market Info Box */}
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#3b82f6', fontStyle: 'italic', letterSpacing: '4px' }}>TERMINAL SIGNAL ANALYSIS</span>
            </div>
            
            <h1 style={{ fontSize: '56px', fontWeight: '900', color: '#ffffff', lineHeight: '1.0', fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '30px' }}>
              {question}?
            </h1>

            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                backgroundColor: 'rgba(255,255,255,0.03)', 
                borderRadius: '40px', 
                padding: '35px', 
                border: '1px solid rgba(255,255,255,0.1)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>BULLISH</span>
                  <span style={{ fontSize: '64px', fontWeight: '900', color: '#3b82f6', fontStyle: 'italic' }}>{yesProb}% YES</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>BEARISH</span>
                  <span style={{ fontSize: '64px', fontWeight: '900', color: '#ef4444', fontStyle: 'italic' }}>{100 - yesProb}% NO</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', width: '100%', height: '14px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '7px', overflow: 'hidden' }}>
                <div style={{ width: `${yesProb}%`, height: '100%', backgroundColor: '#3b82f6' }} />
              </div>

              <div style={{ display: 'flex', marginTop: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: '18px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{total} VERIFIED VOTES ON SOLANA</span>
                 <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#10b981', marginRight: '8px' }} />
                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#10b981' }}>LIVE ORACLE</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div style={{ display: 'flex', width: '100%', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', justifyContent: 'space-between' }}>
           <span style={{ fontSize: '16px', fontWeight: '900', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>POLYMARKET TERMINAL v5.2</span>
           <span style={{ fontSize: '16px', fontWeight: '900', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>BROADCAST_ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
        </div>
      </div>
    ),
    { 
      ...size,
    }
  );
}
