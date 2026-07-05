# Email Forwarding Setup — parentscript.app → ginsburgezra@gmail.com

**Author:** Sherlock (debug_hermes_v2)
**Date:** 2026-06-25
**Domain:** parentscript.app (Namecheap registrar, Namecheap BasicDNS)
**Goal:** Forward all inbound mail to parentscript.app addresses → ginsburgezra@gmail.com
**Status:** Research complete. **No solution achieves literally-zero-Dov-action.** Recommend Path A below.

---

## TL;DR — Two realistic paths

| Path | Dov action required | One-time or recurring? | Programmatic later? | Reliability |
|---|---|---|---|---|
| **A. Namecheap built-in Email Forwarding (recommended)** | ~60 sec in the already-open tab | One-time setup | Yes, via API *if* enabled (see Path B) | High — runs on Namecheap's MX |
| **B. Namecheap API** | 2 min (toggle ON + whitelist IP, one-time) | One-time, then fully scriptable | Yes, forever | High |
| ~~C. ForwardEmail.net TXT-only~~ | n/a | n/a | n/a | **Not viable** — requires MX records; TXT record on its own does NOT deliver mail |
| ~~D. Cloudflare Email Routing~~ | ~5 min (add zone, change nameservers) | One-time | Yes, via Cloudflare API | High, but more moving parts |

**The catch that motivates this doc:** Namecheap's Advanced DNS dropdown is mutually exclusive between "Email Forwarding" (auto-creates Namecheap's MX, hides manual MX records) and "Custom MX" (lets you add your own MX, hides the forwarding UI). The user's prompt reflects that exact confusion: the dropdown is on Email Forwarding, but the MX records shown by ForwardEmail.net are nowhere to be added.

**The honest answer:** No email forwarding service can deliver mail to a domain without an MX record pointing to a real mail server. The TXT-only records (`_forwardemail`, SPF, DKIM) only *verify* or *authorize* — they do not *receive*. Something has to give. The cheapest give is letting Namecheap set up its own MX records (1 click); the cleanest give is enabling the API (1 toggle + 1 IP whitelist).

---

## Path A — Namecheap built-in Email Forwarding (recommended)

**Cost:** Free (included with all Namecheap domains).
**Dov action:** ~60 seconds. The DNS page is already open in Safari.
**Why this is simplest:** Per Namecheap KB article 308/2214, selecting "Email Forwarding" in the MAIL SETTINGS dropdown and clicking Save All Changes *automatically* inserts the required MX records. No separate MX configuration needed — Namecheap owns that side of it.

### Steps (Dov, in the open Safari tab)

1. In Safari, switch to the tab titled **"Advanced DNS"** at URL `https://ap.www.namecheap.com/Domains/DomainControlPanel/parentscript.app/advancedns`.
2. In the **MAIL SETTINGS** section, confirm the dropdown shows **"Email Forwarding"** (per the task prompt, it already does).
3. Below the dropdown, in the **EMAIL FORWARDING** subsection, add a catch-all rule:
   - **Mailbox:** `*` (asterisk = catch-all for any address on the domain)
   - **Forward to:** `ginsburgezra@gmail.com`
4. Click the green **✓** (add icon) next to the row to commit the catch-all row.
5. Click the green **Save All Changes** button at the top-right of the records table.
6. Wait ~5 minutes for DNS propagation. Test by sending an email to `test@parentscript.app` from any external address (Gmail, Outlook, ProtonMail).

### Verification

```bash
# Check MX records point to Namecheap's email-forwarding servers
dig MX parentscript.app +short @1.1.1.1
# Expected (Namecheap's forwarding mail exchanger, priority 10):
# 10 mx1.privateemail.com.
# 10 mx2.privateemail.com.
# (Or the equivalent efwd.* Namecheap forwarder host — see References below.)

# Check SPF record (auto-added by Namecheap for forwarding)
dig TXT parentscript.app +short @1.1.1.1
# Expected: "v=spf1 include:spf.efwd.regservers.com ~all"

# Confirm no stale _forwardemail TXT leftover from the abandoned ForwardEmail.net path
dig TXT _forwardemail.parentscript.app +short @1.1.1.1
# If this returns "forward-email=ginsburgezra@gmail.com", it is now harmless — can be deleted
# via the Advanced DNS page (click the trash icon next to the record) or left in place.

# End-to-end test
echo "Test from parentscript.app $(date)" | mail -s "Hello" test@parentscript.app 2>&1
# Expected: arrives in ginsburgezra@gmail.com within ~5 min
```

### Catch-all vs explicit mailboxes

A catch-all (`*` → gmail) catches *any* address: `anything@parentscript.app` forwards. Useful while the project is small.

If you want only specific addresses to forward (less spam risk):

| Mailbox | Forward to |
|---|---|
| `hello` | `ginsburgezra@gmail.com` |
| `support` | `ginsburgezra@gmail.com` |
| `press` | `ginsburgezra@gmail.com` |

Add one row per mailbox, all pointing to the same Gmail, then Save All Changes.

### Limitations

- **No sending from @parentscript.app.** Built-in forwarding is receive-only. If you need to send mail *as* `dov@parentscript.app`, you'd need Gmail's "Send mail as" configured with an SMTP relay (e.g., SendGrid, Mailgun, or Namecheap Private Email). Out of scope here — the task is forwarding only.
- **Catch-all forwards spam too.** Anything sent to `random@parentscript.app` (including dictionary attacks) lands in the Gmail inbox. Add an explicit-mailbox rule list instead, or set up a Gmail filter to trash forwarded mail where `To:` doesn't match a known address.
- **Custom MX records and built-in forwarding are mutually exclusive.** If you later want a custom SMTP relay or third-party mail provider (Zoho, Proton, Fastmail), you'll have to switch the dropdown to "Custom MX" and lose the forwarding UI (but you can always recreate the forwarding via Path B's API).

---

## Path B — Namecheap API (programmatic, scriptable forever)

**Cost:** Free (API access is included with all Namecheap accounts).
**Dov action:** ~2 minutes, **one time only**. After that, all DNS and forwarding is scriptable.
**Why choose this:** If you'll be touching parentscript.app DNS again (adding a verification record, a DMARC policy, a DKIM key, a `www` CNAME, etc.), having the API enabled means future changes are a 5-second script call instead of opening the Advanced DNS page each time. The session also unlocks the entire awesome-copilot `namecheap` skill for future use.

### Step 1 — Dov enables API access (one-time, ~2 minutes)

1. Log into Namecheap in Safari (already done — see open tab).
2. Navigate to **Profile → Tools → Business & Dev Tools → API Access** (direct URL: `https://ap.www.namecheap.com/settings/tools/apiaccess/`).
3. Toggle **API Access** to **ON**.
4. Click **Generate API Key** (or regenerate if one exists). Copy the key into a password manager (1Password, Bitwarden). **Never paste the API key into chat.**
5. Under **Whitelisted IP addresses**, add our public IP. Get it from any agent or run on the Mac mini:
   ```bash
   curl -sSL https://api.ipify.org
   # Returns: 98.113.130.39 (current value, may change)
   ```
   Or skip the dynamic lookup and check the existing saved creds file:
   ```
   cat ~/.hermes/api_keys/active/namecheap_2026-05-21.txt
   ```
   If the IP is dynamic (most residential ISPs), re-whitelist whenever the script starts failing. Some ISPs assign static IPs — Comcast/Xfinity business, Verizon Fios, AT&T Fiber typically do.
6. Confirm "API access is enabled" green checkmark shows.

### Step 2 — Configure the local agent (one-time, ~30 seconds)

Create the credentials file at `~/.namecheap-api` (mode 600):

```bash
cat > ~/.namecheap-api <<'EOF'
NAMECHEAP_API_USER="dovginsburg"
NAMECHEAP_API_KEY="<paste-key-here>"
EOF
chmod 600 ~/.namecheap-api
```

Or set env vars instead (preferred if shared across multiple profiles):
```bash
export NAMECHEAP_API_USER="dovginsburg"
export NAMECHEAP_API_KEY="<paste-key-here>"
```

### Step 3 — Run the forwarding setup (agent does this, no Dov)

Using the bundled script from the awesome-copilot Namecheap skill (downloaded into `/tmp/namecheap_skill_script.py` for reference; canonically lives at `~/.hermes/skills/devops/namecheap/namecheap.py` once installed):

```bash
# 1. Verify API access works
python3 /tmp/namecheap_skill_script.py domains.dns.getList --domain parentscript.app

# 2. Inspect current DNS state
python3 /tmp/namecheap_skill_script.py domains.dns.getHosts --domain parentscript.app

# 3. Configure catch-all forwarding to gmail
python3 /tmp/namecheap_skill_script.py domains.dns.setEmailForwarding \
    --domain parentscript.app \
    --forwards '[{"MailBox":"*","ForwardTo":"ginsburgezra@gmail.com"}]'

# 4. Verify the rule was saved
python3 /tmp/namecheap_skill_script.py domains.dns.getEmailForwarding --domain parentscript.app
# Expected: returns the catch-all rule
```

This call is the **single API equivalent of selecting "Email Forwarding" in the dropdown AND clicking Save** — Namecheap's backend automatically writes the right MX records when `setEmailForwarding` is invoked.

### Verification (after the API call)

```bash
# Same dig checks as Path A — should show mx1/mx2.privateemail.com (or efwd.* equivalents)
dig MX parentscript.app +short @1.1.1.1
dig TXT parentscript.app +short @1.1.1.1
dig TXT _forwardemail.parentscript.app +short @1.1.1.1

# Send a real test email
echo "Sherlock path-B test $(date)" | mail -s "Path B test" hello@parentscript.app
```

### Common pitfalls (from the awesome-copilot Namecheap skill)

- **`setHosts` REPLACES ALL RECORDS.** Never call `domains.dns.setHosts` directly — use `dns.addHost` / `dns.removeHost` for single-record changes. The bundled script enforces this internally.
- **IP whitelist is per-key and per-IP.** If the Mac mini's IP changes (DHCP lease expiry, ISP rotation), API calls return `1011102: API Key is invalid or API access has not been enabled`. Re-whitelist the new IP — no need to regenerate the key.
- **Multi-part TLDs** don't apply here (`.app` is a single-label TLD), but the script handles `co.uk`/`com.au` style automatically.
- **API user vs account user.** The API uses the same username as login (`dovginsburg` in this case). Username is case-sensitive.

---

## Path C — ForwardEmail.net (NOT viable as currently configured)

**Verdict:** The existing `_forwardemail = forward-email=ginsburgezra@gmail.com` TXT record is **insufficient on its own**. ForwardEmail.net requires MX records too, per their own documentation and GitHub issues.

What ForwardEmail.net actually needs:

| Type | Host | Value | Priority |
|---|---|---|---|
| MX | `@` | `mx1.forwardemail.net` | 10 |
| MX | `@` | `mx2.forwardemail.net` | 10 |
| TXT | `@` | `v=spf1 include:spf.forwardemail.net ~all` | n/a |
| TXT | `forwardemail` or `_forwardemail` | `forward-email=ginsburgezra@gmail.com` | n/a (already exists) |

The missing piece is the two MX records. ForwardEmail.net's DNS check refuses to enable forwarding for a domain without their MX records (verified by their issue #194, `550: missing required DNS MX records`).

**Why this won't work without MX records:** DNS protocol requires an MX record pointing to a mail server before any other DNS record (TXT, CNAME, etc.) can route inbound mail. The TXT record at `_forwardemail` is a *verification* record — it tells ForwardEmail.net's server "this domain owner authorized forwarding to this address" — but no mail server will even *consult* it unless an MX record first directs the inbound mail to ForwardEmail.net's MX hosts. (Stack Overflow canonical answer: https://stackoverflow.com/questions/17382003)

**Options if you specifically want ForwardEmail.net:**

1. **Switch the Namecheap dropdown to "Custom MX"**, then add the two MX records manually in the Advanced DNS page (the MAIL SETTINGS dropdown choice doesn't affect the manual host-records list below it — only the dropdown above it). The catch-all forwarding UI then disappears, but ForwardEmail.net's web dashboard handles the catch-all via TXT.
2. **Use Path B (API) to add the MX records** programmatically, then leave the `_forwardemail` TXT as-is. ForwardEmail.net's dashboard will activate forwarding within ~30 seconds of the MX records being visible.

The existing `_forwardemail` TXT record is **not harmful** — it can stay or be deleted; it has no effect unless MX records point to ForwardEmail.net's servers.

---

## Path D — Cloudflare Email Routing (most powerful, most setup)

**Cost:** Free for unlimited addresses and forwards on any domain Cloudflare is authoritative for.
**Dov action:** ~5 min (add zone, change nameservers at Namecheap, configure Email Routing).
**Why this is overkill for parentscript.app's current needs:** the project is small, doesn't send mail, and only needs a single forwarding target. Cloudflare Email Routing shines when you have multiple destinations, want to filter spam at the edge, or plan to layer Workers for advanced routing. Path A or B is cheaper in time-to-working.

**Skip unless:** you want wildcard + per-address filtering, multi-destination routing, or a future path to receiving mail into Workers (e.g., auto-creating Supabase tickets from inbound mail).

Not documented step-by-step here. The setup is: add parentscript.app as a zone on Cloudflare (free plan) → copy Cloudflare's two assigned nameservers → paste them into Namecheap's Nameservers section (Custom DNS) → wait for propagation → enable Email Routing in Cloudflare dashboard → add destinations and rules.

---

## Recommendation for parentscript.app

**Use Path A (Namecheap built-in Email Forwarding).**

Reasons:
1. The DNS page is *already open* in Safari with the correct dropdown selection.
2. One catch-all row + one Save click → done. No API enable, no IP whitelist, no zone transfer.
3. Future programmatic control is still possible later by enabling Path B's API (one toggle, takes 2 min when needed — not blocking).
4. The `_forwardemail` TXT record can stay; it's harmless unless MX records point to ForwardEmail.net's hosts.

**Re-evaluate to Path B when:**
- You find yourself opening the Advanced DNS page more than 2-3 times per month.
- A second domain gets added that also needs forwarding (the API makes batch ops trivial).
- We need to script DNS changes as part of a deploy pipeline (e.g., Vercel verification, Supabase custom auth domain, etc.).

**Re-evaluate to Path D when:**
- We need to send mail as @parentscript.app (Cloudflare Email Workers can chain into Mailgun/SES).
- We need spam filtering before forwarding (Cloudflare's filter runs at the edge, Gmail filter is downstream).
- We add a second domain and want one place to manage both.

---

## Verification checklist (all paths)

After whichever path is chosen, run:

```bash
# 1. MX records visible to public resolvers
dig MX parentscript.app +short @1.1.1.1
# Should show 10 mx[N].privateemail.com (Namecheap forwarding)
# OR 10 mx[N].forwardemail.net (ForwardEmail.net)
# OR 10 route[N].mx.cloudflare.net (Cloudflare Email Routing)

# 2. SPF record
dig TXT parentscript.app +short @1.1.1.1
# Should show v=spf1 ... for the chosen provider

# 3. End-to-end test
echo "Test $(date)" | mail -s "Hello" test@parentscript.app
# Wait 5-10 minutes, check ginsburgezra@gmail.com

# 4. Negative test (existing _forwardemail TXT should not affect anything)
dig TXT _forwardemail.parentscript.app +short @1.1.1.1
# If still showing forward-email=ginsburgezra@gmail.com: harmless; safe to delete via Advanced DNS UI
```

---

## Open tabs context (for Sherlock handoff)

Two relevant tabs are open in Safari as of this writing:

| URL | Purpose |
|---|---|
| `https://ap.www.namecheap.com/Domains/DomainControlPanel/parentscript.app/advancedns` | Namecheap Advanced DNS — drop the catch-all row + Save here for Path A |
| `https://forwardemail.net/en/my-account/profile` | ForwardEmail.net profile — irrelevant once Path A or B is chosen (TXT-only path is not viable) |

**State of those tabs at task start (per the prompt):** "Email Forwarding" already selected in MAIL SETTINGS dropdown, `_forwardemail` TXT record present (irrelevant). No DNS records added or modified by this analysis — the file is the deliverable, not the configuration change.

---

## References

- Namecheap KB 308/2214 — [How to set up Free Email Forwarding](https://www.namecheap.com/support/knowledgebase/article.aspx/308/2214/how-to-set-up-free-email-forwarding/) (the canonical guide for Path A; documents that MX records are auto-created on Save)
- Namecheap KB 310/2214 — [How to set up a catch-all (wildcard) email address](https://www.namecheap.com/support/knowledgebase/article.aspx/310/2214/how-to-set-up-a-catchall-wildcard-email-address/) (the `*` mailbox syntax for catch-all)
- Namecheap KB 322/2237 — [How can I set up MX records required for mail service?](https://www.namecheap.com/support/knowledgebase/article.aspx/322/2237/how-can-i-set-up-mx-records-required-for-mail-service/) (background on why the dropdown is mutually exclusive)
- Namecheap API — [`namecheap.domains.dns.setEmailForwarding`](https://www.namecheap.com/support/api/methods/domains-dns/set-email-forwarding/) (Path B equivalent of Path A)
- awesome-copilot Namecheap skill — https://github.com/github/awesome-copilot/blob/main/skills/namecheap/SKILL.md (canonical `namecheap.py` CLI wrapper used for Path B; gotchas on IP whitelist, `setHosts` replacing all records, multi-part TLDs)
- `~/.hermes/skills/devops/tunnel-management/references/namecheap-cloudflare-captcha-dns-workaround.md` — prior-session note: Namecheap login is behind a Cloudflare CAPTCHA that defeats headless browser automation; explains why API + IP whitelist is the durable automation path
- `~/.hermes/api_keys/active/namecheap_2026-05-21.txt` — saved credentials (username + login password, not API key) from prior Cloudflare-tunnel work on `mooreterminal.site`
- Stack Overflow — [Using MX Records to Forward Email to Another Domain](https://stackoverflow.com/questions/17382003) (canonical "TXT alone doesn't deliver mail" answer — referenced in Path C)
- ForwardEmail.net GitHub issue #194 — [550: missing required DNS MX records of mx1.forwardemail.net](https://github.com/forwardemail/free-email-forwarding/issues/194) (confirms MX records are mandatory, not optional)
- Cloudflare Email Routing — https://www.cloudflare.com/products/email-routing/ (Path D entry point; free with any zone on Cloudflare)
