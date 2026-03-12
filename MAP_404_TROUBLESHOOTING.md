# Map 404 Error - Troubleshooting Guide

## Current Status
The code has been updated with better debugging. Let's troubleshoot step by step.

## Step 1: Check Browser Console

1. Open the location page (`/location`)
2. Open browser console (F12 or Right-click → Inspect → Console tab)
3. Look for these messages:
   - `Contact info loaded:` - Shows the data from Firebase
   - `Map URL:` - Shows the actual URL being used
   - Any error messages

**What to look for:**
- Is `Map URL:` showing the correct URL?
- Is it showing `undefined` or empty?
- Are there any Firebase errors?

## Step 2: Verify Data in CMS

1. Go to **Owner Dashboard** → **CMS** → **Contact Information**
2. Scroll to **"Map Location"** section
3. Check if you see the green confirmation box:
   ```
   ✓ Map URL Configured:
   https://www.google.com/maps/embed?pb=...
   ```

**If you DON'T see the green box:**
- The URL wasn't saved properly
- Try pasting again and clicking "Save Changes"

**If you DO see the green box:**
- The URL is saved in the form state
- But might not be saved to Firebase yet

## Step 3: Verify Firebase Save

After pasting the iframe code in CMS:

1. Click **"Save Changes"** button
2. Wait for success message: "Contact information saved successfully!"
3. Refresh the page
4. Check if the URL is still there

**If URL disappears after refresh:**
- Firebase save failed
- Check browser console for errors
- Check Firebase permissions

## Step 4: Check the Exact URL Format

The URL should look like this:
```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15566.763477078872!2d121.88088268133836!3d12.733578599999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2926019cd2bdf74d%3A0x1c6cccf2f4e240d4!2sALDEA%20Lights%20and%20Sounds!5e0!3m2!1sen!2sph!4v1773292197154!5m2!1sen!2sph
```

**Common Issues:**
- ❌ Missing `https://`
- ❌ Has `<iframe` tags still attached
- ❌ Has extra quotes or spaces
- ❌ Truncated URL (not complete)

## Step 5: Manual Test

Try this URL directly in your browser:
```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15566.763477078872!2d121.88088268133836!3d12.733578599999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2926019cd2bdf74d%3A0x1c6cccf2f4e240d4!2sALDEA%20Lights%20and%20Sounds!5e0!3m2!1sen!2sph!4v1773292197154!5m2!1sen!2sph
```

**Expected Result:**
- Should show the map in your browser
- If it shows 404 in browser too, the URL itself is invalid

**If it works in browser but not on your site:**
- The URL is correct
- Problem is with how it's being saved/loaded

## Step 6: Check Firebase Database Directly

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find collection: `settings`
4. Find document: `contact`
5. Check field: `mapUrl`

**What should be there:**
```
mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15566..."
```

**If it's not there or different:**
- The save didn't work
- Try saving again from CMS

## Step 7: Try Alternative Method

If auto-extraction isn't working, manually extract the URL:

1. From your iframe code:
   ```html
   <iframe src="THIS_IS_WHAT_YOU_NEED" width="600"...
   ```

2. Copy only the URL part (between the quotes after `src=`):
   ```
   https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15566.763477078872!2d121.88088268133836!3d12.733578599999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2926019cd2bdf74d%3A0x1c6cccf2f4e240d4!2sALDEA%20Lights%20and%20Sounds!5e0!3m2!1sen!2sph!4v1773292197154!5m2!1sen!2sph
   ```

3. Paste ONLY this URL in the CMS field
4. Save

## Step 8: Clear Cache

Sometimes the browser caches the old (broken) URL:

1. Hard refresh the location page:
   - Windows: `Ctrl + Shift + R` or `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. Or clear browser cache completely

## Step 9: Check for CORS/Security Issues

Open browser console and look for errors like:
- `Refused to display in a frame`
- `X-Frame-Options`
- `Content Security Policy`

**If you see these:**
- The URL might be blocked by Google
- Try getting a fresh embed code from Google Maps

## Quick Fix: Use This Exact URL

Copy and paste this EXACT URL into the CMS Map Location field:

```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15566.763477078872!2d121.88088268133836!3d12.733578599999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2926019cd2bdf74d%3A0x1c6cccf2f4e240d4!2sALDEA%20Lights%20and%20Sounds!5e0!3m2!1sen!2sph!4v1773292197154!5m2!1sen!2sph
```

Then:
1. Click "Save Changes"
2. Wait for success message
3. Hard refresh location page (Ctrl+Shift+R)
4. Check browser console for logs

## What to Report Back

Please check and report:

1. **Browser Console Output:**
   - What does `Map URL:` show?
   - Any error messages?

2. **Firebase Database:**
   - Is `mapUrl` field present in `settings/contact`?
   - What value does it have?

3. **CMS Field:**
   - Does the green confirmation box appear?
   - What does it show?

4. **Direct URL Test:**
   - Does the URL work when opened directly in browser?

5. **Network Tab:**
   - Open DevTools → Network tab
   - Reload page
   - Look for the maps embed request
   - What status code does it show? (200, 404, etc.)

This information will help identify exactly where the problem is!
