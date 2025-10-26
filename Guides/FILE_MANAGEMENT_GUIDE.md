# File Management Guide

This guide explains the file management features in the organization's uploads system.

## Features Overview

Organizations can now fully manage their uploaded files with the following options:

### 1. **Edit File Details** ✏️
- Update display name
- Modify description
- Change category
- Add/edit tags
- View file statistics (size, downloads, original name)

### 2. **Hide Files** 👁️‍🗨️
- Archive files to make them invisible to students
- Files remain in the database with status "archived"
- Can be restored later (functionality for restoration can be added)
- Useful for temporarily removing outdated materials

### 3. **Delete Files** 🗑️
- Permanently remove files from the system
- Confirmation dialog prevents accidental deletion
- Removes file from both Firestore and eventually Cloudinary
- Cannot be undone

## User Interface

### File Card
Each uploaded file now displays:
- A **three-dot menu button** (⋮) in the top-right corner
- Tap to open the file options modal
- Tap the file itself to open/preview it

### File Options Modal
Bottom sheet modal with three main actions:
1. **Edit Details** - Blue icon
2. **Hide File** - Orange icon
3. **Delete File** - Red icon (destructive)

### Edit Modal
Full-screen modal with form fields:
- Display Name (required)
- Description (optional, multiline)
- Category (optional)
- Tags (comma-separated, optional)
- File info display (read-only)
- Save/Cancel buttons

## Success Feedback

After each action, a green success message appears at the bottom of the screen:
- "File updated successfully!"
- "File hidden successfully!"
- "File deleted successfully!"

Messages auto-dismiss after 3 seconds.

## Technical Implementation

### Updated Components
- `OrgUploads.tsx` - Main uploads screen with file management

### Service Functions Used
From `cloudinaryUploadService.js`:
- `updateUploadMetadata(uploadId, metadata)` - Update file details
- `archiveUpload(uploadId)` - Hide file (sets status to 'archived')
- `deleteUpload(uploadId, cloudinaryPublicId)` - Delete file

### State Management
New state variables:
- `selectedFile` - Currently selected file for operations
- `showOptionsModal` - Controls options modal visibility
- `showEditModal` - Controls edit modal visibility
- `editDisplayName`, `editDescription`, `editCategory`, `editTags` - Edit form fields
- `actionLoading` - Loading state during operations
- `successMessage` - Success notification message

### Firestore Updates
File documents are updated with:
- `updatedAt` - Server timestamp on every update
- `status` - "active" or "archived" for visibility control
- Custom metadata fields as provided by organization

## User Experience Flow

### Editing a File
1. User taps the three-dot menu on a file card
2. Options modal appears
3. User taps "Edit Details"
4. Edit modal opens with pre-filled fields
5. User modifies fields
6. User taps "Save Changes"
7. System updates Firestore
8. Success message appears
9. File list refreshes with updated data

### Hiding a File
1. User taps the three-dot menu
2. User taps "Hide File"
3. Confirmation alert appears
4. User confirms
5. File status changes to "archived"
6. File disappears from active uploads list
7. Success message appears

### Deleting a File
1. User taps the three-dot menu
2. User taps "Delete File" (red option)
3. Destructive confirmation alert appears
4. User confirms deletion
5. File removed from Firestore
6. (Note: Cloudinary deletion requires backend implementation)
7. File disappears from list
8. Success message appears

## Security Considerations

1. **Authentication**: All operations require authenticated organization user
2. **Ownership**: Users can only manage their own uploaded files (enforced by `organizationId`)
3. **Confirmation**: Destructive actions (hide, delete) require explicit confirmation
4. **Validation**: Display name is required when editing

## Future Enhancements

Potential improvements:
1. **Restore Hidden Files** - Add view to see and restore archived files
2. **Bulk Operations** - Select multiple files for batch actions
3. **Cloudinary Deletion** - Implement backend endpoint to delete from Cloudinary
4. **File Versioning** - Keep edit history
5. **Analytics** - Track which files are most edited
6. **Permissions** - Role-based access for team members
7. **Undo Delete** - Soft delete with recovery period

## Related Files

- `app/orgPages/(tabs)/OrgUploads.tsx` - Main UI implementation
- `services/cloudinaryUploadService.js` - Service layer functions
- `firebaseconfig.js` - Firebase configuration
- `firestore.rules` - Security rules for uploads collection

## Notes

- Hidden files (archived) are not deleted from the database, just marked as inactive
- The delete function removes from Firestore but Cloudinary cleanup should be done server-side
- All operations trigger a refresh of the uploads list
- Error handling includes user-friendly Alert dialogs

