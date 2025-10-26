import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { FacebookAuthProvider, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebaseconfig';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = 'YOUR_ACTUAL_GOOGLE_CLIENT_ID_HERE'; // Replace with your Google Client ID
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
  useProxy: true,
});

// Facebook OAuth Configuration  
const FACEBOOK_APP_ID = 'YOUR_ACTUAL_FACEBOOK_APP_ID_HERE'; // Replace with your Facebook App ID
const FACEBOOK_REDIRECT_URI = AuthSession.makeRedirectUri({
  useProxy: true,
});

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    // Check if credentials are configured
    if (GOOGLE_CLIENT_ID === 'YOUR_ACTUAL_GOOGLE_CLIENT_ID_HERE') {
      throw new Error('Google OAuth credentials not configured. Please set up Google OAuth in the Firebase Console and update the credentials in socialAuthServices.js');
    }

    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: GOOGLE_REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {},
      additionalParameters: {},
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    });

    if (result.type === 'success') {
      // Exchange the code for an access token
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: GOOGLE_CLIENT_ID,
          code: result.params.code,
          redirectUri: GOOGLE_REDIRECT_URI,
          extraParams: {
            code_verifier: request.codeVerifier,
          },
        },
        {
          tokenEndpoint: 'https://oauth2.googleapis.com/token',
        }
      );

      // Get user info from Google
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.accessToken}`
      );
      const userInfo = await userInfoResponse.json();

      // Create Firebase credential
      const credential = GoogleAuthProvider.credential(tokenResponse.idToken);
      
      // Sign in to Firebase
      const userCredential = await signInWithCredential(auth, credential);
      
      return userCredential.user;
    } else {
      throw new Error('Google sign-in was cancelled');
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

// Facebook Sign In
export const signInWithFacebook = async () => {
  try {
    // Check if credentials are configured
    if (FACEBOOK_APP_ID === 'YOUR_ACTUAL_FACEBOOK_APP_ID_HERE') {
      throw new Error('Facebook OAuth credentials not configured. Please set up Facebook OAuth in the Firebase Console and update the credentials in socialAuthServices.js');
    }

    const request = new AuthSession.AuthRequest({
      clientId: FACEBOOK_APP_ID,
      scopes: ['public_profile', 'email'],
      redirectUri: FACEBOOK_REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {},
      additionalParameters: {},
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
    });

    if (result.type === 'success') {
      // Exchange the code for an access token
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: FACEBOOK_APP_ID,
          code: result.params.code,
          redirectUri: FACEBOOK_REDIRECT_URI,
          extraParams: {
            code_verifier: request.codeVerifier,
          },
        },
        {
          tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
        }
      );

      // Get user info from Facebook
      const userInfoResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenResponse.accessToken}`
      );
      const userInfo = await userInfoResponse.json();

      // Create Firebase credential
      const credential = FacebookAuthProvider.credential(tokenResponse.accessToken);
      
      // Sign in to Firebase
      const userCredential = await signInWithCredential(auth, credential);
      
      return userCredential.user;
    } else {
      throw new Error('Facebook sign-in was cancelled');
    }
  } catch (error) {
    console.error('Facebook sign-in error:', error);
    throw error;
  }
};
