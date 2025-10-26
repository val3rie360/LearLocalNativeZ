# Student Library System

## Overview
The Student Library system allows students to browse, bookmark, and download educational resources uploaded by verified organizations.

## Features Implemented

### 1. **Public Resource Access**
- Students can view all educational resources uploaded by **verified organizations only**
- Resources from unverified organizations are automatically filtered out
- Each resource displays:
  - File name/display name
  - Organization name (who uploaded it)
  - Category and tags
  - File size
  - Upload date
  - Download count

### 2. **Bookmark System**
Students can save resources to "My Library" for easy access later:
- **Add Bookmark**: Tap the bookmark icon (outlined) to save a resource
- **Remove Bookmark**: Tap the filled bookmark icon to remove from library
- Bookmarks are stored in the user's Firestore profile under `bookmarkedResources` array
- Bookmark status persists across sessions

### 3. **Download Functionality**
- Click the download icon or tap the resource card to open/download
- Downloads are tracked and increment the download count
- Files open in the device's default PDF viewer or browser

### 4. **Filter Options**
Four filter tabs are available:

#### **All** 
- Shows all resources from verified organizations
- Default view

#### **My Library**
- Shows only bookmarked resources
- Quick access to saved materials
- Empty state guides users to bookmark resources

#### **New**
- Shows resources uploaded in the last 7 days
- Helps students discover fresh content

#### **Popular**
- Sorts resources by download count (highest first)
- Shows most-downloaded materials

### 5. **Search Functionality**
Students can search across:
- File names
- Descriptions
- Categories
- Tags
- Organization names

### 6. **Organization Verification Filter**
- **Automatic filtering**: Only resources from verified organizations appear
- **Verification check**: System queries organization profiles and checks `verificationStatus === 'verified'`
- **Organization info**: Each resource shows which organization uploaded it

## Technical Implementation

### Firestore Service Functions

#### `addBookmark(userId, uploadId)`
Adds a resource to user's bookmarked list.

```javascript
await addBookmark(user.uid, resourceId);
```

#### `removeBookmark(userId, uploadId)`
Removes a resource from user's bookmarked list.

```javascript
await removeBookmark(user.uid, resourceId);
```

#### `getBookmarkedResources(userId)`
Fetches all bookmarked resources for a user.

```javascript
const bookmarks = await getBookmarkedResources(user.uid);
```

#### `isResourceBookmarked(userId, uploadId)`
Checks if a specific resource is bookmarked.

```javascript
const isBookmarked = await isResourceBookmarked(user.uid, resourceId);
```

### Cloudinary Upload Service Updates

#### `getAllActiveUploads(limit)`
Enhanced to include organization verification checks:
- Fetches all active uploads
- Queries organization profiles
- Filters for verified organizations only
- Adds organization info to each resource

### Data Structure

#### Profile Document (Firestore `profiles` collection)
```json
{
  "name": "John Doe",
  "email": "student@example.com",
  "role": "student",
  "bookmarkedResources": ["uploadId1", "uploadId2", "uploadId3"],
  ...
}
```

#### Upload Document (Firestore `uploads` collection)
```json
{
  "id": "upload123",
  "organizationId": "org456",
  "organizationName": "Local Library",
  "organizationVerificationStatus": "verified",
  "isVerified": true,
  "fileName": "study-guide.pdf",
  "displayName": "Math Study Guide",
  "description": "Comprehensive guide for algebra",
  "category": "Math",
  "tags": ["algebra", "study guide", "exam prep"],
  "fileSize": 1048576,
  "downloadCount": 42,
  "status": "active",
  "cloudinarySecureUrl": "https://...",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## User Experience Flow

### For Students

1. **Browse Resources**
   - Open Library tab
   - See all available resources from verified organizations
   - Use filters and search to find specific materials

2. **Bookmark Resources**
   - Tap bookmark icon on any resource
   - Resource is saved to "My Library"
   - Confirmation alert appears

3. **Access Saved Resources**
   - Switch to "My Library" filter
   - View all bookmarked resources
   - Remove bookmarks as needed

4. **Download Resources**
   - Tap download icon or resource card
   - File opens in browser/PDF viewer
   - Download count increments

### For Organizations

Organizations upload resources through the OrgUploads page:
- Resources are only visible to students once the organization is verified
- Upload metadata includes: name, description, category, tags
- Organizations can track download counts

## Security & Privacy

### Verification Requirement
- **Student Protection**: Only verified organizations can share resources with students
- **Quality Control**: Admin verification ensures legitimate educational organizations
- **Visibility Toggle**: Unverified organizations' uploads are hidden from students automatically

### Data Storage
- Bookmarks stored per user in Firestore profiles
- Files hosted on Cloudinary (secure CDN)
- Download tracking for analytics

## UI/UX Features

### Visual Indicators
- **Bookmark Status**: 
  - Outlined bookmark icon = Not saved
  - Filled bookmark icon = Saved to library
- **Organization Name**: Displayed in purple text below resource name
- **Category Colors**: Color-coded icons for different subjects

### Empty States
- **No Resources**: Friendly message when no resources available
- **No Bookmarks**: Guidance to bookmark resources for "My Library"
- **No Search Results**: Helpful message to try different search terms

### Loading States
- Loading spinner while fetching resources
- Pull-to-refresh functionality
- Smooth state transitions

## Future Enhancements

Potential additions for the library system:
1. **Categories filter**: Filter by subject/category
2. **Sort options**: Sort by date, name, size, downloads
3. **Preview**: PDF preview before download
4. **Notes**: Add personal notes to bookmarked resources
5. **Collections**: Organize bookmarks into custom collections
6. **Share**: Share resources with other students
7. **Offline access**: Download resources for offline viewing
8. **Recently viewed**: Track and show recently accessed resources

## Related Files

- `app/studentPages/(tabs)/Library.tsx` - Main library UI
- `services/firestoreService.js` - Bookmark management functions
- `services/cloudinaryUploadService.js` - Resource fetching with verification
- `app/orgPages/(tabs)/OrgUploads.tsx` - Organization upload interface
- `contexts/AuthContext.tsx` - User authentication and profile data

## Testing Checklist

- [ ] Student can view all resources from verified organizations
- [ ] Resources from unverified organizations are hidden
- [ ] Bookmark icon toggles correctly
- [ ] Bookmarks persist after app reload
- [ ] "My Library" filter shows only bookmarked items
- [ ] Download button opens files correctly
- [ ] Search works across all fields
- [ ] Filter tabs work correctly
- [ ] Empty states display properly
- [ ] Organization names display correctly
- [ ] Download counts increment
- [ ] Pull-to-refresh works

## Support

For issues or questions about the library system:
1. Check Firestore indexes are deployed (`firestore.indexes.json`)
2. Verify Cloudinary configuration is correct
3. Ensure user has proper authentication
4. Check organization verification status in Firestore

