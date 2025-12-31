# WhatsApp API Test Commands

Use these cURL commands to test your WhatsApp API endpoints.

## Prerequisites

1. Start the server: `npm run dev`
2. Get a valid auth token by logging in
3. Replace `YOUR_TOKEN` with your JWT token
4. Replace `YOUR_TENANT_ID` with your tenant ID

---

## 1. Webhook Verification (Meta sends this to verify)

```bash
curl -X GET "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test_challenge_123"
```

Expected: Returns `test_challenge_123`

---

## 2. Simulate Incoming WhatsApp Message (Webhook POST)

```bash
curl -X POST "http://localhost:3000/api/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: mock-valid-signature" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "123456789",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "919999999999",
            "phone_number_id": "123456789"
          },
          "messages": [{
            "from": "919876543210",
            "id": "wamid.test123456789",
            "timestamp": "1703775600",
            "type": "text",
            "text": {
              "body": "Hi, I want to book a Ladakh trip"
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

---

## 3. Get All Conversations (Authenticated)

```bash
curl -X GET "http://localhost:3000/api/whatsapp/conversations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Id: YOUR_TENANT_ID"
```

---

## 4. Get Single Conversation

```bash
curl -X GET "http://localhost:3000/api/whatsapp/conversations/CONVERSATION_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Id: YOUR_TENANT_ID"
```

---

## 5. Get Conversation Messages

```bash
curl -X GET "http://localhost:3000/api/whatsapp/conversations/CONVERSATION_ID/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Id: YOUR_TENANT_ID"
```

---

## 6. Send Text Message

```bash
curl -X POST "http://localhost:3000/api/whatsapp/messages/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Id: YOUR_TENANT_ID" \
  -d '{
    "recipientPhone": "+919876543210",
    "messageType": "TEXT",
    "textContent": {
      "body": "Hello! Thank you for your inquiry. Our team will get back to you shortly."
    }
  }'
```

---

## 7. Send Template Message

```bash
curl -X POST "http://localhost:3000/api/whatsapp/messages/template" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Id: YOUR_TENANT_ID" \
  -d '{
    "recipientPhone": "+919876543210",
    "templateName": "booking_confirmation",
    "language": "en",
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Rahul" },
          { "type": "text", "text": "Ladakh Adventure Trek" },
          { "type": "text", "text": "January 15, 2025" },
          { "type": "text", "text": "BK-2025-001" }
        ]
      }
    ]
  }'
```

---

## 8. Get Templates

```bash
curl -X GET "http://localhost:3000/api/whatsapp/templates" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Id: YOUR_TENANT_ID"
```

---

## 9. Get Timeline for a Booking

```bash
curl -X GET "http://localhost:3000/api/whatsapp/timeline/booking/BOOKING_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Id: YOUR_TENANT_ID"
```

---

## 10. Link Entity to Conversation

```bash
curl -X POST "http://localhost:3000/api/whatsapp/conversations/CONVERSATION_ID/link" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Id: YOUR_TENANT_ID" \
  -d '{
    "entityType": "LEAD",
    "entityId": "lead-uuid-here"
  }'
```

---

## PowerShell Equivalents

### Send Message (PowerShell)
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_TOKEN"
    "X-Tenant-Id" = "YOUR_TENANT_ID"
}

$body = @{
    recipientPhone = "+919876543210"
    messageType = "TEXT"
    textContent = @{
        body = "Hello from PowerShell test!"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/whatsapp/messages/send" -Method POST -Headers $headers -Body $body
```

### Get Conversations (PowerShell)
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN"
    "X-Tenant-Id" = "YOUR_TENANT_ID"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/whatsapp/conversations" -Method GET -Headers $headers
```

---

## Using with REST Client (VS Code Extension)

Create a `.http` file with:

```http
### Webhook Verification
GET http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=abc123

### Get Conversations
GET http://localhost:3000/api/whatsapp/conversations
Authorization: Bearer {{token}}
X-Tenant-Id: {{tenantId}}

### Send Message
POST http://localhost:3000/api/whatsapp/messages/send
Content-Type: application/json
Authorization: Bearer {{token}}
X-Tenant-Id: {{tenantId}}

{
  "recipientPhone": "+919876543210",
  "messageType": "TEXT",
  "textContent": {
    "body": "Test message"
  }
}
```

---

## Notes

- The Mock Provider is used in development mode, so messages won't actually be sent to WhatsApp
- Check server console for `[MockProvider]` logs to see message activity
- All messages are stored in the database for testing
- Use `npm run seed:whatsapp` to reset test data
