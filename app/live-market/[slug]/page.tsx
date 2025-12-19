
import { Metadata } from 'next';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const title = params.slug.split('-').join(' ').toUpperCase();
  const description = "Live prediction market for " + title + ". Cast your vote on Pulymerket.";
  
  return {
    title: `PULYMERKET | ${title}`,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Pulymerket',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function Page({ params }: Props) {
  // This page just redirects or serves as the SEO entry point
  // The actual app logic is in the root index.tsx
  return null;
}
