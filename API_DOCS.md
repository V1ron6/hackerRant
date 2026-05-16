# hackerRant API Documentation

> Base URL: `https://your-backend.onrender.com/api`
> All requests and responses are `Content-Type: application/json`
> Auth is handled via the `hr_ticket` httpOnly cookie — set automatically on login/verify

---

## Table of Contents

- [Standard Response Format](#standard-response-format)
- [Error Codes](#error-codes)
- [Auth](#auth)
  - [POST /auth/register](#post-authregister)
  - [POST /auth/verify-otp](#post-authverify-otp)
  - [POST /auth/login](#post-authlogin)
  - [POST /auth/logout](#post-authlogout)
  - [GET /auth/me](#get-authme)
- [Users](#users)
  - [GET /users/:username](#get-usersusername)
  - [PATCH /users/me](#patch-usersme)
- [Sessions](#sessions)
  - [GET /sessions](#get-sessions)
  - [DELETE /sessions/:id](#delete-sessionsid)
  - [DELETE /sessions](#delete-sessions)
- [Socket.io Events](#socketio-events)
  - [Connection](#connection)
  - [Emitting Events](#emitting-events)
  - [Listening to Events](#listening-to-events)

---

## Standard Response Format

Every response follows this envelope:

### Success

```json
{
  "success": true,
  "message": "Human-readable status",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Validation Error

```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email"
    }
  ]
}
```

---

## Error Codes

| HTTP Status | Meaning |
|---|---|
| 400 | Bad request / validation failure |
| 401 | Unauthenticated — missing or invalid ticket |
| 403 | Forbidden — suspended account or CSRF failure |
| 404 | Resource not found |
| 409 | Conflict — duplicate email/username |
| 429 | Rate limited |
| 500 | Internal server error |

---

## Auth

---

### POST /auth/register

Creates a new user account and sends an OTP to the provided email.

**Rate limit:** global (100 req/min via Diane)

**Request body:**

```json
{
  "username": "v1ron",
  "email": "v1ron@example.com",
  "phone": "+233XXXXXXXXX",
  "password": "mySecurePassword123"
}
```

| Field | Type | Rules |
|---|---|---|
| `username` | string | 3–30 chars, alphanumeric + underscores only |
| `email` | string | valid email format |
| `phone` | string | valid mobile number |
| `password` | string | minimum 8 characters |

**Success response `201`:**

```json
{
  "success": true,
  "message": "Check your email for the OTP",
  "data": {
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

**Error responses:**

`400` — validation failure
```json
{
  "success": false,
  "errors": [
    { "field": "username", "message": "Username must be 3–30 characters" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

`409` — email already registered
```json
{
  "success": false,
  "error": "Email already registered"
}
```

---

### POST /auth/verify-otp

Verifies the OTP sent to email. On success, issues the `hr_ticket` httpOnly cookie and the `hr_csrf` CSRF cookie.

**Request body:**

```json
{
  "email": "v1ron@example.com",
  "otp": "482910"
}
```

| Field | Type | Rules |
|---|---|---|
| `email` | string | must match the registered email |
| `otp` | string | exactly 6 numeric digits |

**Success response `200`:**

```json
{
  "success": true,
  "message": "Verified",
  "data": {
    "username": "v1ron"
  }
}
```

**Sets cookies:**

| Cookie | httpOnly | Notes |
|---|---|---|
| `hr_ticket` | yes | 90-day auth ticket — never readable by JS |
| `hr_csrf` | no | CSRF token — must be read and sent as `x-csrf-token` header on mutations |

**Error responses:**

`400` — invalid or expired OTP
```json
{
  "success": false,
  "error": "Invalid or expired OTP"
}
```

---

### POST /auth/login

Authenticates an existing user with email/username and password. Issues cookies on success.

**Rate limit:** 10 attempts per 15 minutes per IP (Meliodas)

**Request body:**

```json
{
  "identifier": "v1ron",
  "password": "mySecurePassword123"
}
```

| Field | Type | Rules |
|---|---|---|
| `identifier` | string | email address or username |
| `password` | string | required |

**Success response `200`:**

```json
{
  "success": true,
  "message": "Logged in",
  "data": {
    "username": "v1ron"
  }
}
```

**Sets cookies:** same as [verify-otp](#post-authverify-otp)

**Error responses:**

`401` — wrong credentials
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

`403` — account suspended
```json
{
  "success": false,
  "error": "Account suspended"
}
```

`429` — too many attempts
```json
{
  "success": false,
  "error": "MELIODAS: Too many login attempts."
}
```

---

### POST /auth/logout

Revokes the current session and ticket. Clears cookies.

**Auth required:** yes (`hr_ticket` cookie)
**CSRF required:** yes (`x-csrf-token` header)

**Request headers:**

```
Cookie: hr_ticket=<auto>
x-csrf-token: <value from hr_csrf cookie>
```

**No request body.**

**Success response `200`:**

```json
{
  "success": true,
  "message": "Logged out",
  "data": {}
}
```

**Clears cookies:** `hr_ticket`, `hr_csrf`

**Error responses:**

`401` — not authenticated
```json
{
  "success": false,
  "error": "No ticket provided"
}
```

`403` — missing or invalid CSRF token
```json
{
  "success": false,
  "error": "MERLIN: CSRF token missing"
}
```

---

### GET /auth/me

Returns the authenticated user's profile and refreshes the CSRF token.

**Auth required:** yes (`hr_ticket` cookie)

**Request headers:**

```
Cookie: hr_ticket=<auto>
```

**No request body.**

**Success response `200`:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "username": "v1ron",
    "first_name": "Elvin",
    "last_name": "Owusu",
    "email": "v1ron@example.com",
    "phone": "+233XXXXXXXXX",
    "dob": "2000-01-01",
    "bio": "hacker. builder.",
    "avatar_url": "https://r2.example.com/avatars/v1ron.jpg",
    "latitude": null,
    "longitude": null,
    "status": "active",
    "created_at": "2025-05-23T10:00:00.000Z"
  }
}
```

> `password_hash` is never returned.

**Refreshes cookie:** `hr_csrf` with a new token

**Error responses:**

`401` — not authenticated
```json
{
  "success": false,
  "error": "No ticket provided"
}
```

---

## Users

---

### GET /users/:username

Returns a public profile. No auth required.

**URL parameter:**

| Param | Type | Description |
|---|---|---|
| `username` | string | the target user's username |

**Example:** `GET /api/users/v1ron`

**Success response `200`:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "username": "v1ron",
    "first_name": "Elvin",
    "last_name": "Owusu",
    "bio": "hacker. builder.",
    "avatar_url": "https://r2.example.com/avatars/v1ron.jpg",
    "created_at": "2025-05-23T10:00:00.000Z"
  }
}
```

> `bio` is XSS-sanitized on output (King middleware).
> Deleted or suspended users return `404`.

**Error responses:**

`404` — user not found or inactive
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### PATCH /users/me

Updates the authenticated user's profile fields.

**Auth required:** yes (`hr_ticket` cookie)
**CSRF required:** yes (`x-csrf-token` header)

**Request headers:**

```
Cookie: hr_ticket=<auto>
x-csrf-token: <value from hr_csrf cookie>
```

**Request body** (all fields optional):

```json
{
  "first_name": "Elvin",
  "last_name": "Owusu",
  "bio": "hacker. builder. breaker.",
  "dob": "2000-01-15"
}
```

| Field | Type | Notes |
|---|---|---|
| `first_name` | string | optional |
| `last_name` | string | optional |
| `bio` | string | optional, stored raw, sanitized on output |
| `dob` | string | optional, ISO date `YYYY-MM-DD` |

> `username`, `email`, `phone`, and `password` cannot be updated through this endpoint.

**Success response `200`:**

```json
{
  "success": true,
  "message": "Profile updated",
  "data": {}
}
```

**Error responses:**

`401` — not authenticated
```json
{
  "success": false,
  "error": "No ticket provided"
}
```

`401` — session anomaly (Gowther)
```json
{
  "success": false,
  "error": "GOWTHER: Session anomaly detected"
}
```

`403` — invalid CSRF token (Merlin)
```json
{
  "success": false,
  "error": "MERLIN: Invalid CSRF token"
}
```

---

## Sessions

All session routes require the `hr_ticket` auth cookie.

---

### GET /sessions

Returns all active (non-revoked) sessions for the authenticated user.

**Auth required:** yes
**CSRF:** refreshed via `hr_csrf` cookie on response

**Success response `200`:**

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "sess-uuid-1",
      "user_id": "a1b2c3d4-...",
      "fingerprint": "abc123...",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      "ip_address": "197.255.x.x",
      "last_active_at": "2025-05-23T12:30:00.000Z",
      "is_revoked": false
    },
    {
      "id": "sess-uuid-2",
      "user_id": "a1b2c3d4-...",
      "fingerprint": "def456...",
      "user_agent": "Mozilla/5.0 (Android 12; Mobile)...",
      "ip_address": "41.66.x.x",
      "last_active_at": "2025-05-22T08:00:00.000Z",
      "is_revoked": false
    }
  ]
}
```

---

### DELETE /sessions/:id

Revokes a single session by ID. Also blacklists the matching ticket.

**Auth required:** yes
**CSRF required:** yes (`x-csrf-token` header)

**URL parameter:**

| Param | Type | Description |
|---|---|---|
| `id` | string (UUID) | session ID from `GET /sessions` |

**Example:** `DELETE /api/sessions/sess-uuid-2`

**Success response `200`:**

```json
{
  "success": true,
  "message": "Session revoked",
  "data": {}
}
```

**Error responses:**

`404` — session not found or doesn't belong to user
```json
{
  "success": false,
  "error": "Session not found"
}
```

`403` — CSRF failure
```json
{
  "success": false,
  "error": "MERLIN: Invalid CSRF token"
}
```

---

### DELETE /sessions

Revokes **all** sessions and blacklists all tickets for the user. Clears the current cookie. Effectively a global sign-out.

**Auth required:** yes
**CSRF required:** yes (`x-csrf-token` header)

**No request body.**

**Success response `200`:**

```json
{
  "success": true,
  "message": "All sessions revoked",
  "data": {}
}
```

**Clears cookies:** `hr_ticket`, `hr_csrf`

---

## Socket.io Events

**Connection URL:** `wss://your-backend.onrender.com`

Auth is handled automatically via the `hr_ticket` cookie. Pass `withCredentials: true` on the client.

```js
// Client-side connection example
import { io } from 'socket.io-client';

const socket = io('https://your-backend.onrender.com', {
  withCredentials: true,
});
```

If the ticket is missing or invalid, the connection is rejected with:
```
Error: SOCKET_AUTH: Invalid ticket
```

---

### Connection

On successful connection the server joins the socket to the user's personal room (their `user_id`). All targeted events use this room ID as the `to` field.

---

### Emitting Events

Events you send **from the client to the server.**

---

#### `message:send`

Send a direct message to another user.

**Payload:**

```json
{
  "to": "recipient-user-id",
  "content": "yo what's the flag",
  "threadId": "optional-thread-id-or-null"
}
```

| Field | Type | Required |
|---|---|---|
| `to` | string (user ID) | yes |
| `content` | string | yes |
| `threadId` | string or null | no |

---

#### `typing:start`

Notify another user you are typing.

**Payload:**

```json
{
  "to": "recipient-user-id"
}
```

---

#### `typing:stop`

Notify another user you stopped typing.

**Payload:**

```json
{
  "to": "recipient-user-id"
}
```

---

#### `message:read`

Mark a message as read and notify the sender.

**Payload:**

```json
{
  "from": "sender-user-id",
  "messageId": "message-uuid"
}
```

---

#### `presence:ping`

Ping a user to check if they are online.

**Payload:**

```json
{
  "to": "target-user-id"
}
```

---

#### `aggressor:pong`

Response to the server's `aggressor:verify` challenge. Send this back immediately when received to confirm the client is a real user.

**Payload:** none

```js
socket.on('aggressor:verify', () => {
  socket.emit('aggressor:pong');
});
```

---

### Listening to Events

Events you **receive from the server.**

---

#### `message:receive`

Fires when another user sends you a message.

**Payload:**

```json
{
  "from": "sender-user-id",
  "to": "your-user-id",
  "content": "yo what's the flag",
  "threadId": null,
  "timestamp": "2025-05-23T14:22:00.000Z"
}
```

---

#### `message:sent`

Echo confirmation after you successfully send a message. Useful for multi-device sync.

**Payload:**

```json
{
  "from": "your-user-id",
  "to": "recipient-user-id",
  "content": "yo what's the flag",
  "threadId": null,
  "timestamp": "2025-05-23T14:22:00.000Z"
}
```

---

#### `typing:start`

Another user started typing to you.

**Payload:**

```json
{
  "from": "sender-user-id"
}
```

---

#### `typing:stop`

Another user stopped typing.

**Payload:**

```json
{
  "from": "sender-user-id"
}
```

---

#### `message:read`

A recipient read your message.

**Payload:**

```json
{
  "by": "reader-user-id",
  "messageId": "message-uuid"
}
```

---

#### `presence:online`

Fired when a user in your room comes online.

**Payload:**

```json
"user-id-string"
```

---

#### `presence:ping`

Another user pinged you to check presence. Respond however your client handles it.

**Payload:**

```json
{
  "from": "pinging-user-id"
}
```

---

#### `aggressor:verify`

Server challenges your client to prove it's human. Respond with `aggressor:pong` immediately.

**Payload:** none — fires on a random interval between 4–7 minutes per connection.

```js
socket.on('aggressor:verify', () => {
  socket.emit('aggressor:pong');
});
```

---

## CSRF Flow Summary

```
1. Client calls GET /auth/me or GET /sessions
2. Server sets hr_csrf cookie (readable by JS)
3. Client reads hr_csrf cookie value
4. Client includes it as x-csrf-token header on all POST/PATCH/DELETE requests
5. Server (Merlin) validates it against Redis before processing
```

```js
// Helper to get CSRF token from cookie
const getCsrf = () =>
  document.cookie
    .split('; ')
    .find((c) => c.startsWith('hr_csrf='))
    ?.split('=')[1];

// Attach to every mutation request
fetch('/api/sessions/sess-uuid-2', {
  method:      'DELETE',
  credentials: 'include',
  headers: {
    'x-csrf-token': getCsrf(),
  },
});
```
