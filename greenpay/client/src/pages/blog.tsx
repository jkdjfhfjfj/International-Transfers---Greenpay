import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowUpRight, Calendar, FileText, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  externalUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  publishedAt?: string | null;
  createdAt: string;
};

function BlogMedia({ blog }: { blog: Blog }) {
  if (!blog.mediaUrl) {
    return <div className="flex h-56 items-center justify-center bg-primary/5 text-primary"><FileText className="h-10 w-10" /></div>;
  }
  return blog.mediaType === "video"
    ? <video src={blog.mediaUrl} controls playsInline className="max-h-[28rem] w-full bg-black object-contain" />
    : <img src={blog.mediaUrl} alt={blog.title} className="max-h-[28rem] w-full object-cover" />;
}

export default function BlogPage() {
  const [, detailParams] = useRoute<{ slug: string }>("/blog/:slug");
  const slug = detailParams?.slug;
  const { data, isLoading, isError } = useQuery<{ blogs?: Blog[]; blog?: Blog }>({
    queryKey: slug ? ["/api/blogs", slug] : ["/api/blogs"],
    queryFn: async () => (await apiRequest("GET", slug ? `/api/blogs/${slug}` : "/api/blogs")).json(),
  });

  const blog = data?.blog;
  const canonical = `${window.location.origin}${slug ? `/blog/${slug}` : "/blog"}`;

  if (slug) {
    if (isLoading) return <LoadingState />;
    if (isError || !blog) {
      return <EmptyState title="Blog not found" description="This blog may have been unpublished or moved." />;
    }
    const title = blog.seoTitle || blog.title;
    const description = blog.seoDescription || blog.excerpt || blog.content.slice(0, 160);
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Helmet>
          <title>{title} | GreenPay</title>
          <meta name="description" content={description} />
          {blog.seoKeywords && <meta name="keywords" content={blog.seoKeywords} />}
          <link rel="canonical" href={canonical} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={canonical} />
          {blog.mediaUrl && <meta property="og:image" content={blog.mediaUrl} />}
        </Helmet>
        <div className="mx-auto max-w-3xl px-5 py-8 md:py-14">
          <a href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" />All blogs</a>
          <article className="mt-8 overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
            <BlogMedia blog={blog} />
            <div className="p-6 md:p-10">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">{blog.title}</h1>
              {blog.excerpt && <p className="mt-4 text-lg leading-8 text-muted-foreground">{blog.excerpt}</p>}
              <div className="mt-8 whitespace-pre-wrap text-base leading-8 text-foreground">{blog.content}</div>
              {blog.externalUrl && <a href={blog.externalUrl} target="_blank" rel="noreferrer"><Button className="mt-8 gap-2">Learn more <ArrowUpRight className="h-4 w-4" /></Button></a>}
            </div>
          </article>
        </div>
      </main>
    );
  }

  const blogs = data?.blogs || [];
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>GreenPay Blog</title>
        <meta name="description" content="Money movement, digital finance, and account tips from GreenPay." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <div className="mx-auto max-w-5xl px-5 py-10 md:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">GreenPay insights</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Money made clearer</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">Practical guidance for sending, receiving, and managing money across borders.</p>
        </div>
        {isLoading ? <LoadingState /> : blogs.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">New articles are coming soon.</div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {blogs.map(item => (
              <a key={item.id} href={`/blog/${item.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className="overflow-hidden">
                  {item.mediaUrl && item.mediaType === "video"
                    ? <div className="flex h-52 items-center justify-center bg-black text-white"><Video className="h-8 w-8" /></div>
                    : item.mediaUrl
                      ? <img src={item.mediaUrl} alt={item.title} className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      : <div className="flex h-52 items-center justify-center bg-primary/5 text-primary"><FileText className="h-10 w-10" /></div>}
                </div>
                <div className="p-5">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{new Date(item.publishedAt || item.createdAt).toLocaleDateString()}</p>
                  <h2 className="mt-2 text-xl font-semibold group-hover:text-primary">{item.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.excerpt || item.content}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function LoadingState() {
  return <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 text-center"><FileText className="h-10 w-10 text-primary" /><h1 className="mt-4 text-2xl font-bold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p><a href="/blog" className="mt-5"><Button variant="outline">Back to blogs</Button></a></div>;
}