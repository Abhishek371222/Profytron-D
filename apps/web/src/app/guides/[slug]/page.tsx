import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Clock, ArrowRight } from 'lucide-react';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { MarketingSection, MarketingCard } from '@/components/marketing/MarketingPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { BlogArticleBody } from '@/components/blog/BlogArticleBody';
import { GUIDES, getAllGuideSlugs, getGuide } from '@/lib/guides/content';
import { buildPageMetadata, absoluteUrl } from '@/lib/seo/metadata';
import { SITE_URL } from '@/lib/seo/constants';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: 'Guide Not Found' };

  return buildPageMetadata({
    title: guide.title,
    description: guide.desc,
    path: `/guides/${slug}`,
    keywords: [guide.category, 'algo trading guide', 'Profytron guides'],
    type: 'article',
  });
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const related = GUIDES.filter((g) => g.slug !== slug && g.category === guide.category)
    .concat(GUIDES.filter((g) => g.slug !== slug && g.category !== guide.category))
    .slice(0, 2);

  return (
    <PublicPageLayout>
      <JsonLd
        type="article"
        article={{
          title: guide.title,
          description: guide.desc,
          slug: `guides/${slug}`,
          datePublished: new Date().toISOString(),
          readTime: guide.readTime,
        }}
      />
      <JsonLd
        type="breadcrumb"
        breadcrumbs={[
          { name: 'Home', url: SITE_URL },
          { name: 'Guides', url: `${SITE_URL}/guides` },
          { name: guide.title, url: absoluteUrl(`/guides/${slug}`) },
        ]}
      />

      <MarketingSection narrow className="pb-20">
        <article className="max-w-3xl">
          <Breadcrumbs items={[{ label: 'Guides', href: '/guides' }, { label: guide.title }]} />

          <div className="mt-6 mb-8 flex items-center gap-3">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              {guide.category}
            </span>
            <span className="rounded border border-[var(--card-border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {guide.level}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <Clock className="h-3 w-3" />
              {guide.readTime}
            </span>
          </div>

          <h1 className="mb-8 text-3xl font-bold leading-snug tracking-tight text-foreground md:text-4xl">
            {guide.title}
          </h1>

          <BlogArticleBody content={guide.content} />
        </article>

        {related.length > 0 && (
          <div className="mt-16 max-w-3xl border-t border-[var(--card-border)] pt-10">
            <h2 className="mb-5 text-lg font-bold text-foreground">Related guides</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {related.map((g) => (
                <Link key={g.slug} href={`/guides/${g.slug}`} className="group block h-full">
                  <MarketingCard hover className="flex h-full flex-col">
                    <h3 className="mb-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                      {g.title}
                    </h3>
                    <p className="mb-4 flex-1 text-xs leading-relaxed text-muted-foreground">{g.desc}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary/80 transition-colors group-hover:text-primary">
                      Read guide <ArrowRight className="h-3 w-3" />
                    </span>
                  </MarketingCard>
                </Link>
              ))}
            </div>
          </div>
        )}
      </MarketingSection>
    </PublicPageLayout>
  );
}
