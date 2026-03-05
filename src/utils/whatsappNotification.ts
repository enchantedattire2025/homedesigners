import { supabase } from '../lib/supabase';

export type NotificationType =
  | 'quote_generated'
  | 'quote_accepted'
  | 'status_update'
  | 'project_update'
  | 'team_assigned'
  | 'project_completed';

interface SendNotificationParams {
  projectId: string;
  notificationType: NotificationType;
  customMessage?: string;
}

export const sendWhatsAppNotification = async ({
  projectId,
  notificationType,
  customMessage,
}: SendNotificationParams): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: settings } = await supabase
      .from('whatsapp_settings')
      .select('is_enabled')
      .maybeSingle();

    if (!settings || !settings.is_enabled) {
      console.log('WhatsApp notifications are not enabled');
      return { success: true };
    }

    const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
      body: {
        projectId,
        notificationType,
        customMessage,
      },
    });

    if (error) {
      console.error('Error sending WhatsApp notification:', error);
      return { success: false, error: error.message };
    }

    if (data?.skipped) {
      console.log('Notification skipped:', data.message);
      return { success: true };
    }

    console.log('WhatsApp notification sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send WhatsApp notification:', error);
    return { success: false, error: error.message };
  }
};

export const processQueuedNotifications = async (): Promise<void> => {
  try {
    const { data: queuedNotifications, error } = await supabase
      .from('whatsapp_notification_logs')
      .select('*')
      .eq('status', 'queued')
      .limit(10);

    if (error) {
      console.error('Error fetching queued notifications:', error);
      return;
    }

    if (!queuedNotifications || queuedNotifications.length === 0) {
      return;
    }

    for (const notification of queuedNotifications) {
      await sendWhatsAppNotification({
        projectId: notification.project_id,
        notificationType: notification.notification_type,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Error processing queued notifications:', error);
  }
};
