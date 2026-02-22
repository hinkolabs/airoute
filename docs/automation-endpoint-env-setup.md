# Automation Endpoint - Environment Setup

## Required Environment Variable

Add the following to your `.env.local` file:

```bash
# n8n Automation Secret (for /api/admin/automation/run)
AUTOMATION_SECRET=your-secure-secret-here
```

## Generating a Secure Secret

Choose one of these methods to generate a secure secret:

### Using OpenSSL (recommended)

```bash
openssl rand -hex 32
```

### Using Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Example Output

```
a3f9d8c7e2b1f6a4c8d9e3b7f1a2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1
```

## Production Deployment (Vercel)

1. Go to Vercel Project Settings → Environment Variables
2. Add new variable:
   - **Name**: `AUTOMATION_SECRET`
   - **Value**: (paste your generated secret)
   - **Environment**: Production, Preview, Development
3. Redeploy your application

## n8n Configuration

In your n8n workflow, configure the HTTP Request node:

1. **Authentication Type**: Header Auth
2. **Header Name**: `Authorization`
3. **Header Value**: `Bearer {{ $env.AIROUTE_AUTOMATION_SECRET }}`

Then add `AIROUTE_AUTOMATION_SECRET` to your n8n environment variables.

## Security Best Practices

- **Never commit secrets to git** - use `.env.local` (already in `.gitignore`)
- **Use different secrets** for dev/staging/production environments
- **Rotate secrets periodically** (e.g., every 90 days)
- **Monitor logs** for unauthorized access attempts
- **Consider IP allowlisting** if n8n runs on static infrastructure

## Testing Locally

```bash
# Set in .env.local
AUTOMATION_SECRET=dev-secret-for-testing-only

# Test with curl
curl -X POST http://localhost:3000/api/admin/automation/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-secret-for-testing-only" \
  -d '{
    "run_type": "generate_guide_route_based",
    "recipe_key": "test_v1",
    "lang": "ko",
    "input": {
      "route_slug": "long-to-shorts"
    },
    "dry_run": true
  }'
```

## Troubleshooting

### Error: "AUTOMATION_SECRET not configured"

- The environment variable is missing from `.env.local` or Vercel settings
- Restart your dev server after adding the variable

### Error: "Unauthorized"

- Check Bearer token format: `Authorization: Bearer <secret>`
- Ensure no extra whitespace or quotes around the secret value
- Verify the secret matches exactly (case-sensitive)

### Success Response Example

```json
{
  "ok": true,
  "dry_run": true,
  "preview": {
    "title": "A Practical Route to turn long videos into shorts",
    "excerpt": "A clear, practical guide...",
    "content_length": 3245,
    "has_h2": true,
    "slug": "turn-long-videos-into-shorts-1738499200000",
    "lang": "kr",
    "recipe_key": "route_based:video-editing:turn-long-videos-into-shorts:kr:A",
    "variant": "A"
  }
}
```
