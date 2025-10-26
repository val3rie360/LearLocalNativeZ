# Debugging Empty Deadlines Issue

## Quick Diagnostic Steps

### Step 1: Check Console Logs
Open your development console and look for these messages when you open Calendar tab:

**Expected logs:**
```
📅 Calendar tab focused - checking for updates
🔄 Fetching fresh deadlines from Firestore
🔄 Starting background sync for deadline changes...
```

**What to look for:**
- Any error messages?
- Does it say "Loading deadlines..."?
- Does it say "0 deadlines" or similar?

---

### Step 2: Verify You Have Tracked Opportunities

**In Firebase Console:**
1. Go to Firestore Database
2. Navigate to: `profiles` → `[your userId]` 
3. Look for field: `registeredOpportunities`

**Should look like:**
```json
registeredOpportunities: [
  {
    opportunityId: "abc123",
    specificCollection: "scholarships",
    registeredAt: Timestamp
  }
]
```

❌ **If this field is missing or empty:**
- You haven't tracked any opportunities yet
- Try: Home tab → Tap opportunity → "Track Deadlines" button

---

### Step 3: Check Opportunity Has Date Milestones

**In Firebase Console:**
1. Go to the opportunity's collection (e.g., `scholarships`)
2. Find the opportunity document by its ID
3. Look for: `dateMilestones` field

**Should look like:**
```json
dateMilestones: [
  {
    date: Timestamp (future date),
    title: "Application Deadline",
    description: "Submit all documents"
  }
]
```

❌ **Common issues:**
- Field is missing → Opportunity has no milestones
- Field is empty array → No milestones defined
- Date is in the past → Won't show in "upcoming" deadlines

---

### Step 4: Check Date Format

Dates must be:
- ✅ Firestore Timestamp type
- ✅ Future dates (not past)
- ✅ Properly formatted

**In Firebase Console, dates should show as:**
```
December 31, 2025 at 11:59:00 PM UTC+8
```

NOT as:
- String: "2025-12-31" ❌
- Number: 1735660740000 ❌
- Invalid/null ❌

---

## Common Issues & Solutions

### Issue 1: No Opportunities Tracked

**Symptoms:**
- Empty calendar
- No console errors
- Console shows: "No registered opportunities"

**Solution:**
1. Go to Home tab
2. Tap any opportunity
3. Tap "Track Deadlines" button
4. Check console for: "✅ Deadline tracking automatically enabled"
5. Return to Calendar tab

---

### Issue 2: Opportunities Have No Milestones

**Symptoms:**
- Tracked opportunities exist in Firestore
- Calendar still empty
- No errors

**Solution:**
Add `dateMilestones` to the opportunity:

```json
dateMilestones: [
  {
    date: Timestamp.fromDate(new Date('2025-12-31')),
    title: "Application Deadline",
    description: "Final day to submit"
  }
]
```

---

### Issue 3: All Deadlines Are Past

**Symptoms:**
- Opportunities tracked
- Milestones exist
- But dates are in the past

**Solution:**
Update the dates to future dates in Firebase Console.

The system only shows **upcoming** (future) deadlines.

---

### Issue 4: Wrong Collection Name

**Symptoms:**
- Tracked in Firestore
- Console shows errors like "Collection not found"

**Solution:**
Check `specificCollection` value in `registeredOpportunities`:
- Should be: "scholarships", "competitions", "workshops", "studySpots", or "resources"
- NOT: "opportunity" or other values

---

## Debugging Code Snippet

Add this to Calendar.tsx temporarily to see what's happening:

```typescript
// Add after fetchDeadlines()
useEffect(() => {
  if (deadlines.length === 0 && !loading) {
    console.log("🔍 DEBUG: No deadlines found");
    console.log("User ID:", user?.uid);
    console.log("Deadlines array:", deadlines);
  } else if (deadlines.length > 0) {
    console.log("✓ Deadlines loaded:", deadlines.length);
    console.log("First deadline:", deadlines[0]);
  }
}, [deadlines, loading, user?.uid]);
```

---

## Manual Test: Create Test Opportunity

If you want to test quickly, create a test opportunity in Firestore:

### Step 1: Create Opportunity
Collection: `scholarships`
Document ID: `test_scholarship_001`

```json
{
  "title": "Test Scholarship 2025",
  "category": "Scholarship / Grant",
  "description": "This is a test",
  "status": "active",
  "organizationId": "test_org",
  "dateMilestones": [
    {
      "date": [Timestamp: 30 days from now],
      "title": "Application Deadline",
      "description": "Submit application"
    },
    {
      "date": [Timestamp: 60 days from now],
      "title": "Interview Date",
      "description": "Online interview"
    }
  ],
  "createdAt": [Timestamp: now]
}
```

### Step 2: Track It
In your user profile (`profiles/[userId]`), add:

```json
{
  "registeredOpportunities": [
    {
      "opportunityId": "test_scholarship_001",
      "specificCollection": "scholarships",
      "registeredAt": [Timestamp: now]
    }
  ]
}
```

### Step 3: Refresh Calendar
Pull to refresh → Should see 2 deadlines

---

## Check Full Data Flow

Run this checklist:

### 1. User Profile
- [ ] `profiles/[userId]` exists
- [ ] Has `registeredOpportunities` array
- [ ] Array has at least one entry
- [ ] Entry has `opportunityId` and `specificCollection`

### 2. Opportunity Document
- [ ] Opportunity exists in specified collection
- [ ] Has `status: "active"`
- [ ] Has `dateMilestones` array OR `deadline` field
- [ ] Dates are Firestore Timestamps
- [ ] Dates are in the future

### 3. Console Output
- [ ] No errors when fetching
- [ ] "Fetching fresh deadlines" message appears
- [ ] Console shows deadline count

### 4. UI
- [ ] Calendar tab loads without errors
- [ ] No "Loading..." stuck state
- [ ] Empty state shows if truly no deadlines

---

## Quick Fix Commands

If you have Firebase CLI access, run these to check:

```bash
# Check user profile
firebase firestore:get profiles/[YOUR_USER_ID]

# Check scholarships collection
firebase firestore:list scholarships
```

---

## Still Empty?

If deadlines are still empty after all checks, provide me with:

1. **Console logs** (full output from Calendar tab)
2. **Firestore screenshot** of:
   - Your user profile (`profiles/[userId]`)
   - One opportunity document you're tracking
3. **Any error messages**

I'll help you debug further!

