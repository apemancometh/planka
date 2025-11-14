# Planka External API Documentation

This document describes the external API endpoints for Planka, which allow programmatic access via API keys.

## Table of Contents

- [Authentication](#authentication)
- [API Key Management](#api-key-management)
- [Boards](#boards)
- [Cards](#cards)
- [Error Handling](#error-handling)
- [Example Usage](#example-usage)

## Authentication

The External API uses API key authentication via the `X-API-Key` header.

### Creating an API Key

Before using the External API, you must create an API key. This requires authentication with your regular Planka account (Bearer token).

**Endpoint:** `POST /api/external/api-keys`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Voice Assistant Integration",
  "description": "Used for creating cards from Alexa",
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "permissions": {}
}
```

**Response:** (201 Created)
```json
{
  "apiKey": "plk_abc123def456...",
  "item": {
    "id": "1234567890",
    "name": "Voice Assistant Integration",
    "description": "Used for creating cards from Alexa",
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "permissions": {},
    "createdAt": "2024-11-14T10:30:00.000Z"
  }
}
```

**⚠️ IMPORTANT:** The `apiKey` field contains the actual API key. This is the ONLY time you'll see it! Store it securely.

### Using an API Key

Once you have an API key, include it in the `X-API-Key` header for all External API requests:

```bash
curl -H "X-API-Key: plk_abc123def456..." \
     https://your-planka-domain.com/api/external/boards
```

---

## API Key Management

### List API Keys

Get all API keys for your account.

**Endpoint:** `GET /api/external/api-keys`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** (200 OK)
```json
{
  "items": [
    {
      "id": "1234567890",
      "name": "Voice Assistant Integration",
      "description": "Used for creating cards from Alexa",
      "isActive": true,
      "lastUsedAt": "2024-11-14T15:45:00.000Z",
      "expiresAt": "2025-12-31T23:59:59.000Z",
      "permissions": {},
      "createdAt": "2024-11-14T10:30:00.000Z",
      "updatedAt": "2024-11-14T10:30:00.000Z"
    }
  ]
}
```

### Delete API Key

Revoke an API key.

**Endpoint:** `DELETE /api/external/api-keys/:keyId`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** (200 OK)
```json
{
  "item": {
    "id": "1234567890"
  }
}
```

---

## Boards

### List Boards

Get all boards you have access to.

**Endpoint:** `GET /api/external/boards`

**Headers:**
```
X-API-Key: plk_abc123def456...
```

**Response:** (200 OK)
```json
{
  "items": [
    {
      "id": "1357158568008091264",
      "name": "Personal Tasks",
      "projectId": "1357158567999602688",
      "projectName": "Home",
      "position": 65536,
      "createdAt": "2024-11-01T10:00:00.000Z",
      "updatedAt": "2024-11-01T10:00:00.000Z"
    }
  ]
}
```

### Get Board Details

Get detailed information about a specific board, including its lists.

**Endpoint:** `GET /api/external/boards/:boardId`

**Headers:**
```
X-API-Key: plk_abc123def456...
```

**Response:** (200 OK)
```json
{
  "item": {
    "id": "1357158568008091264",
    "name": "Personal Tasks",
    "projectId": "1357158567999602688",
    "projectName": "Home",
    "position": 65536,
    "createdAt": "2024-11-01T10:00:00.000Z",
    "updatedAt": "2024-11-01T10:00:00.000Z",
    "lists": [
      {
        "id": "1357158568008091265",
        "name": "To Do",
        "position": 65536
      },
      {
        "id": "1357158568008091266",
        "name": "In Progress",
        "position": 131072
      }
    ]
  }
}
```

---

## Cards

### Create Card

Create a new card in a list.

**Endpoint:** `POST /api/external/cards`

**Headers:**
```
X-API-Key: plk_abc123def456...
Content-Type: application/json
```

**Request Body:**
```json
{
  "boardId": "1357158568008091264",
  "listId": "1357158568008091265",
  "name": "Buy groceries",
  "description": "Milk, eggs, bread",
  "type": "project",
  "position": null,
  "dueDate": "2024-11-15T18:00:00.000Z",
  "isDueCompleted": false
}
```

**Required Fields:**
- `boardId` - ID of the board
- `listId` - ID of the list
- `name` - Card title

**Optional Fields:**
- `description` - Card description
- `type` - Card type: `"project"` or `"story"` (default: `"project"`)
- `position` - Position in list (null = bottom)
- `dueDate` - Due date (ISO 8601 format)
- `isDueCompleted` - Whether due date is completed
- `stopwatch` - Stopwatch data: `{ "startedAt": "ISO date", "total": seconds }`

**Response:** (201 Created)
```json
{
  "item": {
    "id": "1357158568012345678",
    "boardId": "1357158568008091264",
    "listId": "1357158568008091265",
    "creatorUserId": "1234567890",
    "name": "Buy groceries",
    "description": "Milk, eggs, bread",
    "type": "project",
    "position": 65536,
    "dueDate": "2024-11-15T18:00:00.000Z",
    "isDueCompleted": false,
    "stopwatch": null,
    "createdAt": "2024-11-14T16:00:00.000Z",
    "updatedAt": "2024-11-14T16:00:00.000Z"
  }
}
```

### Get Card

Get details about a specific card.

**Endpoint:** `GET /api/external/cards/:cardId`

**Headers:**
```
X-API-Key: plk_abc123def456...
```

**Response:** (200 OK)
```json
{
  "item": {
    "id": "1357158568012345678",
    "name": "Buy groceries",
    "description": "Milk, eggs, bread",
    "type": "project",
    "position": 65536,
    "dueDate": "2024-11-15T18:00:00.000Z",
    "isDueCompleted": false,
    "stopwatch": null,
    "boardId": "1357158568008091264",
    "boardName": "Personal Tasks",
    "listId": "1357158568008091265",
    "listName": "To Do",
    "createdAt": "2024-11-14T16:00:00.000Z",
    "updatedAt": "2024-11-14T16:00:00.000Z"
  }
}
```

### Update Card

Update card properties.

**Endpoint:** `PATCH /api/external/cards/:cardId`

**Headers:**
```
X-API-Key: plk_abc123def456...
Content-Type: application/json
```

**Request Body:** (all fields optional)
```json
{
  "name": "Buy groceries and cook dinner",
  "description": "Milk, eggs, bread, chicken, vegetables",
  "dueDate": "2024-11-16T18:00:00.000Z",
  "isDueCompleted": false,
  "position": 32768
}
```

**Response:** (200 OK)
```json
{
  "item": {
    "id": "1357158568012345678",
    "name": "Buy groceries and cook dinner",
    "description": "Milk, eggs, bread, chicken, vegetables",
    ...
  }
}
```

### Delete Card

Delete a card.

**Endpoint:** `DELETE /api/external/cards/:cardId`

**Headers:**
```
X-API-Key: plk_abc123def456...
```

**Response:** (200 OK)
```json
{
  "item": {
    "id": "1357158568012345678"
  }
}
```

---

## Error Handling

The API uses standard HTTP status codes and returns errors in JSON format:

### Common Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid API key
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error

### Error Response Format

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "API key authentication required"
}
```

---

## Example Usage

### Voice Command Integration (Node.js)

```javascript
const axios = require('axios');

const PLANKA_API_URL = 'https://your-planka-domain.com/api/external';
const API_KEY = 'plk_abc123def456...';

async function createCardFromVoiceCommand(voiceInput) {
  try {
    // Parse voice input: "Add buy milk to shopping list"
    const cardName = extractTaskFromVoice(voiceInput);

    // Get boards
    const boardsResponse = await axios.get(`${PLANKA_API_URL}/boards`, {
      headers: { 'X-API-Key': API_KEY }
    });

    // Find "Shopping" board
    const shoppingBoard = boardsResponse.data.items.find(
      b => b.name.toLowerCase().includes('shopping')
    );

    // Get board details with lists
    const boardDetails = await axios.get(
      `${PLANKA_API_URL}/boards/${shoppingBoard.id}`,
      { headers: { 'X-API-Key': API_KEY } }
    );

    // Find "To Buy" list
    const toBuyList = boardDetails.data.item.lists.find(
      l => l.name.toLowerCase().includes('to buy')
    );

    // Create card
    const cardResponse = await axios.post(
      `${PLANKA_API_URL}/cards`,
      {
        boardId: shoppingBoard.id,
        listId: toBuyList.id,
        name: cardName,
        type: 'project'
      },
      { headers: { 'X-API-Key': API_KEY } }
    );

    return cardResponse.data.item;
  } catch (error) {
    console.error('Error creating card:', error.response?.data || error.message);
    throw error;
  }
}
```

### Python Example

```python
import requests

PLANKA_API_URL = 'https://your-planka-domain.com/api/external'
API_KEY = 'plk_abc123def456...'

def create_task_card(board_id, list_id, task_name, description=None):
    headers = {'X-API-Key': API_KEY}

    payload = {
        'boardId': board_id,
        'listId': list_id,
        'name': task_name,
        'type': 'project'
    }

    if description:
        payload['description'] = description

    response = requests.post(
        f'{PLANKA_API_URL}/cards',
        json=payload,
        headers=headers
    )

    response.raise_for_status()
    return response.json()['item']

# Usage
card = create_task_card(
    board_id='1357158568008091264',
    list_id='1357158568008091265',
    task_name='Buy groceries',
    description='Milk, eggs, bread'
)
print(f"Created card: {card['id']}")
```

### cURL Examples

**List boards:**
```bash
curl -H "X-API-Key: plk_abc123def456..." \
     https://your-planka-domain.com/api/external/boards
```

**Create card:**
```bash
curl -X POST \
     -H "X-API-Key: plk_abc123def456..." \
     -H "Content-Type: application/json" \
     -d '{
       "boardId": "1357158568008091264",
       "listId": "1357158568008091265",
       "name": "Buy groceries",
       "description": "Milk, eggs, bread"
     }' \
     https://your-planka-domain.com/api/external/cards
```

---

## Security Best Practices

1. **Store API keys securely** - Never commit API keys to version control
2. **Use environment variables** - Store API keys in environment variables
3. **Set expiration dates** - Create keys with expiration dates for temporary integrations
4. **Rotate keys regularly** - Delete old keys and create new ones periodically
5. **Use HTTPS only** - Always use HTTPS in production
6. **Limit permissions** - Use the permissions object to restrict key access (future enhancement)
7. **Monitor usage** - Check `lastUsedAt` timestamps to detect unauthorized use

---

## AWS Copilot Deployment

The External API works seamlessly with your existing AWS Copilot deployment. No additional configuration is required for the Copilot manifest - the endpoints are exposed through the same Load Balanced Web Service as your regular Planka instance.

### Example Request to Copilot Deployment

```bash
curl -H "X-API-Key: plk_abc123def456..." \
     https://your-planka-service.your-env.your-app.com/api/external/boards
```

---

## Troubleshooting

### "API key authentication required"

- Ensure you're including the `X-API-Key` header
- Verify the header name is exactly `X-API-Key` (case-sensitive in some clients)
- Check that your API key starts with `plk_`

### "API key not found" or 401 Unauthorized

- Verify the API key hasn't expired (check `expiresAt`)
- Ensure the API key hasn't been deleted
- Check that the key is still active (`isActive: true`)

### "Not enough rights" or 403 Forbidden

- Verify your user account has editor permissions on the board
- Check that you're a member of the board

### "Board not found" or "List not found"

- Verify the IDs are correct
- Ensure your user has access to the board/list
- Check that the resources haven't been deleted

---

## Support

For issues or questions:
1. Check this documentation
2. Review the error response for details
3. Verify your API key is valid and has the right permissions
4. Check the Planka logs for detailed error information

## Future Enhancements

Planned features for the External API:

- [ ] Granular permissions per API key (restrict to specific boards)
- [ ] Rate limiting per API key
- [ ] Webhook support for real-time updates
- [ ] Bulk operations (create multiple cards)
- [ ] List management endpoints
- [ ] Label and member management
- [ ] Task list and checklist support
- [ ] Attachment upload support
