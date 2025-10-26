# Auto-Sync Calendar System - Testing Guide

## 🧪 Complete Testing Checklist

### Prerequisites
- [ ] App running on device/emulator
- [ ] Signed in as a student user
- [ ] At least one active opportunity exists in Firestore
- [ ] Firebase console access for manual data manipulation

---

## Test Suite 1: Phase 1 - Automatic Tracking

### Test 1.1: Track Deadlines Button
**Goal:** Verify "Track Deadlines" button adds opportunity to calendar and redirects

**Steps:**
1. Go to Home tab
2. Tap any opportunity to open details
3. Verify calendar icon is empty (○)
4. Tap "Track Deadlines" button (top button)
5. Alert should appear: "Deadlines added to your calendar!"
6. Choose "View Calendar"

**Expected Results:**
- ✅ Alert has two options: "View Calendar" and "Stay Here"
- ✅ Calendar icon turns yellow/filled (●)
- ✅ "View Calendar" navigates to Calendar tab
- ✅ Calendar tab shows the opportunity's deadlines

**Console Logs to Check:**
```
✅ Deadline tracking automatically enabled
📸 Deadline snapshot saved for: [opportunityId]
Registered to opportunity: [opportunityId]
```

---

### Test 1.2: Register Now Button (Auto-tracking)
**Goal:** Verify "Register Now" auto-tracks deadlines before opening link

**Steps:**
1. Go to Home tab
2. Find a NEW opportunity (not already tracked)
3. Tap opportunity to open details
4. Verify calendar icon is empty (○)
5. Tap "Register Now" button (bottom button)
6. External link should open

**Expected Results:**
- ✅ Calendar icon turns yellow (●) immediately
- ✅ Registration link opens in browser
- ✅ No alerts shown (silent tracking)
- ✅ Go to Calendar tab → deadline appears

**Console Logs to Check:**
```
✅ Deadline tracking automatically enabled on registration
📸 Deadline snapshot saved for: [opportunityId]
```

---

### Test 1.3: Prevent Duplicate Tracking
**Goal:** Verify already-tracked opportunities don't create duplicates

**Steps:**
1. Track an opportunity using either button
2. Return to the same opportunity
3. Tap "Register Now" again

**Expected Results:**
- ✅ Calendar icon stays yellow (already tracking)
- ✅ No duplicate created in Firestore
- ✅ Registration link still opens normally

---

## Test Suite 2: Phase 2 - Auto-Refresh on Focus

### Test 2.1: Tab Focus Auto-Refresh
**Goal:** Verify Calendar refreshes when tab is focused

**Steps:**
1. Go to Calendar tab (note current deadlines)
2. Switch to Home tab
3. Wait 5 seconds
4. Switch back to Calendar tab
5. Check console logs

**Expected Results:**
- ✅ Console shows: "📅 Calendar tab focused - checking for updates"
- ✅ If cache is fresh (<30s): "📦 Using cached deadlines"
- ✅ If cache is stale (>30s): "🔄 Fetching fresh deadlines from Firestore"
- ✅ Deadlines display quickly (cached) or load fresh

---

### Test 2.2: Cache Behavior
**Goal:** Verify 30-second cache works correctly

**Steps:**
1. Go to Calendar tab
2. Note time in console
3. Switch tabs and immediately return
4. Check console - should use cache
5. Wait 35 seconds
6. Switch tabs and return
7. Check console - should fetch fresh

**Expected Results:**
- ✅ Within 30s: Uses cached data (instant display)
- ✅ After 30s: Fetches fresh data
- ✅ Console logs show cache hit/miss correctly

---

### Test 2.3: Pull-to-Refresh
**Goal:** Verify manual refresh forces fresh data

**Steps:**
1. Go to Calendar tab
2. Pull down to refresh
3. Watch for refresh indicator
4. Check console logs

**Expected Results:**
- ✅ Shows pull-to-refresh spinner
- ✅ Console shows: "🔄 Starting background sync..."
- ✅ Console shows: "🔄 Fetching fresh deadlines from Firestore"
- ✅ All data refreshed regardless of cache
- ✅ Spinner disappears when complete

---

## Test Suite 3: Phase 3 - Deadline Change Detection

### Test 3.1: Snapshot Creation
**Goal:** Verify snapshots are created when tracking starts

**Steps:**
1. Track a new opportunity
2. Open Firebase Console
3. Navigate to: Firestore → profiles → [your userId]
4. Check `deadlineSnapshots` field

**Expected Results:**
- ✅ Field exists: `deadlineSnapshots`
- ✅ Contains key matching opportunityId
- ✅ Has structure:
  ```json
  {
    "opportunityId": "opp123",
    "specificCollection": "scholarships",
    "deadlines": [
      {
        "description": "Application Deadline",
        "date": 1234567890
      }
    ],
    "lastChecked": Timestamp
  }
  ```

---

### Test 3.2: Detect Deadline Change
**Goal:** Verify system detects when organization changes deadline

**Manual Setup Required:**
1. Track an opportunity with dateMilestones
2. Note the current deadline date
3. In Firebase Console:
   - Go to the opportunity's collection (e.g., "scholarships")
   - Find the opportunity document
   - Edit a dateMilestone date
   - Change date to a different value
   - Save

**Test Steps:**
4. Return to app
5. Pull-to-refresh on Calendar tab
6. Check console logs

**Expected Results:**
- ✅ Console shows: "🔄 Starting background sync..."
- ✅ Console shows: "🔔 Detected X deadline change(s) for [opportunityId]"
- ✅ Console shows: "✓ Sync complete: 1 change(s) detected"
- ✅ Console shows: "🔔 Notification created for deadline changes"
- ✅ Amber banner appears on Calendar

---

### Test 3.3: Multiple Change Types
**Goal:** Verify detection of added/removed/changed deadlines

**Manual Setup:**
1. Track opportunity with 2 dateMilestones
2. In Firebase:
   - Change date of milestone 1 (CHANGED)
   - Add a new milestone (ADDED)
   - Remove milestone 2 (REMOVED)
3. Save changes

**Test Steps:**
4. Pull-to-refresh on Calendar
5. Tap amber banner to view notifications

**Expected Results:**
- ✅ Modal shows all 3 changes
- ✅ CHANGED: Shows old date (red, strikethrough) → new date (green)
- ✅ ADDED: Shows green plus icon + new date
- ✅ REMOVED: Shows red minus icon + "Deadline removed"

---

## Test Suite 4: Phase 4 - Notification UI

### Test 4.1: Notification Banner Display
**Goal:** Verify amber banner appears when changes detected

**Steps:**
1. Create a deadline change (see Test 3.2)
2. Sync calendar (pull-to-refresh)
3. Check for banner below title

**Expected Results:**
- ✅ Amber/yellow banner appears
- ✅ Shows bell icon
- ✅ Shows text: "Deadline Changes Detected"
- ✅ Shows count: "X opportunities have updated deadlines"
- ✅ Chevron icon on right
- ✅ Banner is tappable

---

### Test 4.2: Notification Modal Content
**Goal:** Verify modal displays changes correctly

**Steps:**
1. Tap amber banner
2. Review modal content

**Expected Results:**
- ✅ Modal slides up from bottom
- ✅ Semi-transparent overlay
- ✅ Header shows: "Deadline Changes"
- ✅ Subtitle shows count
- ✅ Close button (X) works
- ✅ Each notification shows:
  - Calendar icon (purple background)
  - Opportunity title
  - Category
  - List of changes with proper formatting
  - "View Opportunity" link
- ✅ Scrollable if many notifications
- ✅ "Mark All as Read" button at bottom

---

### Test 4.3: Change Type Formatting
**Goal:** Verify each change type displays correctly

**Expected in Modal:**

**For CHANGED deadlines:**
- ✅ Milestone description as header
- ✅ "From: [old date]" in red with strikethrough
- ✅ "To: [new date]" in green

**For ADDED deadlines:**
- ✅ Green plus icon
- ✅ "New deadline: [date]" in green
- ✅ Milestone description

**For REMOVED deadlines:**
- ✅ Red minus icon
- ✅ "Deadline removed" in red
- ✅ Milestone description

---

### Test 4.4: View Opportunity Navigation
**Goal:** Verify "View Opportunity" link works

**Steps:**
1. Open notification modal
2. Tap "View Opportunity" on any notification
3. Check navigation

**Expected Results:**
- ✅ Modal closes automatically
- ✅ Navigates to opportunity details page
- ✅ Correct opportunity loads
- ✅ Calendar icon shows as tracking (yellow)

---

### Test 4.5: Mark as Read Functionality
**Goal:** Verify dismissing notifications

**Steps:**
1. Open notification modal
2. Tap "Mark All as Read" button
3. Wait for completion

**Expected Results:**
- ✅ Console shows: "✓ All notifications marked as read"
- ✅ Modal closes
- ✅ Amber banner disappears
- ✅ Check Firestore: all notifications have `read: true`
- ✅ Reopening Calendar shows no banner

---

## Test Suite 5: Phase 5 - Background Sync

### Test 5.1: Sync on Tab Focus
**Goal:** Verify background sync runs when opening Calendar tab

**Steps:**
1. Start on Home tab
2. Switch to Calendar tab
3. Check console logs

**Expected Results:**
- ✅ Console shows: "📅 Calendar tab focused - checking for updates"
- ✅ Console shows: "🔄 Starting background sync..." (if >60s since last)
- ✅ OR: "⏭️ Skipping sync (last synced Xs ago)" (if <60s)
- ✅ "Syncing..." badge appears briefly near title
- ✅ Badge disappears when sync completes

---

### Test 5.2: Sync Throttling (60-second)
**Goal:** Verify sync doesn't run too frequently

**Steps:**
1. Go to Calendar tab
2. Note time in console
3. Switch to Home and back to Calendar immediately
4. Check console

**Expected Results:**
- ✅ Console shows: "⏭️ Skipping sync (last synced Xs ago)"
- ✅ No sync performed
- ✅ No "Syncing..." badge
- ✅ Wait 65 seconds, switch tabs again
- ✅ Now sync should run

---

### Test 5.3: Force Sync on Pull-to-Refresh
**Goal:** Verify manual refresh bypasses throttle

**Steps:**
1. Sync calendar (wait for completion)
2. Immediately pull-to-refresh
3. Check console

**Expected Results:**
- ✅ Sync runs immediately (no throttle check)
- ✅ Console shows: "🔄 Starting background sync..."
- ✅ Even if <60s since last sync
- ✅ "Syncing..." badge appears
- ✅ All data refreshed

---

### Test 5.4: Sync Visual Indicator
**Goal:** Verify "Syncing..." badge displays correctly

**Steps:**
1. Clear app cache or wait >60s
2. Switch to Calendar tab
3. Watch title area

**Expected Results:**
- ✅ Small badge appears next to "Your Calendar"
- ✅ Badge shows spinner + "Syncing..." text
- ✅ Semi-transparent background
- ✅ Disappears after sync completes (1-3 seconds)
- ✅ Doesn't block UI interaction

---

### Test 5.5: Sync Triggers Notification Refresh
**Goal:** Verify sync updates notifications when changes found

**Setup:**
1. Track opportunity
2. Change deadline in Firestore
3. Wait 65 seconds

**Test Steps:**
4. Switch to Calendar tab
5. Watch for sync + notification

**Expected Results:**
- ✅ Sync runs automatically
- ✅ Detects change
- ✅ Console shows: "✓ Sync complete: 1 change(s) detected"
- ✅ Console shows: "📬 Found 1 unread notification(s)"
- ✅ Amber banner appears automatically
- ✅ No manual action needed

---

## Test Suite 6: Edge Cases & Error Handling

### Test 6.1: No User Signed In
**Steps:**
1. Sign out
2. Go to Calendar tab

**Expected Results:**
- ✅ No errors in console
- ✅ Shows empty state
- ✅ No sync attempts
- ✅ No crashes

---

### Test 6.2: No Tracked Opportunities
**Steps:**
1. New user with no tracked opportunities
2. Go to Calendar tab

**Expected Results:**
- ✅ Shows empty state message
- ✅ "Explore Opportunities" button works
- ✅ No sync errors
- ✅ No notification banner

---

### Test 6.3: Opportunity Deleted by Organization
**Setup:**
1. Track opportunity
2. Delete opportunity from Firestore

**Test Steps:**
3. Sync calendar

**Expected Results:**
- ✅ No errors/crashes
- ✅ Gracefully handles missing opportunity
- ✅ Deadline removed from calendar
- ✅ Console shows: "Opportunity no longer exists"

---

### Test 6.4: Network Offline
**Steps:**
1. Enable airplane mode
2. Go to Calendar tab
3. Try to sync

**Expected Results:**
- ✅ Shows cached deadlines (if any)
- ✅ Sync fails gracefully
- ✅ No crashes
- ✅ Error logged to console
- ✅ Works when back online

---

### Test 6.5: Multiple Simultaneous Changes
**Setup:**
1. Track 3 opportunities
2. Change deadlines in all 3

**Test Steps:**
3. Sync calendar
4. Check notifications

**Expected Results:**
- ✅ All 3 notifications created
- ✅ Banner shows correct count
- ✅ Modal displays all 3 opportunities
- ✅ Can scroll through all changes
- ✅ "Mark All as Read" dismisses all

---

## Test Suite 7: Data Consistency

### Test 7.1: Firestore Data Verification
**Goal:** Verify data saved correctly

**Check in Firebase Console:**

1. **User Profile** (`profiles/[userId]`):
   ```
   ✅ registeredOpportunities: Array
   ✅ deadlineSnapshots: Object
   ✅ deadlineNotifications: Array
   ```

2. **Registration Structure:**
   ```json
   registeredOpportunities: [
     {
       opportunityId: "opp123",
       specificCollection: "scholarships",
       registeredAt: Timestamp
     }
   ]
   ```

3. **Snapshot Structure:**
   ```json
   deadlineSnapshots: {
     "opp123": {
       opportunityId: "opp123",
       specificCollection: "scholarships",
       deadlines: [...],
       lastChecked: Timestamp
     }
   }
   ```

4. **Notification Structure:**
   ```json
   deadlineNotifications: [
     {
       id: "notif_...",
       type: "deadline_change",
       opportunityId: "opp123",
       opportunityTitle: "...",
       category: "...",
       changes: [...],
       read: false,
       createdAt: Timestamp
     }
   ]
   ```

---

### Test 7.2: Snapshot Updates
**Goal:** Verify snapshots update after detecting changes

**Steps:**
1. Track opportunity (snapshot created)
2. Note snapshot data in Firebase
3. Change deadline in Firestore
4. Sync calendar
5. Check snapshot again

**Expected Results:**
- ✅ Snapshot updated with new deadline date
- ✅ `lastChecked` timestamp updated
- ✅ Old date replaced with new date
- ✅ No duplicate entries

---

## Test Suite 8: Performance & Optimization

### Test 8.1: Cache Hit Rate
**Goal:** Verify caching reduces API calls

**Steps:**
1. Open Calendar tab
2. Switch away and back within 30 seconds (5 times)
3. Count console "Using cached" messages

**Expected Results:**
- ✅ 4-5 cache hits out of 5 returns
- ✅ Fast render times (<100ms)
- ✅ No unnecessary Firestore reads

---

### Test 8.2: Sync Throttle Effectiveness
**Goal:** Verify sync throttle prevents excessive calls

**Steps:**
1. Switch to Calendar tab
2. Switch away and back 10 times rapidly

**Expected Results:**
- ✅ Sync runs only once (first time)
- ✅ Next 9 times show "Skipping sync"
- ✅ No duplicate notifications
- ✅ No performance lag

---

## Test Suite 9: User Experience

### Test 9.1: Loading States
**Goal:** Verify all loading indicators work

**Check for:**
- ✅ Initial load: Large spinner + "Loading deadlines..."
- ✅ Sync: Small "Syncing..." badge near title
- ✅ Pull-to-refresh: Native refresh spinner
- ✅ Tracking toggle: Spinner on button
- ✅ Modal dismiss: Button remains clickable

---

### Test 9.2: Error Messages
**Goal:** Verify user-friendly error messages

**Test scenarios:**
- ✅ No internet: Shows cached data
- ✅ Tracking fails: Error alert shown
- ✅ Sync fails: Logged but doesn't crash

---

### Test 9.3: Visual Polish
**Goal:** Verify UI looks good

**Check:**
- ✅ Colors match design (purple, amber, green, red)
- ✅ Fonts load correctly (Karla)
- ✅ Icons display properly
- ✅ Animations smooth
- ✅ Touch targets adequate size
- ✅ No text overflow
- ✅ Responsive to screen sizes

---

## Quick Smoke Test (5 minutes)

Run this quick test to verify basic functionality:

1. ✅ Track opportunity → deadline appears in calendar
2. ✅ Change deadline in Firebase → pull-to-refresh
3. ✅ Amber banner appears → tap it
4. ✅ Modal shows changes → mark as read
5. ✅ Switch tabs → calendar auto-refreshes
6. ✅ No console errors

---

## Debugging Tips

### Common Issues & Solutions

**Issue:** Notifications not appearing
- Check: User has `deadlineNotifications` field
- Check: `read: false` in notification
- Check: Sync actually ran (console logs)

**Issue:** Sync runs every time
- Check: `lastSyncTimestamp.current` being set
- Check: Time calculation (should be 60000ms)

**Issue:** Snapshots not created
- Check: `saveDeadlineSnapshot()` called in `registerToOpportunity()`
- Check: Opportunity has dateMilestones
- Check: No errors in console

**Issue:** Changes not detected
- Check: Snapshot exists for opportunity
- Check: Deadline actually changed (compare timestamps)
- Check: `syncTrackedOpportunityDeadlines()` returns >0

### Console Log Patterns

**Successful Flow:**
```
📅 Calendar tab focused - checking for updates
📦 Using cached deadlines (fetched 15 seconds ago)
📬 Found 0 unread notification(s)
🔄 Starting background sync for deadline changes...
✓ Sync complete: No changes detected
```

**Change Detected:**
```
🔄 Starting background sync for deadline changes...
🔔 Detected 1 deadline change(s) for opp123
🔔 Notification created for deadline changes
✓ Sync complete: 1 change(s) detected
📬 Found 1 unread notification(s)
🔄 Fetching fresh deadlines from Firestore
```

---

## Test Results Template

Use this to track your testing:

```
Date: __________
Tester: __________
App Version: __________
Device: __________

Phase 1: ☐ Pass ☐ Fail
Phase 2: ☐ Pass ☐ Fail
Phase 3: ☐ Pass ☐ Fail
Phase 4: ☐ Pass ☐ Fail
Phase 5: ☐ Pass ☐ Fail
Edge Cases: ☐ Pass ☐ Fail

Issues Found:
1. 
2. 
3. 

Notes:


```

---

## Ready to Test!

Start with the **Quick Smoke Test**, then proceed through each test suite systematically.

Good luck! 🧪🚀

