import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AdminShell from "@/components/admin/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Save, Megaphone, Calendar, Trash2, Upload, X, Link as LinkIcon,
  Image as ImageIcon, Video as VideoIcon, Play, Pause, Volume2, VolumeX, Maximize2
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  actionUrl?: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt?: string;
}

function isVideo(url?: string) {
  if (!url) return false;
  return url.includes("/video/") || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

function MediaModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const video = isVideo(url);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
    setDuration(v.duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * v.duration;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-3xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
          {video ? (
            <div className="relative">
              <video
                ref={videoRef}
                src={url}
                className="w-full max-h-[70vh] object-contain bg-black"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onEnded={() => setPlaying(false)}
                playsInline
              />
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={togglePlay}
              >
                <AnimatePresence>
                  {!playing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                    >
                      <Play className="w-7 h-7 text-white fill-white ml-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                <div
                  className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer hover:h-2 transition-all"
                  onClick={handleSeek}
                >
                  <div className="h-full bg-white rounded-full relative" style={{ width: `${progress}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                  </button>
                  <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors">
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-white/70 text-xs flex-1">
                    {formatTime((progress / 100) * duration)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <img src={url} alt={title} className="w-full max-h-[80vh] object-contain" />
          )}
          <div className="p-3 bg-black/80">
            <p className="text-white text-sm font-medium">{title}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminAnnouncementsDBPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState("1");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [modalMedia, setModalMedia] = useState<{ url: string; title: string } | null>(null);

  const { data: announcements, isLoading } = useQuery<{ announcements: Announcement[] }>({
    queryKey: ["/api/admin/announcements"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/announcements");
      return r.json();
    },
  });

  const uploadMedia = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/admin/announcements/upload-media", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
      }
      const data = await response.json();
      if (data.url) {
        setImageUrl(data.url);
        toast({ title: "Uploaded", description: `${data.type === "video" ? "Video" : "Image"} uploaded successfully.` });
      }
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message || "Failed to upload media.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMedia(file);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMedia(file);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/admin/announcements", {
        title, content, imageUrl: imageUrl || undefined, actionUrl: actionUrl || undefined, isActive, priority: parseInt(priority),
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Created", description: "Announcement created successfully." });
      setTitle(""); setContent(""); setImageUrl(""); setActionUrl(""); setIsActive(true); setPriority("1");
      qc.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to create announcement.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("PUT", `/api/admin/announcements/${id}`, {
        title, content, imageUrl: imageUrl || undefined, actionUrl: actionUrl || undefined, isActive, priority: parseInt(priority),
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Announcement updated successfully." });
      setTitle(""); setContent(""); setImageUrl(""); setActionUrl(""); setIsActive(true); setPriority("1"); setEditingId(null);
      qc.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to update announcement.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/admin/announcements/${id}`, {});
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Announcement deleted successfully." });
      qc.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete announcement.", variant: "destructive" }),
  });

  const handleEdit = (announcement: Announcement) => {
    setTitle(announcement.title);
    setContent(announcement.content);
    setImageUrl(announcement.imageUrl || "");
    setActionUrl(announcement.actionUrl || "");
    setIsActive(announcement.isActive);
    setPriority(String(announcement.priority));
    setEditingId(announcement.id);
  };

  const handleCancel = () => {
    setTitle(""); setContent(""); setImageUrl(""); setActionUrl(""); setIsActive(true); setPriority("1"); setEditingId(null);
  };

  const handleSave = () => {
    if (!title || !content) {
      toast({ title: "Error", description: "Title and message are required.", variant: "destructive" });
      return;
    }
    if (editingId) updateMutation.mutate(editingId);
    else createMutation.mutate();
  };

  if (isLoading) {
    return (
      <AdminShell title="Announcements">
        <div className="space-y-6">
          <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Announcements">
      <AnimatePresence>
        {modalMedia && (
          <MediaModal url={modalMedia.url} title={modalMedia.title} onClose={() => setModalMedia(null)} />
        )}
      </AnimatePresence>

      <div className="max-w-4xl space-y-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50">
                <Megaphone className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle>{editingId ? "Edit Announcement" : "Create New Announcement"}</CardTitle>
                <CardDescription>Create or modify system announcements for all users</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., System Maintenance" className="rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Message</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter announcement message..." className="rounded-xl min-h-24 resize-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Image / Video (Optional)
                </Label>
                <div className="space-y-2">
                  {imageUrl && (
                    <div
                      className="relative w-full h-32 rounded-xl overflow-hidden bg-gray-100 cursor-pointer group"
                      onClick={() => setModalMedia({ url: imageUrl, title: title || "Preview" })}
                    >
                      {isVideo(imageUrl) ? (
                        <video src={imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {isVideo(imageUrl)
                            ? <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            : <Maximize2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setImageUrl(""); }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute top-2 left-2 text-[10px] text-white bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
                        {isVideo(imageUrl) ? "Video · click to preview" : "Image · click to preview"}
                      </span>
                    </div>
                  )}

                  <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                  <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} disabled={uploading} className="hidden" />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl"
                      disabled={uploading}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Image"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl"
                      disabled={uploading}
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <VideoIcon className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Video"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Action Link (Optional)
                </Label>
                <Input value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} placeholder="e.g., https://example.com or /deposit" className="rounded-xl" />
                <p className="text-xs text-gray-500">Users can click "Learn More" to open this link</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Priority</Label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="1">Low</option>
                  <option value="2">Medium</option>
                  <option value="3">High</option>
                  <option value="4">Urgent</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center justify-between w-full p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <Label className="text-sm font-medium">Active</Label>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-500">
                <Save className="w-4 h-4 mr-2" />
                {editingId ? "Update" : "Create"}
              </Button>
              {editingId && (
                <Button onClick={handleCancel} variant="outline" className="flex-1 rounded-xl">Cancel</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">All Announcements ({announcements?.announcements?.length || 0})</h3>
          {announcements?.announcements && announcements.announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.announcements.map((ann) => (
                <Card key={ann.id} className="rounded-xl border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {ann.imageUrl && (
                        <div
                          className="w-full sm:w-36 h-32 flex-shrink-0 bg-gray-100 overflow-hidden relative cursor-pointer group"
                          onClick={() => setModalMedia({ url: ann.imageUrl!, title: ann.title })}
                        >
                          {isVideo(ann.imageUrl) ? (
                            <video src={ann.imageUrl} className="w-full h-full object-cover" />
                          ) : (
                            <img src={ann.imageUrl} alt={ann.title} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {isVideo(ann.imageUrl)
                                ? <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                                : <Maximize2 className="w-4 h-4 text-white" />}
                            </div>
                          </div>
                          <span className="absolute bottom-1 left-1 text-[9px] text-white bg-black/50 rounded-full px-1.5 py-0.5 flex items-center gap-1">
                            {isVideo(ann.imageUrl)
                              ? <><VideoIcon className="w-2.5 h-2.5" />Video</>
                              : <><ImageIcon className="w-2.5 h-2.5" />Image</>}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-sm">{ann.title}</h4>
                          {ann.isActive ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Inactive</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">Priority {ann.priority}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ann.content}</p>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-xs text-gray-400">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(ann.createdAt).toLocaleString()}
                          </p>
                          <div className="flex gap-2">
                            {ann.actionUrl && (
                              <a href={ann.actionUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200">
                                Visit Link →
                              </a>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleEdit(ann)} className="rounded-lg text-xs">Edit</Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteMutation.mutate(ann.id)}
                              disabled={deleteMutation.isPending}
                              className="rounded-lg text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-xl border-0 shadow-sm bg-gray-50">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">No announcements yet. Create one to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
