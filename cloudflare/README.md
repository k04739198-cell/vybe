# Cloudflare Setup: UK Geo-Block & DDoS Protection

## Option A: One-Click WAF Custom Rule (Recommended & Free)
1. Log into your Cloudflare Dashboard and select your domain (`vybe.live`).
2. Go to **Security** → **WAF** → **Custom Rules** → **Create Rule**.
3. Configure the rule:
   - **Rule name**: `UK Geo-Block (Online Safety Act)`
   - **Field**: `Country`
   - **Operator**: `equals`
   - **Value**: `United Kingdom`
   - **Action**: `Block` (or `Managed Challenge`)
4. Click **Deploy**. Takes effect globally within 30 seconds.

## Option B: Custom 451 Page via Cloudflare Worker
1. Install Wrangler or go to **Workers & Pages** in Cloudflare.
2. Deploy `cloudflare/worker.js`.
3. Add a route for `*vybe.live/*`.
4. UK users will see a styled 451 "Unavailable for Legal Reasons" notice compliant with UK OSA guidelines.
