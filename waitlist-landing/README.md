# Data Gems - Waitlist Landing Page

A beautiful, responsive waitlist landing page for Data Gems - Your Personal AI Context Provider.

## 🚀 Features

- **Responsive Design** - Works perfectly on all devices
- **Data Gems Design System** - Consistent with the main extension
- **Interactive Animations** - Smooth scrolling and entrance animations
- **Waitlist Management** - Complete form handling with validation
- **Performance Optimized** - Fast loading with optimized assets
- **SEO Ready** - Proper meta tags and social media previews

## 🎨 Design System

The landing page uses the same design system as the Data Gems Chrome extension:

- **Colors**: Coral pink (#EC6F95) and teal (#00A699) accent colors
- **Typography**: Circular font family with proper weight hierarchy
- **Components**: Consistent buttons, cards, and form elements
- **Spacing**: 12px border radius and consistent padding/margins

## 📁 File Structure

```
waitlist-landing/
├── index.html          # Main landing page
├── styles.css          # Complete CSS with design system
├── script.js           # Interactive functionality
├── vercel.json         # Vercel deployment configuration
├── package.json        # Project metadata
├── assets/             # Images and icons
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── favicon-16x16.png   # Browser favicon
├── favicon-32x32.png   # Browser favicon
└── README.md           # This file
```

## 🛠 Local Development

To run the landing page locally:

```bash
# Simple Python server
python -m http.server 3000

# Or using Node.js
npx serve .

# Or any other static server
```

Then visit `http://localhost:3000`

## 🌐 Deployment to Vercel

1. **Connect to Vercel**:
   ```bash
   vercel --cwd waitlist-landing
   ```

2. **Configure Settings**:
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: (leave empty)
   - Output Directory: `./`

3. **Environment Variables** (optional):
   - Add any analytics or form handling service keys
   - Configure custom domain if desired

4. **Deploy**:
   ```bash
   vercel --prod --cwd waitlist-landing
   ```

## 📊 Analytics Integration

The landing page is ready for analytics integration:

```javascript
// Google Analytics 4
gtag('event', 'waitlist_signup', {
  email_domain: 'gmail.com',
  use_case: 'work'
});

// Or your preferred analytics service
```

## 📝 Waitlist Management

The current implementation stores waitlist entries in localStorage for demo purposes. For production, integrate with:

- **Email Services**: Mailchimp, ConvertKit, EmailOctopus
- **Database**: Supabase, Firebase, or your own backend
- **CRM**: HubSpot, Pipedrive, etc.

Update the `submitToWaitlist` method in `script.js`:

```javascript
async submitToWaitlist(data) {
  const response = await fetch('/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

## 🎯 Key Sections

1. **Hero** - Compelling headline with value proposition
2. **Features** - 6 key features with icons and descriptions
3. **How It Works** - 3-step process explanation
4. **Waitlist** - Email capture form with validation
5. **Footer** - Links and branding

## 📱 Responsive Breakpoints

- **Desktop**: 1200px+ (3-column layouts)
- **Tablet**: 768px-1199px (2-column layouts)
- **Mobile**: <768px (single column, stacked layouts)

## 🚀 Performance Features

- Optimized images and icons
- CSS animations using transforms (GPU accelerated)
- Lazy loading with Intersection Observer
- Minimal JavaScript bundle
- Cached static assets

## 🔒 Security Headers

Configured in `vercel.json`:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: enabled

## 📞 Support

For questions about the landing page:
- Email: hello@datagems.dev
- GitHub Issues: [Repository Issues](https://github.com/n3rdstyle/data-gems/issues)

---

Built with ❤️ for the Data Gems community