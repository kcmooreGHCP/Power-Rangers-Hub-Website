# README

## Co-Pilot Power Rangers Hub

A Store Operations Innovation Hub for discovering Copilot prompts, sharing smart automations, and turning everyday friction into enterprise-wide solutions.

### Features

- **Prompt Launchpad** – Copy pre-built prompts for leadership recaps, process analysis, and action planning
- **Quick Links** – Fast access to Copilot chat, Power Automate, and team resources
- **Idea Submission** – Capture automation opportunities, prompt ideas, and success stories
- **SharePoint Integration** – Submit ideas directly to your organization's innovation tracking system via Power Automate

### Quick Start

1. **Local Preview:**
   ```bash
   python3 -m http.server 8000
   ```
   Then open: http://localhost:8000

2. **Connect to SharePoint:**
   - Follow the setup guide in `POWER-AUTOMATE-SETUP.md`
   - Update `powerAutomateUrl` in `index.html` line 28 with your Power Automate webhook

3. **Customize Quick Links:**
   - Edit the `CONFIG.quickLinks` array in `index.html` (lines 29-34)
   - Update titles, descriptions, icons, and URLs for your team's destinations

### Configuration

All customization is in the `CONFIG` object at the top of the inline script (line 27 in `index.html`):

```javascript
const CONFIG={
  powerAutomateUrl:"",  // Power Automate webhook URL for form submissions
  quickLinks:[
    // Add/edit quick link destinations here
  ]
};
```

### How It Works

**Demo Mode (No Power Automate):**
- Ideas are saved to browser localStorage
- Useful for testing and local development
- Ideas persist for this browser session

**Production Mode (With Power Automate):**
- Ideas are submitted to Power Automate webhook
- Webhook creates entries in your SharePoint list
- Optional automation: create SET Loop tasks or send notifications

### Deployment

This is a static single-file HTML site — no build process required.

**Option 1: Host on SharePoint**
1. Upload `index.html` to your SharePoint site
2. Create a new modern page and embed it via Web Part

**Option 2: Host on any web server**
- Copy `index.html` to your hosting provider
- Ensure CORS is configured if your Power Automate flow is on a different domain

**Option 3: Microsoft Teams**
- Upload to Teams as a Tab using the static HTML hosting option

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires JavaScript enabled

### Accessibility

- Keyboard navigation (Tab through form fields)
- Semantic HTML and ARIA labels
- Modal dialog properly labeled and announced
- Color contrast meets WCAG AA standards

### Support & Contribution

Questions or ideas? Submit via the form on the site itself, or contact your Store Operations Power Rangers team lead.

---

**Last Updated:** August 15, 2026  
**Version:** 1.0  
**Status:** Production-ready (awaiting Power Automate configuration)
