import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminShell from '@/components/admin/admin-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Bell, Send, Users, Globe } from 'lucide-react';

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [sendMode, setSendMode] = useState<'single' | 'multiple' | 'all'>('single');
  const [userId, setUserId] = useState('');
  const [userIds, setUserIds] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { data: usersData } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.json();
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async () => {
      if (!title || !body) {
        throw new Error('Title and body are required');
      }

      let endpoint = '';
      let payload: any = { title, body };

      if (sendMode === 'single') {
        if (!userId) throw new Error('User ID is required');
        endpoint = '/api/admin/push-notifications/send-user';
        payload.userId = userId;
      } else if (sendMode === 'multiple') {
        if (!userIds) throw new Error('User IDs are required');
        endpoint = '/api/admin/push-notifications/send-multiple';
        payload.userIds = userIds.split('\n').filter((id) => id.trim());
      } else {
        endpoint = '/api/admin/push-notifications/send-all';
      }

      const response = await apiRequest('POST', endpoint, payload);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message || 'Notification sent successfully',
      });
      setTitle('');
      setBody('');
      setUserId('');
      setUserIds('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send notification',
        variant: 'destructive',
      });
    },
  });

  return (
    <AdminShell title="Push Notifications">
      <div className="space-y-6">
        {/* Send Mode Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Send Mode</CardTitle>
            <CardDescription>Choose who to send notifications to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setSendMode('single')}
                className={`p-4 rounded-lg border-2 transition ${
                  sendMode === 'single'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary'
                }`}
              >
                <Users className="w-6 h-6 mx-auto mb-2" />
                <p className="font-semibold">Single User</p>
              </button>

              <button
                onClick={() => setSendMode('multiple')}
                className={`p-4 rounded-lg border-2 transition ${
                  sendMode === 'multiple'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary'
                }`}
              >
                <Users className="w-6 h-6 mx-auto mb-2" />
                <p className="font-semibold">Multiple Users</p>
              </button>

              <button
                onClick={() => setSendMode('all')}
                className={`p-4 rounded-lg border-2 transition ${
                  sendMode === 'all'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary'
                }`}
              >
                <Globe className="w-6 h-6 mx-auto mb-2" />
                <p className="font-semibold">All Users</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Content */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Content</CardTitle>
            <CardDescription>Write the notification message</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="e.g., KYC Verification Complete"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="e.g., Your KYC verification has been approved. You can now use all features."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* User Selection */}
        {sendMode === 'single' && (
          <Card>
            <CardHeader>
              <CardTitle>Select User</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="">Choose a user...</option>
                {usersData?.users?.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email})
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        )}

        {sendMode === 'multiple' && (
          <Card>
            <CardHeader>
              <CardTitle>Select Users</CardTitle>
              <CardDescription>Enter user IDs, one per line</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="User ID 1&#10;User ID 2&#10;User ID 3"
                value={userIds}
                onChange={(e) => setUserIds(e.target.value)}
                rows={6}
              />
            </CardContent>
          </Card>
        )}

        {sendMode === 'all' && (
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Notification</CardTitle>
              <CardDescription>This will be sent to all users with FCM tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ This notification will be sent to all {usersData?.users?.length || 0} users.
                  Please ensure the message is appropriate for all users.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Send Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={() => sendNotificationMutation.mutate()}
            disabled={
              sendNotificationMutation.isPending ||
              !title ||
              !body ||
              (sendMode === 'single' && !userId) ||
              (sendMode === 'multiple' && !userIds)
            }
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
          >
            <Bell className="w-5 h-5 mr-2" />
            {sendNotificationMutation.isPending
              ? 'Sending...'
              : `Send Notification${sendMode === 'all' ? ' to All Users' : ''}`}
          </Button>
        </motion.div>
      </div>
    </AdminShell>
  );
}
