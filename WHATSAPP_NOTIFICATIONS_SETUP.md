# WhatsApp Notification System

This document explains how to set up and use the WhatsApp notification system for sending automated updates to customers.

## Overview

The WhatsApp notification system automatically sends updates to customers via WhatsApp when:
- A new quotation is generated
- A quotation is accepted
- Project status is updated
- New project updates/photos are added
- Team members are assigned
- Project is completed

## Setup Instructions

### 1. Create a Twilio Account

1. Go to [https://www.twilio.com](https://www.twilio.com) and sign up
2. Complete the verification process
3. Navigate to the Twilio Console

### 2. Enable WhatsApp Messaging

1. In your Twilio Console, go to **Messaging** > **Try it out** > **Send a WhatsApp message**
2. Follow the instructions to activate WhatsApp messaging
3. You'll get a WhatsApp-enabled phone number (e.g., +14155238886)

### 3. Get Your Credentials

From your Twilio Console dashboard, note down:
- **Account SID** (starts with AC...)
- **Auth Token** (click to reveal)
- **WhatsApp Phone Number** (from WhatsApp settings)

### 4. Configure in Admin Dashboard

1. Log in to your admin account
2. Navigate to **Admin Dashboard**
3. Click on **WhatsApp Settings** button
4. Enter your Twilio credentials:
   - Provider: Twilio
   - Account SID
   - Auth Token
   - From Number (WhatsApp)
5. Enable WhatsApp Notifications
6. Click **Save Settings**

### 5. Test the Integration

1. In the WhatsApp Settings page, scroll to **Test Notification**
2. Enter a phone number (with country code, e.g., +919876543210)
3. Click **Send Test**
4. Check the phone number for the test message

## How It Works

### Automatic Notifications

The system uses database triggers to automatically queue notifications when certain events occur:

```
Quote Generated → Customer receives notification about new quote
Quote Accepted → Customer receives confirmation
Status Update → Customer notified of status changes
Project Update → Customer notified when designer adds photos/updates
Team Member Added → Customer notified of new team members
Project Completed → Customer receives completion notification
```

### Notification Flow

1. **Event Occurs** (e.g., designer updates project status)
2. **Database Trigger** fires and queues notification
3. **Edge Function** processes the notification
4. **Twilio API** sends WhatsApp message
5. **Delivery Status** is logged in database

## Customer Notification Preferences

Customers can control which notifications they receive:

- Each customer has a `customer_notification_preferences` record
- By default, all notifications are enabled
- Customers can opt-out of specific notification types
- Complete opt-out available via `whatsapp_enabled` flag

## Notification Logs

All WhatsApp notifications are logged in `whatsapp_notification_logs` table:

- Message content
- Delivery status
- Timestamps (sent, delivered, failed)
- Error messages (if any)
- Provider message IDs

Admins, customers, and designers can view relevant notification logs based on their permissions.

## Message Templates

### Quote Generated
```
Hello [Customer Name]! 🎉

A new quotation has been generated for your project "[Project Name]".

Please log in to your account to review and accept the quote.

Thank you!
The Home Designers Team
```

### Quote Accepted
```
Hello [Customer Name]! ✅

Your quotation for project "[Project Name]" has been accepted.

Work will begin soon. We'll keep you updated on the progress.

Thank you!
The Home Designers Team
```

### Project Update
```
Hello [Customer Name]! 📸

[Designer Name] has added a new update to your project "[Project Name]".

Check your account to see the latest photos and progress.

Thank you!
The Home Designers Team
```

### Project Completed
```
Hello [Customer Name]! 🎊

Congratulations! Your project "[Project Name]" has been marked as completed.

Thank you for choosing The Home Designers. We hope you love your new space!

Please share your feedback with us.

Best regards,
The Home Designers Team
```

## Manual Notification Trigger

You can manually trigger notifications using the utility function:

```typescript
import { sendWhatsAppNotification } from './utils/whatsappNotification';

await sendWhatsAppNotification({
  projectId: 'project-uuid',
  notificationType: 'status_update',
  customMessage: 'Optional custom message'
});
```

## Troubleshooting

### Messages Not Being Sent

1. **Check WhatsApp Settings**
   - Is WhatsApp enabled in Admin Dashboard?
   - Are credentials correct?

2. **Check Twilio Account**
   - Is WhatsApp messaging activated?
   - Is account in good standing?
   - Check Twilio logs for errors

3. **Check Notification Logs**
   - View `whatsapp_notification_logs` table
   - Look for error messages
   - Check delivery status

### Phone Number Format

- Always include country code
- Use + prefix (e.g., +919876543210)
- Indian numbers: +91 followed by 10 digits
- Remove spaces and special characters

### Common Errors

**Error: "Invalid phone number"**
- Solution: Check phone number format, ensure country code is included

**Error: "WhatsApp not enabled for this number"**
- Solution: Number must be registered with Twilio WhatsApp sandbox

**Error: "Authentication failed"**
- Solution: Verify Account SID and Auth Token are correct

## Cost Considerations

- Twilio charges per WhatsApp message sent
- Check Twilio pricing for your region
- Monitor usage in Twilio Console
- Consider implementing rate limiting for high-volume scenarios

## Security

- Auth tokens are stored securely in database
- Only admins can access WhatsApp settings
- Customer data is protected with RLS policies
- Notifications use service role key for secure access

## Future Enhancements

Potential improvements:
- Support for additional providers (WhatsApp Business API)
- Rich media messages (images, documents)
- Message templates management
- Scheduled notifications
- Bulk notification sending
- Delivery reports and analytics
- Customer reply handling
