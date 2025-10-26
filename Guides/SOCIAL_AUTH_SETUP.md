# Social Authentication Setup Guide

## 🔧 Configuration Required

To enable Google and Facebook login, you need to configure the OAuth credentials in the `services/socialAuthServices.js` file.

### 1. Google OAuth Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Add authorized redirect URIs:
     - `https://auth.expo.io/@your-expo-username/your-app-slug`
     - `https://auth.expo.io/@anonymous/your-app-slug` (for development)
5. **Copy the Client ID** and replace `YOUR_GOOGLE_CLIENT_ID` in `socialAuthServices.js`

### 2. Facebook OAuth Setup

1. **Go to Facebook Developers**: https://developers.facebook.com/
2. **Create a new app**:
   - Click "Create App"
   - Choose "Consumer" or "Other"
   - Fill in app details
3. **Add Facebook Login product**:
   - Go to "Products" > "Facebook Login" > "Set Up"
   - Choose "Web" platform
4. **Configure OAuth settings**:
   - Go to "Facebook Login" > "Settings"
   - Add Valid OAuth Redirect URIs:
     - `https://auth.expo.io/@your-expo-username/your-app-slug`
     - `https://auth.expo.io/@anonymous/your-app-slug` (for development)
5. **Copy the App ID** and replace `YOUR_FACEBOOK_APP_ID` in `socialAuthServices.js`

### 3. Firebase Configuration

1. **Enable Authentication providers** in Firebase Console:
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable "Google" provider
   - Enable "Facebook" provider
   - Add the OAuth client IDs from steps 1 and 2

### 4. Update the Code

Replace the placeholder values in `services/socialAuthServices.js`:

```javascript
// Replace these with your actual credentials
const GOOGLE_CLIENT_ID = 'your-actual-google-client-id';
const FACEBOOK_APP_ID = 'your-actual-facebook-app-id';
```

### 5. Test the Implementation

1. **Run the app**: `npm start`
2. **Test Google login**: Click the Google button on login/signup pages
3. **Test Facebook login**: Click the Facebook button on login/signup pages
4. **Check Firebase Console**: Verify users are created in Authentication

## 🚨 Important Notes

- **Development vs Production**: Use different OAuth credentials for development and production
- **Expo Go vs Standalone**: OAuth redirect URIs differ between Expo Go and standalone builds
- **App Store Requirements**: For production, you'll need to configure additional settings for app store submission

## 🔍 Troubleshooting

### Common Issues:
1. **"Invalid redirect URI"**: Check that redirect URIs match exactly
2. **"App not configured"**: Ensure OAuth credentials are properly set up
3. **"Permission denied"**: Check that required scopes are requested

### Debug Steps:
1. Check console logs for detailed error messages
2. Verify OAuth credentials are correct
3. Test with different browsers/devices
4. Check Firebase Console for authentication logs

## 📱 Platform-Specific Notes

### iOS:
- May require additional configuration in `app.json`
- Consider using `expo-auth-session` for better iOS integration

### Android:
- Ensure proper SHA-1 fingerprints are added to Google Console
- Test on both debug and release builds

## 🔐 Security Considerations

- Never commit OAuth credentials to version control
- Use environment variables for production
- Regularly rotate OAuth secrets
- Monitor authentication logs for suspicious activity
