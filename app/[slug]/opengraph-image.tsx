
import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const alt = 'Polymarket Prediction Terminal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BRAND_LOGO = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

async function getMarketBySlug(slug: string) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data } = await supabase
    .from('markets')
    .select('*');

  if (!data) return null;

  const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-').substring(0, 50);
  
  return data.find(m => slugify(m.question) === slug) || data[0];
}

export default async function Image({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const market = await getMarketBySlug(slug);

  const image = market?.image || BRAND_LOGO;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          backgroundColor: '#0a0f1d',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <img 
          src={image} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
          }} 
        />
      </div>
    ),
    { 
      ...size,
    }
  );
}
