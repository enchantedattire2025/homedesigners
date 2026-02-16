# Professional Email Templates for TheHomeDesigners

This document contains comprehensive, professional email templates for all authentication flows in your TheHomeDesigners application. These templates include welcome messages, service details, and confirmation links for a complete user experience.

## Overview

We've created professional email templates for:
- **Signup Confirmation** - Welcome new users with service highlights
- **Password Reset** - Help users securely reset their passwords
- **Email Change Confirmation** - Verify email address changes

## Quick Implementation Guide

### Step 1: Access Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Update Each Template

For each template below:
1. Click on the template name in the left sidebar
2. Clear the existing content
3. Copy and paste the corresponding HTML template from this document
4. Click **Save**

### Step 3: Test Your Templates

After updating:
1. Test signup flow - Create a new account and check the welcome email
2. Test password reset - Use the "Forgot Password" feature
3. Verify emails arrive with proper formatting
4. Test links work correctly
5. Check appearance across different email clients (Gmail, Outlook, etc.)

---

## Template 1: Signup Confirmation Email

### How to Configure

1. In Supabase Dashboard, go to **Authentication** > **Email Templates**
2. Select **Confirm signup** template
3. Replace the existing HTML with the template below
4. Click **Save**

### Template Code

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
        .welcome-box { background-color: #e8f4f8; border-left: 4px solid #007AFF; padding: 15px; margin: 20px 0; }
        .services { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .service-item { padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .service-item:last-child { border-bottom: none; }
        .service-icon { display: inline-block; width: 24px; color: #e26f09; font-weight: bold; }
        .cta-section { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999999; }
        .footer a { color: #007AFF; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TheHomeDesigners</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your Trusted Interior Design Partner</p>
        </div>
        <div class="content">
            <h2 style="margin-top: 0; color: #e26f09;">Welcome to TheHomeDesigners!</h2>
            <p>Hello,</p>
            <p>Thank you for joining <strong>TheHomeDesigners</strong> - India's premier platform connecting homeowners with professional interior designers. We're thrilled to have you as part of our community!</p>

            <div class="welcome-box">
                <strong>🎉 You're almost there!</strong> To activate your account and unlock all features, please verify your email address by clicking the button below:
            </div>

            <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="button">Verify Email Address</a>
            </div>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 12px; word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;"><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>

            <h3 style="color: #e26f09; margin-top: 30px;">What You Can Do With TheHomeDesigners:</h3>

            <div class="services">
                <div class="service-item">
                    <span class="service-icon">🎨</span> <strong>Connect with Expert Designers</strong> - Browse and connect with verified interior designers across India
                </div>
                <div class="service-item">
                    <span class="service-icon">📋</span> <strong>Manage Your Projects</strong> - Submit project details and track progress from start to finish
                </div>
                <div class="service-item">
                    <span class="service-icon">💰</span> <strong>Get Instant Quotes</strong> - Receive detailed quotations from multiple designers and compare prices
                </div>
                <div class="service-item">
                    <span class="service-icon">🏗️</span> <strong>2D Design Tools</strong> - Use our interactive tools to visualize and plan your space
                </div>
                <div class="service-item">
                    <span class="service-icon">🎭</span> <strong>Browse Materials</strong> - Explore our extensive gallery of premium materials and finishes
                </div>
                <div class="service-item">
                    <span class="service-icon">⭐</span> <strong>Read Reviews</strong> - Make informed decisions with authentic reviews from verified customers
                </div>
                <div class="service-item">
                    <span class="service-icon">🔒</span> <strong>Secure Platform</strong> - Your data and transactions are protected with industry-leading security
                </div>
            </div>

            <div class="cta-section">
                <h3 style="margin-top: 0; color: #e26f09;">Ready to Transform Your Space?</h3>
                <p>Once you verify your email, you'll have full access to all our features. Start by browsing our designer profiles or submit your first project!</p>
                <p style="margin-top: 15px;">
                    <a href="{{ .SiteURL }}/designers" style="color: #007AFF; text-decoration: none; font-weight: bold;">Browse Designers →</a> |
                    <a href="{{ .SiteURL }}/gallery" style="color: #007AFF; text-decoration: none; font-weight: bold;">View Gallery →</a>
                </p>
            </div>

            <p style="margin-top: 30px;">If you have any questions or need assistance, our support team is here to help you every step of the way.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>The TheHomeDesigners Team</strong><br><em>Transforming Houses into Dream Homes</em></p>
        </div>
        <div class="footer">
            <p><strong>TheHomeDesigners</strong></p>
            <p style="margin-top: 10px;">&copy; 2026 TheHomeDesigners. All rights reserved.</p>
            <p style="margin-top: 10px;">
                <a href="{{ .SiteURL }}">Visit Website</a> |
                <a href="{{ .SiteURL }}/projects">View Projects</a> |
                <a href="{{ .SiteURL }}/materials">Browse Materials</a>
            </p>
            <p style="margin-top: 15px; font-size: 11px;">If you didn't create this account, you can safely ignore this email.</p>
        </div>
    </div>
</body>
</html>
```

---

## Template 2: Password Reset Email

### How to Configure

1. In Supabase Dashboard, go to **Authentication** > **Email Templates**
2. Select **Reset Password** template
3. Replace the existing HTML with the template below
4. Click **Save**

### Template Code

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
        .info-box { background-color: #f8f9fa; border-left: 4px solid #e26f09; padding: 15px; margin: 20px 0; }
        .services { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .service-item { padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .service-item:last-child { border-bottom: none; }
        .service-icon { display: inline-block; width: 24px; color: #e26f09; font-weight: bold; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999999; }
        .footer a { color: #007AFF; text-decoration: none; }
        .security-note { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TheHomeDesigners</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your Trusted Interior Design Partner</p>
        </div>
        <div class="content">
            <h2 style="margin-top: 0; color: #e26f09;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset the password for your <strong>TheHomeDesigners</strong> account. If you made this request, click the button below to set a new password:</p>

            <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="button">Reset Your Password</a>
            </div>

            <div class="security-note">
                <strong>⚠️ Security Notice:</strong> This password reset link will expire in 60 minutes for your security. If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.
            </div>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 12px; word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;"><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>

            <div class="info-box">
                <h3 style="margin-top: 0; color: #e26f09;">About TheHomeDesigners</h3>
                <p>We connect homeowners with professional interior designers to transform spaces into beautiful, functional homes. Our platform offers:</p>
            </div>

            <div class="services">
                <div class="service-item">
                    <span class="service-icon">✓</span> <strong>Expert Designers</strong> - Access to verified, experienced interior designers across India
                </div>
                <div class="service-item">
                    <span class="service-icon">✓</span> <strong>Project Management</strong> - Track your design projects from concept to completion
                </div>
                <div class="service-item">
                    <span class="service-icon">✓</span> <strong>Instant Quotes</strong> - Get detailed quotations from multiple designers
                </div>
                <div class="service-item">
                    <span class="service-icon">✓</span> <strong>2D Design Tools</strong> - Visualize your space with our interactive design tools
                </div>
                <div class="service-item">
                    <span class="service-icon">✓</span> <strong>Materials Gallery</strong> - Browse and select from premium materials and finishes
                </div>
                <div class="service-item">
                    <span class="service-icon">✓</span> <strong>Secure Platform</strong> - Your data and projects are protected with industry-standard security
                </div>
            </div>

            <p style="margin-top: 30px;">If you need any assistance, our support team is here to help you at every step of your design journey.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>The TheHomeDesigners Team</strong></p>
        </div>
        <div class="footer">
            <p><strong>TheHomeDesigners</strong></p>
            <p>Transforming Houses into Dream Homes</p>
            <p style="margin-top: 15px;">&copy; 2026 TheHomeDesigners. All rights reserved.</p>
            <p style="margin-top: 10px;">
                <a href="{{ .SiteURL }}">Visit Website</a> |
                <a href="{{ .SiteURL }}/designers">Browse Designers</a> |
                <a href="{{ .SiteURL }}/gallery">View Gallery</a>
            </p>
            <p style="margin-top: 15px; font-size: 11px;">This is an automated email. Please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>
```

---

## Template 3: Change Email Address

### How to Configure

1. In Supabase Dashboard, go to **Authentication** > **Email Templates**
2. Select **Change Email Address** template
3. Replace the existing HTML with the template below
4. Click **Save**

### Template Code

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
        .info-box { background-color: #f8f9fa; border-left: 4px solid #e26f09; padding: 15px; margin: 20px 0; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999999; }
        .security-note { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TheHomeDesigners</h1>
        </div>
        <div class="content">
            <h2 style="margin-top: 0; color: #e26f09;">Confirm Your New Email Address</h2>
            <p>Hello,</p>
            <p>We received a request to change the email address associated with your <strong>TheHomeDesigners</strong> account. To complete this change, please confirm your new email address by clicking the button below:</p>

            <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm New Email</a>
            </div>

            <div class="security-note">
                <strong>⚠️ Security Notice:</strong> If you didn't request this email change, please contact our support team immediately to secure your account.
            </div>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 12px; word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;"><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>

            <p style="margin-top: 30px;">Best regards,<br><strong>The TheHomeDesigners Team</strong></p>
        </div>
        <div class="footer">
            <p>&copy; 2026 TheHomeDesigners. All rights reserved.</p>
            <p style="margin-top: 10px;"><a href="{{ .SiteURL }}">Visit Website</a></p>
        </div>
    </div>
</body>
</html>
```

---

## Template Variables Reference

Supabase provides the following variables that you can use in email templates:

- `{{ .ConfirmationURL }}` - The confirmation/action link (most important)
- `{{ .Token }}` - The confirmation token (if needed separately)
- `{{ .TokenHash }}` - The hashed token
- `{{ .SiteURL }}` - Your site URL configured in Supabase
- `{{ .Email }}` - The user's email address (available in some templates)

## Design Features

All templates include:

✅ **Professional Design** - Clean, modern layout with your brand colors
✅ **Mobile Responsive** - Looks great on all devices
✅ **Service Highlights** - Showcases platform features to engage users
✅ **Clear CTAs** - Prominent action buttons for better conversion
✅ **Security Notes** - Builds trust with security information
✅ **Fallback Links** - Text links for users whose email clients block buttons
✅ **Brand Consistency** - Uses TheHomeDesigners orange (#e26f09) and blue (#007AFF)
✅ **Email Client Compatible** - Inline CSS for maximum compatibility

## Testing Checklist

After implementing the templates, test each one:

### Signup Confirmation Email
- [ ] Create a new account
- [ ] Verify email arrives within 1 minute
- [ ] Check all service features are listed
- [ ] Confirm button works correctly
- [ ] Test fallback link
- [ ] Verify branding and colors

### Password Reset Email
- [ ] Use "Forgot Password" feature
- [ ] Verify email arrives quickly
- [ ] Check security notice is visible
- [ ] Confirm reset button works
- [ ] Test link expiration (60 minutes)
- [ ] Verify service details display correctly

### Email Change Confirmation
- [ ] Change email address in account settings
- [ ] Verify email arrives at new address
- [ ] Confirm button works correctly
- [ ] Check security notice

### Email Client Testing
Test templates in popular email clients:
- [ ] Gmail (Web & Mobile)
- [ ] Outlook (Web & Desktop)
- [ ] Apple Mail (iOS & macOS)
- [ ] Yahoo Mail
- [ ] Thunderbird

## Customization Tips

### Updating Brand Colors
To change colors, find and replace:
- `#e26f09` - Primary orange color (header background)
- `#007AFF` - Button blue color

### Modifying Service List
In each template, you can:
- Add/remove service items in the services section
- Update service descriptions
- Change icons (use emoji or HTML entities)

### Adjusting Footer
Update footer content:
- Company address and contact info
- Social media links
- Legal disclaimers
- Unsubscribe options

## Additional Email Templates

While you're in the Email Templates section, consider customizing:

- **Invite user** - For inviting users to your application
- **Magic Link** - For passwordless login (if enabled)

## Email Delivery Best Practices

1. **Enable SPF and DKIM** - Configure in Supabase SMTP settings for better deliverability
2. **Test Spam Scores** - Use tools like Mail-Tester.com to check spam scores
3. **Monitor Delivery Rates** - Check Supabase logs for email delivery issues
4. **Warm Up Domain** - If using custom SMTP, gradually increase sending volume
5. **Avoid Spam Triggers** - Don't use excessive caps, exclamation marks, or spam keywords

## Production SMTP Setup (Recommended)

For better deliverability in production, set up custom SMTP:

1. Go to **Project Settings** → **Authentication** → **SMTP Settings**
2. Choose a provider:
   - **SendGrid** - Easy setup, generous free tier
   - **Amazon SES** - Cost-effective, highly reliable
   - **Mailgun** - Developer-friendly
   - **Postmark** - Premium deliverability
3. Configure SMTP credentials
4. Test thoroughly before going live

## Troubleshooting

### Emails Not Arriving
- Check spam/junk folders
- Verify SMTP configuration in Supabase
- Check Supabase Authentication logs
- Ensure domain isn't blacklisted

### Links Not Working
- Verify redirect URLs in Supabase Auth settings
- Check that routes exist in your application
- Ensure SSL is properly configured

### Template Not Updating
- Clear browser cache
- Wait a few minutes for changes to propagate
- Try sending a new test email

### Styling Issues
- Ensure all CSS is inline (email clients strip `<style>` tags)
- Test in multiple email clients
- Use web-safe fonts only
- Keep images hosted externally

## Support

If you need help with email templates:
1. Check Supabase documentation: https://supabase.com/docs/guides/auth
2. Review email delivery logs in Supabase dashboard
3. Test templates using email testing tools

## Notes

- Email confirmation is enabled in your Supabase project
- Users must click confirmation links to activate accounts or reset passwords
- Templates use inline CSS for maximum email client compatibility
- Links expire after 60 minutes for security
- The orange color (#e26f09) matches your brand identity
- Templates are optimized for both desktop and mobile viewing
