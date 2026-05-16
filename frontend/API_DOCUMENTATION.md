# HGBMI Church Attendance API Documentation

**Base URL:** `http://localhost:4000/api`

**Authentication:** Bearer Token (JWT) in Authorization header
```
Authorization: Bearer <token>
```

---

## Table of Contents
1. [Authentication](#authentication)
   - [Get Available Cells (Public)](#get-available-cells-public)
   - [Generate Secure Password](#generate-secure-password)
   - [Register Member](#register-member)
   - [Verify Email](#verify-email)
   - [Resend OTP](#resend-otp)
   - [Member Login](#member-login)
   - [Admin/Privileged User Login](#adminprivileged-user-login)
   - [Forgot Password](#forgot-password)
   - [Reset Password](#reset-password)
   - [Get Current User Profile](#get-current-user-profile)
   - [Update Profile](#update-profile)
   - [Get QR Code](#get-qr-code)
   - [Logout](#logout)
2. [Admin - User Management](#admin---user-management)
3. [Admin - Cell Management](#admin---cell-management)
4. [Admin - Service Type Management](#admin---service-type-management)
5. [Admin - Member Management](#admin---member-management)
6. [Admin - Messages](#admin---messages)
7. [Admin - Dashboard](#admin---dashboard)
8. [Attendance](#attendance)
9. [Attendance Analytics](#attendance-analytics)
10. [Notifications](#notifications)
11. [Notifications - Cell Leader](#notifications---cell-leader)

---

## Authentication

### Get Available Cells (Public)
**GET** `http://localhost:4000/api/auth/cells`

**Access:** Public

**Description:** Returns all active cells. Use this to populate the cell dropdown on the registration form — no authentication required.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "name": "Faith Fellowship",
      "description": "Empowering believers through prayer,study,and mutual support in faith"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "name": "Klagon Fellowship",
      "description": "Empowering students with spiritual growth"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440012",
      "name": "Light Fellowship",
      "description": "Guiding young heights in faith and joy"
    }
  ]
}
```

**Notes:**
- Results are sorted alphabetically by name
- Only active cells (`isActive: true`) are returned
- Use the `name` value as the `cellName` field when registering a member

---

### Generate Secure Password
**GET** `http://localhost:4000/api/auth/generate-password`

**Access:** Public

**Query Parameters:**
- `length` (optional): Password length, 8-32 characters (default: 12)

**Example:** `GET http://localhost:4000/api/auth/generate-password?length=16`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "password": "K$7mPx2@nQvL4hBt",
    "length": 16,
    "strength": "strong",
    "note": "Save this password securely. It will not be shown again."
  }
}
```

**Notes:**
- Generated passwords always contain: uppercase, lowercase, number, and special character (@$!%*?&)
- Use this endpoint to help users create strong passwords for registration

---

### Register Member
**POST** `http://localhost:4000/api/auth/register`

**Access:** Public (Rate Limited: 5 req/15 min)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+233201234567",
  "password": "Password@123",
  "cellName": "Light Fellowship"
}
```

**Validation:**
- `firstName`: 2-50 characters, letters only
- `lastName`: 2-50 characters, letters only
- `email`: Valid email format
- `phoneNumber`: 10-15 digits
- `password`: Min 8 chars, must include uppercase, lowercase, number, special char (@$!%*?&)
- `cellName`: Must be an existing cell

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for OTP verification.",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

---

### Verify Email
**POST** `http://localhost:4000/api/auth/verify-email`

**Access:** Public (Rate Limited: 3 req/10 min)

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully. QR code has been sent to your email.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "+233201234567",
      "cellName": "Light Fellowship",
      "isVerified": true,
      "role": "member",
      "status": "active"
    },
    "qrCode": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

---

### Resend OTP
**POST** `http://localhost:4000/api/auth/resend-otp`

**Access:** Public (Rate Limited: 3 req/10 min)

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

---

### Member Login
**POST** `http://localhost:4000/api/auth/login`

**Access:** Public (Rate Limited: 5 req/15 min)

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "Password@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "+233201234567",
      "cellName": "Light Fellowship",
      "isVerified": true,
      "role": "member",
      "status": "active"
    }
  }
}
```

**Error Response (403 - Unverified):**
```json
{
  "success": false,
  "message": "Please verify your email first",
  "requiresVerification": true
}
```

---

### Admin/Privileged User Login
**POST** `http://localhost:4000/api/auth/admin/login`

**Access:** Public (Rate Limited: 5 req/15 min)

**Request Body:**
```json
{
  "email": "admin@hgbmi.church",
  "password": "Admin@123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "firstName": "Super",
      "lastName": "Admin",
      "email": "admin@hgbmi.church",
      "phoneNumber": "0000000000",
      "role": "superAdmin",
      "cellName": null,
      "isActive": true
    }
  }
}
```

---

### Forgot Password
**POST** `http://localhost:4000/api/auth/forgot-password`

**Access:** Public (Rate Limited: 3 req/10 min)

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "userType": "member"
}
```
*userType: "member" or "privileged"*

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset OTP sent to your email"
}
```

---

### Reset Password
**POST** `http://localhost:4000/api/auth/reset-password`

**Access:** Public (Rate Limited: 3 req/10 min)

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "123456",
  "newPassword": "NewPassword@456",
  "userType": "member"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful. Please login with your new password."
}
```

---

### Get Current User Profile
**GET** `http://localhost:4000/api/auth/me`

**Access:** Private (All authenticated users)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+233201234567",
    "cellName": "Light Fellowship",
    "isVerified": true,
    "role": "member",
    "status": "active",
    "createdAt": "2026-02-27T10:00:00.000Z"
  }
}
```

---

### Update Profile
**PUT** `http://localhost:4000/api/auth/update-profile`

**Access:** Private (All authenticated users)

**Request Body:**
```json
{
  "email": "new.email@example.com",
  "phoneNumber": "+233209876543",
  "currentPassword": "Password@123",
  "newPassword": "NewPassword@456"
}
```
*All fields optional. currentPassword required only if changing password.*

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "new.email@example.com",
    "phoneNumber": "+233209876543"
  }
}
```

---

### Get QR Code
**GET** `http://localhost:4000/api/auth/qrcode`

**Access:** Private (Members only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

---

### Logout
**POST** `http://localhost:4000/api/auth/logout`

**Access:** Private (All authenticated users)

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Admin - User Management

### Create Privileged User
**POST** `http://localhost:4000/api/admin/users`

**Access:** Private (SuperAdmin only)

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@hgbmi.church",
  "phoneNumber": "+233201234568",
  "password": "CellLeader@123",
  "role": "cellLeader",
  "cellName": "Light Fellowship"
}
```
*role: "cellLeader" or "usher". cellName required for cellLeader only.*

**Response (201):**
```json
{
  "success": true,
  "message": "cellLeader created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@hgbmi.church",
    "phoneNumber": "+233201234568",
    "role": "cellLeader",
    "cellName": "Light Fellowship",
    "isActive": true
  }
}
```

---

### Get All Privileged Users
**GET** `http://localhost:4000/api/admin/users`

**Access:** Private (SuperAdmin only)

**Query Parameters:**
- `role` (optional): Filter by role ("cellLeader" | "usher")

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@hgbmi.church",
      "role": "cellLeader",
      "cellName": "Light Fellowship",
      "isActive": true,
      "createdAt": "2026-02-27T10:00:00.000Z"
    }
  ]
}
```

---

### Update Privileged User
**PUT** `http://localhost:4000/api/admin/users/:id`

**Access:** Private (SuperAdmin only)

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+233209999999",
  "isActive": true,
  "cellName": "Spirit Fellowship"
}
```
*All fields optional.*

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.smith@hgbmi.church",
    "role": "cellLeader",
    "cellName": "Spirit Fellowship",
    "isActive": true
  }
}
```

---

### Delete Privileged User
**DELETE** `http://localhost:4000/api/admin/users/:id`

**Access:** Private (SuperAdmin only)

**Response (200):**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

## Admin - Cell Management

### Create Cell
**POST** `http://localhost:4000/api/admin/cells`

**Access:** Private (SuperAdmin only)

**Request Body:**
```json
{
  "name": "Grace Fellowship",
  "description": "Grace Fellowship Cell Group"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Cell created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "name": "Grace Fellowship",
    "description": "Grace Fellowship Cell Group",
    "leaderId": null,
    "isActive": true,
    "memberCount": 0
  }
}
```

---

### Get All Cells
**GET** `http://localhost:4000/api/admin/cells`

**Access:** Private (SuperAdmin - all cells, CellLeader - their cell only)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "name": "Light Fellowship",
      "description": "Light Fellowship Cell Group",
      "leaderId": "550e8400-e29b-41d4-a716-446655440002",
      "isActive": true,
      "memberCount": 15,
      "leader": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@hgbmi.church",
        "phoneNumber": "+233201234568"
      }
    }
  ]
}
```

---

### Update Cell
**PUT** `http://localhost:4000/api/admin/cells/:id`

**Access:** Private (SuperAdmin only)

**Request Body:**
```json
{
  "name": "Light & Life Fellowship",
  "description": "Updated description",
  "isActive": true,
  "leaderId": "550e8400-e29b-41d4-a716-446655440002"
}
```
*All fields optional.*

**Response (200):**
```json
{
  "success": true,
  "message": "Cell updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "name": "Light & Life Fellowship",
    "description": "Updated description",
    "isActive": true
  }
}
```

---

### Delete Cell
**DELETE** `http://localhost:4000/api/admin/cells/:id`

**Access:** Private (SuperAdmin only)

**Response (200):**
```json
{
  "success": true,
  "message": "Cell deactivated successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Cannot delete cell with 15 members. Please reassign members first."
}
```

---

## Admin - Service Type Management

### Create Service Type
**POST** `http://localhost:4000/api/admin/service-types`

**Access:** Private (SuperAdmin only)

**Request Body:**
```json
{
  "name": "Youth Service",
  "description": "Weekly youth fellowship service",
  "dayOfWeek": 6,
  "defaultTime": "16:00:00"
}
```
*dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday*

**Response (201):**
```json
{
  "success": true,
  "message": "Service type created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "name": "Youth Service",
    "slug": "youth_service",
    "description": "Weekly youth fellowship service",
    "dayOfWeek": 6,
    "defaultTime": "16:00:00",
    "isActive": true,
    "createdBy": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

---

### Get All Service Types
**GET** `http://localhost:4000/api/admin/service-types`

**Access:** Private (All privileged users)

**Query Parameters:**
- `includeInactive` (optional): "true" to include inactive service types

**Response (200):**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440021",
      "name": "Sunday Service",
      "slug": "sunday_service",
      "description": "Weekly Sunday worship service",
      "dayOfWeek": 0,
      "defaultTime": "09:00:00",
      "isActive": true,
      "creator": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "firstName": "Super",
        "lastName": "Admin"
      }
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440022",
      "name": "Cell Meeting",
      "slug": "cell_meeting",
      "description": "Weekly cell group fellowship meeting",
      "dayOfWeek": 5,
      "defaultTime": "18:30:00",
      "isActive": true
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440023",
      "name": "Midweek Service",
      "slug": "midweek_service",
      "description": "Weekly midweek prayer and teaching service",
      "dayOfWeek": 3,
      "defaultTime": "18:00:00",
      "isActive": true
    }
  ]
}
```

---

### Get Single Service Type
**GET** `http://localhost:4000/api/admin/service-types/:id`

**Access:** Private (All privileged users)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440021",
    "name": "Sunday Service",
    "slug": "sunday_service",
    "description": "Weekly Sunday worship service",
    "dayOfWeek": 0,
    "defaultTime": "09:00:00",
    "isActive": true
  }
}
```

---

### Update Service Type
**PUT** `http://localhost:4000/api/admin/service-types/:id`

**Access:** Private (SuperAdmin only)

**Request Body:**
```json
{
  "name": "Sunday Worship Service",
  "description": "Updated description",
  "defaultTime": "10:00:00",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Service type updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440021",
    "name": "Sunday Worship Service",
    "slug": "sunday_worship_service",
    "description": "Updated description",
    "defaultTime": "10:00:00",
    "isActive": true
  }
}
```

---

### Delete Service Type
**DELETE** `http://localhost:4000/api/admin/service-types/:id`

**Access:** Private (SuperAdmin only)

**Response (200):**
```json
{
  "success": true,
  "message": "Service type deactivated successfully"
}
```

---

## Admin - Member Management

### Get All Members
**GET** `http://localhost:4000/api/admin/members`

**Access:** Private (SuperAdmin - all, CellLeader - their cell only)

**Query Parameters:**
- `cellName` (optional): Filter by cell name
- `status` (optional): Filter by status ("active" | "inactive" | "suspended")
- `search` (optional): Search by name or email

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "+233201234567",
      "cellName": "Light Fellowship",
      "isVerified": true,
      "role": "member",
      "status": "active",
      "createdAt": "2026-02-27T10:00:00.000Z"
    }
  ]
}
```

---

### Update Member Status
**PUT** `http://localhost:4000/api/admin/members/:id`

**Access:** Private (SuperAdmin - all, CellLeader - their cell only)

**Request Body:**
```json
{
  "status": "suspended",
  "cellName": "Spirit Fellowship"
}
```
*cellName change only allowed for SuperAdmin*

**Response (200):**
```json
{
  "success": true,
  "message": "Member updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "status": "suspended",
    "cellName": "Spirit Fellowship"
  }
}
```

---

### Remove Member
**DELETE** `http://localhost:4000/api/admin/members/:id`

**Access:** Private (SuperAdmin - all, CellLeader - their cell only)

**Response (200):**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

## Admin - Messages

### Send Broadcast Message
**POST** `http://localhost:4000/api/admin/messages/send`

**Access:** Private (SuperAdmin only)

**Request Body:**
```json
{
  "subject": "Important Church Announcement",
  "body": "Dear members,\n\nWe are pleased to announce...",
  "audience": "all"
}
```

**Audience Options:**
- `"all"`: Send to all active members
- `"cell"`: Send to specific cell (requires `cellName`)
- `"individual"`: Send to specific member (requires `memberId`)

**Request Body (Cell Audience):**
```json
{
  "subject": "Cell Meeting Update",
  "body": "Dear cell members,\n\nOur meeting this week...",
  "audience": "cell",
  "cellName": "Light Fellowship"
}
```

**Request Body (Individual):**
```json
{
  "subject": "Personal Message",
  "body": "Dear member,\n\nWe would like to inform you...",
  "audience": "individual",
  "memberId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_1709035200000",
    "recipientCount": 150,
    "sent": 148,
    "failed": 2
  }
}
```

---

## Admin - Dashboard

### Get Dashboard Stats
**GET** `http://localhost:4000/api/admin/dashboard`

**Access:** Private (SuperAdmin - full stats, CellLeader - cell stats)

**Response (200) - SuperAdmin:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 150,
    "totalCells": 5,
    "totalAdmins": 8,
    "todayAttendance": 45,
    "recentAttendance": 320,
    "attendanceRate": "30.00"
  }
}
```

**Response (200) - CellLeader:**
```json
{
  "success": true,
  "data": {
    "cellName": "Light Fellowship",
    "cellMembers": 30,
    "todayCellAttendance": 12,
    "recentCellAttendance": 85,
    "attendanceRate": "40.00"
  }
}
```

---

### Get Dashboard Summary (Lightweight)
**GET** `http://localhost:4000/api/admin/dashboard/summary`

**Access:** Private (SuperAdmin only)

**Description:** Single lightweight endpoint returning all dashboard stats. Reduces multiple API calls on dashboard load to just one.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalMembers": 150,
    "activeMembers": 135,
    "totalCells": 5,
    "totalPrivilegedUsers": 8,
    "todayAttendance": 45,
    "todayTotal": 150,
    "todayRate": "30.00",
    "last30DaysAttendance": 1250,
    "last30DaysRate": "72.50",
    "newMembersThisMonth": 12
  }
}
```

---

## Attendance

### Scan Attendance (Mark Attendance)
**POST** `http://localhost:4000/api/attendance/scan`

**Access:** Private (Usher and SuperAdmin only) - Rate Limited: 200 req/min

**Request Body:**
```json
{
  "qrData": "{\"userId\":\"550e8400-e29b-41d4-a716-446655440000\",\"firstName\":\"John\",\"lastName\":\"Doe\",\"email\":\"john.doe@example.com\",\"phoneNumber\":\"+233201234567\",\"cellName\":\"Light Fellowship\",\"timestamp\":1709035200000}",
  "serviceTypeId": "550e8400-e29b-41d4-a716-446655440021"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Attendance marked successfully for John Doe",
  "data": {
    "attendance": {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "cellName": "Light Fellowship",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "+233201234567",
      "usherId": "550e8400-e29b-41d4-a716-446655440003",
      "serviceTypeId": "550e8400-e29b-41d4-a716-446655440021",
      "dateOfAttendance": "2026-02-27",
      "checkInTime": "09:15:30"
    },
    "member": {
      "name": "John Doe",
      "cell": "Light Fellowship"
    },
    "service": "Sunday Service"
  }
}
```

**Error Response (400 - Already Marked):**
```json
{
  "success": false,
  "message": "Attendance already marked for John Doe on 2026-02-27 for Sunday Service"
}
```

---

### Get Attendance by Date
**GET** `http://localhost:4000/api/attendance/date/:date`

**Access:** Private (SuperAdmin - all, CellLeader - their cell only)

**URL Parameters:**
- `date`: Date in YYYY-MM-DD format

**Query Parameters:**
- `serviceTypeId` (optional): Filter by service type
- `cellName` (optional): Filter by cell (SuperAdmin only)

**Example:** `GET http://localhost:4000/api/attendance/date/2026-02-27?serviceTypeId=550e8400-e29b-41d4-a716-446655440021`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2026-02-27",
    "totalPresent": 45,
    "totalMembers": 150,
    "attendancePercentage": "30.00",
    "attendance": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440030",
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "cellName": "Light Fellowship",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "checkInTime": "09:15:30",
        "usher": {
          "firstName": "Mark",
          "lastName": "Usher"
        },
        "serviceType": {
          "id": "550e8400-e29b-41d4-a716-446655440021",
          "name": "Sunday Service",
          "slug": "sunday_service"
        }
      }
    ]
  }
}
```

---

### Get Attendance Summary by Cell
**GET** `http://localhost:4000/api/attendance/summary/cell`

**Access:** Private (SuperAdmin - all, CellLeader - their cell only)

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `cellName` (optional): Filter by cell (SuperAdmin only)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "cellName": "Light Fellowship",
      "totalAttendance": 120,
      "uniqueMembers": 28,
      "daysTracked": 4,
      "totalMembers": 30,
      "averageAttendance": "30.00"
    },
    {
      "cellName": "Spirit Fellowship",
      "totalAttendance": 100,
      "uniqueMembers": 25,
      "daysTracked": 4,
      "totalMembers": 28,
      "averageAttendance": "25.00"
    }
  ]
}
```

---

### Get Absentees
**GET** `http://localhost:4000/api/attendance/absentees/:date`

**Access:** Private (SuperAdmin - all, CellLeader - their cell only)

**URL Parameters:**
- `date`: Date in YYYY-MM-DD format

**Query Parameters:**
- `serviceTypeId` (optional): Filter by service type
- `cellName` (optional): Filter by cell (SuperAdmin only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2026-02-27",
    "serviceType": "Sunday Service",
    "totalAbsentees": 105,
    "totalMembers": 150,
    "absenteesByCell": {
      "Light Fellowship": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440005",
          "firstName": "Mary",
          "lastName": "Johnson",
          "email": "mary.johnson@example.com",
          "phoneNumber": "+233201234570",
          "cellName": "Light Fellowship"
        }
      ],
      "Spirit Fellowship": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440006",
          "firstName": "Peter",
          "lastName": "Williams",
          "email": "peter.williams@example.com",
          "phoneNumber": "+233201234571",
          "cellName": "Spirit Fellowship"
        }
      ]
    }
  }
}
```

---

### Get Member Attendance History
**GET** `http://localhost:4000/api/attendance/member/:memberId`

**Access:** Private (Member - own history with "me", Admins - any member)

**URL Parameters:**
- `memberId`: Member UUID or "me" for own history

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Example:** `GET http://localhost:4000/api/attendance/member/me?startDate=2026-01-01&endDate=2026-02-27`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "cellName": "Light Fellowship"
    },
    "totalRecords": 12,
    "attendance": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440030",
        "dateOfAttendance": "2026-02-27",
        "serviceTypeId": "550e8400-e29b-41d4-a716-446655440021",
        "checkInTime": "09:15:30"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440031",
        "dateOfAttendance": "2026-02-20",
        "serviceTypeId": "550e8400-e29b-41d4-a716-446655440021",
        "checkInTime": "09:10:15"
      }
    ]
  }
}
```

---

### Get Attendance Analytics
**GET** `http://localhost:4000/api/attendance/analytics`

**Access:** Private (SuperAdmin only)

**Query Parameters:**
- `period` (optional): Number of days to analyze (default: 30)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "30 days",
    "overview": {
      "totalAttendance": 450,
      "totalMembers": 150,
      "totalCells": 5
    },
    "byServiceType": [
      {
        "serviceType": "sunday_service",
        "count": 200
      },
      {
        "serviceType": "cell_meeting",
        "count": 150
      },
      {
        "serviceType": "midweek_service",
        "count": 100
      }
    ],
    "byCell": [
      {
        "cellName": "Light Fellowship",
        "count": 120
      },
      {
        "cellName": "Spirit Fellowship",
        "count": 100
      }
    ],
    "trend": [
      {
        "dateOfAttendance": "2026-02-01",
        "count": 42
      },
      {
        "dateOfAttendance": "2026-02-08",
        "count": 48
      }
    ]
  }
}
```

---

## Attendance Analytics

### Get Growth Analytics
**GET** `http://localhost:4000/api/attendance/analytics/growth`

**Access:** Private (SuperAdmin - all, CellLeader - their cell only)

**Description:** Track member registration/growth over time for growth tracker charts.

**Query Parameters:**
- `period` (optional): `"weekly"` | `"monthly"` (default: `"weekly"`)
- `cellName` (optional): Filter by cell (SuperAdmin only)
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Example:** `GET http://localhost:4000/api/attendance/analytics/growth?period=weekly&startDate=2026-01-01&endDate=2026-03-01`

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "date": "2026-02-01", "newMembers": 5, "totalMembers": 120 },
    { "date": "2026-02-08", "newMembers": 3, "totalMembers": 123 },
    { "date": "2026-02-15", "newMembers": 7, "totalMembers": 130 },
    { "date": "2026-02-22", "newMembers": 4, "totalMembers": 134 }
  ]
}
```

---

### Get Retention Analytics
**GET** `http://localhost:4000/api/attendance/analytics/retention`

**Access:** Private (SuperAdmin - all, CellLeader - their cell only)

**Description:** Calculate member retention/engagement rate showing how many members are actively attending vs dropping off.

**Query Parameters:**
- `weeks` (optional): Number of weeks to analyze (default: 4)
- `cellName` (optional): Filter by cell (SuperAdmin only)

**Example:** `GET http://localhost:4000/api/attendance/analytics/retention?weeks=4`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "retentionRate": "78.50",
    "activeMembers": 118,
    "inactiveMembers": 32,
    "atRiskMembers": 15,
    "totalMembers": 150,
    "period": "4 weeks"
  }
}
```

---

### Get Service Type Trends
**GET** `http://localhost:4000/api/attendance/analytics/trends/service`

**Access:** Private (SuperAdmin - all, CellLeader - their cell only)

**Description:** Per-service-type attendance trend over time for line/bar charts comparing attendance across service types.

**Query Parameters:**
- `period` (optional): Number of days (default: 30)
- `serviceTypeId` (optional): Filter to single service type

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "date": "2026-02-01", "serviceType": "sunday_service", "serviceName": "Sunday Service", "count": 42 },
    { "date": "2026-02-01", "serviceType": "cell_meeting", "serviceName": "Cell Meeting", "count": 28 },
    { "date": "2026-02-08", "serviceType": "sunday_service", "serviceName": "Sunday Service", "count": 48 },
    { "date": "2026-02-08", "serviceType": "cell_meeting", "serviceName": "Cell Meeting", "count": 32 }
  ]
}
```

---

### Get Cell Trends
**GET** `http://localhost:4000/api/attendance/analytics/trends/cell`

**Access:** Private (SuperAdmin only)

**Description:** Per-cell attendance trend over time for cell comparison charts showing which cells are growing/declining.

**Query Parameters:**
- `period` (optional): Number of days (default: 30)
- `cellName` (optional): Filter to single cell

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "date": "2026-02-01", "cellName": "Light Fellowship", "count": 25 },
    { "date": "2026-02-01", "cellName": "Spirit Fellowship", "count": 20 },
    { "date": "2026-02-08", "cellName": "Light Fellowship", "count": 28 },
    { "date": "2026-02-08", "cellName": "Spirit Fellowship", "count": 22 }
  ]
}
```

---

### Get First-Timers
**GET** `http://localhost:4000/api/attendance/analytics/first-timers`

**Access:** Private (SuperAdmin - all, CellLeader - their cell only)

**Description:** Identify members who attended for the first time in a given date range for new visitor tracking and outreach.

**Query Parameters:**
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)
- `cellName` (optional): Filter by cell (SuperAdmin only)

**Example:** `GET http://localhost:4000/api/attendance/analytics/first-timers?startDate=2026-02-01&endDate=2026-02-28`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "memberId": "550e8400-e29b-41d4-a716-446655440050",
      "firstName": "Sarah",
      "lastName": "Mensah",
      "email": "sarah@example.com",
      "cellName": "Light Fellowship",
      "firstAttendanceDate": "2026-02-15",
      "serviceType": "Sunday Service"
    },
    {
      "memberId": "550e8400-e29b-41d4-a716-446655440051",
      "firstName": "Emmanuel",
      "lastName": "Asante",
      "email": "emmanuel@example.com",
      "cellName": "Spirit Fellowship",
      "firstAttendanceDate": "2026-02-22",
      "serviceType": "Cell Meeting"
    }
  ]
}
```

---

### Get Attendance Streaks
**GET** `http://localhost:4000/api/attendance/analytics/streaks`

**Access:** Private (SuperAdmin - all, CellLeader - their cell only)

**Description:** Track consecutive-week attendance streaks per member for engagement gamification and member recognition.

**Query Parameters:**
- `cellName` (optional): Filter by cell (SuperAdmin only)
- `minStreak` (optional): Minimum streak length to include (default: 2)

**Example:** `GET http://localhost:4000/api/attendance/analytics/streaks?minStreak=4`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "memberId": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "cellName": "Light Fellowship",
      "currentStreak": 8,
      "longestStreak": 12,
      "lastAttendance": "2026-03-01"
    },
    {
      "memberId": "550e8400-e29b-41d4-a716-446655440005",
      "firstName": "Mary",
      "lastName": "Johnson",
      "cellName": "Spirit Fellowship",
      "currentStreak": 5,
      "longestStreak": 10,
      "lastAttendance": "2026-03-01"
    }
  ]
}
```

---

### Get Peak Times
**GET** `http://localhost:4000/api/attendance/analytics/peak-times`

**Access:** Private (SuperAdmin - all, CellLeader - their cell only)

**Description:** Analyze check-in time distribution for heatmap or histogram to understand when members typically arrive.

**Query Parameters:**
- `period` (optional): Number of days (default: 30)
- `serviceTypeId` (optional): Filter by service type

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "hour": 7, "count": 5 },
    { "hour": 8, "count": 25 },
    { "hour": 9, "count": 48 },
    { "hour": 10, "count": 30 },
    { "hour": 11, "count": 12 }
  ]
}
```

---

### Compare Periods
**GET** `http://localhost:4000/api/attendance/compare/periods`

**Access:** Private (SuperAdmin - all, CellLeader - their cell only)

**Description:** Compare two arbitrary date ranges side by side for "This month vs last month" comparisons.

**Query Parameters:**
- `period1Start` (required): First period start date (YYYY-MM-DD)
- `period1End` (required): First period end date (YYYY-MM-DD)
- `period2Start` (required): Second period start date (YYYY-MM-DD)
- `period2End` (required): Second period end date (YYYY-MM-DD)
- `cellName` (optional): Filter by cell (SuperAdmin only)

**Example:** `GET http://localhost:4000/api/attendance/compare/periods?period1Start=2026-02-01&period1End=2026-02-28&period2Start=2026-01-01&period2End=2026-01-31`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period1": {
      "label": "2026-02-01 to 2026-02-28",
      "totalAttendance": 420,
      "avgPerDay": 30,
      "rate": "75.00"
    },
    "period2": {
      "label": "2026-01-01 to 2026-01-31",
      "totalAttendance": 380,
      "avgPerDay": 27,
      "rate": "68.50"
    },
    "delta": {
      "attendance": 40,
      "rate": "+6.50",
      "direction": "up"
    }
  }
}
```

---

### Get Chronic Absentees
**GET** `http://localhost:4000/api/attendance/absentees/chronic`

**Access:** Private (SuperAdmin - all, CellLeader - their cell only)

**Description:** Identify members who have missed N or more consecutive services for pastoral care follow-up and re-engagement campaigns.

**Query Parameters:**
- `minMissed` (optional): Minimum consecutive missed services (default: 3)
- `cellName` (optional): Filter by cell (SuperAdmin only)

**Example:** `GET http://localhost:4000/api/attendance/absentees/chronic?minMissed=3`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "memberId": "550e8400-e29b-41d4-a716-446655440006",
      "firstName": "Peter",
      "lastName": "Williams",
      "email": "peter@example.com",
      "phoneNumber": "+233201234571",
      "cellName": "Spirit Fellowship",
      "consecutiveMissed": 5,
      "lastSeenDate": "2026-01-25",
      "lastServiceType": "Sunday Service"
    },
    {
      "memberId": "550e8400-e29b-41d4-a716-446655440007",
      "firstName": "Grace",
      "lastName": "Owusu",
      "email": "grace@example.com",
      "phoneNumber": "+233201234572",
      "cellName": "Light Fellowship",
      "consecutiveMissed": 3,
      "lastSeenDate": "2026-02-10",
      "lastServiceType": "Cell Meeting"
    }
  ]
}
```

---

## Notifications

### Get User Notifications
**GET** `http://localhost:4000/api/notifications`

**Access:** Private (Authenticated users)

**Description:** Get notifications for the current user including direct notifications, cell-wide notifications, and broadcasts.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `unreadOnly` (optional): `"true"` to show only unread (default: false)
- `type` (optional): Filter by type (`info`, `warning`, `success`, `error`, `reminder`, `announcement`)

**Example:** `GET http://localhost:4000/api/notifications?page=1&limit=10&unreadOnly=true`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440060",
        "title": "Welcome to HGBMI",
        "message": "Welcome to our church family! We're glad to have you.",
        "type": "info",
        "recipientId": null,
        "cellName": null,
        "isBroadcast": true,
        "isRead": false,
        "readAt": null,
        "expiresAt": null,
        "createdAt": "2026-03-12T10:00:00.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440061",
        "title": "Cell Meeting Reminder",
        "message": "Don't forget our cell meeting this Friday at 6 PM.",
        "type": "reminder",
        "recipientId": null,
        "cellName": "Light Fellowship",
        "isBroadcast": false,
        "isRead": true,
        "readAt": "2026-03-12T14:30:00.000Z",
        "expiresAt": "2026-03-15T00:00:00.000Z",
        "createdAt": "2026-03-10T08:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

---

### Get Unread Notification Count
**GET** `http://localhost:4000/api/notifications/unread-count`

**Access:** Private (Authenticated users)

**Description:** Get count of unread notifications for badge display.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

### Mark Notification as Read
**PATCH** `http://localhost:4000/api/notifications/:notificationId/read`

**Access:** Private (Authenticated users)

**URL Parameters:**
- `notificationId`: UUID of the notification

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440060",
    "isRead": true,
    "readAt": "2026-03-12T15:00:00.000Z"
  }
}
```

---

### Mark All Notifications as Read
**PATCH** `http://localhost:4000/api/notifications/read-all`

**Access:** Private (Authenticated users)

**Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### Delete Notification
**DELETE** `http://localhost:4000/api/notifications/:notificationId`

**Access:** Private (Authenticated users - can only delete direct notifications sent to them)

**URL Parameters:**
- `notificationId`: UUID of the notification

**Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Not authorized to delete this notification"
}
```

---

### Admin: Get All Notifications
**GET** `http://localhost:4000/api/notifications/admin/all`

**Access:** Private (SuperAdmin only)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `type` (optional): Filter by notification type
- `isBroadcast` (optional): `"true"` or `"false"`
- `cellName` (optional): Filter by cell

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 50,
      "totalPages": 2
    }
  }
}
```

---

### Admin: Create Notification
**POST** `http://localhost:4000/api/notifications/admin/create`

**Access:** Private (SuperAdmin only)

**Request Body:**
```json
{
  "title": "Important Announcement",
  "message": "Church building maintenance scheduled for next Saturday.",
  "type": "announcement",
  "recipientId": "550e8400-e29b-41d4-a716-446655440000",
  "cellName": null,
  "isBroadcast": false,
  "expiresAt": "2026-03-20T00:00:00.000Z",
  "metadata": { "priority": "high" }
}
```

**Validation:**
- `title`: Required, max 255 characters
- `message`: Required
- `type`: Optional (`info`, `warning`, `success`, `error`, `reminder`, `announcement`)
- Must specify one of: `recipientId`, `cellName`, or `isBroadcast: true`

**Response (201):**
```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440062",
    "title": "Important Announcement",
    "message": "Church building maintenance scheduled for next Saturday.",
    "type": "announcement",
    "recipientId": "550e8400-e29b-41d4-a716-446655440000",
    "isBroadcast": false,
    "createdAt": "2026-03-12T16:00:00.000Z"
  }
}
```

---

### Admin: Update Notification
**PUT** `http://localhost:4000/api/notifications/admin/:notificationId`

**Access:** Private (SuperAdmin only)

**URL Parameters:**
- `notificationId`: UUID of the notification

**Request Body:**
```json
{
  "title": "Updated Title",
  "message": "Updated message content.",
  "type": "warning",
  "expiresAt": "2026-03-25T00:00:00.000Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification updated successfully",
  "data": { ... }
}
```

---

### Admin: Delete Notification
**DELETE** `http://localhost:4000/api/notifications/admin/:notificationId`

**Access:** Private (SuperAdmin only)

**URL Parameters:**
- `notificationId`: UUID of the notification

**Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

### Admin: Send Notification to Cell
**POST** `http://localhost:4000/api/notifications/admin/cell`

**Access:** Private (SuperAdmin only)

**Request Body:**
```json
{
  "cellName": "Light Fellowship",
  "title": "Cell Meeting Update",
  "message": "Our cell meeting has been moved to Saturday this week.",
  "type": "info",
  "expiresAt": "2026-03-18T00:00:00.000Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Notification sent to all members of Light Fellowship",
  "data": { ... }
}
```

---

### Admin: Broadcast to All Users
**POST** `http://localhost:4000/api/notifications/admin/broadcast`

**Access:** Private (SuperAdmin only)

**Request Body:**
```json
{
  "title": "Church-Wide Announcement",
  "message": "Annual thanksgiving service will be held on December 15th.",
  "type": "announcement",
  "expiresAt": "2026-12-16T00:00:00.000Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Broadcast notification sent to all users",
  "data": { ... }
}
```

---

## Notifications - Cell Leader

Cell leaders can send notifications only to members of their assigned cell.

### Get Cell Members
**GET** `http://localhost:4000/api/notifications/leader/members`

**Access:** Private (Cell Leader only)

**Description:** Get list of members in the cell leader's cell for recipient selection.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cellName": "Light Fellowship",
    "members": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "+233201234567"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@example.com",
        "phoneNumber": "+233201234568"
      }
    ],
    "count": 28
  }
}
```

---

### Get Sent Notifications
**GET** `http://localhost:4000/api/notifications/leader/sent`

**Access:** Private (Cell Leader only)

**Description:** Get notifications created by the cell leader.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440065",
        "title": "Cell Meeting Reminder",
        "message": "Don't forget our cell meeting this Friday.",
        "type": "reminder",
        "cellName": "Light Fellowship",
        "recipientId": null,
        "createdAt": "2026-03-10T08:00:00.000Z",
        "recipient": null
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440066",
        "title": "Birthday Wishes",
        "message": "Happy birthday! Have a blessed day.",
        "type": "info",
        "cellName": null,
        "recipientId": "550e8400-e29b-41d4-a716-446655440000",
        "createdAt": "2026-03-08T06:00:00.000Z",
        "recipient": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com"
        }
      }
    ],
    "pagination": {
      "total": 12,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

### Send Notification to Cell
**POST** `http://localhost:4000/api/notifications/leader/cell`

**Access:** Private (Cell Leader only)

**Description:** Send notification to all members in the cell leader's cell.

**Request Body:**
```json
{
  "title": "Cell Meeting Reminder",
  "message": "Our weekly cell meeting is this Friday at 6 PM. Please confirm your attendance.",
  "type": "reminder",
  "expiresAt": "2026-03-16T00:00:00.000Z"
}
```

**Validation:**
- `title`: Required, max 255 characters
- `message`: Required
- `type`: Optional (`info`, `warning`, `success`, `error`, `reminder`, `announcement`)
- `expiresAt`: Optional, ISO 8601 date format

**Response (201):**
```json
{
  "success": true,
  "message": "Notification sent to all members of Light Fellowship",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440067",
    "title": "Cell Meeting Reminder",
    "message": "Our weekly cell meeting is this Friday at 6 PM. Please confirm your attendance.",
    "type": "reminder",
    "cellName": "Light Fellowship",
    "createdById": "550e8400-e29b-41d4-a716-446655440010",
    "createdAt": "2026-03-12T10:00:00.000Z"
  }
}
```

---

### Send Notification to Member
**POST** `http://localhost:4000/api/notifications/leader/member`

**Access:** Private (Cell Leader only)

**Description:** Send notification to a specific member in the cell leader's cell.

**Request Body:**
```json
{
  "recipientId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Follow-up Message",
  "message": "We missed you at the last meeting. Hope everything is okay!",
  "type": "info"
}
```

**Validation:**
- `recipientId`: Required, valid UUID
- `title`: Required, max 255 characters
- `message`: Required
- `type`: Optional
- Recipient must be a member of the cell leader's cell

**Response (201):**
```json
{
  "success": true,
  "message": "Notification sent to John Doe",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440068",
    "title": "Follow-up Message",
    "message": "We missed you at the last meeting. Hope everything is okay!",
    "type": "info",
    "recipientId": "550e8400-e29b-41d4-a716-446655440000",
    "createdById": "550e8400-e29b-41d4-a716-446655440010",
    "createdAt": "2026-03-12T10:30:00.000Z"
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "You can only send notifications to members of your own cell"
}
```

---

### Delete Notification
**DELETE** `http://localhost:4000/api/notifications/leader/:notificationId`

**Access:** Private (Cell Leader only - can only delete notifications they created)

**URL Parameters:**
- `notificationId`: UUID of the notification

**Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "You can only delete notifications you created"
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    },
    {
      "field": "password",
      "message": "Password must contain uppercase, lowercase, number, and special character"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Not authorized, token invalid"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Access denied. Super Admin only."
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### Rate Limited (429)
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again after 15 minutes"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "requestId": "550e8400-e29b-41d4-a716-446655440099"
}
```

---

## User Roles Summary

| Role | Description | Permissions |
|------|-------------|-------------|
| **superAdmin** | Pastor/Administrator | Full system access, CRUD all resources |
| **cellLeader** | Cell Group Leader | View/manage members in their cell only |
| **usher** | Attendance Taker | Scan QR codes, mark attendance only |
| **member** | Church Member | View own profile, QR code, attendance history |

---

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| General API | 100 requests / 15 minutes |
| Authentication | 5 requests / 15 minutes |
| OTP Requests | 3 requests / 10 minutes |
| QR Scan | 200 requests / minute |
