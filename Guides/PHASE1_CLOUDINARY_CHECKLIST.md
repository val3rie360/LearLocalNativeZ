# Phase 1: Cloudinary Backend Setup - Checklist

## ✅ Already Complete (Code)

- ✅ `cloudinaryConfig.js` created
- ✅ `services/cloudinaryUploadService.js` created with 12 functions
- ✅ `.env.example` template updated
- ✅ Setup helper script created
- ✅ Cleaned up old PocketBase/Firebase Storage files
- ✅ Firestore rules include `uploads` collection

## 📋 Your Action Items (10 minutes total)

### ☑️ Step 1: Create Cloudinary Account (3 min)

1. **Visit:** https://cloudinary.com/users/register/free
2. **Sign up** (free account)
3. **Verify email** and login
4. **See dashboard** with your credentials

### ☑️ Step 2: Get Credentials (1 min)

In Cloudinary Dashboard, you'll see:

```
Cloud name: [copy this]
API Key: [copy this]
API Secret: [copy this]
```

**Keep these safe - you'll need them next!**

### ☑️ Step 3: Create Upload Preset (2 min)

1. **Go to:** Settings → Upload → Upload presets
2. **Click:** "Add upload preset"
3. **Configure:**
   - Name: `learn_local_uploads`
   - Signing Mode: **Unsigned** ⭐
   - Folder: `uploads`
   - Resource type: **Raw** (for PDFs)
   - Allowed formats: `pdf`
4. **Save**

### ☑️ Step 4: Configure .env File (2 min)

**Option 1: Run helper script**
```bash
setup-cloudinary.bat
```

**Option 2: Manual**

Create `.env` in project root:
```bash
# SECURITY: Only add public values - never API secrets!
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=learn_local_uploads

# ⚠️ DO NOT ADD API KEY OR SECRET WITH EXPO_PUBLIC_ PREFIX!
# This exposes them in your app bundle - major security risk
# API credentials should only be used server-side

# For backend/server only (no EXPO_PUBLIC_ prefix):
# CLOUDINARY_API_KEY=your-actual-api-key
# CLOUDINARY_API_SECRET=your-actual-api-secret
```

**Replace cloud name with your actual value!**

### ☑️ Step 5: Deploy Firestore Rules (1 min)

The `uploads` collection rules are already in `firestore.rules`.

**Deploy:**
1. Go to: https://console.firebase.google.com/
2. Select: `learnlocal-nat`
3. Firestore Database → Rules tab
4. Copy content from `firestore.rules`
5. Paste into editor
6. Click **"Publish"**

### ☑️ Step 6: Create Firestore Index (1 min)

You'll need this index for queries.

**Option 1: Auto-create (when you test)**
- Run the app
- Try to view uploads
- Click the link in the error
- Create index
- Wait 1-2 minutes

**Option 2: Manual create**
1. Firebase Console → Firestore → Indexes
2. Create Index:
   ```
   Collection: uploads
   Fields:
     - organizationId (Ascending)
     - status (Ascending)
     - createdAt (Descending)
   ```

## ✅ Verification Checklist

After completing all steps:

- [ ] Cloudinary account exists and verified
- [ ] Upload preset `learn_local_uploads` created (unsigned)
- [ ] `.env` file exists with real Cloudinary values (not placeholders)
- [ ] Cloud name in `.env` matches dashboard
- [ ] Upload preset name matches in `.env`
- [ ] Firestore rules deployed (includes `uploads` collection)
- [ ] App starts without errors: `npm start`

## 🧪 Test Your Setup

### Test 1: Check Environment
```javascript
import { cloudinaryConfig } from './cloudinaryConfig';

console.log('Cloud Name:', cloudinaryConfig.cloudName);
// Should show your cloud name, NOT 'your-cloud-name'
```

### Test 2: Validate File
```javascript
import { validateFile } from './services/cloudinaryUploadService';

const testPDF = {
  name: 'test.pdf',
  mimeType: 'application/pdf',
  size: 1024000  // 1MB
};

const result = validateFile(testPDF);
console.log(result);  // { valid: true }
```

### Test 3: Check Cloudinary Dashboard
1. Go to: https://console.cloudinary.com/
2. Click "Media Library"
3. Should see empty library (ready for uploads)

## 📊 What's Next

### Phase 1 Status: ✅ COMPLETE (Code Ready)

**Backend Ready:**
- Cloudinary configuration ✅
- Upload service (12 functions) ✅
- Firestore metadata storage ✅
- Validation & error handling ✅

**You Need To:**
1. Create Cloudinary account
2. Get credentials
3. Create upload preset
4. Update `.env` file
5. Deploy Firestore rules

**Then: Phase 2!**
- Build upload UI
- Test real uploads
- Display files
- Download tracking

## 🎯 Success Criteria

Phase 1 is complete when:
- ✅ `.env` has real Cloudinary values
- ✅ Upload preset exists in Cloudinary
- ✅ Firestore rules deployed
- ✅ Index created
- ✅ No errors when starting app

**Estimated time: 10 minutes**

## 🆘 Need Help?

**Stuck on a step?**
- See: `Guides/CLOUDINARY_SETUP.md`
- Run: `setup-cloudinary.bat`
- Check: Cloudinary documentation

**Common issues:**
- Wrong cloud name → Check spelling
- Preset not found → Make sure it's "Unsigned"
- Permission error → Deploy Firestore rules

## 🚀 Ready for Phase 2?

Once `.env` is configured with real values, we can start building the upload UI!

Next up:
- Upload modal with progress bar
- File picker for PDFs
- Display uploaded files
- Edit/delete functionality

Let me know when you're ready! 🎉



