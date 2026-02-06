# Firebase Authentication Setup Guide

## Enable Email/Password Authentication

The error "Failed to create account" usually means Email/Password authentication is not enabled in Firebase Console.

### Steps to Enable:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `eventcash-74a3a`

2. **Navigate to Authentication**
   - Click on "Authentication" in the left sidebar
   - Click on "Sign-in method" tab

3. **Enable Email/Password**
   - Find "Email/Password" in the list of providers
   - Click on it
   - Toggle "Enable" to ON
   - Click "Save"

4. **Optional: Enable Google Sign-In**
   - Find "Google" in the list
   - Click on it
   - Toggle "Enable" to ON
   - Add your project support email
   - Click "Save"

5. **Optional: Enable Facebook Sign-In**
   - Find "Facebook" in the list
   - Click on it
   - Toggle "Enable" to ON
   - Add App ID and App Secret from Facebook Developers
   - Click "Save"

## Verify Setup

After enabling Email/Password authentication:

1. Refresh your application
2. Try to register a new account
3. Check the browser console (F12) for any error messages
4. If successful, you should see the user in Firebase Console → Authentication → Users

## Common Issues

### Issue: "operation-not-allowed"
**Solution:** Email/Password authentication is not enabled. Follow steps above.

### Issue: "weak-password"
**Solution:** Password must be at least 6 characters long.

### Issue: "email-already-in-use"
**Solution:** This email is already registered. Try logging in instead or use a different email.

### Issue: "invalid-email"
**Solution:** The email format is invalid. Check for typos.

### Issue: "network-request-failed"
**Solution:** Check your internet connection or Firebase project configuration.

## Test Account Creation

Once Email/Password is enabled, try creating an account with:
- **Email:** test@example.com
- **Password:** Test123456
- **Name:** Test User

## Debugging

If you still have issues:

1. **Check Browser Console (F12)**
   - Look for red error messages
   - Note the error code (e.g., "auth/operation-not-allowed")

2. **Check Firebase Console**
   - Go to Authentication → Users
   - See if any users were created

3. **Check Network Tab**
   - Open DevTools → Network tab
   - Try to register
   - Look for failed requests to Firebase

4. **Verify Firebase Config**
   - Check `lib/firebase.ts`
   - Ensure all config values are correct
   - Verify the project ID matches your Firebase project

## Next Steps

After enabling authentication:
1. Create a test account
2. Login with the test account
3. Access the dashboard at `/dashboard`
4. Create a booking to test the full flow
