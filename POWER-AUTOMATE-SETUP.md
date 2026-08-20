# Power Automate Integration Guide

## Overview

This guide enables the Co-Pilot Power Rangers Hub to submit ideas directly to SharePoint via Power Automate.

## Setup Steps

### 1. Create a SharePoint List for Ideas

1. Navigate to your SharePoint site: https://vscocorp.sharepoint.com/sites/Co-PilotPowerRangersHub
2. Create a new List called **"Idea Submissions"** with these columns:
   - **Title** (auto-created)
   - **Name** (Text) – Submitter name
   - **Email** (Text) – Submitter email
   - **Team** (Text) – Team/function
   - **Request Type** (Choice) – Options: Help me automate this | Build or improve a prompt | Share a success | I know there is a better way | Other
   - **Details** (Multiline Text) – Description of the challenge/idea
   - **Impact** (Text) – Who this would help
   - **Submitted At** (Date/Time) – Timestamp of submission

### 2. Create a Power Automate Flow

1. Go to https://make.powerautomate.com/
2. Create a new cloud flow: **Instant cloud flow** (trigger: HTTP POST request)
3. Use this JSON schema for the request body:

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "email": { "type": "string" },
    "team": { "type": "string" },
    "type": { "type": "string" },
    "title": { "type": "string" },
    "details": { "type": "string" },
    "impact": { "type": "string" },
    "submittedAt": { "type": "string" }
  }
}
```

4. Add an action: **SharePoint – Create item**
   - **Site Address:** Your SharePoint site URL
   - **List Name:** Idea Submissions
   - **Map the fields:** Match form fields to list columns

5. Add an optional action: **Send an email notification** to your team's inbox

6. Save and copy the HTTP POST URL

### 3. Update the Website Configuration

Open `index.html` and update line 28:

```javascript
const CONFIG={
  powerAutomateUrl:"YOUR_POWER_AUTOMATE_WEBHOOK_URL_HERE",
  quickLinks:[...]
};
```

Paste the Power Automate HTTP POST URL you copied in step 2.6.

### 4. Test the Integration

1. Open the site locally: `python3 -m http.server 8000` (or deploy to your hosting)
2. Click "Submit an idea" or "Can you help me automate this?"
3. Fill out and submit the form
4. Check your SharePoint "Idea Submissions" list to confirm the entry was created

## Optional: Connect to SET/SET Loop

If you use a SET Loop workflow:

1. In Power Automate, add another action after creating the SharePoint item
2. **Microsoft Lists – Create item** in your SET Loop list with:
   - **Source Idea ID** (from SharePoint item ID)
   - **Status** = "New Submission"
   - **Priority** = Based on impact/request type
   - **Owner** = Assign to your Power Rangers team lead

This creates an automated feedback loop from submissions → SET Loop tracking.

## Security Notes

- The Power Automate flow URL is a public webhook. If you need to restrict submissions, add IP allowlisting or authentication headers.
- Never commit the actual URL to version control; keep it in a configuration file or environment variable.
- Consider adding rate limiting or spam checks in Power Automate if needed.

## Support

If submissions aren't flowing to SharePoint:
1. Check Power Automate run history for failures
2. Verify SharePoint list column names match the flow mapping
3. Check browser console for JavaScript errors (F12 → Console tab)
4. Ensure CORS headers are configured if using a different domain
