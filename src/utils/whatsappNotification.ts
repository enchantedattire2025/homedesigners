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
    const { data, error } = await supabase.functions.invoke('process-whatsapp-queue', {
      body: {},
    });

    if (error) {
      console.error('Error processing queued notifications:', error);
      return;
    }

    if (data && data.processed > 0) {
      console.log(`Processed ${data.processed} WhatsApp notifications (${data.succeeded} succeeded, ${data.failed} failed)`);
    }
  } catch (error) {
    console.error('Error processing queued notifications:', error);
  }
};
