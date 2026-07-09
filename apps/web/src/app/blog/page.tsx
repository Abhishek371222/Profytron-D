'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import {
  MarketingHero,
  MarketingSection,
  MarketingCard,
} from '@/components/marketing/MarketingPage';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/blog/posts';

const posts = BLOG_POSTS;

export default function BlogPage() {
  return (
    <PublicPageLayout>
      <MarketingHero
        eyebrow="Signal Log"
        eyebrowIcon={BookOpen}
        title="The Profytron"
        titleAccent="Blog."
        description="Technical writing on algo trading, market microstructure, and the AI powering modern execution."
        meta={
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-chart-3/60" />
            {posts.length} articles published
          </div>
        }
      />

      <MarketingSection>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Link href={`/blog/${posts[0].id}`} className="group block">
            <MarketingCard
              hover
              className="relative overflow-hidden border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_10%,transparent),transparent)] p-10 md:p-12"
            >
              <div className="pointer-events-none absolute top-0 right-0 h-[300px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
              <div className="relative z-10 max-w-2xl">
                <div className="mb-6 flex items-center gap-4">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${posts[0].tag}`}>
                    {posts[0].category}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {posts[0].readTime}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{posts[0].date}</span>
                </div>
                <h2 className="mb-5 text-3xl font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary md:text-4xl">
                  {posts[0].title}
                </h2>
                <p className="mb-8 text-base leading-relaxed text-muted-foreground">{posts[0].excerpt}</p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all group-hover:gap-3">
                  Read Article <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </MarketingCard>
          </Link>
        </motion.div>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {posts.slice(1).map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Link href={`/blog/${post.id}`} className="group block h-full">
                <MarketingCard hover className="flex h-full flex-col">
                  <div className="mb-5 flex items-center gap-3">
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${post.tag}`}>
                      {post.category}
                    </span>
                  </div>
                  <h3 className="mb-3 flex-1 text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                  <div className="flex items-center justify-between border-t border-[var(--card-border)] pt-4 text-xs font-mono text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </div>
                    <span>{post.date}</span>
                  </div>
                </MarketingCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </MarketingSection>
    </PublicPageLayout>
  );
}
