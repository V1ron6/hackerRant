# Required Endpoints (to implement ASAP)

This file describes backend endpoints needed to fully implement the product flows described in buildi.txt, in a way that stays consistent with:
- API_DOCS.md envelope + cookies (`hr_ticket`, `hr_csrf`)
- README.md security model (ticket, fingerprint, aggressor)

Base URL (same convention as API_DOCS.md): `https://<backend>/api`

## Response Envelope (must match API_DOCS.md)

**Success**
```json
{ "success": true, "message": "OK", "data": {} }
```

**Error**
```json
{ "success": false, "error": "Human-readable" }
```

**Validation error**
```json
{ "success": false, "errors": [{ "field": "name", "message": "Invalid" }] }
```

## Auth / Device Linking / Ticket Management

### POST /auth/request-device-link
Use when user has a new phone/device (buildi: link sent to email + code to device; expires ~20 min).
- **Auth:** no
- **Body:**
```json
{ "email": "user@example.com" }
```
- **Success:** returns a `linkTokenId` and sends email link + SMS OTP.

### POST /auth/confirm-device-link
Completes device linking.
- **Auth:** no
- **Body:**
```json
{ "linkToken": "...", "otp": "123456" }
```
- **Success:** issues new `hr_ticket` + `hr_csrf` cookies.

### POST /tickets/change
Danger Zone: rotate ticket but keep IP binding semantics (buildi).
- **Auth:** yes (`hr_ticket`)
- **CSRF:** yes (`x-csrf-token`)
- **Success:** clears old ticket, blacklists it, issues new cookies.

### POST /tickets/request-reset
Danger Zone: request a new ticket for lost device.
- **Auth:** optional (depending on design)
- **Body:** `{ "email": "..." }`
- **Success:** starts reset flow; verify by email + OTP.

> Escanor rule (README/buildi): enforce backend-side suspension if more than 2 resets/changes per month.

## Chats (WhatsApp-like)

### GET /chats
List user chats.
- **Auth:** yes
- **Query:** `cursor`, `limit`
- **Data:**
```json
[{ "id":"chatId", "type":"dm", "title":"@other", "lastMessage": {"id":"m1","text":"hi","created_at":"..."}, "unreadCount": 2 }]
```

### POST /chats
Create a new DM chat.
- **Auth:** yes
- **CSRF:** yes
- **Body:**
```json
{ "username": "targetUsername" }
```

### GET /chats/:chatId/messages
Paginated messages.
- **Auth:** yes
- **Query:** `cursor`, `limit`

### POST /chats/:chatId/messages
Send message.
- **Auth:** yes
- **CSRF:** yes
- **Body:**
```json
{ "text": "hello", "attachments": [] }
```

### POST /uploads
Secure upload (README Phase 9). Should return a safe URL.
- **Auth:** yes
- **CSRF:** yes
- **Content-Type:** multipart/form-data

## Status

### GET /status
Feed of status posts.

### POST /status
Create status post.
- Supports: text, image/video/audio URLs (from /uploads)

## Threads

### GET /threads
List threads.

### POST /threads
Create a thread.
- buildi: can "ask generate questions"; if AI generation is needed, expose:

### POST /threads/generate
Returns suggested thread prompts/questions.

### POST /threads/:threadId/replies
Reply to a thread.

## RantFinder (discovery)

### GET /discovery/nearby
Requires server-side location matching.
- **Query:** `lat`, `lng`, `radiusKm`

### GET /discovery/search
Search by username.
- **Query:** `q`

## Ranres (resources)

### GET /resources
List resources.

### POST /resources
Admin-only create resource.

## Complains

### POST /complaints
Submit complaint.
- **Body:** `{ "message": "...", "category": "..." }`

## Notifications

### GET /notifications
List notifications.

### PATCH /notifications/:id
Mark read.

## Socket.io Events

Maintain README.md naming, plus:
- `chat:message:new` (server -> client)
- `presence:update` (server -> client)
- `aggressor:verify` (server -> client)
- `aggressor:invalid` (server -> client)

Client should authenticate sockets using cookies (README Phase 6).

## Status of this list
Everything the frontend pages call is implemented in the backend — see "Additional endpoints (implemented)" in `API_DOCS.md`.
Not built: `/threads/generate` (AI question generation, needs an LLM key) and `/notifications` (replaced by browser notifications).
