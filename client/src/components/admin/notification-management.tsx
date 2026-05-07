import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Users, Calendar, MessageSquare, AlertCircle, CheckCircle, Clock, Trash2, User, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const broadcastSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  message: z.string().min(1, "Message is required").max(500, "Message must be less than 500 characters"),
  type: z.enum(["general", "promotion", "security", "maintenance", "alert"]),
  actionUrl: z.string().optional(),
  expiresIn: z.number().min(1).max(168).optional(),
});

const userNotifSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required").max(100),
  message: z.string().min(1, "Message is required").max(500),
  type: z.enum(["general", "promotion", "security", "maintenance", "alert", "info"]),
  actionUrl: z.string().optional(),
});

const smsSchema = z.object({
  message: z.string().min(1, "Message is required").max(160, "SMS must be ≤ 160 characters"),
  target: z.enum(["all", "user"]),
  userId: z.string().optional(),
});

type BroadcastForm = z.infer<typeof broadcastSchema>;
type UserNotifForm = z.infer<typeof userNotifSchema>;
type SMSForm = z.infer<typeof smsSchema>;

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  userId?: string;
  isGlobal: boolean;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
  expiresAt?: string;
}

export default function NotificationManagement() {
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [userNotifDialogOpen, setUserNotifDialogOpen] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery({ queryKey: ["/api/admin/notifications"] });
  const notifications = notificationsData?.notifications || [];

  const broadcastForm = useForm<BroadcastForm>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: { title: "", message: "", type: "general", actionUrl: "" },
  });

  const userNotifForm = useForm<UserNotifForm>({
    resolver: zodResolver(userNotifSchema),
    defaultValues: { userId: "", title: "", message: "", type: "info", actionUrl: "" },
  });

  const smsForm = useForm<SMSForm>({
    resolver: zodResolver(smsSchema),
    defaultValues: { message: "", target: "all", userId: "" },
  });

  const broadcastMutation = useMutation({
    mutationFn: async (data: BroadcastForm) => {
      const response = await apiRequest('POST', '/api/admin/broadcast-notification', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ title: "Notification Sent", description: "Broadcast notification sent to all users successfully." });
      setBroadcastDialogOpen(false);
      broadcastForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to send notification", variant: "destructive" });
    },
  });

  const userNotifMutation = useMutation({
    mutationFn: async (data: UserNotifForm) => {
      const response = await apiRequest('POST', `/api/admin/users/${data.userId}/notification`, {
        title: data.title,
        message: data.message,
        type: data.type,
        actionUrl: data.actionUrl,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Notification Sent", description: "In-app notification delivered to user successfully." });
      setUserNotifDialogOpen(false);
      userNotifForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to send notification", variant: "destructive" });
    },
  });

  const smsMutation = useMutation({
    mutationFn: async (data: SMSForm) => {
      if (data.target === 'all') {
        const response = await apiRequest('POST', '/api/admin/sms/broadcast', { all: true, message: data.message });
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/admin/sms/send-user', { userId: data.userId, message: data.message });
        return response.json();
      }
    },
    onSuccess: (result: any) => {
      if (result.sent !== undefined) {
        toast({ title: "SMS Sent", description: `Delivered to ${result.sent} of ${result.total} users.` });
      } else {
        toast({ title: "SMS Sent", description: "SMS delivered successfully." });
      }
      setSmsDialogOpen(false);
      smsForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to send SMS", variant: "destructive" });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/notifications/${notificationId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ title: "Deleted", description: "Notification deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to delete notification", variant: "destructive" });
    },
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promotion': return 'bg-blue-100 text-blue-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'alert': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();
  const isExpired = (expiresAt?: string) => expiresAt ? new Date(expiresAt) < new Date() : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  const globalNotifications = notifications.filter((n: Notification) => n.isGlobal);
  const activeNotifications = globalNotifications.filter((n: Notification) => !isExpired(n.expiresAt));
  const expiredNotifications = globalNotifications.filter((n: Notification) => isExpired(n.expiresAt));

  const smsTarget = smsForm.watch("target");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Management</h2>
          <p className="text-gray-600">Manage and broadcast notifications to users</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setSmsDialogOpen(true)} data-testid="button-sms-send">
            <MessageSquare className="w-4 h-4 mr-2" />
            Send SMS
          </Button>
          <Button variant="outline" onClick={() => setUserNotifDialogOpen(true)} data-testid="button-user-notif">
            <User className="w-4 h-4 mr-2" />
            Notify User
          </Button>
          <Button onClick={() => setBroadcastDialogOpen(true)} className="bg-green-600 hover:bg-green-700" data-testid="button-broadcast">
            <Globe className="w-4 h-4 mr-2" />
            Broadcast All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-600">{globalNotifications.length}</p>
              <p className="text-sm text-gray-600">Total Notifications</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{activeNotifications.length}</p>
              <p className="text-sm text-gray-600">Active Notifications</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <Clock className="w-8 h-8 text-gray-600" />
            <div>
              <p className="text-2xl font-bold text-gray-600">{expiredNotifications.length}</p>
              <p className="text-sm text-gray-600">Expired Notifications</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({activeNotifications.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredNotifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {activeNotifications.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Notifications</h3>
                    <p className="text-gray-600 mb-4">Use the buttons above to send or broadcast notifications.</p>
                  </CardContent>
                </Card>
              ) : (
                activeNotifications.map((notification: Notification) => (
                  <Card key={notification.id} className="border-l-4 border-l-green-400">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-5 h-5 text-gray-500" />
                          <div>
                            <h3 className="font-semibold">{notification.title}</h3>
                            <p className="text-sm text-gray-600">Global broadcast</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(notification.type)}>{notification.type}</Badge>
                          <Button
                            variant="outline" size="sm"
                            onClick={() => deleteNotificationMutation.mutate(notification.id)}
                            disabled={deleteNotificationMutation.isPending}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            data-testid={`delete-notification-${notification.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700">{notification.body}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-gray-500">Created</Label>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(notification.createdAt)}</span>
                          </div>
                        </div>
                        {notification.expiresAt && (
                          <div>
                            <Label className="text-xs text-gray-500">Expires</Label>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{formatDate(notification.expiresAt)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {notification.actionUrl && (
                        <div>
                          <Label className="text-xs text-gray-500">Action URL</Label>
                          <p className="text-sm font-mono bg-gray-50 p-2 rounded">{notification.actionUrl}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="expired">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {expiredNotifications.map((notification: Notification) => (
                <Card key={notification.id} className="border-l-4 border-l-gray-400 opacity-75">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-gray-500" />
                        <div>
                          <h3 className="font-semibold text-gray-700">{notification.title}</h3>
                          <p className="text-sm text-gray-600">Expired notification</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-gray-600">Expired</Badge>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => deleteNotificationMutation.mutate(notification.id)}
                          disabled={deleteNotificationMutation.isPending}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          data-testid={`delete-expired-notification-${notification.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">{notification.body}</p>
                    <div className="mt-2 text-xs text-gray-500">Expired on {formatDate(notification.expiresAt!)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* ─── BROADCAST ALL DIALOG ─── */}
      <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Broadcast Notification</DialogTitle>
            <DialogDescription>Send an in-app notification to all users.</DialogDescription>
          </DialogHeader>
          <Form {...broadcastForm}>
            <form onSubmit={broadcastForm.handleSubmit(data => broadcastMutation.mutate(data))} className="space-y-4">
              <FormField control={broadcastForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input placeholder="Notification title" {...field} data-testid="broadcast-title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={broadcastForm.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl><Textarea placeholder="Message body..." className="min-h-[80px]" {...field} data-testid="broadcast-message" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={broadcastForm.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={broadcastForm.control} name="expiresIn" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires In (hours)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="24" {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={broadcastForm.control} name="actionUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Action URL (Optional)</FormLabel>
                  <FormControl><Input placeholder="/dashboard or https://..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setBroadcastDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={broadcastMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {broadcastMutation.isPending ? 'Sending...' : <><Send className="w-4 h-4 mr-2" />Broadcast</>}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ─── USER NOTIFICATION DIALOG ─── */}
      <Dialog open={userNotifDialogOpen} onOpenChange={setUserNotifDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Notification to User</DialogTitle>
            <DialogDescription>Send an in-app notification to a specific user by their User ID.</DialogDescription>
          </DialogHeader>
          <Form {...userNotifForm}>
            <form onSubmit={userNotifForm.handleSubmit(data => userNotifMutation.mutate(data))} className="space-y-4">
              <FormField control={userNotifForm.control} name="userId" render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl><Input placeholder="Paste user ID here" {...field} data-testid="user-notif-userId" className="font-mono text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={userNotifForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input placeholder="Notification title" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={userNotifForm.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl><Textarea placeholder="Message..." className="min-h-[80px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={userNotifForm.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={userNotifForm.control} name="actionUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action URL (Optional)</FormLabel>
                    <FormControl><Input placeholder="/dashboard" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setUserNotifDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={userNotifMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {userNotifMutation.isPending ? 'Sending...' : <><Send className="w-4 h-4 mr-2" />Send</>}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ─── SMS DIALOG ─── */}
      <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send SMS</DialogTitle>
            <DialogDescription>Send an SMS via CommsGrid to a specific user or all users.</DialogDescription>
          </DialogHeader>
          <Form {...smsForm}>
            <form onSubmit={smsForm.handleSubmit(data => smsMutation.mutate(data))} className="space-y-4">
              <FormField control={smsForm.control} name="target" render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipients</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="user">Specific User</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {smsTarget === 'user' && (
                <FormField control={smsForm.control} name="userId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>User ID</FormLabel>
                    <FormControl><Input placeholder="Paste user ID" {...field} className="font-mono text-sm" data-testid="sms-userId" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={smsForm.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>Message <span className="text-xs text-muted-foreground">([GREENPAY] prefix added automatically)</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter SMS message..."
                      className="min-h-[80px]"
                      maxLength={160}
                      {...field}
                      data-testid="sms-message"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground text-right">{field.value?.length || 0}/160</p>
                  <FormMessage />
                </FormItem>
              )} />

              {smsTarget === 'all' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                  This will send an SMS to all users who have phone numbers. Use with caution.
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setSmsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={smsMutation.isPending} className="bg-green-600 hover:bg-green-700" data-testid="button-send-sms">
                  {smsMutation.isPending ? 'Sending...' : <><Send className="w-4 h-4 mr-2" />Send SMS</>}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
