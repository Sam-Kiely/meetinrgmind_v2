# MeetingMind Deployment Guide

## Pre-Deployment Checklist

### 1. GitHub Repository
- [ ] Create repository on GitHub
- [ ] Push code to GitHub
- [ ] Verify all files are committed

### 2. Supabase Setup
- [ ] Create Supabase project
- [ ] Run database schema (supabase/schema.sql)
- [ ] Enable Email auth in Authentication settings
- [ ] Get API keys (URL, anon key, service role key)

### 3. Stripe Configuration
- [ ] Create Stripe account
- [ ] Get API keys (publishable and secret)
- [ ] Create subscription products:
  - Free: $0/month (5 meetings limit)
  - Individual: $19/month (unlimited meetings)
  - Team: $49/month (unlimited + team features)
- [ ] Note product IDs for each tier

### 4. Environment Variables
Required for production:
```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET= (add after Vercel deploy)
NEXT_PUBLIC_APP_URL=https://getmeetingmind.com
```

### 5. Vercel Deployment
- [ ] Connect GitHub repo to Vercel
- [ ] Add all environment variables
- [ ] Deploy to production
- [ ] Test deployment on Vercel URL

### 6. Domain Configuration (Porkbun → Vercel)

Add to Porkbun DNS:
```
Type: A
Host: @
Answer: 76.76.21.21

Type: CNAME
Host: www
Answer: cname.vercel-dns.com
```

In Vercel:
- [ ] Add getmeetingmind.com
- [ ] Add www.getmeetingmind.com
- [ ] Verify domain connection

### 7. Post-Deployment

#### Stripe Webhook
1. Add webhook endpoint: `https://getmeetingmind.com/api/webhooks/stripe`
2. Select events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
3. Copy webhook secret to Vercel env vars

#### Supabase Security
1. Enable Row Level Security on all tables
2. Set up proper auth policies
3. Configure email templates for auth

#### Testing
- [ ] Test user registration
- [ ] Test login/logout
- [ ] Test meeting analysis
- [ ] Test payment flow
- [ ] Test email generation
- [ ] Verify mobile responsiveness

## Monitoring

### Essential Services to Monitor
1. **Vercel Dashboard**: Check build status and function logs
2. **Supabase Dashboard**: Monitor database usage and auth
3. **Stripe Dashboard**: Track payments and subscriptions
4. **API Usage**:
   - Anthropic Claude usage
   - OpenAI Whisper usage

### Error Tracking (Optional)
Consider adding:
- Sentry for error tracking
- Google Analytics for user insights
- Hotjar for user behavior

## Support

For deployment issues:
1. Check Vercel function logs
2. Verify environment variables
3. Check Supabase logs
4. Test API endpoints individually

## Security Reminders

1. Never commit API keys to GitHub
2. Use environment variables for all secrets
3. Enable 2FA on GitHub, Vercel, Stripe, Supabase
4. Regularly rotate API keys
5. Monitor usage to prevent abuse

## Launch Checklist

Before going live:
- [ ] Test full user journey
- [ ] Verify payment processing
- [ ] Check email deliverability
- [ ] Test on multiple devices
- [ ] Prepare customer support email
- [ ] Create terms of service page
- [ ] Create privacy policy page
- [ ] Set up customer support system