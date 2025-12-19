
import { Metadata } from 'next';

type Props = {
  params: { slug: string };
};

// This helps the Twitter crawler see the absolute URL of the image
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const question = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const title = `${question}? | PULYMERKET`;
  const description = `Live sentiment: ${68}% Bullish. Join the merket and cast your vote on the Solana blockchain.`;
  
  // Use a fallback domain if process.env.VERCEL_URL is not available
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'https://pulymerket.com';
  const imageUrl = `${domain}/${slug}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${domain}/${slug}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      site: '@pulymerket',
      creator: '@pulymerket',
    },
  };
}

export default function Page({ params }: Props) {
  return (
    <html>
      <head>
        {/* Instant client-side redirect for human users */}
        <script dangerouslySetInnerHTML={{
          __html: `window.location.href = "/#live-market:${params.slug}";`
        }} />
        {/* Fallback redirect for browsers without JS or slow execution */}
        <meta httpEquiv="refresh" content={`0;url=/#live-market:${params.slug}`} />
      </head>
      <body style={{ 
        backgroundColor: '#1d4ed8', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        margin: 0,
        fontFamily: 'system-ui, sans-serif' 
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            border: '4px solid white', 
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h1 style={{ fontWeight: '900', fontStyle: 'italic', fontSize: '2rem', margin: '0' }}>PULYMERKET</h1>
          <p style={{ opacity: 0.7, fontWeight: 'bold' }}>ACCESSING TERMINAL...</p>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin { to { transform: rotate(360deg); } }
          `}} />
        </div>
      </body>
    </html>
  );
}
