# Cloudinary Setup Guide for File Storage

## 🎯 Overview

Cloudinary is a fully-managed cloud service for media management. We'll use it to handle PDF uploads with these benefits:
- ✅ No server to run (unlike PocketBase)
- ✅ Built-in global CDN
- ✅ Automatic optimization
- ✅ Free tier available
- ✅ Simple API
- ✅ React Native friendly

## 🚀 Quick Setup (10 minutes)

### Step 1: Create Cloudinary Account (3 minutes)

1. **Visit:** https://cloudinary.com/users/register/free

2. **Sign up** with:
   - Email
   - Or Google/GitHub account

3. **Verify email** and login

4. **You're in the Dashboard!**

### Step 2: Get Your Credentials (1 minute)

In the Cloudinary Dashboard:

1. **Copy these values:**
   ```
   Cloud name: xxxxx
   API Key: xxxxxxxxxxxxx
   API Secret: xxxxxxxxxxxxxxxxxxxxx
   ```

2. **Keep these safe!** You'll need them next.

### Step 3: Create Upload Preset (2 minutes)

Upload presets allow unsigned uploads (no API secret exposed in mobile app).

1. **Go to:** Settings → Upload → Upload presets

2. **Click:** "Add upload preset"

3. **Configure:**
   - Upload preset name: `learn_local_uploads`
   - Signing Mode: **Unsigned**
   - Folder: `uploads`
   - Resource type: **Raw** (for PDFs)
   - Access mode: Public
   - Allowed formats: `pdf`

4. **Save**

5. **Copy the preset name:** `learn_local_uploads`

### Step 4: Configure Your App (2 minutes)

**Create `.env` file** in your project root:

```bash
# Cloudinary Configuration
# ONLY add public values here - never API Secret!
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=learn_local_uploads

# ⚠️ SECURITY WARNING:
# DO NOT add EXPO_PUBLIC_CLOUDINARY_API_KEY or EXPO_PUBLIC_CLOUDINARY_API_SECRET
# The EXPO_PUBLIC_ prefix exposes values in your app bundle!
# API Key/Secret should ONLY be used server-side for admin operations.

# For server-side operations (optional - only needed for backend):
# CLOUDINARY_API_KEY=your-api-key
# CLOUDINARY_API_SECRET=your-api-secret
```

**Replace with your actual values!**

### Step 5: Update Firestore Rules (1 minute)

The `uploads` collection rules are already in `firestore.rules`:

```javascript
match /uploads/{uploadId} {
  allow read: if true;
  allow create: if isAuthenticated() 
                && request.resource.data.organizationId == request.auth.uid;
  allow update: if isAuthenticated() 
                && resource.data.organizationId == request.auth.uid;
  allow delete: if isAuthenticated() 
                && resource.data.organizationId == request.auth.uid;
}
```

**Deploy to Firebase Console:**
1. Go to: https://console.firebase.google.com/
2. Firestore Database → Rules
3. Paste from `firestore.rules`
4. Click "Publish"

### Step 6: Create Firestore Index (1 minute)

When you first test, you'll get an index error with a link. Click it and create the index, or use this:

**Firebase Console → Firestore → Indexes → Create Index:**
```
Collection: uploads
Fields:
  - organizationId (Ascending)
  - status (Ascending)  
  - createdAt (Descending)
```

## 🧪 Test the Setup

### Test 1: Check Config

```javascript
import { cloudinaryConfig } from './cloudinaryConfig';

console.log('Cloud Name:', cloudinaryConfig.cloudName);
console.log('Upload Preset:', cloudinaryConfig.uploadPreset);
// Should show your values, not 'your-cloud-name'
```

### Test 2: Test Validation

```javascript
import { validateFile } from './services/cloudinaryUploadService';

const testFile = {
  name: 'test.pdf',
  mimeType: 'application/pdf',
  size: 1024000
};

const result = validateFile(testFile);
console.log(result); // { valid: true }
```

### Test 3: Test Upload (in Phase 2)

We'll test actual uploads when we build the UI.

## 📊 Architecture

```
React Native App
    ↓
Upload PDF
    ↓
┌─────────────────────────────┐
│        Cloudinary           │
│  - Stores PDF files         │
│  - Serves via CDN           │
│  - Returns secure URL       │
└─────────────────────────────┘
    ↓
Store metadata in Firestore
    ↓
┌─────────────────────────────┐
│       Firebase              │
│  - File metadata            │
│  - Download counts          │
│  - Categories/tags          │
└─────────────────────────────┘
```

## 🔐 Security Notes

### Upload Preset (Unsigned Uploads)

**Why Unsigned?**
- Mobile apps can't safely store API secrets
- Unsigned presets allow secure client-side uploads
- You control what's allowed via preset settings

**Preset Security:**
- Set allowed formats: PDF only
- Set max file size: 50MB
- Set folder structure
- Disable sensitive transformations

### API Secret ⚠️ CRITICAL

**NEVER expose in mobile app!**
- ❌ DO NOT use `EXPO_PUBLIC_` prefix for API secrets
- ❌ DO NOT include in cloudinaryConfig.js
- ✅ Only use on backend/server
- ✅ Keep in server `.env` (without EXPO_PUBLIC_ prefix)
- ✅ For mobile app, use unsigned upload presets only
- Deletion/admin operations require API secret (implement secure backend endpoint)

## 💰 Cloudinary Free Tier

**Free Plan Includes:**
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month
- Core features


## 📁 File Organization

**Cloudinary Structure:**
```
your-cloud-name/
  └── raw/upload/
      └── uploads/
          ├── {organizationId}/
          │   ├── {uploadId}_filename.pdf
          │   └── {uploadId}_otherdoc.pdf
          └── {anotherOrgId}/
              └── {uploadId}_document.pdf
```

## 🔗 Cloudinary URLs

**Format:**
```
https://res.cloudinary.com/{cloud-name}/raw/upload/v{version}/{public-id}.pdf
```

**Example:**
```
https://res.cloudinary.com/demo/raw/upload/v1234567890/uploads/org123/file.pdf
```

**Features:**
- Automatic CDN distribution
- Global edge servers
- Fast downloads worldwide
- HTTPS by default

## ⚙️ Advanced Features (Future)

Cloudinary can do much more:

1. **PDF Thumbnails**
   - Generate preview images
   - First page as thumbnail

2. **Transformations**
   - Convert to images
   - Extract pages
   - Optimize size

3. **Analytics**
   - Track views
   - Bandwidth usage
   - Popular files

4. **Search**
   - Built-in search
   - Tag-based filtering

## 🐛 Troubleshooting

### "Invalid cloud name"
- Check `.env` has correct EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
- No spaces or special characters
- Should match your dashboard

### "Upload preset not found"
- Create preset in Cloudinary dashboard
- Make it "Unsigned"
- Use exact preset name in `.env`

### "File too large"
- Max 50MB in our validation
- Check file.size before upload
- Cloudinary free tier has limits

### "Invalid signature"
- For unsigned uploads, you don't need signature
- Make sure using upload preset
- Check preset is set to "Unsigned"

## ✅ Phase 1 Complete When:

- [✅] Cloudinary account created
- [✅] Upload preset created (unsigned)
- [✅] Credentials copied
- [✅] `.env` file configured with all values
- [✅] Firestore rules deployed
- [✅] Firestore index created
- [✅] Test connection successful

## 🚀 Next: Phase 2

With Cloudinary configured, we can now:
- Build upload UI
- Test actual file uploads
- Display uploaded files
- Implement download tracking


---

**Resources:**
- [Cloudinary Dashboard](https://console.cloudinary.com/)
- [Upload Presets](https://cloudinary.com/documentation/upload_presets)
- [React Native Integration](https://cloudinary.com/documentation/react_native_integration)



