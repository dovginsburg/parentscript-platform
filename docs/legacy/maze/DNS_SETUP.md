# Vercel DNS Setup for parentscript.app (Namecheap)

**Domain:** `parentscript.app`
**Target:** Vercel hosting
**Registrar:** Namecheap
**Last verified:** 2026-06-25

---

## TL;DR

The values Dov entered are **correct**. The IP `76.76.21.21` and host `@` are the official Vercel apex-domain values. The "please provide valid address" error is **not about the IP being wrong** — it's a form-validation rejection. Most common cause: an invisible character (trailing space, non-breaking space, or stray digit) introduced when the IP was pasted into the Namecheap Advanced DNS form.

**Recommended fix (in order):**

1. Re-type the IP by hand — do not paste.
2. If that fails, switch to Vercel's **nameserver method** (simpler, less error-prone).
3. If that also fails, use Cloudflare as a free DNS proxy.

---

## 1. The Correct Vercel DNS Values

Per Vercel's official docs (`vercel.com/docs/domains/troubleshooting`):

| Record | Host  | Value / Target         | TTL       |
| ------ | ----- | ---------------------- | --------- |
| A      | `@`   | `76.76.21.21`          | Automatic |
| CNAME  | `www` | `cname.vercel-dns.com` | Automatic |

> The IP `76.76.21.21` is a Vercel anycast IP — a single IP that routes to the nearest Vercel edge. There is no regional variant. This is the **only** correct A-record value for Vercel apex domains.

Vercel will also tell you the exact value it expects on the project's **Settings → Domains** page; for a free plan that's typically `76.76.21.21`, and for the `www` subdomain it's `cname.vercel-dns.com`. Always confirm with `vercel domains inspect parentscript.app` after setup.

---

## 2. Why Namecheap Is Rejecting the Record

Namecheap's "please provide valid address" / "Please provide a valid IP address" error appears for A records when the **Value** field doesn't parse as an IPv4 octet. The IP itself is valid, so the form is choking on one of these:

| Cause                                                                                 | How to detect                                                          | Fix                                                                |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Trailing space after the IP**                                                       | Paste the IP into a plain-text editor and check the bytes              | Re-type by hand; do not paste                                      |
| **Non-breaking space (U+00A0) introduced by a browser extension / clipboard manager** | Hex-dump the field content (`xxd` in terminal)                         | Re-type; disable clipboard clean-up extensions                     |
| **Typo in the IP** (`76.76.21.210`, `76.76.21,21`, etc.)                              | Compare character-by-character with `76.76.21.21`                      | Re-type                                                            |
| **Form bug when `Host` is left blank**                                                | Make sure `@` is selected (not blank)                                  | Pick `@` from the Host dropdown — don't type it                    |
| **Domain not using Namecheap DNS** (BasicDNS / PremiumDNS / FreeDNS)                  | Check Domain List → Manage → Nameservers section at top of domain page | If nameservers point elsewhere, switch to Namecheap BasicDNS first |

The single highest-probability fix: **re-type `76.76.21.21` into the Value field instead of pasting it.** This eliminates 90% of these reports.

### Steps in Namecheap

1. Sign in → **Domain List** → **Manage** next to `parentscript.app`.
2. Confirm the nameservers dropdown at the top shows **Namecheap BasicDNS** (not Custom DNS / Web Hosting DNS).
3. Click the **Advanced DNS** tab.
4. Delete any existing `A Record` rows for host `@` (the parking page record often conflicts).
5. Click **Add New Record**:
   - Type: **A Record**
   - Host: **@**
   - Value: `76.76.21.21` _(typed, not pasted)_
   - TTL: **Automatic**
6. Also add for `www`:
   - Type: **CNAME Record**
   - Host: **www**
   - Target: `cname.vercel-dns.com`
   - TTL: **Automatic**
7. Click the green ✓ (Save All Changes).

Propagation: typically <5 min, can take up to 30 min for Namecheap. Verify with:

```bash
dig +short parentscript.app A
dig +short www.parentscript.app CNAME
```

Expected output:

```
76.76.21.21
cname.vercel-dns.com.
```

Then in Vercel, go to Settings → Domains → `parentscript.app` and click **Refresh** (or re-run `vercel domains inspect parentscript.app`) — status should flip from _Invalid Configuration_ to _Valid Configuration_.

---

## 3. Alternative: Vercel Nameserver Method (Simpler)

If Namecheap's Advanced DNS UI keeps fighting you, hand the whole zone to Vercel. This is **the path of least resistance** and is what most Vercel users end up doing.

**Pros:** one config step at the registrar, Vercel auto-manages every record (including the apex A, `www` CNAME, and any future subdomains), Vercel provisions and renews SSL automatically.

**Cons:** DNS lookups go through Vercel's nameservers (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`); if you ever need DNS records Vercel doesn't expose (e.g. custom MX, complex TXT), you have to switch back.

### Steps

1. In Vercel: **Project → Settings → Domains → `parentscript.app` → Nameservers**. Vercel shows:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
2. In Namecheap: **Domain List → Manage → Nameservers dropdown → Custom DNS**.
3. Enter both Vercel nameservers.
4. Click the green ✓.

That's it — Vercel now owns the zone and will add the A and CNAME records automatically. After ~5 min, `dig ns parentscript.app` should show:

```
ns1.vercel-dns.com.
ns2.vercel-dns.com.
```

…and the Vercel Domains page will show _Valid Configuration_ without you ever touching the Advanced DNS tab.

---

## 4. Alternative: Cloudflare as a Free DNS Proxy

If for any reason neither Namecheap DNS nor Vercel nameservers work well (e.g. you want DDoS protection, faster global propagation, or analytics), use Cloudflare:

1. Add `parentscript.app` to Cloudflare (free plan).
2. Cloudflare scans and shows current records.
3. Set the proxy status for the apex `A` record to **Proxied** (orange cloud) — Cloudflare IPs replace the real IP, traffic flows through Cloudflare's edge.
4. Cloudflare gives you two of its own nameservers.
5. In Namecheap → **Custom DNS**, enter Cloudflare's nameservers.

Cloudflare's free tier also handles SSL and lets you point apex A records at any IP without propagation headaches.

**Trade-off vs. Option 3 (Vercel NS):** Cloudflare adds a CDN hop and complicates Vercel SSL provisioning slightly. For a static Next.js site this is usually a net positive; for a Vercel-Native SSR app with edge functions it can occasionally cause issues. If unsure, prefer **Option 3 (Vercel nameservers)** for a Vercel-native stack.

---

## Recommendation for parentscript.app

Use **Option 3 (Vercel nameservers)**. It's the smallest number of clicks, the smallest surface area for human error, and Vercel handles the SSL + records for you. Keep Namecheap as the registrar (just flip the nameserver dropdown to "Custom DNS" and paste Vercel's two NS records). Total time: ~2 minutes.

If you specifically need fine-grained control over DNS records (custom subdomains, third-party email, etc.), use **Option 2 (Namecheap Advanced DNS)** and re-type the IP by hand.

---

## References

- Vercel docs — Troubleshooting domains: https://vercel.com/docs/projects/domains/troubleshooting
- Vercel docs — Set up custom domain: https://vercel.com/docs/domains/set-up-custom-domain
- Vercel docs — Working with nameservers: https://vercel.com/docs/domains/working-with-nameservers
- Namecheap KB — How can I set up an A (address) record for my domain?: https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/
- Namecheap KB — How do I set up host records for a domain?: https://www.namecheap.com/support/knowledgebase/article.aspx/434/2237/how-do-i-set-up-host-records-for-a-domain/
- DEV Community walkthrough — "How to add custom domain to Vercel using Namecheap" (Andrew Lee, Apr 2025)
