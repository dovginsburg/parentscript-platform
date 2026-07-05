# ParentScript Slack App

Therapist notifications and skill search via Slack slash commands.

## Features

1. **Skill Search** — `/parentscript search <query>` searches published skills
2. **Crisis Alerts** — Therapist gets DM when parent triggers safety-guard
3. **Skill Unlock Notifications** — Therapist gets DM when they unlock a skill
4. **Weekly Practice Summaries** — Automated digest of parent practice logs

---

## Setup

### 1. Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From manifest"
3. Paste contents of `slack-app-manifest.json`
4. Install to your workspace

### 2. Configure Environment

Create `.env` file (see `.env.example`):

```bash
# Slack credentials (from https://api.slack.com/apps → your app)
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token  # For socket mode

# Supabase (for skill search)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
SLACK_PORT=3001
NODE_ENV=development
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run

```bash
# Development (with socket mode)
npm run dev

# Production
npm start
```

---

## Usage

### Slash Command

```
/parentscript search tantrum
```

Returns top 5 matching skills with links to parentscript.app.

### Programmatic Notifications

The Slack app exports functions that the backend can call:

```javascript
import { 
  sendSkillUnlockNotification, 
  sendCrisisAlert, 
  sendWeeklyPracticeSummary 
} from '@parentscript/slack-app';

// When therapist unlocks a skill
await sendSkillUnlockNotification({
  therapistSlackId: 'U12345',
  skillTitle: 'Labeled Praise',
  clientLabel: 'Client 042',
});

// When parent triggers crisis response
await sendCrisisAlert({
  therapistSlackId: 'U12345',
  clientLabel: 'Client 042',
  situation: 'Parent described child saying...',
  riskLevel: 'high',
});

// Weekly summary (cron job)
await sendWeeklyPracticeSummary({
  therapistSlackId: 'U12345',
  therapistEmail: 'therapist@example.com',
});
```

---

## Local Development

Use **socket mode** (no ngrok required):

1. Enable Socket Mode in your Slack app settings
2. Generate an app-level token with `connections:write` scope
3. Add `SLACK_APP_TOKEN` to `.env`
4. Run `npm run dev`

Socket mode connects via WebSocket, so no public URL needed for local testing.

---

## Production Deployment

1. Deploy to a server with public URL (e.g., Fly.io, Render, Railway)
2. Disable socket mode in Slack app settings
3. Update event subscription URL: `https://api.parentscript.app/slack/events`
4. Update interactivity URL: `https://api.parentscript.app/slack/interactivity`
5. Set `NODE_ENV=production`

---

## Architecture

```
Slack Workspace
    ↓ slash command: /parentscript
    ↓
ParentScript Slack App (Bolt.js)
    ↓ query skills
    ↓
Supabase (public skills table)
    ↓
    ← results
```

For notifications, the flow is reversed:

```
ParentScript Backend
    ↓ sendCrisisAlert()
    ↓
Slack App (exports notification functions)
    ↓ chat.postMessage
    ↓
Therapist's Slack DM
```

---

## Security

- Slash commands are ephemeral (only visible to user)
- Crisis alerts are sent as DMs (not in channels)
- Skill search uses `SUPABASE_SERVICE_ROLE_KEY` (read-only on published skills)
- No PHI is ever logged or sent to Slack (client labels are non-identifying)

---

## Testing

```bash
# Run tests
npm test

# Test slash command locally
# 1. Run app with socket mode
npm run dev

# 2. In Slack, type:
/parentscript search praise
```

---

## Troubleshooting

### "Invalid signing secret"
- Verify `SLACK_SIGNING_SECRET` matches your app settings
- Check that you're not using the old verification token

### "Skill search returns no results"
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check that skills exist with `is_published = true`
- Test query: `SELECT * FROM skills WHERE is_published = true LIMIT 5;`

### "Socket mode not connecting"
- Ensure `SLACK_APP_TOKEN` starts with `xapp-`
- Verify Socket Mode is enabled in app settings
- Check app token has `connections:write` scope

---

**Built with @slack/bolt v4.3+**
