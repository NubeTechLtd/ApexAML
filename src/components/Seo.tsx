import { Helmet } from 'react-helmet-async';

const SITE = 'https://apexaml.com';

interface SeoProps {
  title: string;
  description: string;
  path: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Per-route SEO head. Sets title, description, canonical, og:* and
 * optional JSON-LD. Sitewide og:image stays in index.html as the
 * fallback for non-JS social crawlers.
 */
export function Seo({ title, description, path, jsonLd }: SeoProps) {
  const url = `${SITE}${path}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(b)}
        </script>
      ))}
    </Helmet>
  );
}
