import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Clock, ChevronLeft, ArrowRight } from 'lucide-react';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { BlogArticleBody } from '@/components/blog/BlogArticleBody';
import { getAllBlogSlugs, getBlogPost } from '@/lib/blog/posts';
import { buildPageMetadata, absoluteUrl } from '@/lib/seo/metadata';
import { SITE_URL } from '@/lib/seo/constants';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: 'Article Not Found' };

  return buildPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    keywords: [post.category, 'algo trading', 'Profytron blog'],
    type: 'article',
    publishedTime: new Date(post.date).toISOString(),
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const related = getAllBlogSlugs()
    .filter((s) => s !== slug)
    .slice(0, 2)
    .map((s) => getBlogPost(s)!)
    .filter(Boolean);

  return (
    <PublicPageLayout>
      <JsonLd
        type="article"
        article={{
          title: post.title,
          description: post.excerpt,
          slug,
          datePublished: new Date(post.date).toISOString(),
          readTime: post.readTime,
        }}
      />
      <JsonLd
        type="breadcrumb"
        breadcrumbs={[
          { name: 'Home', url: SITE_URL },
          { name: 'Blog', url: `${SITE_URL}/blog` },
          { name: post.title, url: absoluteUrl(`/blog/${slug}`) },
        ]}
      />

      <main className="min-h-screen px-6 py-24">
        <article className="mx-auto max-w-3xl">
          <Breadcrumbs
            items={[
              { label: 'Blog', href: '/blog' },
              { label: post.title },
            ]}
          />

          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6 mb-8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
            Back to Blog
          </Link>

          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span
                className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${post.tag}`}
              >
                {post.category}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" aria-hidden />
                {post.readTime}
              </span>
              <time className="text-xs text-muted-foreground" dateTime={new Date(post.date).toISOString()}>
                {post.date}
              </time>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
          </header>

          <div className="h-px bg-[var(--card-border)] mb-10" />

          <BlogArticleBody content={post.content} />

          {related.length > 0 && (
            <section className="mt-16 pt-10 border-t border-[var(--card-border)]" aria-labelledby="related-articles">
              <h2 id="related-articles" className="text-xl font-bold text-foreground mb-6">
                Related articles
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/blog/${item.id}`}
                    className="group rounded-2xl border border-[var(--card-border)] bg-card p-5 hover:border-primary/25 transition-colors"
                  >
                    <p className="text-xs font-semibold text-primary mb-2">{item.category}</p>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
                      {item.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground group-hover:text-primary">
                      Read more <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
    </PublicPageLayout>
  );
}
