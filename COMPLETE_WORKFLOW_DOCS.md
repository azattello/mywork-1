# Complete Proposal & Work Flow System Documentation

## Overview

Full implementation of a two-stage proposal system with work completion and review workflow for the YoYo.kz application. This system manages the entire lifecycle from specialist selection through project completion and reviews.

---

## System Architecture

### State Progression

```
Application States:
┌─────────┐      ┌──────────┐      ┌─────────────┐      ┌─────────┐
│  open   │──→   │in_progress│  →  │work_accepted│  →   │ closed  │
└─────────┘      └──────────┘      └─────────────┘      └─────────┘

Response States:
- "pending" → Client has selected specialist, awaiting confirmation
- "accepted" → Specialist confirmed, application is "in_progress"
- "rejected" → Specialist or client rejected the match
```

### Key Data Model Changes

**Application Model** - Added fields:
```javascript
{
  proposedSpecialist: ObjectId,           // Set when client selects
  pendingSpecialistConfirmation: Boolean, // True until specialist confirms
  currentSpecialist: ObjectId,            // Set when specialist confirms
  workCompleted: Boolean,                 // Specialist marks work done
  workAccepted: Boolean,                  // Client accepts completed work
  active: Boolean,                        // false when confirmed (not in search)
  status: String,                         // 'open', 'in_progress', 'closed'
  review: ObjectId,                       // Reference to Review collection
}
```

**Response Model** - Status values:
- `"pending"` - Initial, specialist has responded
- `"accepted"` - Response selected by client (proposed state)
- `"confirmed"` - Specialist confirmed (becomes currentSpecialist)
- `"rejected"` - Either party rejected

**Review Model** - New fields:
```javascript
{
  application: ObjectId,     // Link to application
  author: ObjectId,          // Who wrote review
  toUser: ObjectId,          // Who the review is about
  rating: Number,            // 1-5 stars
  text: String,              // Review text (min 10 chars)
  image: String,             // Optional image URL
  createdAt: Date
}
```

---

## API Endpoints

### 1. Response Management (Proposal Stage)

#### POST `/api/applications/:applicationId/responses/:responseId/accept`
**Client selects a specialist**
- Sets `response.status = "accepted"`
- Sets `application.proposedSpecialist = specialistId`
- Sets `application.pendingSpecialistConfirmation = true`
- Application remains `active: true` (still visible in search)
- Emits: `proposal_selected` to specialist's socket room

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "response123",
    "status": "accepted",
    "application": "app123",
    "specialist": "spec123"
  }
}
```

---

#### POST `/api/applications/:applicationId/responses/:responseId/confirm`
**Specialist confirms client's selection**
- Sets `response.status = "confirmed"`
- Sets `application.currentSpecialist = specialistId`
- Sets `application.status = "in_progress"`
- Sets `application.active = false` (hidden from search)
- Sets `application.pendingSpecialistConfirmation = false`
- Rejects all other responses automatically
- Emits: `proposal_confirmed` to both parties

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "response123",
    "status": "confirmed",
    "application": "app123",
    "specialist": "spec123"
  }
}
```

---

#### POST `/api/applications/:applicationId/responses/:responseId/decline`
**Either party rejects**
- If specialist: sets `response.status = "rejected"`, clears proposal
- If client: sets `response.status = "rejected"`, keeps application open
- Specialist cannot message if rejected
- Emits: `proposal_declined` to other party

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Response declined successfully"
  }
}
```

---

#### GET `/api/applications/:applicationId/responses/:specialistId`
**Fetch specialist's response status for an application**
- Only accessible by application owner or specialist
- Returns full response object including status

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "response123",
    "specialist": "spec123",
    "application": "app123",
    "status": "pending|accepted|confirmed|rejected",
    "offeredPrice": 5000,
    "estimatedDuration": "3 days",
    "description": "I can do this..."
  }
}
```

---

### 2. Work Completion

#### POST `/api/applications/:applicationId/markWorkComplete`
**Specialist marks work as finished**
- Only specialist assigned to application can mark
- Sets `application.workCompleted = true`
- Application status remains `in_progress`
- Emits: `work_marked_complete` to client

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "app123",
    "status": "in_progress",
    "workCompleted": true,
    "workAccepted": false
  }
}
```

---

#### POST `/api/applications/:applicationId/acceptWork`
**Client confirms work is complete**
- Only application owner can accept
- Sets `application.workAccepted = true`
- Next: client should leave review
- Emits: `work_accepted` to specialist

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "app123",
    "status": "in_progress",
    "workCompleted": true,
    "workAccepted": true
  }
}
```

---

### 3. Reviews

#### POST `/api/applications/:applicationId/createReview`
**Create a review after work accepted**
- Both client and specialist can review
- Each can only review once per application
- Specialist rating is auto-calculated from average
- Application closes when both have reviewed

**Request (multipart/form-data):**
```
rating: 5 (1-5)
text: "Great work, very professional and fast!"
image: <binary image file> (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "review123",
    "application": "app123",
    "author": "user123",
    "toUser": "spec123",
    "rating": 5,
    "text": "Great work...",
    "image": "/uploads/123456789.jpg",
    "createdAt": "2025-02-05T10:30:00Z"
  },
  "applicationClosed": true
}
```

---

## Message Access Control

### Rules in POST `/api/messages`

1. **If specialist AND response.status === "rejected"**
   - Returns 403: "Ваш отклик был отклонён — вы не можете писать в этом чате"
   - Specialist permanently blocked from messaging

2. **If application.status !== "open"**
   - Only `application.currentSpecialist` can send
   - Or `application.proposedSpecialist` if `pendingSpecialistConfirmation: true`
   - Other specialists cannot message after proposal rejected

3. **If application.status === "open"**
   - Application owner (client) can always send
   - All specialists can send (before/after responses)

---

## Socket Events

### Emitted Events

**proposal_selected**
```javascript
io.to('specialist_' + specialistId).emit('proposal_selected', {
  applicationId: "app123"
})
```

**proposal_confirmed**
```javascript
io.to('user_' + clientId).emit('proposal_confirmed', { applicationId })
io.to('specialist_' + specialistId).emit('proposal_confirmed', { applicationId })
```

**proposal_declined**
```javascript
io.to('specialist_' + specialistId).emit('proposal_declined', { applicationId })
// OR if client declined:
io.to('user_' + clientId).emit('proposal_declined', { applicationId })
```

**work_marked_complete**
```javascript
io.to('user_' + clientId).emit('work_marked_complete', { applicationId })
```

**work_accepted**
```javascript
io.to('specialist_' + specialistId).emit('work_accepted', { applicationId })
```

**review_submitted**
```javascript
io.to('specialist_' + specialistId).emit('review_submitted', { applicationId })
// OR
io.to('user_' + clientId).emit('review_submitted', { applicationId })
```

### Frontend Listeners

In ChatScreen.js:
```javascript
socketRef.current.on('proposal_selected', () => {
  loadResponseData(applicationId, currentUser._id);
});

socketRef.current.on('proposal_confirmed', () => {
  loadResponseData(applicationId, currentUser._id);
});

socketRef.current.on('work_marked_complete', () => {
  loadApplicationData(applicationId);
});

socketRef.current.on('work_accepted', () => {
  loadApplicationData(applicationId);
});
```

---

## Frontend Components

### ChatScreen.js

**Key Features:**
- Application card header with full details (price, deadline, categories)
- Conditional action buttons based on role and status
- Work completion buttons (specialist/client)
- Review button and ReviewModal integration
- Socket event listeners for real-time updates
- Message input blocked for rejected specialists (403 handling)

**Action Button Logic:**
```javascript
// Client side - if proposal pending:
<Reject Button> → handleRejectResponse() → POST /decline
<Select Button> → handleSelectSpecialist() → POST /accept

// Specialist side - if pending confirmation:
<Decline Button> → handleDeclineProposal() → POST /decline
<Confirm Button> → handleConfirmProposal() → POST /confirm

// After in_progress:
// Specialist: <Mark Done> → POST /markWorkComplete
// Client: <Accept Work> → POST /acceptWork

// After work accepted:
// Both: <Leave Review> → ReviewModal
```

### ReviewModal.js

**Features:**
- Star rating selector (1-5)
- Review text input (min 10 chars)
- Image upload from gallery
- Loading and error states
- Multipart form submission

**Props:**
```javascript
ReviewModal
  - visible: Boolean
  - onClose: Function
  - onSubmit: (reviewData) => Promise
  - loading: Boolean
  - userName: String
```

---

## File Structure

### Backend
```
src/
  controllers/
    responseController.js    (markWorkComplete, acceptWork, createReview)
  models/
    Application.js           (added 4 new fields)
    Review.js                (updated with author/toUser)
  routes/
    applications.js          (3 new routes for work/review)
  middlewares/
    upload.js                (new - image upload handling)
```

### Frontend
```
components/
  ChatScreen.js              (major update - action buttons, socket listeners)
  ReviewModal.js             (new component)
```

---

## Testing Scenarios

### Scenario 1: Complete Happy Path
1. Client opens application with 3 specialist responses
2. Client selects specialist #1 → `proposal_selected` event
3. Specialist #1 sees confirmation buttons
4. Specialist #1 confirms → `proposal_confirmed`, application becomes private
5. Specialist marks work done → `work_marked_complete`
6. Client accepts work → `work_accepted`
7. Both leave reviews → application closes when both done

### Scenario 2: Rejection
1. Client selects specialist #1 → proposed
2. Specialist #1 declines → `proposal_declined`
3. Client can now chat with specialist #2 (no blocking)
4. Specialist #1 cannot send messages in this application's chat anymore

### Scenario 3: Message Access Control
1. Application open, specialist sends message → ✅ allowed
2. Client selects specialist → specialist can still message
3. Specialist declines → specialist blocked with 403
4. Specialist #2 tries to message → blocked (not current/proposed)

---

## Error Codes

| Status | Message | Scenario |
|--------|---------|----------|
| 403 | "Ваш отклик был отклонён" | Rejected specialist trying to message |
| 403 | "Переговоры по этой заявке закрыты" | Non-assigned specialist messaging closed order |
| 400 | "Only assigned specialist can mark complete" | Wrong specialist marking done |
| 400 | "Work must be marked complete first" | Client accepting before specialist marks done |
| 400 | "Rating must be between 1 and 5" | Invalid review rating |
| 400 | "You already left a review" | Duplicate review attempt |

---

## Database Indexes

### New/Updated Indexes
```javascript
// Review
{ application: 1, author: 1 }  // unique: true

// Application
// Should have indexes on:
// - { user: 1 } for finding client's applications
// - { currentSpecialist: 1 } for specialist's active work
// - { proposedSpecialist: 1 } for pending confirmations
// - { status: 1 } for filtering
```

---

## Future Enhancements

1. **Message Reactions** - React to messages with emoji
2. **File Sharing** - Attach files in chat (work samples)
3. **Revisions** - Client request revision, specialist resubmit
4. **Dispute Resolution** - If quality issue before accept
5. **Ratings History** - Track specialist ratings over time
6. **Messaging Templates** - Quick reply buttons for common messages
7. **Video Call Integration** - Direct calling from chat
8. **Payment Integration** - Escrow payment on work acceptance

---

## Deployment Checklist

- [ ] Ensure `multer` is in package.json (`npm install multer`)
- [ ] Create `/uploads` directory in backend root (or ensure writable)
- [ ] Update `.gitignore` to exclude uploads: `uploads/`
- [ ] Test image upload with file size > 5MB (should fail)
- [ ] Verify socket.io connections working for all 6+ new events
- [ ] Test with both roles (client + specialist) simultaneously
- [ ] Check Review model index creation in MongoDB
- [ ] Clear browser cache for updated ChatScreen.js
- [ ] Test message blocking (send as rejected specialist - should get 403)

---

## Version History

- **v3.0** (2025-02-05): Complete proposal + work + review system
  - Added work completion workflow
  - Added review system with images
  - Enhanced message access control
  - Added 6 new socket events
  - 3 new backend endpoints
  - ReviewModal component
  - Upload middleware

---

Generated: 2025-02-05
System: Full Two-Stage Proposal + Work Completion + Review System
