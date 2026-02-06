# Firebase Configuration Error Fix

## Error: `auth/configuration-not-found`

This error means Firebase Authentication is not properly configured for your project.

## Quick Fix Steps

### Step 1: Enable Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **eventcash-74a3a**
3. Click **Authentication** in the left sidebar
4. If you see **"Get Started"**, click it
5. Click the **"Sign-in method"** tab
6. Find **"Email/Password"** in the providers list
7. Click on it
8. Toggle **"Enable"** to ON
9. Click **"Save"**

### Step 2: Verify Web App is Registered

1. In Firebase Console, click the **gear icon** ⚙️ (top left)
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. You should see a web app with the icon **</>**
5. If you DON'T see a web app:
   - Click **"Add app"**
   - Select **Web** (</> icon)
   - Give it a nickname: "Aldea Catering Web"
   - Check **"Also set up Firebase Hosting"** (optional)
   - Click **"Register app"**
   - Copy the configuration code shown

### Step 3: Verify Your Configuration

The configuration in `lib/firebase.ts` should match what's shown in Firebase Console:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyARdK4OYZ04cweeVHSTrrU-74cm4Xf6nIo",
  authDomain: "eventcash-74a3a.firebaseapp.com",
  projectId: "eventcash-74a3a",
  storageBucket: "eventcash-74a3a.firebasestorage.app",
  messagingSenderId: "670848651839",
  appId: "1:670848651839:web:0c1b1d912708aa87765e8a",
  measurementId: "G-5HWTP0HKF3"
};
```

### Step 4: Check Browser Console

1. Open your app in the browser
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for these messages:
   - ✅ "Firebase initialized successfully"
   - ✅ "Auth instance created"
   - ✅ "Project ID: eventcash-74a3a"

If you see errors, note them down.

### Step 5: Clear Cache and Retry

1. Clear your browser cache (Ctrl+Shift+Delete)
2. Close and reopen your browser
3. Restart your development server:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```
4. Try registering again

## Common Causes

### 1. Authentication Not Enabled
**Solution:** Follow Step 1 above to enable Email/Password authentication.

### 2. Wrong App Configuration
**Solution:** Make sure you're using the correct `appId` from Firebase Console.

### 3. Web App Not Registered
**Solution:** Follow Step 2 to register a web app in Firebase Console.

### 4. Project Not Upgraded
**Solution:** Some Firebase features require the Blaze (pay-as-you-go) plan. Check your plan in Firebase Console.

### 5. API Key Restrictions
**Solution:** 
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your API key
5. Make sure it's not restricted or add your domain to allowed domains

## Alternative: Create User Manually

While fixing the configuration, you can create a test user manually:

1. Go to Firebase Console → Authentication → Users
2. Click **"Add user"**
3. Enter:
   - Email: `test@aldea.com`
   - Password: `Test123456`
4. Click **"Add user"**
5. Now you can login with these credentials at `/login`

## Verify Everything is Working

After completing the steps above:

1. Go to your app at `http://localhost:5173/register`
2. Fill in the registration form
3. Check the browser console (F12) for any errors
4. If successful, you should be redirected to the home page
5. Check Firebase Console → Authentication → Users to see your new user

## Still Having Issues?

Check the browser console and look for:
- The exact error message
- Any red error logs
- Network requests to Firebase (Network tab)

Share the error message and I can help further!
