import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Megaphone, Tag, ImagePlus, X, Upload, Video, Eye, ExternalLink, Bell } from "lucide-react";

export function AnnouncementManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // selectedFile holds the raw file chosen by the user — preview uses object URL
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // localPreview is an object URL for instant display — never sent to server
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "announcement",
    isActive: true,
    priority: 0,
    actionUrl: "",
    imageUrl: "",
  });

  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ["/api/admin/announcements"],
  });

  const announcements = announcementsData?.announcements || [];

  // Upload the selected file and return a URL (Cloudinary or base64 fallback)
  const uploadFile = async (file: File): Promise<string> => {
    const formDataObj = new FormData();
    formDataObj.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formDataObj,
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Upload failed");
    }
    const data = await res.json();
    return data.url || data.fileUrl;
  };

  // Handle file selection — just show a local preview, no upload yet
  const handleFileSelect = (file: File) => {
    const isVid = file.type.startsWith("video/");
    const isImg = file.type.startsWith("image/");
    if (!isVid && !isImg) {
      toast({ title: "Invalid file", description: "Please choose an image or video file", variant: "destructive" });
      return;
    }
    // Revoke old object URL to avoid memory leaks
    if (localPreview) URL.revokeObjectURL(localPreview);
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setLocalPreview(objectUrl);
    setMediaType(isVid ? "video" : "image");
    // Clear any manually typed URL
    setFormData(prev => ({ ...prev, imageUrl: "" }));
  };

  const clearMedia = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setSelectedFile(null);
    setLocalPreview(null);
    setMediaType(null);
    setFormData(prev => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReset = () => {
    clearMedia();
    setFormData({ title: "", content: "", type: "announcement", isActive: true, priority: 0, actionUrl: "", imageUrl: "" });
    setIsAdding(false);
  };

  // On submit: upload file first (if one was selected), then create the announcement
  const handleCreate = async () => {
    if (!formData.title || !formData.content) return;

    let imageUrl = formData.imageUrl;

    if (selectedFile) {
      setIsUploading(true);
      try {
        imageUrl = await uploadFile(selectedFile);
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message || "Could not upload media", variant: "destructive" });
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    createMutation.mutate({ ...formData, imageUrl });
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/admin/announcements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      handleReset();
      setShowPreview(false);
      toast({ title: "Published", description: "Announcement is now live for all users" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create announcement", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      toast({ title: "Deleted", description: "Announcement removed" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PUT", `/api/admin/announcements/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
    },
  });

  // The effective media to display (local object URL or manually typed URL)
  const effectiveMediaUrl = localPreview || formData.imageUrl || null;
  const isVideoUrl = (url: string) => /\.(mp4|mov|webm|avi|mkv)$/i.test(url) || mediaType === "video";

  if (isLoading) return <Loader2 className="animate-spin h-8 w-8 mx-auto" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Announcements & Offers</h2>
        <Button onClick={() => { if (isAdding) handleReset(); else setIsAdding(true); }}>
          {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" />Add New</>}
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Announcement title"
              />
            </div>

            {/* Content */}
            <div className="grid gap-2">
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Description or offer details"
                rows={3}
              />
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="offer">Special Offer</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority (higher = shown first)</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Media Upload */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <ImagePlus className="w-4 h-4" />
                Media — Image or Video (Optional)
              </Label>

              {/* Instant local preview */}
              {effectiveMediaUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border bg-black/5">
                  {isVideoUrl(effectiveMediaUrl) ? (
                    <video src={effectiveMediaUrl} controls className="w-full max-h-56 object-cover" />
                  ) : (
                    <img src={effectiveMediaUrl} alt="Preview" className="w-full max-h-56 object-cover" />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg"
                    onClick={clearMedia}
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {isVideoUrl(effectiveMediaUrl) ? <Video className="w-3 h-3" /> : <ImagePlus className="w-3 h-3" />}
                    {localPreview ? "Ready to upload" : "URL added"}
                  </div>
                </div>
              ) : (
                /* Drop zone */
                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:bg-muted/30 hover:border-primary/40 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="w-10 h-10" />
                    <p className="text-sm font-medium text-foreground">Click or drag & drop to add media</p>
                    <p className="text-xs">PNG, JPG, GIF, WebP, MP4, MOV supported</p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              {/* URL fallback */}
              {!effectiveMediaUrl && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or paste a URL</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => {
                      const url = e.target.value;
                      setFormData({ ...formData, imageUrl: url });
                      if (url) setMediaType(/\.(mp4|mov|webm|avi|mkv)$/i.test(url) ? "video" : "image");
                      else setMediaType(null);
                    }}
                    placeholder="https://example.com/image.jpg"
                  />
                </>
              )}
            </div>

            {/* Action URL */}
            <div className="grid gap-2">
              <Label>Action URL (Optional)</Label>
              <Input
                value={formData.actionUrl}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                placeholder="/deposit or https://..."
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
              <div>
                <p className="text-sm font-medium">Active immediately</p>
                <p className="text-xs text-muted-foreground">Visible to all users right after posting</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPreview(true)}
                disabled={!formData.title || !formData.content}
                type="button"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview as User
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={createMutation.isPending || isUploading || !formData.title || !formData.content}
              >
                {(createMutation.isPending || isUploading) ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isUploading ? "Uploading..." : "Publishing..."}</>
                ) : (
                  <><Bell className="w-4 h-4 mr-2" />Publish Announcement</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcement preview modal — shows exactly how users will see it */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-sm text-muted-foreground font-normal">Preview — as seen by users</DialogTitle>
          </DialogHeader>

          <div className="m-4 rounded-xl border border-border overflow-hidden shadow-sm bg-card">
            {/* Media preview */}
            {effectiveMediaUrl && (
              <div className="bg-black/5">
                {isVideoUrl(effectiveMediaUrl) ? (
                  <video src={effectiveMediaUrl} controls className="w-full max-h-48 object-cover" />
                ) : (
                  <img src={effectiveMediaUrl} alt="preview" className="w-full max-h-48 object-cover" />
                )}
              </div>
            )}
            <div className="p-4 space-y-2">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  formData.type === "offer" ? "bg-orange-100 text-orange-600" : "bg-primary/10 text-primary"
                }`}>
                  {formData.type === "offer" ? <Tag className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 uppercase">
                      {formData.type}
                    </Badge>
                    {formData.isActive && (
                      <Badge className="text-[10px] py-0 px-1.5 bg-green-500">Live</Badge>
                    )}
                  </div>
                  <p className="font-semibold text-sm leading-snug">
                    {formData.title || <span className="text-muted-foreground italic">Title goes here</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {formData.content || <span className="italic">Content goes here</span>}
                  </p>
                  {formData.actionUrl && (
                    <div className="mt-2 flex items-center gap-1 text-primary text-xs font-medium">
                      <ExternalLink className="w-3 h-3" />
                      {formData.actionUrl}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 p-4 pt-0">
            <Button variant="outline" className="flex-1" onClick={() => setShowPreview(false)}>
              Edit
            </Button>
            <Button
              className="flex-1"
              onClick={() => { setShowPreview(false); handleCreate(); }}
              disabled={createMutation.isPending || isUploading}
            >
              {(createMutation.isPending || isUploading) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              Publish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Existing announcements list */}
      <div className="grid gap-4">
        {Array.isArray(announcements) && announcements.length > 0 ? (
          announcements.map((item: any) => (
            <Card key={item.id} className={item.isActive ? "" : "opacity-60"}>
              {item.imageUrl && (
                <div className="relative overflow-hidden rounded-t-xl">
                  {/\.(mp4|mov|webm|avi|mkv)$/i.test(item.imageUrl) ? (
                    <video src={item.imageUrl} controls className="w-full max-h-40 object-cover" />
                  ) : (
                    <img src={item.imageUrl} alt={item.title} className="w-full max-h-40 object-cover" />
                  )}
                </div>
              )}
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex gap-3 min-w-0">
                  <div className="mt-1 flex-shrink-0">
                    {item.type === "offer" ? <Tag className="text-orange-500" /> : <Megaphone className="text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold truncate">{item.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded uppercase">{item.type}</span>
                      {item.imageUrl && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                          {/\.(mp4|mov|webm|avi|mkv)$/i.test(item.imageUrl) ? <Video className="w-3 h-3" /> : <ImagePlus className="w-3 h-3" />}
                          Media
                        </span>
                      )}
                      {item.actionUrl && (
                        <span className="text-xs text-primary truncate max-w-[120px]">{item.actionUrl}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Switch
                    checked={item.isActive}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: item.id, isActive: checked })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center p-8 bg-muted/20 rounded-xl border border-dashed">
            <Megaphone className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No announcements yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Add New" to create your first announcement</p>
          </div>
        )}
      </div>
    </div>
  );
}
