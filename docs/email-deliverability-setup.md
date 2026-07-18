# Email Deliverability Setup

Turasum sends digest emails through [Resend](https://resend.com). Follow this checklist once, before going live, to ensure emails land in the Primary inbox rather than Spam.

---

## 1. Verify your domain in Resend

1. Log in to [resend.com/domains](https://resend.com/domains) and click **Add Domain**.
2. Enter the domain you want to send from (e.g. `turasum.com`).
3. Resend will show you a set of DNS records to add — follow steps 2–4 below before clicking **Verify**.

---

## 2. Publish SPF (Sender Policy Framework)

SPF tells receiving mail servers which hosts are allowed to send email on behalf of your domain.

Add a **TXT** record to your DNS zone:

| Type | Host | Value |
|------|------|-------|
| TXT | `@` (or your domain root) | `v=spf1 include:amazonses.com ~all` |

> **Why `amazonses.com`?** Resend delivers through Amazon SES infrastructure. The `~all` soft-fail directive passes SPF while flagging anything else as suspicious — a reasonable starting posture.

If you already have an SPF record, merge `include:amazonses.com` into it rather than adding a second TXT record (multiple SPF records break the standard).

---

## 3. Publish DKIM (DomainKeys Identified Mail)

DKIM adds a cryptographic signature to every outgoing email so receivers can verify it really came from you.

Resend generates the DKIM key pair automatically. In the Resend dashboard, after adding your domain, copy the two **CNAME** records it provides and add them to your DNS:

| Type | Host (example) | Value (example) |
|------|----------------|-----------------|
| CNAME | `resend._domainkey` | `resend._domainkey.yourdomain.com.dkim.resend.com` |

The exact hostnames and values come from the Resend dashboard — use those, not the example above.

---

## 4. Publish DMARC (Domain-based Message Authentication, Reporting & Conformance)

DMARC ties SPF and DKIM together and tells receivers what to do when checks fail.

Add a **TXT** record:

| Type | Host | Value |
|------|------|-------|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com` |

Start with `p=none` (monitoring mode) so you can review reports without risking legitimate email being rejected. After a week or two with no issues, tighten to `p=quarantine` and eventually `p=reject`.

Replace `dmarc-reports@yourdomain.com` with any address you control — this is where aggregate reports are sent.

---

## 5. Set the `EMAIL_FROM_ADDRESS` secret

Once your domain is verified in Resend:

1. In the Replit workspace, open **Secrets**.
2. Add (or update) the secret `EMAIL_FROM_ADDRESS` with a value like:

   ```
   Turasum <noreply@yourdomain.com>
   ```

   The display name ("Turasum") shows up in the recipient's inbox; the email address must be on your verified domain.

Without this secret, the API server falls back to Resend's sandbox sender (`onboarding@resend.dev`), which is rate-limited and universally filtered as bulk/promotional mail.

---

## 6. Send a test email and check results

1. Trigger a digest generation for your own account (via the profile page → "Generate now").
2. Check the [Resend dashboard → Emails](https://resend.com/emails) to confirm the status shows **Delivered**.
3. Open the email in Gmail or Outlook and verify it landed in **Primary** (not Spam or Promotions).
4. In Gmail, click the three-dot menu → **Show original** → confirm:
   - `SPF: PASS`
   - `DKIM: PASS`
   - `DMARC: PASS`

---

## 7. Warm-up tips (optional but recommended)

- **Start small.** Send to a handful of engaged users first; low complaint rates help your sender reputation.
- **Avoid spam trigger words** in subjects — already avoided in the current template.
- **Keep the plain-text version.** Both HTML and text bodies are always sent; many spam filters reward this.
- **One-click unsubscribe.** `List-Unsubscribe` and `List-Unsubscribe-Post` headers are already set in the code so Gmail shows a native unsubscribe link — this significantly reduces spam complaints.

---

## Reference: DNS checklist

| Record | Type | Status |
|--------|------|--------|
| SPF | TXT on `@` | ✅ Add manually (see §2) |
| DKIM | CNAME(s) | ✅ Copy from Resend dashboard (see §3) |
| DMARC | TXT on `_dmarc` | ✅ Add manually (see §4) |
| `EMAIL_FROM_ADDRESS` secret | Replit Secret | ✅ Set in Secrets panel (see §5) |
