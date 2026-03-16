# Notification System Documentation

## Overview

The notification system provides both in-app notifications and email notifications for key activities between customers and designers. Notifications are triggered automatically when important events occur in the project lifecycle.

## Features

### In-App Notifications
- Real-time notification bell in the header
- Unread count badge
- Click on notifications to navigate to related pages
- Mark individual notifications as read
- Mark all notifications as read
- Auto-refresh via Supabase Realtime

### Email Notifications
- Queued email notifications for all major events
- Email notifications are stored in the database for tracking
- Can be processed by an edge function or external email service

## Notification Events

### 1. Project Creation
**Trigger:** When a customer creates a new project
**Recipients:** Customer
**Type:** `project_created`

### 2. Quote Request (Project Assignment)
**Trigger:** When a customer assigns a project to a designer
**Recipients:**
- Designer (receives quote request)
- Customer (confirmation of request sent)
**Type:** `quote_request`, `quote_request_sent`

### 3. Quotation Submitted
**Trigger:** When a designer submits a quotation
**Recipients:**
- Customer (new quotation received)
- Designer (confirmation of submission)
**Type:** `quotation_submitted`, `quotation_submitted_confirmation`

### 4. Quotation Accepted
**Trigger:** When a customer accepts a quotation
**Recipients:**
- Designer (quotation accepted)
- Customer (confirmation of acceptance)
**Type:** `quotation_accepted`, `quotation_accepted_confirmation`

### 5. Project Status Update
**Trigger:** When project status changes (in_progress, completed, etc.)
**Recipients:** Customer
**Type:** `project_status_update`

## Database Tables

### notifications
Stores in-app notifications for users.

**Columns:**
- `id` - Unique identifier
- `user_id` - User who receives the notification
- `user_type` - Type of user (customer, designer, admin)
- `title` - Notification title
- `message` - Notification message
- `type` - Notification type
- `reference_id` - ID of related record (project, quote, etc.)
- `reference_type` - Type of reference (project, quotation, etc.)
- `is_read` - Whether notification has been read
- `created_at` - When notification was created

**RLS Policies:**
- Users can only view their own notifications
- Users can update their own notifications (mark as read)
- System can insert notifications for any user

### email_notifications
Queues email notifications for processing.

**Columns:**
- `id` - Unique identifier
- `recipient_email` - Email address of recipient
- `recipient_name` - Name of recipient
- `subject` - Email subject
- `body` - Email body content
- `status` - Status (pending, sent, failed)
- `sent_at` - When email was sent
- `error_message` - Error message if sending failed
- `created_at` - When notification was queued

**RLS Policies:**
- Only admins can view/manage email notifications

## Functions

### create_notification()
Creates a new in-app notification.

**Parameters:**
- `p_user_id` - User ID to send notification to
- `p_user_type` - Type of user (customer, designer, admin)
- `p_title` - Notification title
- `p_message` - Notification message
- `p_type` - Notification type
- `p_reference_id` - Optional reference ID
- `p_reference_type` - Optional reference type

**Returns:** Notification ID

### queue_email_notification()
Queues an email notification for sending.

**Parameters:**
- `p_recipient_email` - Recipient email address
- `p_recipient_name` - Recipient name
- `p_subject` - Email subject
- `p_body` - Email body

**Returns:** Email notification ID

## Usage

### Frontend Hook

```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh
  } = useNotifications();

  // Access notifications array
  // Check unreadCount
  // Call markAsRead(notificationId) to mark as read
  // Call markAllAsRead() to mark all as read
}
```

### Notification Bell Component

The `NotificationBell` component is automatically included in the header for authenticated users. It shows:
- Bell icon with unread count badge
- Dropdown with recent notifications
- Mark as read functionality
- Click to navigate to related pages

## Real-time Updates

The notification system uses Supabase Realtime to receive instant updates:
- New notifications appear immediately
- Unread count updates in real-time
- No page refresh required

## Email Processing

Email notifications are queued in the `email_notifications` table with status `pending`. To process these emails, you can:

1. Create an edge function that runs periodically
2. Query for pending emails
3. Send using your email service (SendGrid, AWS SES, etc.)
4. Update status to `sent` or `failed`

Example edge function structure:

```typescript
// Process pending emails
const { data: pendingEmails } = await supabase
  .from('email_notifications')
  .select('*')
  .eq('status', 'pending')
  .limit(10);

for (const email of pendingEmails) {
  try {
    // Send email using your service
    await sendEmail(email);

    // Update status
    await supabase
      .from('email_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', email.id);
  } catch (error) {
    // Update with error
    await supabase
      .from('email_notifications')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', email.id);
  }
}
```

## Customization

### Adding New Notification Types

1. Create a new trigger function in the database
2. Define when the notification should be sent
3. Use `create_notification()` and `queue_email_notification()`
4. Update frontend to handle the new notification type

### Customizing Email Templates

Edit the email body text in the trigger functions located in the migration file. You can use HTML formatting for richer emails.

### Notification Preferences

To add user preferences for notifications:
1. Create a `notification_preferences` table
2. Add checkboxes in user settings
3. Check preferences before creating notifications

## Testing

To test notifications:

1. Create a new project as a customer
2. Assign the project to a designer
3. Submit a quotation as the designer
4. Accept the quotation as the customer
5. Update project status

Check the notification bell for each event and verify emails are queued in the database.
