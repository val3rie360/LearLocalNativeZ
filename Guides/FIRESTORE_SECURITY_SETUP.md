# Firestore Security Rules Setup Guide

## Overview

This guide will help you deploy the Firestore security rules to fix the "missing or insufficient permissions" error when creating opportunities.

## What We've Done

1. ✅ Created `firestore.rules` file with proper security rules
2. ✅ Made date milestones optional in OrgCreate component
3. 📋 Now you need to deploy these rules to Firebase

## Deploying Firestore Rules

### Option 1: Using Firebase Console (Easiest)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `learnlocal-nat`

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab at the top

3. **Copy and Paste Rules**
   - Open the `firestore.rules` file from your project
   - Copy all the content
   - Paste it into the Firebase Console rules editor
   - Click "Publish" button

4. **Verify Deployment**
   - You should see a success message
   - The rules are now active immediately

### Option 2: Using Firebase CLI

If you have Firebase CLI installed:

1. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done)
   ```bash
   firebase init firestore
   ```
   - Select your project
   - Accept the default firestore.rules file

4. **Deploy Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

## Security Rules Explained

### What the Rules Do

**For Opportunities Collections:**
- ✅ **Read**: Anyone can read opportunities (public access)
- ✅ **Create**: Only authenticated users can create opportunities
- ✅ **Update**: Only the owner of an opportunity can update it
- ✅ **Delete**: Only the owner of an opportunity can delete it

**Collections Covered:**
- `opportunities` (main denormalized collection)
- `scholarships`
- `competitions`
- `workshops`
- `studySpots`
- `resources`
- `profiles`

### Security Features

1. **Authentication Check**
   ```javascript
   function isAuthenticated() {
     return request.auth != null;
   }
   ```

2. **Ownership Verification**
   ```javascript
   function isOwner(userId) {
     return isAuthenticated() && request.auth.uid == userId;
   }
   ```

3. **Organization ID Matching**
   - When creating an opportunity, the `organizationId` field must match the authenticated user's UID
   - This prevents users from creating opportunities on behalf of others

## Testing After Deployment

### Test 1: Create an Opportunity

1. Open your app
2. Log in as an organization
3. Navigate to the Create tab
4. Fill in the opportunity details
5. Try to submit
6. ✅ Should succeed now

### Test 2: Edit Your Own Opportunity

1. Go to Home tab
2. View your opportunities
3. Try to view details
4. ✅ Should work

### Test 3: Delete Your Own Opportunity

1. Go to Home tab
2. Click the trash icon on your opportunity
3. Confirm deletion
4. ✅ Should succeed

## Troubleshooting

### Still Getting Permission Errors?

**Check 1: Rules Deployed?**
- Go to Firebase Console → Firestore Database → Rules
- Verify your rules are there
- Check the last deployment timestamp

**Check 2: User Authenticated?**
- Make sure you're logged in
- Check if `user.uid` is available in your app

**Check 3: OrganizationId Field**
- Verify that the `organizationId` field is being set correctly
- It should match the authenticated user's UID

**Check 4: Clear App Cache**
- Sometimes the app needs to be restarted
- Close and reopen the app

### Error: "Resource not found"

If you see this error in Firebase Console:
1. Make sure you've created the Firestore database
2. Go to Firestore Database and click "Create database"
3. Choose a location and security rules mode
4. Then deploy your rules

### Error: "Deploy failed"

If using Firebase CLI:
```bash
# Make sure you're in the correct project
firebase use learnlocal-nat

# Try deploying again
firebase deploy --only firestore:rules
```

## Changes Made to OrgCreate

### Date Milestones are Now Required

**For Scholarships and Competitions:**
- At least one date milestone is **required**
- Clear validation with error messages displayed at the top
- Helpful description text guides users
- Error message appears if you try to submit without milestones

**For Other Categories:**
- Study Spots: Don't need milestones
- Workshops: Don't need milestones
- Resources: Don't need milestones

### Error Message Display

**New Feature: Top Error Banner**
- Red banner appears at the top when validation fails
- Shows specific error message
- Can be dismissed by clicking the X
- Auto-clears when you try to submit again

**Common Error Messages:**
- "Please fill in all required fields: Title and Description"
- "Please add at least one date milestone (e.g., Application Deadline)"
- "Please complete the milestone form or click 'Add Milestone' to save it"
- "Please select a location for study spot"
- "Please upload a PDF file for resources category"

### Example Use Cases

**Scholarship with Required Milestones:**
```
Title: Summer Research Grant
Description: Funding for undergraduate research
Milestones: (Required - at least 1)
  ✓ Application Deadline: May 15, 2025
  ✓ Winner Announcement: June 1, 2025
```

**Study Spot (No Milestones Needed):**
```
Title: Study Room Available
Description: Quiet study space available
Location: Selected on map
Hours: 8:00 AM - 10:00 PM
```

## Quick Start Checklist

- [ ] Open Firebase Console
- [ ] Go to Firestore Database → Rules
- [ ] Copy content from `firestore.rules`
- [ ] Paste into console editor
- [ ] Click "Publish"
- [ ] Test creating an opportunity in your app
- [ ] ✅ Success!

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)

## Support

If you're still having issues after following this guide:

1. Check the browser console for detailed error messages
2. Verify your Firebase project ID matches
3. Ensure you're using the correct Firebase configuration
4. Check that your user is properly authenticated before creating opportunities

## Summary

The security rules are now configured to:
- ✅ Allow organizations to create, read, update, and delete their own opportunities
- ✅ Allow anyone to read opportunities (public access for students)
- ✅ Prevent unauthorized modifications
- ✅ Ensure data integrity with ownership checks

After deploying these rules, you should be able to create opportunities without any permission errors! 🎉

