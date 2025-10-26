# Deadline Tracking System

## Overview

The Deadline Tracking System allows students to register for opportunities and automatically track all associated deadlines in their calendar. The system extracts date milestones from registered opportunities and orders them by urgency, making it easy for students to stay on top of important dates.

## Features

### 1. **Opportunity Registration**
- Students can register to track any opportunity with deadline information
- Registration is independent of external application processes
- Tracked opportunities sync across all devices using Firestore

### 2. **Smart Calendar Integration**
- All deadlines from registered opportunities appear in the Calendar tab
- Dates are marked on the visual calendar with color-coded urgency indicators
- Pull-to-refresh to update deadlines in real-time

### 3. **Urgency-Based Sorting**
- Deadlines are automatically sorted by date (most urgent first)
- Visual urgency indicators:
  - **Red** (≤3 days): Very urgent - requires immediate attention
  - **Orange** (≤7 days): Urgent - action needed soon
  - **Yellow** (≤14 days): Moderate - plan ahead
  - **Purple** (>14 days): Not urgent - plenty of time

### 4. **Multiple Milestone Support**
- Each opportunity can have multiple date milestones
- All milestones are tracked separately (e.g., application deadline, interview date, final submission)
- Each milestone displays with its specific description

### 5. **User Experience**
- One-tap registration from opportunity details page
- Visual feedback showing tracking status
- Calendar icon in header changes color when tracking is enabled
- Empty state guides users to explore opportunities

## User Workflow

### For Students

#### 1. **Discover an Opportunity**
Navigate to Home tab → Browse opportunities → Tap on an opportunity

#### 2. **Enable Deadline Tracking** (Two Ways)

**Option A: Automatic (Recommended)**
- Tap the **"Register & Track"** button at the bottom
- System automatically adds deadlines to your calendar
- Alert confirms: "Deadlines for this opportunity have been added to your calendar! ✓"
- Registration link opens in browser
- Calendar icon in header turns yellow

**Option B: Manual Tracking Only**
- Tap the **"Track Deadlines"** button at the top
- Confirmation alert appears
- Calendar icon in header turns yellow to indicate tracking is active
- No external registration link opened

#### 3. **View Deadlines in Calendar**
Navigate to Calendar tab:
- Visual calendar shows marked dates with urgency colors
- Scroll down to see upcoming deadlines list
- Each deadline card shows:
  - Date and countdown (e.g., "3 days" or "Tomorrow")
  - Opportunity title
  - Specific milestone description
  - Category badge
  - Urgency indicator (if ≤3 days)
  - "View" button to navigate back to opportunity

#### 4. **Manage Tracking**
To remove an opportunity from tracking:
- Return to the opportunity details page
- Tap **"Tracking Deadlines"** button (now showing as active)
- Confirmation alert appears
- Deadlines are removed from calendar

## Technical Implementation

### Database Structure

#### User Profile (`profiles` collection)
```javascript
{
  userId: "student123",
  name: "John Doe",
  role: "student",
  registeredOpportunities: [
    {
      opportunityId: "opp123",
      specificCollection: "scholarships",
      registeredAt: Timestamp
    }
  ],
  // ... other fields
}
```

#### Opportunity Document (in specific collections)
```javascript
{
  id: "opp123",
  title: "STEM Scholarship 2025",
  category: "Scholarship / Grant",
  dateMilestones: [
    {
      date: Timestamp,
      title: "Application Deadline",
      description: "Submit all required documents"
    },
    {
      date: Timestamp,
      title: "Interview Date",
      description: "Online interview session"
    }
  ],
  deadline: Timestamp, // Alternative single deadline field
  // ... other fields
}
```

### Key Functions

#### `registerToOpportunity(userId, opportunityId, specificCollection)`
Registers a student to track an opportunity's deadlines.

**Parameters:**
- `userId`: Student's user ID
- `opportunityId`: ID of the opportunity
- `specificCollection`: Collection where opportunity is stored (e.g., "scholarships", "competitions")

**Returns:** Promise<void>

**Usage:**
```javascript
await registerToOpportunity(user.uid, "opp123", "scholarships");
```

---

#### `unregisterFromOpportunity(userId, opportunityId)`
Removes an opportunity from the student's tracking list.

**Parameters:**
- `userId`: Student's user ID
- `opportunityId`: ID of the opportunity to unregister

**Returns:** Promise<void>

**Usage:**
```javascript
await unregisterFromOpportunity(user.uid, "opp123");
```

---

#### `getRegisteredOpportunities(userId)`
Retrieves all opportunities a student is tracking with full details.

**Parameters:**
- `userId`: Student's user ID

**Returns:** Promise<Array<Opportunity>>

**Usage:**
```javascript
const opportunities = await getRegisteredOpportunities(user.uid);
// Returns full opportunity objects with dateMilestones
```

---

#### `getUpcomingDeadlines(userId, limit?)`
Retrieves upcoming deadlines from all registered opportunities, sorted by urgency.

**Parameters:**
- `userId`: Student's user ID
- `limit`: (Optional) Maximum number of deadlines to return (default: 10)

**Returns:** Promise<Array<Deadline>>

**Deadline Object:**
```javascript
{
  date: Date,
  title: "STEM Scholarship 2025",
  milestoneDescription: "Application Deadline",
  opportunityId: "opp123",
  specificCollection: "scholarships",
  category: "Scholarship / Grant"
}
```

**Usage:**
```javascript
const deadlines = await getUpcomingDeadlines(user.uid, 20);
// Returns up to 20 upcoming deadlines sorted by date
```

---

#### `isRegisteredToOpportunity(userId, opportunityId)`
Checks if a student is tracking a specific opportunity.

**Parameters:**
- `userId`: Student's user ID
- `opportunityId`: ID of the opportunity

**Returns:** Promise<boolean>

**Usage:**
```javascript
const isTracking = await isRegisteredToOpportunity(user.uid, "opp123");
if (isTracking) {
  console.log("Student is tracking this opportunity");
}
```

## Components

### Calendar.tsx
**Location:** `app/studentPages/(tabs)/Calendar.tsx`

**Features:**
- Displays visual calendar with marked dates
- Shows upcoming deadlines list sorted by urgency
- Pull-to-refresh functionality
- Loading states
- Empty state with call-to-action
- Urgency-based color coding
- Days countdown display

**State Management:**
- `deadlines`: Array of upcoming deadline objects
- `loading`: Initial load state
- `refreshing`: Pull-to-refresh state
- `selectedDate`: Currently selected date on calendar

---

### Opportunity.tsx (Enhanced)
**Location:** `app/studentPages/opportunity.tsx`

**New Features:**
- "Track Deadlines" button with toggle functionality (manual tracking)
- **"Register & Track" button** - Automatically enables tracking when registering
- Calendar icon in header showing tracking status (yellow when tracking)
- Loading state during registration/unregistration
- Confirmation alerts for user actions
- Smart button labels based on tracking status

**State Management:**
- `isRegistered`: Whether user is tracking this opportunity
- `isTrackingLoading`: Loading state for tracking operations

**Auto-Tracking Logic:**
When "Register & Track" is clicked:
1. Check if user is signed in
2. If not already tracking, automatically call `registerToOpportunity()`
3. Update UI to show tracking is enabled
4. Show confirmation alert
5. Open external registration link

## Color Coding System

### Urgency Colors
- **#ff0a0aff** (Red): ≤3 days remaining
- **#F59E0B** (Orange): 4-7 days remaining
- **#F4B740** (Yellow): 8-14 days remaining
- **#6C63FF** (Purple): >14 days remaining

### Category Colors
- **Scholarship / Grant**: Cyan (#D1FAFF / #0CA5E9)
- **Competition / Event**: Red (#FECACA / #B91C1C)
- **Workshop / Seminar**: Amber (#FEF3C7 / #F59E0B)
- **Study Spot**: Indigo (#E0E7FF / #4F46E5)
- **Default**: Gray (#E5E7EB / #6B7280)

## Firestore Security Rules

Add these rules to allow students to manage their registered opportunities:

```javascript
// Allow students to read/write their own registeredOpportunities
match /profiles/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow update: if request.auth != null && 
                   request.auth.uid == userId &&
                   request.resource.data.role == resource.data.role;
}
```

## Best Practices

### For Organizations Creating Opportunities

1. **Always include dateMilestones** when creating opportunities
2. **Use clear milestone descriptions** (e.g., "Application Deadline", "Interview Date")
3. **Set realistic dates** that give students enough time to prepare
4. **Include multiple milestones** for complex opportunities (application, interview, acceptance)

### For Students

1. **Use "Register & Track" button** for automatic deadline tracking when registering
2. **Register early** to get maximum planning time
3. **Check calendar regularly** for upcoming deadlines
4. **Use pull-to-refresh** to ensure you have the latest information
5. **Unregister from opportunities** you're no longer pursuing to keep calendar clean
6. **Calendar icon indicator** - Yellow icon means deadlines are being tracked

## Troubleshooting

### Deadlines Not Appearing

**Possible Causes:**
1. Opportunity doesn't have `dateMilestones` or `deadline` field
2. All deadlines have already passed
3. Not signed in or profile not loaded
4. Network connection issues

**Solutions:**
- Pull to refresh on Calendar tab
- Check if you're signed in
- Verify opportunity has deadline information
- Check network connection

### Registration Not Working

**Possible Causes:**
1. Not signed in
2. Missing opportunity ID or collection
3. Firestore permissions issue
4. Network issues

**Solutions:**
- Ensure user is signed in
- Check console for error messages
- Verify Firestore security rules
- Test network connection

### Duplicate Deadlines

**Cause:** Same milestone date appears multiple times

**Solution:** This is expected if an opportunity has multiple milestones on the same date. Each milestone is shown separately with its specific description.

## Current Features ✅

1. ✅ **Automatic Tracking on Registration** - Deadlines added when clicking "Register & Track"
2. ✅ **Manual Tracking Option** - Track without registering using "Track Deadlines" button
3. ✅ **Visual Calendar** - See all deadlines on a visual calendar
4. ✅ **Urgency Sorting** - Deadlines sorted by date with color coding
5. ✅ **Multiple Milestones** - Support for multiple dates per opportunity
6. ✅ **Pull-to-Refresh** - Easy manual sync

## Future Enhancements

### Potential Features
1. **Push Notifications**: Send alerts 1-3 days before deadlines
2. **Calendar Export**: Export deadlines to Google Calendar, iCal
3. **Deadline Filters**: Filter by category, urgency level
4. **Custom Reminders**: Set custom reminder times for each deadline
5. **Progress Tracking**: Mark milestones as complete
6. **Notes**: Add personal notes to each tracked opportunity
7. **Search**: Search through tracked opportunities
8. **Statistics**: Show deadline completion rates

### Technical Improvements
1. **Caching**: Cache deadlines locally for offline access
2. **Real-time Updates**: Use Firestore listeners for instant updates
3. **Batch Operations**: Support bulk registration/unregistration
4. **Pagination**: Implement pagination for users with many tracked opportunities

## Related Documentation

- [Opportunities System Guide](./OPPORTUNITIES_SYSTEM.md)
- [Firestore Security Setup](./FIRESTORE_SECURITY_SETUP.md)
- [Firestore Index Configuration](./FIRESTORE_INDEX_FIX.md)

## Support

For issues or questions about the deadline tracking system:
1. Check this documentation first
2. Review Firestore console for data structure
3. Check browser/app console for error messages
4. Verify user authentication state
5. Test with a fresh opportunity that has clear deadline information

