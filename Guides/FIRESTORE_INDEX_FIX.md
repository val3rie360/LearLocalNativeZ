# Firestore Index Error Fix

## Problem

❌ **Error:** "The query requires an index"

This happens because Firestore needs a composite index when you:
- Filter by one field (`organizationId`)
- AND sort by another field (`createdAt`)

## 🚀 Quick Fix (Choose One)

### Method 1: Click the Auto-Generated Link (FASTEST)

1. **Find the error link in your terminal**
   Look for the long URL starting with:
   ```
   https://console.firebase.google.com/v1/r/project/learnlocal-nat/firestore/indexes?create_composite=...
   ```

2. **Click or copy-paste the entire URL into your browser**

3. **You'll see Firebase Console with:**
   - Collection: `opportunities`
   - Fields: `organizationId` (Ascending), `createdAt` (Descending)
   
4. **Click "Create Index" button**

5. **Wait for the index to build (1-2 minutes)**
   - You'll see: "Building..." → "Enabled" ✅

6. **Refresh your app**
   - The error should be gone!
   - Opportunities should load normally

### Method 2: Create Index Manually in Console

1. **Go to Firebase Console**
   - https://console.firebase.google.com/
   - Select project: `learnlocal-nat`

2. **Navigate to Firestore Database → Indexes tab**

3. **Click "Create Index"**

4. **Fill in the following:**
   ```
   Collection ID: opportunities
   
   Fields to index:
   1. Field: organizationId
      Order: Ascending
      
   2. Field: createdAt
      Order: Descending
   
   Query scope: Collection
   ```

5. **Click "Create"**

6. **Wait for "Building..." to change to "Enabled"**

7. **Test your app**

### Method 3: Deploy Using Firebase CLI

If you have Firebase CLI installed:

1. **Make sure `firestore.indexes.json` exists in your project root**
   (I just created it for you! ✅)

2. **Deploy indexes**
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. **Wait for deployment to complete**

4. **Check Firebase Console to verify**

## What the Index Does

The index allows Firestore to efficiently:
```
1. Find all opportunities where organizationId = "your-user-id"
2. Sort them by createdAt in descending order (newest first)
3. Return results quickly
```

Without the index, Firestore can't perform this combined query.

## Verification

After creating the index, check Firebase Console:

**Path:** Firestore Database → Indexes

**You should see:**

| Collection | Fields Indexed | Query Scope | Status |
|------------|----------------|-------------|--------|
| opportunities | organizationId (▲), createdAt (▼) | Collection | ✅ Enabled |

## Troubleshooting

### Still seeing the error after creating index?

**Check 1: Wait for index to finish building**
- Index creation takes 1-2 minutes
- Don't refresh the app until status is "Enabled"

**Check 2: Verify the index fields match exactly**
- Collection: `opportunities`
- Field 1: `organizationId` (Ascending)
- Field 2: `createdAt` (Descending)

**Check 3: Clear app cache**
```bash
# Stop the server
# Press Ctrl+C

# Clear cache and restart
npx expo start --clear
```

### Index won't create?

**Error: "Collection doesn't exist"**
- You need to create at least one opportunity first
- Go to app → Create an opportunity → Submit
- Then create the index

**Error: "Permission denied"**
- Make sure you're logged in with the correct Google account
- You need Owner or Editor role on the Firebase project

### Multiple index errors?

You might need additional indexes if you add more queries later. Each unique combination of filters and sorts needs its own index.

**Common combinations:**
```javascript
// This query needs an index:
where('organizationId', '==', uid) + orderBy('createdAt', 'desc')

// This query needs a DIFFERENT index:
where('category', '==', 'Scholarship') + orderBy('createdAt', 'desc')

// This query needs ANOTHER index:
where('organizationId', '==', uid) + where('status', '==', 'active')
```

## Why This Happens

Firestore has a rule:
- Simple queries (one field) → No index needed
- Complex queries (multiple fields) → Index required

Your query in `getOrganizationOpportunities`:
```javascript
query(
  collection(db, "opportunities"),
  where("organizationId", "==", organizationId),  // Field 1
  orderBy("createdAt", "desc")                     // Field 2
);
```

This is a **complex query** → needs index!

## Future-Proofing

If you add more queries in the future, here are common patterns that need indexes:

### Student Home Feed (Future)
```javascript
// Query: All active scholarships, sorted by date
where('category', '==', 'Scholarship / Grant')
orderBy('createdAt', 'desc')

// Needs index on: category (▲) + createdAt (▼)
```

### Search with Filters (Future)
```javascript
// Query: Active opportunities in a category
where('category', '==', 'Workshop / Seminar')
where('status', '==', 'active')
orderBy('createdAt', 'desc')

// Needs index on: category (▲) + status (▲) + createdAt (▼)
```

When you get index errors for these, just:
1. Click the link in the error
2. Create the index
3. Wait for it to build
4. Continue working!

## Files Created

I've created `firestore.indexes.json` for you. This file:
- Defines required indexes
- Can be deployed with Firebase CLI
- Keeps your indexes in version control
- Makes setup easier for team members

## Summary

✅ **To fix the error:**
1. Click the link in the error message
2. Click "Create Index" in Firebase Console
3. Wait 1-2 minutes
4. Refresh your app

✅ **The index allows:**
- Fast queries for organization's opportunities
- Sorting by creation date
- Efficient data retrieval

✅ **You only need to do this once per query pattern!**

After creating this index, your app will be able to load opportunities instantly! 🚀

