import { useState } from "react";
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
import { Save, Megaphone, Eye, EyeOff, Calendar, Trash2, Plus } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminAnnouncementsDBPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState("1");
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: announcements, isLoading } = useQuery<{ announcements: Announcement[] }>({
    queryKey: ["/api/admin/announcements"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/announcements");
      return r.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/admin/announcements", {
        title,
        content,
        isActive,
        priority: parseInt(priority),
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Created", description: "Announcement created successfully." });
      setTitle("");
      setContent("");
      setIsActive(true);
      setPriority("1");
      qc.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to create announcement.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("PUT", `/api/admin/announcements/${id}`, {
        title,
        content,
        isActive,
        priority: parseInt(priority),
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Announcement updated successfully." });
      setTitle("");
      setContent("");
      setIsActive(true);
      setPriority("1");
      setEditingId(null);
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
    setIsActive(announcement.isActive);
    setPriority(String(announcement.priority));
    setEditingId(announcement.id);
  };

  const handleSave = () => {
    if (!title || !content) {
      toast({ title: "Error", description: "Title and message are required.", variant: "destructive" });
      return;
    }

    if (editingId) {
      updateMutation.mutate(editingId);
    } else {
      createMutation.mutate();
    }
  };

  const handleCancel = () => {
    setTitle("");
    setContent("");
    setIsActive(true);
    setPriority("1");
    setEditingId(null);
  };

  if (isLoading) {
    return (
      <AdminShell title="Announcements">
        <div className="space-y-4">
          <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Announcements">
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
              <Label className="text-sm">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., System Maintenance"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Message</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter announcement message..."
                className="rounded-xl min-h-24 resize-none"
              />
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
                <Button onClick={handleCancel} variant="outline" className="flex-1 rounded-xl">
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">All Announcements ({announcements?.announcements?.length || 0})</h3>
          {announcements?.announcements && announcements.announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.announcements.map((ann) => (
                <Card key={ann.id} className="rounded-xl border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{ann.title}</h4>
                          {ann.isActive ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Inactive</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">Priority {ann.priority}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{ann.content}</p>
                        <p className="text-xs text-gray-400">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(ann.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(ann)} className="rounded-lg">
                          Edit
                        </Button>
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
