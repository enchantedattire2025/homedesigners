# Email Confirmation Template Setup

This document contains the professional email template for user signup confirmation and instructions for configuring it in Supabase.

## How to Configure

Email templates in Supabase are configured through the Supabase Dashboard:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** > **Email Templates**
4. Select **Confirm signup** template
5. Replace the existing HTML with the template below
6. Click **Save**

## Professional Email Confirmation Template

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .header { background-color: #e26f09; padding: 40px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; letter-spacing: 2px; text-transform: uppercase; font-size: 24px; }
        .content { padding: 40px; line-height: 1.6; color: #333333; }
        .button-container { text-align: center; margin: 30px 0; }
        .button { background-color: #007AFF; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999999; }
        .footer a { color: #007AFF; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TheHomeDesigners</h1>
        </div>
        <div class="content">
            <h2 style="margin-top: 0;">Welcome to the community!</h2>
            <p>Thanks for joining <strong>TheHomeDesigners</strong>. We're excited to have you on board. To get started and gain full access to your workspace, please confirm your email address by clicking the button below:</p>

            <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="button">Verify Email Address</a>
            </div>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 12px; word-break: break-all;"><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>

            <p>Stay creative,<br>The Designers Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 TheHomeDesigners Inc. | 123 Creative Studio, NY</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
    </div>
</body>
</html>
```

## Template Variables

Supabase provides the following variables for email templates:

- `{{ .ConfirmationURL }}` - The confirmation link that users click to verify their email
- `{{ .Token }}` - The confirmation token (if you need it separately)
- `{{ .TokenHash }}` - The hashed token
- `{{ .SiteURL }}` - Your site URL configured in Supabase

## Additional Email Templates to Customize

While you're in the Email Templates section, consider customizing these other templates as well:

- **Invite user** - When inviting users to your application
- **Magic Link** - For passwordless login
- **Change Email Address** - When users change their email
- **Reset Password** - For password reset requests

## Testing

After configuring the template:

1. Test the signup flow by creating a new user account
2. Check that the email is received with the new professional design
3. Verify that the confirmation link works correctly
4. Test on different email clients (Gmail, Outlook, etc.) to ensure consistent rendering

## Notes

- Email confirmation is enabled in your Supabase project
- Users must click the confirmation link to activate their account
- The template uses inline CSS for maximum email client compatibility
- The orange color (#e26f09) matches your brand color
