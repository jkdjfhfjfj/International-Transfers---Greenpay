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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Megaphone, Tag, ImagePlus, X, Upload, Video } from "lucide-react";

export function AnnouncementManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
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

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast({ title: "Invalid file", description: "Please upload an image or video file", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      // Try server upload first
      let serverUploadSuccess = false;
      try {
        const formDataObj = new FormData();
        formDataObj.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formDataObj, credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const url = data.url || data.fileUrl;
          setFormData(prev => ({ ...prev, imageUrl: url }));
          setMediaPreview(url);
          setMediaType(isVideo ? "video" : "image");
          toast({ title: "Uploaded", description: `${isVideo ? "Video" : "Image"} uploaded successfully` });
          serverUploadSuccess = true;
        }
      } catch {
        // Fall through to base64 fallback
      }

      if (!serverUploadSuccess) {
        // Base64 fallback for images (videos are too large for base64)
        if (isImage) {
          const base64 = await toBase64(file);
          setFormData(prev => ({ ...prev, imageUrl: base64 }));
          setMediaPreview(base64);
          setMediaType("image");
          toast({ title: "Image ready", description: "Image embedded directly (no cloud storage needed)" });
        } else {
          toast({ title: "Upload failed", description: "Video upload requires cloud storage. Please enter a video URL instead.", variant: "destructive" });
        }
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Could not process file.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/admin/announcements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setIsAdding(false);
      setMediaPreview(null);
      setMediaType(null);
      setFormData({ title: "", content: "", type: "announcement", isActive: true, priority: 0, actionUrl: "", imageUrl: "" });
      toast({ title: "Success", description: "Announcement created successfully" });
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

  const clearMedia = () => {
    setMediaPreview(null);
    setMediaType(null);
    setFormData(prev => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (isLoading) return <Loader2 className="animate-spin h-8 w-8 mx-auto" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Announcements & Offers</h2>
        <Button onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add New</>}
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Announcement title"
              />
            </div>
            <div className="grid gap-2">
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Description or offer details"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="offer">Special Offer</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority (higher shows first)</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Media Upload Section */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <ImagePlus className="w-4 h-4" />
                Media (Image or Video) — Optional
              </Label>

              {/* Media Preview */}
              {mediaPreview && (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  {mediaType === "video" ? (
                    <video
                      src={mediaPreview}
                      controls
                      className="w-full max-h-48 object-cover"
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full max-h-48 object-cover"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full"
                    onClick={clearMedia}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {mediaType === "video" ? <Video className="w-3 h-3" /> : <ImagePlus className="w-3 h-3" />}
                    {mediaType === "video" ? "Video" : "Image"}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {!mediaPreview && (
                <div
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload image or video</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF, MP4, MOV supported</p>
                    </div>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />

              {/* Manual URL fallback */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or paste URL</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Input
                value={mediaPreview ? "" : formData.imageUrl}
                onChange={(e) => {
                  const url = e.target.value;
                  setFormData({ ...formData, imageUrl: url });
                  if (url) {
                    setMediaPreview(url);
                    const isVid = /\.(mp4|mov|webm|avi|mkv)$/i.test(url);
                    setMediaType(isVid ? "video" : "image");
                  }
                }}
                placeholder="https://example.com/image.jpg"
                disabled={!!mediaPreview}
              />
            </div>

            <div className="grid gap-2">
              <Label>Action URL (Optional)</Label>
              <Input
                value={formData.actionUrl}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                placeholder="/deposit or external link"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.title || !formData.content}
            >
              {createMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                "Create Entry"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

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
              <CardContent className="p-4 flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="mt-1">
                    {item.type === 'offer' ? <Tag className="text-orange-500" /> : <Megaphone className="text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.content}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded uppercase">{item.type}</span>
                      {item.imageUrl && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                          {/\.(mp4|mov|webm|avi|mkv)$/i.test(item.imageUrl) ? <Video className="w-3 h-3" /> : <ImagePlus className="w-3 h-3" />}
                          Media
                        </span>
                      )}
                      {item.actionUrl && <span className="text-xs text-primary">{item.actionUrl}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
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
            <p className="text-muted-foreground">No announcements found</p>
          </div>
        )}
      </div>
    </div>
  );
}
