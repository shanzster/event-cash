# Quick Map Test - Do This Now

## Test 1: Check What's Saved

1. Open browser console (F12)
2. Go to `/location` page
3. Look for this line in console:
   ```
   Map URL: [some url or undefined]
   ```

**Tell me what it says!**

## Test 2: Direct URL Test

Open this URL directly in your browser:
```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15566.763477078872!2d121.88088268133836!3d12.733578599999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2926019cd2bdf74d%3A0x1c6cccf2f4e240d4!2sALDEA%20Lights%20and%20Sounds!5e0!3m2!1sen!2sph!4v1773292197154!5m2!1sen!2sph
```

**Does it show the map or 404?**

## Test 3: Save Again

1. Go to CMS → Contact Information
2. In "Map Location" field, paste ONLY this:
   ```
   https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15566.763477078872!2d121.88088268133836!3d12.733578599999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2926019cd2bdf74d%3A0x1c6cccf2f4e240d4!2sALDEA%20Lights%20and%20Sounds!5e0!3m2!1sen!2sph!4v1773292197154!5m2!1sen!2sph
   ```
3. Click "Save Changes"
4. Do you see "Contact information saved successfully!"?
5. Refresh the CMS page
6. Is the URL still there?

## Test 4: Check Firebase

1. Go to Firebase Console
2. Firestore Database
3. Collection: `settings`
4. Document: `contact`
5. Look for field: `mapUrl`

**Is it there? What value?**

## Most Likely Issues

### Issue 1: URL Not Saving to Firebase
**Symptoms:** 
- URL disappears after refresh
- Console shows `undefined`

**Fix:** 
- Check Firebase permissions
- Check browser console for save errors

### Issue 2: Wrong URL Format
**Symptoms:**
- URL is saved but shows 404
- Works in browser but not in iframe

**Fix:**
- Make sure URL starts with `https://www.google.com/maps/embed?pb=`
- No extra characters or spaces

### Issue 3: Iframe Blocked
**Symptoms:**
- Console shows "Refused to display"
- Security errors

**Fix:**
- Get fresh embed code from Google Maps
- Check if URL is complete

## Quick Debug Code

Add this to your browser console on the location page:

```javascript
// Check what's loaded
console.log('Contact Info:', window.contactInfo);

// Try to access Firebase directly
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const docRef = doc(db, 'settings', 'contact');
getDoc(docRef).then(snap => {
  if (snap.exists()) {
    console.log('Firebase data:', snap.data());
    console.log('Map URL from Firebase:', snap.data().mapUrl);
  } else {
    console.log('No document found!');
  }
});
```

## Report Back

Please tell me:
1. ✅ or ❌ Does URL work when opened directly in browser?
2. ✅ or ❌ Does "Save Changes" show success message?
3. ✅ or ❌ Does URL stay after refreshing CMS page?
4. ✅ or ❌ Is mapUrl field in Firebase database?
5. What does browser console show for "Map URL:"?

This will help me identify the exact problem!
