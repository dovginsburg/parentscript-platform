# Slack app manifest — validation report

Validated on branch `claude/parentscript-unified-922a7c`.

## 1. JSON well-formedness

`apps/slack-app/slack-app-manifest.json` parses cleanly with `python3 -m json.tool`
(no errors). 63 lines, 1.7 KB.

The `_metadata` block (`major_version: 2, minor_version: 1`) matches the
current Slack app-manifest schema (v2 is the current format; v1 was the old
scattered-form schema).

## 2. Scopes

Required scopes from `README.md` and the auth model:

| Scope               | Requested in manifest | Use case                                                                | OK? |
| ------------------- | --------------------- | ----------------------------------------------------------------------- | --- |
| `chat:write`        | yes                   | DM therapists (skill unlocks, crisis pings)                             | yes |
| `chat:write.public` | yes                   | Post announcements to channels the bot is not in                        | yes |
| `commands`          | yes                   | Slash-command routing (`/parentscript-clients`, `/parentscript-unlock`) | yes |
| `users:read`        | yes                   | Resolve therapist Slack user IDs from emails                            | yes |
| `users:read.email`  | yes                   | Same lookup via email address                                           | yes |
| `im:write`          | yes                   | Open DM channels with therapists on demand                              | yes |

All requested scopes are necessary and sufficient for the README's three
notification surfaces (skill unlock, weekly digest, crisis alerts). No
scope is missing; none is over-broad.

Note: `chat:write.public` is a higher-trust scope — Slack requires the app
to be installed by a workspace admin or to be already approved. Worth
flagging during install.

## 3. Slash commands

Both expected commands are present:

- `/parentscript-clients` — "List your ParentScript clients"
- `/parentscript-unlock` — "Unlock a skill for a client"

`should_escape: false` is correct for command-name-shaped inputs (Slack
recommends `true` only when the response text could be interpreted as
mention/link syntax).

No `/parentscript-help` or `/parentscript-status` command is present — not
required by the README, but worth considering as a follow-up if therapists
need quick diagnostic info from Slack.

## 4. URLs

| URL                                         | Manifest value                                     | Expected per README                                                                        |
| ------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Event subscriptions                         | `https://api.parentscript.app/slack/events`        | matches                                                                                    | yes |
| Interactivity                               | `https://api.parentscript.app/slack/interactivity` | matches                                                                                    | yes |
| OAuth redirect (per README §Install step 3) | `https://api.parentscript.app/slack/oauth`         | not in manifest (correct — redirect URL is a Slack-app config field, not a manifest field) | n/a |

All manifest URL fields are present and HTTPS. `socket_mode_enabled: false`
is correct for a public HTTPS-hosted backend (avoids needing a websocket
tunnel).

## 5. Event subscriptions (`bot_events`)

`app_home_opened`, `app_mention`, `message.im` — all relevant for the
documented use cases (App Home tab greeting, mention-driven help, IM
relay for therapist DMs). No extraneous subscriptions.

Note: no `url_verification` event handler is needed in the manifest itself
(Slack does the handshake against the request URL automatically), but the
backend must respond to `type: url_verification` with the `challenge`
echo — see Backend gap §6.

## 6. Backend gap — handlers not present in `apps/backend/server.mjs`

`apps/backend/server.mjs` (747 lines, last commit `44f6f3a`) exposes:

- `/api/health`
- `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook`
- `/api/invite/:code`
- `/api/coach`
- `/api/analytics`

It has **no** Slack routes. The following handlers must be added before
the manifest can be considered end-to-end functional:

| Path                         | Method | Required for                                                             | Notes                                                                                                                                                                                                                                                                                                               |
| ---------------------------- | ------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/slack/events`              | POST   | Event subscriptions (manifest §settings.event_subscriptions.request_url) | Must echo `challenge` on `url_verification`. Verify Slack signing secret (`X-Slack-Signature` + `X-Slack-Request-Timestamp`) using `SLACK_SIGNING_SECRET`. Body must be `application/x-www-form-urlencoded` for slash commands but JSON for events — handle accordingly.                                            |
| `/slack/interactivity`       | POST   | Button/modal submit payloads                                             | Same signing-secret check. Three-second ack requirement — defer heavy work to a background job.                                                                                                                                                                                                                     |
| `/slack/oauth`               | GET    | OAuth install callback (per README §Install step 3)                      | Exchange `code` for token using `SLACK_CLIENT_ID` + `SLACK_CLIENT_SECRET`. Persist `bot_token`, `team_id`, `installer_user_id` in `workspaces` (or similar) table.                                                                                                                                                  |
| `/slack/commands` (optional) | POST   | Slash commands                                                           | Manifest wires slash commands via the **interactivity** request URL by default, so a dedicated `/slack/commands` route is only needed if commands should be handled separately from other interactivity. Slack also supports routing commands via `/slack/events` (type=`slash_command`); pick one and document it. |

Other backend-side prerequisites (not in `server.mjs` yet):

- Env vars: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_CLIENT_ID`,
  `SLACK_CLIENT_SECRET` (the manifest does not embed any of these — they
  are runtime secrets, correct).
- A `workspaces` (or `slack_installs`) Supabase table to persist
  per-workspace bot tokens, keyed by `team_id`.
- Helper module for outbound `chat.postMessage` calls
  (`apps/backend/lib/slack.mjs` or similar) used by the skill-unlock and
  crisis-alert notification paths.
- Wire the skill-unlock UI in `apps/web` to call the backend, which then
  posts to `chat.postMessage` to the therapist's DM.

These gaps do **not** block the manifest from being installed; they block
the app from being functional. Recommended follow-up cards:

1. Add the four `/slack/*` routes to `apps/backend/server.mjs` (or
   extract to `apps/backend/slack.mjs` and mount).
2. Add `workspaces` table to `supabase/` migrations + RLS for therapist-
   scoped reads.
3. Wire skill-unlock UI → backend → `chat.postMessage`.
4. Wire crisis-alert trigger → same channel.

## 7. Summary

- Manifest JSON: valid.
- Scopes: complete and not over-broad.
- Slash commands: both present and correctly described.
- URLs: HTTPS, match README.
- Backend: handlers missing — Slack app cannot receive events until they
  are added.

Status: **manifest OK; backend integration TODO**.
