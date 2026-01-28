# Email Confirmation Setup Guide

This application now supports email confirmation for both designers and customers. To enable this feature, you need to configure your Supabase project settings.

## How It Works

When a user signs up:
1. They receive a confirmation email with a unique link
2. Clicking the link verifies their email address
3. Only after verification can they sign in to the platform

## Supabase Configuration Steps

Follow these steps to enable email confirmation in your Supabase project:

### Step 1: Access Authentication Settings

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Providers** → **Email**

### Step 2: Enable Email Confirmation

1. Look for the section **"Confirm email"**
2. Toggle **ON** the option: **"Enable email confirmations"**
3. Click **Save** to apply changes

### Step 3: Configure Email Templates (Optional)

To customize the confirmation email:

1. Go to **Authentication** → **Email Templates**
2. Select **"Confirm signup"** template
3. Customize the email content as needed
4. The default template works perfectly fine

### Step 4: Test the Flow

1. Try signing up with a new email address
2. Check your inbox for the confirmation email
3. Click the confirmation link
4. You should be redirected to the confirmation success page
5. Now you can sign in with your credentials

## What Changed in the Application

### Authentication Flow

**Before:**
- Users could sign up and immediately sign in
- No email verification required

**After:**
- Users must verify their email before signing in
- Clear error messages guide users through the process
- Automatic redirect after successful verification

### User Experience

1. **During Signup:**
   - Users see: "Please check your email and click the confirmation link"
   - Modal stays open for 5 seconds to show the message

2. **During Login (Unverified):**
   - Users see: "Please verify your email address before signing in"
   - Cannot access the platform until email is verified

3. **After Clicking Email Link:**
   - Users are redirected to `/auth/confirm`
   - See a success message
   - Automatically redirected to homepage
   - Can now sign in

## Testing in Development

If you want to test without email confirmation (development only):

1. Keep email confirmation **disabled** in Supabase
2. The app will detect this and allow immediate sign-in
3. Re-enable for production

## Email Provider Setup

By default, Supabase uses their email service with rate limits:
- **Development:** Limited emails per hour
- **Production:** You may want to configure a custom SMTP provider

### To Set Up Custom SMTP (Recommended for Production):

1. Go to **Project Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Configure your email provider (SendGrid, Amazon SES, etc.)
4. Test the configuration

## Troubleshooting

### Users not receiving emails?

1. Check spam/junk folders
2. Verify SMTP settings in Supabase
3. Check Supabase email logs: **Authentication** → **Logs**
4. Ensure your email domain is not blacklisted

### Confirmation link not working?

1. Verify the redirect URL is correct: `your-domain.com/auth/confirm`
2. Check that the route is properly configured in App.tsx
3. Ensure email confirmation is enabled in Supabase

### Users getting "Email not confirmed" error?

This is expected behavior when:
1. User tries to sign in without clicking the confirmation link
2. Solution: Check email and click the confirmation link

## Security Benefits

Email confirmation provides several security benefits:

1. **Prevents fake accounts** - Ensures users have access to the email address
2. **Reduces spam** - Makes it harder to create multiple fake accounts
3. **Verifies identity** - Confirms the user owns the email address
4. **Industry standard** - Expected behavior in modern applications

## Support

If you encounter any issues with email confirmation:
1. Check the browser console for error messages
2. Review Supabase authentication logs
3. Verify all configuration steps were completed

The application is now fully configured to handle email confirmations securely and efficiently.
