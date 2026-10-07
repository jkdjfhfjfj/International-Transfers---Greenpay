import { useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Calendar, ExternalLink, FileText, Image as ImageIcon, Link as LinkIcon,
  Loader2, Newspaper, Pencil, Plus, Save, Trash2, Video,
} from "lucide-react";

type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  externalUrl?: string | null;
  status?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  createdAt: string;
};

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  mediaUrl: "",
  mediaType: "none",
  externalUrl: "",
  status: "draft",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
};

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "-");
}

function makeDescription(excerpt: string, content: string) {
  const source = (excerpt || content).replace(/\s+/g, " ").trim();
  return source.length > 160 ? `${source.slice(0, 157).trim()}...` : source;
}

export default function AdminBlogsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery<{ blogs: Blog[] }>({
    queryKey: ["/api/admin/blogs"],
    queryFn: async () => (await apiRequest("GET", "/api/admin/blogs")).json(),
  });

  const blogs = data?.blogs || [];
  const previewSlug = useMemo(() => slugify(form.slug || form.title), [form.slug, form.title]);

  const updateField = (key: keyof typeof emptyForm, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const generateSeo = () => {
    const description = makeDescription(form.excerpt, form.content);
    updateField("seoTitle", form.title.trim());
    updateField("seoDescription", description);
    updateField("seoKeywords", form.title.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8).join(", "));
    toast({ title: "SEO fields generated", description: "Review the metadata before publishing." });
  };

  const uploadMedia = async (file: File) => {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch("/api/admin/blogs/upload-media", {
        method: "POST",
        credentials: "include",
        body,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Upload failed");
      setForm(current => ({ ...current, mediaUrl: result.url, mediaType: result.type }));
      toast({ title: "Media uploaded", description: "The media is attached to this blog." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message || "Could not upload media.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt || makeDescription("", form.content),
        seoTitle: form.seoTitle || form.title,
        seoDescription: form.seoDescription || makeDescription(form.excerpt, form.content),
        seoKeywords: form.seoKeywords || form.title.toLowerCase(),
        mediaUrl: form.mediaUrl || null,
        externalUrl: form.externalUrl || null,
      };
      const response = await apiRequest(editingId ? "PUT" : "POST", editingId ? `/api/admin/blogs/${editingId}` : "/api/admin/blogs", payload);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: editingId ? "Blog updated" : "Blog created", description: "The blog has been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blogs"] });
      resetForm();
    },
    onError: (error: any) => toast({ title: "Could not save blog", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await apiRequest("DELETE", `/api/admin/blogs/${id}`, {})).json(),
    onSuccess: () => {
      toast({ title: "Blog deleted", description: "The blog link is no longer public." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blogs"] });
    },
    onError: (error: any) => toast({ title: "Could not delete blog", description: error.message, variant: "destructive" }),
  });

  const editBlog = (blog: Blog) => {
    setEditingId(blog.id);
    setForm({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || "",
      content: blog.content,
      mediaUrl: blog.mediaUrl || "",
      mediaType: blog.mediaType || "none",
      externalUrl: blog.externalUrl || "",
      status: blog.status || "draft",
      seoTitle: blog.seoTitle || "",
      seoDescription: blog.seoDescription || "",
      seoKeywords: blog.seoKeywords || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AdminShell title="Blogs">
      <div className="max-w-5xl space-y-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Newspaper className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>{editingId ? "Edit blog" : "Create a blog"}</CardTitle>
                  <CardDescription>Publish text, images, videos, links, and SEO metadata.</CardDescription>
                </div>
              </div>
              {editingId && <Button variant="outline" onClick={resetForm}>New blog</Button>}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={e => updateField("title", e.target.value)} placeholder="How to send money safely" />
              </div>
              <div className="space-y-2">
                <Label>URL slug</Label>
                <Input value={form.slug} onChange={e => updateField("slug", e.target.value)} placeholder={slugify(form.title) || "how-to-send-money-safely"} />
                {previewSlug && <p className="text-xs text-muted-foreground">Public link: /blog/{previewSlug}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea value={form.excerpt} onChange={e => updateField("excerpt", e.target.value)} placeholder="A short summary for blog cards and search results." className="min-h-20" />
            </div>
            <div className="space-y-2">
              <Label>Article content</Label>
              <Textarea value={form.content} onChange={e => updateField("content", e.target.value)} placeholder="Write the blog content here..." className="min-h-56" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Image or video</Label>
                <input ref={mediaInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) uploadMedia(file);
                }} />
                <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => mediaInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Upload media"}
                </Button>
                {form.mediaUrl && (
                  <div className="relative overflow-hidden rounded-xl border border-border">
                    {form.mediaType === "video" ? <video src={form.mediaUrl} controls className="max-h-44 w-full object-cover" /> : <img src={form.mediaUrl} alt="Blog media preview" className="max-h-44 w-full object-cover" />}
                    <Button type="button" size="icon" variant="secondary" className="absolute right-2 top-2" onClick={() => { updateField("mediaUrl", ""); updateField("mediaType", "none"); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Related link</Label>
                  <Input value={form.externalUrl} onChange={e => updateField("externalUrl", e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Publishing status</Label>
                  <select value={form.status} onChange={e => updateField("status", e.target.value)} className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <Label>SEO metadata</Label>
                  <p className="text-xs text-muted-foreground">Generated automatically when blank; customize when needed.</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={generateSeo}>Generate SEO</Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={form.seoTitle} onChange={e => updateField("seoTitle", e.target.value)} placeholder="SEO title" />
                <Input value={form.seoKeywords} onChange={e => updateField("seoKeywords", e.target.value)} placeholder="Keywords, comma separated" />
                <Textarea value={form.seoDescription} onChange={e => updateField("seoDescription", e.target.value)} placeholder="SEO description" className="md:col-span-2 min-h-20" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={resetForm}>Clear</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title.trim() || !form.content.trim()} className="gap-2">
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId ? "Save changes" : "Save blog"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>All blogs</CardTitle>
            <CardDescription>{blogs.length} total entries</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading blogs...</div>
            ) : blogs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No blogs yet. Create the first one above.</div>
            ) : (
              <div className="space-y-3">
                {blogs.map(blog => (
                  <div key={blog.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 md:flex-row md:items-center">
                    <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                      {blog.mediaUrl && blog.mediaType === "video" ? <Video className="h-5 w-5" /> : blog.mediaUrl ? <img src={blog.mediaUrl} alt="" className="h-full w-full object-cover" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{blog.title}</p>
                        <Badge variant={blog.status === "published" ? "default" : "outline"}>{blog.status || "draft"}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{blog.excerpt || blog.content}</p>
                      <p className="mt-2 text-xs text-muted-foreground"><Calendar className="mr-1 inline h-3 w-3" />{new Date(blog.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {blog.status === "published" && <a href={`/blog/${blog.slug}`} target="_blank" rel="noreferrer"><Button variant="outline" size="icon" title="Open public blog"><ExternalLink className="h-4 w-4" /></Button></a>}
                      <Button variant="outline" size="icon" onClick={() => editBlog(blog)} title="Edit blog"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="text-destructive" onClick={() => { if (window.confirm("Delete this blog?")) deleteMutation.mutate(blog.id); }} disabled={deleteMutation.isPending} title="Delete blog"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}