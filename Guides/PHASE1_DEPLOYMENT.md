# Phase 1 Deployment Guide - Upload Service Backend

## ✅ What Was Created

### 1. Storage Security Rules (`storage.rules`)
- File type validation (PDF ONLY)
- File size limit (50MB max)
- Owner-only upload/delete permissions
- Public read access for all files

### 2. Upload Service (`services/uploadService.js`)
Complete service with 12 functions:
- ✅ `uploadFile()` - Upload with progress tracking
- ✅ `validateFile()` - Pre-upload validation
- ✅ `getOrganizationUploads()` - Fetch org's files
- ✅ `getUploadById()` - Get single file details
- ✅ `updateUploadMetadata()` - Edit file info
- ✅ `deleteUpload()` - Remove from Storage & Firestore
- ✅ `incrementDownloadCount()` - Track downloads
- ✅ `archiveUpload()` - Soft delete
- ✅ `getUploadsByCategory()` - Filter by category
- ✅ `searchUploads()` - Search functionality
- ✅ `getUploadStats()` - Analytics
- ✅ `formatFileSize()` - Human-readable sizes

### 3. Updated Firestore Rules (`firestore.rules`)
Added `uploads` collection rules:
- Public read access (students can download)
- Owner-only create/update/delete
- Organization ID verification

### 4. Updated Firestore Indexes (`firestore.indexes.json`)
Added 2 new composite indexes for uploads:
- organizationId + status + createdAt
- category + status + createdAt

## 🚀 Deployment Steps

### Step 1: Deploy Storage Rules

**Option 1: Firebase Console (Easiest)**
1. Go to https://console.firebase.google.com/
2. Select project: `learnlocal-nat`
3. Click "Storage" in left sidebar
4. Click "Rules" tab
5. Copy content from `storage.rules`
6. Paste into editor
7. Click "Publish"

**Option 2: Firebase CLI**
```bash
firebase deploy --only storage
```

### Step 2: Deploy Firestore Rules

**Option 1: Firebase Console**
1. Go to https://console.firebase.google.com/
2. Select project: `learnlocal-nat`
3. Click "Firestore Database"
4. Click "Rules" tab
5. Copy content from `firestore.rules`
6. Paste into editor
7. Click "Publish"

**Option 2: Firebase CLI**
```bash
firebase deploy --only firestore:rules
```

### Step 3: Deploy Firestore Indexes

**Option 1: Click Auto-Generated Links**
When you test the app, you'll get error messages with links to create indexes. Click those links and create the indexes.

**Option 2: Firebase CLI**
```bash
firebase deploy --only firestore:indexes
```

**Option 3: Manual Creation**
1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Create these 2 indexes:

**Index 1: Organization Uploads**
```
Collection: uploads
Fields:
  - organizationId (Ascending)
  - status (Ascending)
  - createdAt (Descending)
Query Scope: Collection
```

**Index 2: Category Uploads**
```
Collection: uploads
Fields:
  - category (Ascending)
  - status (Ascending)
  - createdAt (Descending)
Query Scope: Collection
```

## 🧪 Testing the Backend

### Test 1: Import the Service
```javascript
import { 
  uploadFile, 
  getOrganizationUploads 
} from '../services/uploadService';
```

### Test 2: Validate File (in your app)
```javascript
import { validateFile } from '../services/uploadService';

const file = { 
  name: 'test.pdf', 
  type: 'application/pdf', 
  size: 1024000 
};

const validation = validateFile(file);
console.log(validation); // { valid: true } or { valid: false, error: '...' }
```

### Test 3: Format File Size
```javascript
import { formatFileSize } from '../services/uploadService';

console.log(formatFileSize(1536000)); // "1.46 MB"
console.log(formatFileSize(2048));     // "2 KB"
```

### Test 4: Test Upload (Next Phase)
We'll test actual uploads in Phase 2 when we build the UI.

## 📋 Verification Checklist

### Firebase Console Checks

**Storage Rules:**
- [ ] Go to Storage → Rules
- [ ] Verify `/uploads/{organizationId}/{fileId}/{fileName}` rules exist
- [ ] Status should show "Published" with timestamp

**Firestore Rules:**
- [ ] Go to Firestore Database → Rules
- [ ] Verify `match /uploads/{uploadId}` section exists
- [ ] Status should show "Published" with timestamp

**Firestore Indexes:**
- [ ] Go to Firestore Database → Indexes
- [ ] Should see 2 new indexes for "uploads" collection
- [ ] Status should be "Enabled" (not "Building...")

### Code Checks

**Upload Service:**
- [ ] File exists: `services/uploadService.js`
- [ ] No syntax errors
- [ ] All imports resolve correctly
- [ ] TypeScript types work (if using TS)

**Configuration Files:**
- [ ] `storage.rules` exists in project root
- [ ] `firestore.rules` updated with uploads rules
- [ ] `firestore.indexes.json` has upload indexes

## 🔧 Common Issues & Solutions

### Issue 1: "Module not found: firebase/storage"

**Solution:**
Check that Firebase Storage is initialized in `firebaseconfig.js`:
```javascript
import { getStorage } from "firebase/storage";
export const storage = getStorage(app);
```

### Issue 2: "The caller does not have permission"

**Solution:**
1. Make sure you're logged in as an organization
2. Verify user.uid matches organizationId
3. Check that storage rules are published

### Issue 3: "Index not found" error

**Solution:**
1. Click the link in the error message
2. Create the index in Firebase Console
3. Wait 1-2 minutes for index to build
4. Try again

### Issue 4: File validation fails

**Solution:**
Check file object structure:
```javascript
// React Native (expo-document-picker)
{
  uri: 'file://...',
  name: 'document.pdf',
  mimeType: 'application/pdf',
  size: 1024000
}

// Web
{
  name: 'document.pdf',
  type: 'application/pdf',
  size: 1024000
}
```

### Issue 5: Storage quota exceeded

**Solution:**
1. Check Firebase Console → Storage usage
2. Review storage plan limits
3. Consider implementing file cleanup
4. Add storage quota per organization

## 📊 What's Next?

### Phase 2 Preview
With the backend ready, Phase 2 will create:
1. **File Picker Component** - Select files to upload
2. **Upload Modal** - Form with progress bar
3. **Updated OrgUploads Screen** - Display real files

### Immediate Next Steps
1. ✅ Verify all rules are deployed
2. ✅ Test imports work
3. ✅ Check Firebase Console
4. 📋 Ready for Phase 2 UI implementation

## 🎯 Success Criteria

Phase 1 is complete when:
- ✅ All 3 rule files deployed to Firebase
- ✅ No deployment errors
- ✅ Upload service imports without errors
- ✅ Validation functions work
- ✅ Indexes show as "Enabled" in console

## 📚 Reference

### Key Functions for Phase 2

**Upload a file:**
```javascript
const fileId = await uploadFile(
  file, 
  user.uid, 
  {
    displayName: 'Math Tutorial',
    description: 'Beginner math guide',
    category: 'Mathematics',
    tags: ['math', 'tutorial']
  },
  (progress) => console.log(progress + '%')
);
```

**Get organization's files:**
```javascript
const uploads = await getOrganizationUploads(user.uid);
```

**Delete a file:**
```javascript
await deleteUpload(fileId, storagePath);
```

## 🚀 Deploy Checklist

Ready to deploy? Follow this order:

1. **Deploy Storage Rules**
   ```bash
   firebase deploy --only storage
   ```

2. **Deploy Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Deploy Indexes**
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. **Verify in Console**
   - Check all 3 are published
   - Wait for indexes to finish building

5. **Test Imports**
   ```bash
   npm start
   ```
   - Check console for errors
   - Verify service imports

6. **✅ Phase 1 Complete!**
   - Ready for Phase 2

---

**Estimated Time:** 10-15 minutes for deployment
**Next Phase:** Phase 2 - Upload UI Components (3-4 days)

Let me know when rules are deployed and we'll start Phase 2! 🎉

