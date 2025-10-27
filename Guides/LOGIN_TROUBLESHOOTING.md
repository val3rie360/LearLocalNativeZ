# Login Troubleshooting Guide

## Issue: Login Not Working Even When User Exists in Database

### Quick Diagnosis Steps

#### 1. Use the Debug Button (Development Only)
- Enter your email and password
- Click the orange "Debug Login (Dev Only)" button
- Check the console logs for detailed information
- The debug will test:
  - Firebase connection
  - User existence in Firestore
  - Authentication attempt
  - Specific error details

#### 2. Check Console Logs
Look for these specific log messages:
- `🔐 Attempting to sign in user: [email]`
- `✅ User signed in successfully: [user details]`
- `❌ Sign in error: [error details]`

### Common Issues and Solutions

#### Issue 1: User Exists in Firestore but Not in Firebase Auth
**Symptoms:**
- User profile exists in Firestore `profiles` collection
- Login fails with "No account found" error
- Debug shows user in Firestore but auth fails

**Solution:**
- The user was created in Firestore but not in Firebase Authentication
- User needs to sign up properly through the app
- Or admin needs to create the user in Firebase Console

#### Issue 2: Wrong Password
**Symptoms:**
- Login fails with "Incorrect password" error
- User exists in both Firestore and Firebase Auth

**Solution:**
- Use the "Forgot Password" feature to reset password
- Or verify the correct password

#### Issue 3: Email Not Verified
**Symptoms:**
- Login succeeds but user might have limited access
- Some features might not work

**Solution:**
- Check if email verification is required
- Send verification email if needed

#### Issue 4: Account Disabled
**Symptoms:**
- Login fails with "This account has been disabled" error

**Solution:**
- Contact admin to re-enable the account
- Check Firebase Console for disabled users

#### Issue 5: Network Issues
**Symptoms:**
- Login fails with "Network error" message
- Intermittent login failures

**Solution:**
- Check internet connection
- Try again after network stabilizes
- Check if Firebase services are down

#### Issue 6: Too Many Failed Attempts
**Symptoms:**
- Login fails with "Too many failed attempts" error

**Solution:**
- Wait for rate limit to reset (usually 15-30 minutes)
- Use "Forgot Password" to reset

### Debugging Steps

#### Step 1: Check Firebase Connection
```javascript
// In console, run:
import { debugFirebaseConnection } from './services/authDebugService';
debugFirebaseConnection();
```

#### Step 2: Check User in Firestore
```javascript
// In console, run:
import { debugUserInFirestore } from './services/authDebugService';
debugUserInFirestore('user@example.com');
```

#### Step 3: Check Current Auth Status
```javascript
// In console, run:
import { debugAuthStatus } from './services/authDebugService';
debugAuthStatus();
```

#### Step 4: Test Login Attempt
```javascript
// In console, run:
import { debugLoginIssue } from './services/authDebugService';
debugLoginIssue('user@example.com', 'password');
```

### Manual Verification Steps

#### 1. Check Firebase Console
- Go to Firebase Console → Authentication → Users
- Verify user exists with correct email
- Check if user is enabled
- Verify email is verified if required

#### 2. Check Firestore Database
- Go to Firebase Console → Firestore Database
- Check `profiles` collection
- Verify user document exists with correct UID
- Check user role and other profile data

#### 3. Check App Logs
- Look for authentication state changes
- Check for profile loading errors
- Verify routing logic is working

### Common Error Codes and Solutions

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `auth/user-not-found` | No Firebase Auth user | User needs to sign up |
| `auth/wrong-password` | Incorrect password | Reset password or verify |
| `auth/invalid-email` | Invalid email format | Check email format |
| `auth/user-disabled` | Account disabled | Contact admin |
| `auth/too-many-requests` | Rate limited | Wait and retry |
| `auth/network-request-failed` | Network error | Check connection |
| `auth/invalid-credential` | Invalid credentials | Verify email/password |

### Testing Different Scenarios

#### Test 1: New User Signup
1. Try creating a new account
2. Verify it works
3. Try logging in with new account

#### Test 2: Existing User Login
1. Use known working credentials
2. Check if login works
3. Compare with failing account

#### Test 3: Password Reset
1. Use "Forgot Password" feature
2. Reset password via email
3. Try logging in with new password

### Advanced Debugging

#### Check Authentication State Listener
The app uses `onAuthStateChanged` to detect login state changes. If this isn't working:
1. Check Firebase configuration
2. Verify auth persistence is enabled
3. Check for JavaScript errors

#### Check Profile Loading
After successful authentication, the app loads user profile:
1. Verify `getUserProfile` function works
2. Check if profile data exists in Firestore
3. Verify profile loading doesn't cause errors

#### Check Routing Logic
The app redirects users based on their role:
1. Verify user role is correctly set
2. Check routing logic in `_layout.tsx`
3. Ensure proper redirects happen

### Production Considerations

#### Remove Debug Code
Before deploying to production:
1. Remove debug button from login page
2. Remove debug console logs
3. Remove `authDebugService.js` if not needed

#### Monitor Authentication
Set up monitoring for:
1. Failed login attempts
2. Authentication errors
3. User creation issues

#### User Support
Provide users with:
1. Clear error messages
2. Password reset functionality
3. Contact information for support

### Quick Fixes

#### If Login Still Doesn't Work:
1. **Clear app data**: Uninstall and reinstall app
2. **Check Firebase rules**: Ensure Firestore rules allow read/write
3. **Verify API keys**: Check Firebase configuration
4. **Test with different device**: Rule out device-specific issues
5. **Check Firebase status**: Visit status.firebase.google.com

#### Emergency Workaround:
If urgent, you can temporarily:
1. Create new accounts for affected users
2. Use social login (Google/Facebook) as alternative
3. Reset passwords manually in Firebase Console

This guide should help identify and resolve most login issues. Use the debug tools to get specific information about what's failing.

