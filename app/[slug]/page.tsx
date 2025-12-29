import { Metadata } from 'next';
import { headers } from 'next/headers';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const headerList = headers();
  const host = headerList.get('host') || 'polymarket.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const domain = `${protocol}://${host}`;

  const question = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const title = `${question}? | POLYMARKET`;
  const description = `Analyze the sentiment and bet on "${question}" live on the Polymarket terminal.`;
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
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    icons: {
      icon: "https://img.cryptorank.io/coins/polymarket1671006384460.png",
    }
  };
}

export default function Page({ params }: Props) {
  const favicon = "https://img.cryptorank.io/coins/polymarket1671006384460.png";
  
  return (
    <html>
      <head>
        <link rel="icon" type="image/png" href={favicon} />
        <link rel="shortcut icon" type="image/png" href={favicon} />
        <script dangerouslySetInnerHTML={{
          __html: `window.location.href = "/#live-market:${params.slug}";`
        }} />
        <meta httpEquiv="refresh" content={`0;url=/#live-market:${params.slug}`} />
      </head>
      <body style={{ backgroundColor: '#1d4ed8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0, fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontWeight: '900', fontStyle: 'italic', fontSize: '2.5rem', marginBottom: '1rem' }}>POLYMARKET</h1>
          <div style={{ width: '40px', height: '40px', border: '4px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: '1rem', fontWeight: 'bold', opacity: 0.8 }}>CONNECTING TO TERMINAL...</p>
        </div>
      </body>
    </html>
  );
}