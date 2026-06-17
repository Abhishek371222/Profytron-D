'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/blog/posts';

const posts = BLOG_POSTS;

export default function BlogPage() {
  return (
    <PublicPageLayout>
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary/8 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-foreground/3 border border-border text-foreground/50 text-micro font-bold tracking-[0.4em] uppercase mb-8">
              <BookOpen className="w-3 h-3 text-primary" /> Signal_Log
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-[-0.03em] text-foreground leading-[1] mb-6">
              The Profytron<br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-chart-5">Blog.</span>
            </h1>
            <p className="text-lg text-foreground/50 max-w-xl font-medium leading-relaxed">
              Technical writing on algo trading, market microstructure, and the AI powering modern execution.
            </p>
            <div className="flex items-center gap-2 mt-5 text-foreground/20 text-xs font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-chart-3/60" />
              {posts.length} articles published
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-10">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Link
              href={`/blog/${posts[0].id}`}
              className="block w-full text-left group relative p-10 md:p-12 rounded-3xl bg-linear-to-br from-primary/10 to-primary/0 border border-primary/20 hover:border-primary/40 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <span className={`px-3 py-1 rounded-full border text-micro font-bold uppercase tracking-widest ${posts[0].tag}`}>
                    {posts[0].category}
                  </span>
                  <span className="text-foreground/25 text-xs font-mono flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />{posts[0].readTime}
                  </span>
                  <span className="text-foreground/25 text-xs font-mono">{posts[0].date}</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-5 group-hover:text-primary transition-colors leading-snug">
                  {posts[0].title}
                </h2>
                <p className="text-foreground/55 leading-relaxed mb-8 text-base">{posts[0].excerpt}</p>
                <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                  Read Article <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {posts.slice(1).map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  href={`/blog/${post.id}`}
                  className="text-left group p-8 rounded-2xl bg-foreground/2 border border-border hover:border-primary/30 hover:bg-foreground/4 transition-all flex flex-col h-full"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className={`px-2.5 py-1 rounded-full border text-micro font-bold uppercase tracking-widest ${post.tag}`}>
                      {post.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground text-xl leading-snug mb-3 group-hover:text-primary transition-colors flex-1">
                    {post.title}
                  </h3>
                  <p className="text-foreground/40 text-sm leading-relaxed mb-6 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-foreground/25 font-mono border-t border-border pt-4">
                    <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{post.readTime}</div>
                    <span>{post.date}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
