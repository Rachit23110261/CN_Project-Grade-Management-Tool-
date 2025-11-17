# Two-Factor Registration System

## Overview
The Grade Management System now uses a **2-factor authentication registration** process where:
1. New users submit a registration request
2. Admin reviews and approves/rejects the request
3. Approved users receive their account credentials

---

## Database Schema

### New Table: `pending_registrations`

```sql
CREATE TABLE pending_registrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Pre-hashed
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'professor')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);
```

**Indexes:**
- `idx_pending_registrations_email` - Fast email lookups
- `idx_pending_registrations_status` - Filter by status

---

## API Endpoints

### 1. Submit Registration Request (Public)
**POST** `/api/registration/request`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "role": "student"  // or "professor"
}
```

**Response (201):**
```json
{
  "message": "Registration request submitted successfully. Please wait for admin approval.",
  "registration": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "student",
    "status": "pending",
    "requested_at": "2025-11-16T10:30:00.000Z"
  }
}
```

**Validations:**
- ✅ All fields required (name, email, password, role)
- ✅ Role must be 'student' or 'professor' (not 'admin')
- ✅ Password minimum 6 characters
- ✅ Email must be unique (checks both users and pending_registrations)
- ✅ Cannot resubmit if request is pending or rejected

---

### 2. Get All Registration Requests (Admin Only)
**GET** `/api/registration/pending?status=pending&role=student`

**Query Parameters:**
- `status` (optional) - Filter by: 'pending', 'approved', 'rejected'
- `role` (optional) - Filter by: 'student', 'professor'

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "student",
    "status": "pending",
    "rejection_reason": null,
    "requested_at": "2025-11-16T10:30:00.000Z",
    "reviewed_at": null,
    "reviewed_by": null,
    "reviewed_by_name": null
  }
]
```

---

### 3. Get Registration Statistics (Admin Only)
**GET** `/api/registration/stats`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "pending": 5,
  "approved": 15,
  "rejected": 2,
  "total": 22
}
```

---

### 4. Approve Registration (Admin Only)
**PUT** `/api/registration/approve/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "message": "Registration approved successfully",
  "user": {
    "id": 10,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "student"
  }
}
```

**What Happens:**
1. ✅ Creates user account in `users` table
2. ✅ Updates registration status to 'approved'
3. ✅ Records admin who approved (reviewed_by)
4. ✅ Sends approval email to user
5. ✅ User can now login with their original password

**Error Cases:**
- Registration not found (404)
- Already approved/rejected (400)
- User already exists (400)

---

### 5. Reject Registration (Admin Only)
**PUT** `/api/registration/reject/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "reason": "Invalid institutional email address"
}
```

**Response (200):**
```json
{
  "message": "Registration rejected successfully",
  "registration": {
    "id": 1,
    "email": "john.doe@example.com",
    "status": "rejected",
    "reason": "Invalid institutional email address"
  }
}
```

**What Happens:**
1. ✅ Updates registration status to 'rejected'
2. ✅ Stores rejection reason
3. ✅ Records admin who rejected (reviewed_by)
4. ✅ Sends rejection email to user with reason
5. ❌ User cannot login (account not created)

**Validations:**
- Reason is required (cannot be empty)
- Registration must be in 'pending' status

---

### 6. Delete Registration (Admin Only)
**DELETE** `/api/registration/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "message": "Registration request deleted successfully"
}
```

**Use Case:** Remove old approved/rejected requests from database

---

## Email Notifications

### 1. Registration Request Confirmation
**Sent to:** User (when they submit request)  
**Subject:** Registration Request Received - Grade Management System

**Content:**
- ✅ Confirms request received
- 📋 Explains review process
- ⏱️ Typical processing time (24-48 hours)

---

### 2. Registration Approved
**Sent to:** User (when admin approves)  
**Subject:** Registration Approved - Grade Management System

**Content:**
- ✅ Account activated
- 🔐 Login instructions (use original password)
- 🔗 Login link

---

### 3. Registration Rejected
**Sent to:** User (when admin rejects)  
**Subject:** Registration Request Update - Grade Management System

**Content:**
- ❌ Registration not approved
- 📝 Reason for rejection
- 💬 Contact admin for clarification

---

## User Flow

### For New Users:

```
1. Visit Registration Page
   ↓
2. Fill Form (name, email, password, role)
   ↓
3. Submit Request
   ↓
4. Receive Confirmation Email
   ↓
5. Wait for Admin Review
   ↓
6a. APPROVED → Receive Email → Login with password
   OR
6b. REJECTED → Receive Email with reason → Fix issue & resubmit
```

### For Admin:

```
1. Login to Admin Panel
   ↓
2. View Pending Registrations
   ↓
3. Review User Information
   ↓
4a. APPROVE → User account created → Approval email sent
   OR
4b. REJECT → Enter reason → Rejection email sent
```

---

## Security Features

### Password Handling
- ✅ Password hashed with bcrypt (10 rounds) **before** storing in `pending_registrations`
- ✅ When approved, hashed password copied to `users` table
- ✅ User can login immediately with their original password
- ✅ No plain-text passwords stored anywhere

### Email Validation
- ✅ Case-insensitive email matching
- ✅ Duplicate check across both `users` and `pending_registrations`
- ✅ Cannot register with existing email

### Role Restrictions
- ✅ Only 'student' and 'professor' can self-register
- ✅ 'admin' role can only be created by existing admin
- ✅ Admin cannot be demoted through registration

### Status Transitions
```
pending → approved ✅
pending → rejected ✅
approved → (cannot change) ❌
rejected → (cannot change) ❌
```

---

## Frontend Integration

### Registration Page Component
Create a new public registration page at `/register`:

```jsx
import { useState } from 'react';
import api from '../api/axios';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/registration/request', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      setMessage(response.data.message);
      // Optionally redirect to login page
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Register for Grade Management System</h2>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </div>
  );
}
```

### Admin Panel Component
Add to Admin Panel at `/admin/registrations`:

```jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function ManageRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchRegistrations();
  }, [filter]);

  const fetchRegistrations = async () => {
    try {
      const response = await api.get(`/registration/pending?status=${filter}`);
      setRegistrations(response.data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/registration/approve/${id}`);
      alert('Registration approved!');
      fetchRegistrations();
    } catch (error) {
      alert(error.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await api.put(`/registration/reject/${id}`, { reason });
      alert('Registration rejected');
      fetchRegistrations();
    } catch (error) {
      alert(error.response?.data?.message || 'Rejection failed');
    }
  };

  return (
    <div>
      <h2>Manage Registration Requests</h2>
      {/* Registration list with approve/reject buttons */}
    </div>
  );
}
```

---

## Testing Guide

### 1. Test Registration Request
```bash
curl -X POST http://localhost:5000/api/registration/request \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "test@example.com",
    "password": "password123",
    "role": "student"
  }'
```

### 2. Test Get Pending Requests (as Admin)
```bash
curl -X GET http://localhost:5000/api/registration/pending \
  -H "Authorization: Bearer <admin_token>"
```

### 3. Test Approve Request (as Admin)
```bash
curl -X PUT http://localhost:5000/api/registration/approve/1 \
  -H "Authorization: Bearer <admin_token>"
```

### 4. Test Reject Request (as Admin)
```bash
curl -X PUT http://localhost:5000/api/registration/reject/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "reason": "Invalid email domain"
  }'
```

---

## Migration Notes

### Existing Users
- ✅ Not affected - existing users continue to work
- ✅ Admin can still create users via bulk upload
- ✅ Both registration systems coexist

### Backwards Compatibility
- ✅ Old registration endpoint still works (admin only)
- ✅ New registration is separate workflow
- ✅ No breaking changes to existing APIs

---

## Common Questions

**Q: Can admin accounts be created through registration?**  
A: No, only 'student' and 'professor' roles can self-register. Admin accounts must be created by existing admins.

**Q: What happens if user forgets their password before approval?**  
A: They can submit a new registration request or contact admin after approval for password reset.

**Q: Can rejected users resubmit?**  
A: Currently no - they need to contact admin. You can add a "resubmit" feature if needed.

**Q: Are passwords sent to users via email?**  
A: No! Users create their own password during registration. After approval, they login with the same password they created.

**Q: Can admin edit registration details before approving?**  
A: Currently no - admin can only approve/reject. To change details, reject and ask user to resubmit.

---

## Summary of Changes

### New Files Created:
1. ✅ `src/models/PendingRegistration.js` - Model for registration requests
2. ✅ `src/controllers/registrationController.js` - 6 controller functions
3. ✅ `src/routes/registrationRoutes.js` - Registration API routes

### Modified Files:
1. ✅ `src/db/schema.sql` - Added `pending_registrations` table
2. ✅ `src/services/emailService.js` - Added 3 new email templates
3. ✅ `src/app.js` - Imported registration routes

### Database Changes:
1. ✅ New table: `pending_registrations` (7 columns, 2 indexes)
2. ✅ Foreign key: `reviewed_by` → `users(id)`

---

**Next Steps:**
1. Create frontend registration page
2. Add registration management to Admin Panel
3. Test the complete workflow
4. Customize email templates as needed
