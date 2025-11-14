# External API Setup Guide

This guide will help you set up and start using the new External API for Planka.

## What Was Implemented

✅ **API Key Authentication System**
- API key model with secure hashing (SHA-256)
- Validation helper for authenticating requests
- Support for key expiration and soft deletion
- Last-used timestamp tracking

✅ **Authentication Hook Enhancement**
- Modified `current-user` hook to support `X-API-Key` header
- Maintains backward compatibility with existing Bearer token auth
- Sets `isExternalApi` flag for API key requests

✅ **External API Controllers**
- **Boards**: List boards, get board details with lists
- **Cards**: Create, read, update, delete cards
- **API Keys**: Create, list, delete API keys

✅ **Route Configuration**
- All endpoints under `/api/external/*`
- Fully integrated with existing Planka routing

✅ **Documentation**
- Complete API documentation in `EXTERNAL_API.md`
- Example code in Node.js, Python, and cURL
- Security best practices

## Files Created/Modified

### New Files
```
server/api/models/ApiKey.js
server/api/helpers/api-keys/validate-key.js
server/api/helpers/api-keys/generate-key.js
server/api/controllers/external/boards-index.js
server/api/controllers/external/boards-show.js
server/api/controllers/external/cards-show.js
server/api/controllers/external/cards-create.js
server/api/controllers/external/cards-update.js
server/api/controllers/external/cards-delete.js
server/api/controllers/external/api-keys-index.js
server/api/controllers/external/api-keys-create.js
server/api/controllers/external/api-keys-delete.js
EXTERNAL_API.md
EXTERNAL_API_SETUP.md
```

### Modified Files
```
server/api/hooks/current-user/index.js
server/config/routes.js
```

## Setup Steps

### 1. Database Migration

The `ApiKey` model needs a database table. Sails.js will handle this automatically on the next startup if you have migrations enabled.

**Option A: Automatic (if you use `migrate: 'alter'` or `'safe'`)**

Just deploy and Sails will create the table automatically.

**Option B: Manual Migration**

If you prefer manual control, create the table:

```sql
CREATE TABLE api_key (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(1024),
  user_id BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  permissions JSONB DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_api_key_user_id ON api_key(user_id);
CREATE INDEX idx_api_key_key ON api_key(key) WHERE deleted_at IS NULL;
```

### 2. Deploy to AWS Copilot

Your existing Copilot configuration doesn't need any changes! The External API will be available at the same domain.

```bash
# Build and deploy
copilot deploy --name web --env prod
```

### 3. Create Your First API Key

Once deployed, use the Planka UI to log in, then:

```bash
# Get your access token from the browser (inspect network requests)
# or use the API to create a token

# Create an API key
curl -X POST https://your-planka-domain.com/api/external/api-keys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First API Key",
    "description": "Testing the external API"
  }'
```

**Response:**
```json
{
  "apiKey": "plk_abc123...",  ← Save this! You won't see it again
  "item": {
    "id": "...",
    "name": "My First API Key",
    ...
  }
}
```

### 4. Test the API

```bash
# List your boards
curl -H "X-API-Key: plk_abc123..." \
     https://your-planka-domain.com/api/external/boards

# Create a card
curl -X POST \
     -H "X-API-Key: plk_abc123..." \
     -H "Content-Type: application/json" \
     -d '{
       "boardId": "YOUR_BOARD_ID",
       "listId": "YOUR_LIST_ID",
       "name": "Test card from API"
     }' \
     https://your-planka-domain.com/api/external/cards
```

## Voice Assistant Integration Example

For your voice command use case, here's a complete example:

```javascript
// voice-to-planka.js
const axios = require('axios');

const PLANKA_URL = 'https://your-planka-domain.com/api/external';
const API_KEY = process.env.PLANKA_API_KEY;

class PlankaVoiceIntegration {
  constructor() {
    this.client = axios.create({
      baseURL: PLANKA_URL,
      headers: { 'X-API-Key': API_KEY }
    });
  }

  async handleVoiceCommand(command) {
    // Example: "add buy milk to shopping list"
    const match = command.match(/add (.+) to (.+)/i);
    if (!match) return { error: 'Could not parse command' };

    const [, task, listName] = match;

    // Find the board and list
    const boards = await this.client.get('/boards');
    const targetBoard = boards.data.items.find(b =>
      b.name.toLowerCase().includes('shopping')
    );

    if (!targetBoard) {
      return { error: 'Shopping board not found' };
    }

    const boardDetails = await this.client.get(`/boards/${targetBoard.id}`);
    const targetList = boardDetails.data.item.lists.find(l =>
      l.name.toLowerCase().includes(listName.toLowerCase())
    );

    if (!targetList) {
      return { error: `List "${listName}" not found` };
    }

    // Create the card
    const card = await this.client.post('/cards', {
      boardId: targetBoard.id,
      listId: targetList.id,
      name: task,
      type: 'project'
    });

    return {
      success: true,
      card: card.data.item,
      message: `Added "${task}" to ${listName}`
    };
  }
}

// Usage
const integration = new PlankaVoiceIntegration();
integration.handleVoiceCommand('add buy milk to shopping list')
  .then(result => console.log(result));
```

## Security Considerations

1. **Store API keys securely**
   - Use environment variables
   - Never commit keys to git
   - Use secrets manager in production

2. **Key rotation**
   - Create new keys periodically
   - Delete old/unused keys
   - Set expiration dates

3. **Monitor usage**
   - Check `lastUsedAt` to detect suspicious activity
   - Review API key list regularly

4. **HTTPS only**
   - Always use HTTPS in production
   - Your Copilot deployment already has this

## Troubleshooting

### "Relation 'api_key' does not exist"

The database migration hasn't run. Either:
- Restart Sails and let auto-migration create the table
- Run the manual SQL from step 1

### "API key authentication required"

- Check the header name is exactly `X-API-Key` (case matters in some clients)
- Verify your key starts with `plk_`
- Make sure you're hitting an `/api/external/*` endpoint

### "Not enough rights"

Your user account needs to be:
- A member of the board
- Have "editor" role (not just viewer)

### Can't create API key

The API key creation endpoint uses regular Bearer token auth (not API key auth). You need to:
1. Log in to Planka UI
2. Get your access token from browser
3. Use that token to create an API key

## Next Steps

1. **Deploy to production** - Use `copilot deploy`
2. **Create API keys** - For each integration you need
3. **Integrate with voice assistant** - Use the example code above
4. **Monitor usage** - Check the API key dashboard
5. **Optional enhancements**:
   - Add rate limiting
   - Implement granular permissions
   - Add webhook support

## Support

- Full API documentation: `EXTERNAL_API.md`
- Planka issues: https://github.com/plankanban/planka/issues
- Your deployment logs: `copilot svc logs --name web --follow`

## AWS Copilot Commands

```bash
# Deploy
copilot deploy --name web --env prod

# View logs
copilot svc logs --name web --env prod --follow

# Check status
copilot svc status --name web --env prod

# Run commands in container
copilot svc exec --name web --env prod
```

---

**You're all set!** The External API is now integrated into your Planka instance. After deployment, you can start creating cards from voice commands, webhooks, or any other external system.
