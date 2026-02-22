# Automation Endpoint Guide (n8n Integration)

## Overview

`POST /api/admin/automation/run` is a dedicated endpoint for n8n automation workflows to generate guides programmatically.

### Key Features

- **Bearer Token Authentication**: Uses `AUTOMATION_SECRET` env var (no admin cookie needed)
- **Route-Based Guide Generation**: Generates guides based on existing routes
- **Duplicate Detection**: Prevents duplicate guides using recipe_key collision detection
- **Dry Run Support**: Preview generation without DB insert
- **Reuses Existing Logic**: Leverages the same template/helper functions as manual generation

---

## Authentication

```bash
Authorization: Bearer <AUTOMATION_SECRET>
```

- Set `AUTOMATION_SECRET` in your environment variables (`.env.local`)
- n8n should include this token in the `Authorization` header

---

## Request Schema

### Endpoint

```
POST /api/admin/automation/run
```

### Headers

```
Content-Type: application/json
Authorization: Bearer <AUTOMATION_SECRET>
```

### Body (JSON)

```json
{
  "run_type": "generate_guide_route_based",
  "recipe_key": "route_guide_3k_v1",
  "lang": "ko",
  "input": {
    "route_slug": "long-to-shorts"
  },
  "dry_run": false
}
```

#### Fields

| Field       | Type    | Required | Description                                         |
| ----------- | ------- | -------- | --------------------------------------------------- |
| `run_type`  | string  | Yes      | Must be `"generate_guide_route_based"`              |
| `recipe_key`| string  | Yes      | Recipe identifier (e.g., `route_guide_3k_v1`)       |
| `lang`      | string  | Yes      | Language: `"ko"` or `"en"` (ko → kr internally)     |
| `input`     | object  | Yes      | Input parameters                                    |
| `input.route_slug` | string | Yes | Route slug to generate guide for             |
| `dry_run`   | boolean | No       | If `true`, returns preview without saving (default: `false`) |

---

## Response Schema

### Success (200)

```json
{
  "ok": true,
  "guide_id": 123,
  "slug": "turn-long-videos-into-shorts-1738499200000",
  "status": "review",
  "published_source": "n8n",
  "lang": "kr",
  "recipe_key": "route_based:video-editing:turn-long-videos-into-shorts:kr:A",
  "variant": "A"
}
```

### Dry Run Success (200)

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

### Error Responses

#### 401 Unauthorized

```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

#### 400 Bad Request

```json
{
  "ok": false,
  "error": "input.route_slug is required"
}
```

#### 404 Not Found

```json
{
  "ok": false,
  "error": "Route not found: invalid-slug"
}
```

#### 409 Conflict (Duplicate)

```json
{
  "ok": false,
  "error": "duplicate_automation_key"
}
```

---

## Implementation Details

### Recipe Generation Flow

1. **Authentication**: Validates Bearer token against `AUTOMATION_SECRET`
2. **Route Lookup**: Fetches route data from DB using `input.route_slug`
3. **Recipe Building**: Constructs recipe object from route metadata
4. **Variant Selection**: Computes default variant (A/B/C) and rotates if collision detected
5. **Duplicate Check**: Queries existing guides + generation logs to prevent duplicates
6. **Content Generation**: Uses `buildFreeGuideEn()` template (no OpenAI API calls)
7. **Preflight Validation**: Checks content length (min 500 chars) and H2 presence
8. **DB Insert**: Creates guide with `status: "review"` and `published_source: "n8n"`
9. **Logging**: Records generation in `admin_guide_generation_logs` (mode: "n8n")

### Key Differences from Manual Generation

| Feature                  | Manual (`/admin/guides/generate`) | Automation (`/automation/run`) |
| ------------------------ | --------------------------------- | ------------------------------ |
| Authentication           | Admin cookie + system_admins      | Bearer token (AUTOMATION_SECRET)|
| Recipe Selection         | Random from predefined pool       | Route-based (from input)       |
| Daily Limit              | Yes (2 per day, KST)              | No daily limit                 |
| OpenAI Usage             | Optional (if OPENAI_ENABLED=true) | Never (always free template)   |
| Published Source         | `null`                            | `"n8n"`                        |
| Log Mode                 | `"auto"`                          | `"n8n"`                        |

---

## Environment Variables

Add to `.env.local`:

```bash
# Required for /api/admin/automation/run
AUTOMATION_SECRET=your-secure-secret-here
```

Generate a secure secret:

```bash
# Using OpenSSL
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## n8n Workflow Example

### HTTP Request Node Configuration

**URL**: `https://your-domain.com/api/admin/automation/run`

**Method**: `POST`

**Authentication**: `Generic Credential Type`
- **Header Name**: `Authorization`
- **Header Value**: `Bearer {{ $env.AIROUTE_AUTOMATION_SECRET }}`

**Body (JSON)**:

```json
{
  "run_type": "generate_guide_route_based",
  "recipe_key": "route_guide_3k_v1",
  "lang": "ko",
  "input": {
    "route_slug": "{{ $json.route_slug }}"
  },
  "dry_run": false
}
```

**Success Condition**: `{{ $json.ok === true }}`

---

## Testing

### Using curl

```bash
# Test with existing route
curl -X POST https://your-domain.com/api/admin/automation/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-here" \
  -d '{
    "run_type": "generate_guide_route_based",
    "recipe_key": "route_guide_3k_v1",
    "lang": "ko",
    "input": {
      "route_slug": "long-to-shorts"
    },
    "dry_run": true
  }'
```

### Using Node.js (fetch)

```javascript
const response = await fetch('https://your-domain.com/api/admin/automation/run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.AUTOMATION_SECRET}`,
  },
  body: JSON.stringify({
    run_type: 'generate_guide_route_based',
    recipe_key: 'route_guide_3k_v1',
    lang: 'ko',
    input: {
      route_slug: 'long-to-shorts',
    },
    dry_run: true,
  }),
});

const data = await response.json();
console.log(data);
```

---

## Troubleshooting

### Error: "Unauthorized"

- Check that `AUTOMATION_SECRET` is set in `.env.local`
- Verify Bearer token format: `Authorization: Bearer <token>`
- Ensure no extra whitespace in token

### Error: "Route not found"

- Verify route exists in DB: `SELECT * FROM routes WHERE slug = 'your-slug'`
- Check route status is `published` or `active`

### Error: "duplicate_automation_key"

- A guide already exists for this route/lang/variant combination
- Try a different route, or manually delete/archive the existing guide
- The system will auto-rotate variants (A→B→C) but if all are used, it returns 409

### Error: "Content too short" or "Content missing H2 sections"

- This indicates template generation failed validation
- Check route metadata (taxonomy, primary_intent) is valid
- Review `buildFreeGuideEn()` template logic for the specific recipe type

---

## Database Tables

### `guides`

New guide records will have:

- `status`: `"review"`
- `published_at`: `null`
- `published_source`: `"n8n"`
- `generation_version`: Value from `recipe_key` parameter

### `admin_guide_generation_logs`

Each generation is logged with:

- `mode`: `"n8n"`
- `created_by`: `"n8n"`
- `recipe_key`: Full recipe key (e.g., `route_based:video-editing:...:kr:A`)
- `lang`: `"kr"` or `"en"`

---

## Security Considerations

- **Never commit** `AUTOMATION_SECRET` to git
- Use environment-specific secrets in Vercel/hosting platform
- Rotate `AUTOMATION_SECRET` periodically
- Monitor `admin_guide_generation_logs` for unexpected usage
- Consider adding IP allowlist if n8n runs on fixed infrastructure

---

## Future Enhancements

- [ ] Support for `tool_based` and `theme` guide types
- [ ] Batch generation (multiple routes in one request)
- [ ] Custom template selection (override default variant logic)
- [ ] Webhook callback for async generation notifications
- [ ] Rate limiting per n8n workflow ID
