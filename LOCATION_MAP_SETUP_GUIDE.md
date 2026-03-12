# Location Map Setup Guide

## Issue Fixed
The 404 error on the location page has been resolved. The default placeholder URL was invalid and has been replaced with proper error handling.

## What Changed

### Before:
- Invalid placeholder Google Maps URL caused 404 error
- Map would briefly render then fail
- No fallback message for users

### After:
- Removed invalid default URL
- Added graceful fallback when map is not configured
- Shows helpful message to configure map in CMS
- Better user experience

## Current Behavior

### When Map URL is NOT Configured:
The location page will show a placeholder with:
```
┌─────────────────────────────────┐
│         📍 Map Icon             │
│                                 │
│   Map Not Configured            │
│                                 │
│   The location map will appear  │
│   here once configured in CMS.  │
│   Please contact administrator. │
└─────────────────────────────────┘
```

### When Map URL IS Configured:
- Shows the actual Google Maps embed
- Interactive map with zoom, pan, directions
- Professional appearance

## How to Configure the Map

### Step 1: Get Google Maps Embed URL

1. Go to [Google Maps](https://www.google.com/maps)
2. Search for your business location
3. Click the **"Share"** button
4. Click the **"Embed a map"** tab
5. Select map size (Medium or Large recommended)
6. Copy the **entire URL** from the `src` attribute

**Example of what to copy:**
```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.467!2d121.017!3d14.554!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c90264a0ed31%3A0x402e856dd4bee83!2sYour%20Business%20Name!5e0!3m2!1sen!2sph!4v1647856234567!5m2!1sen!2sph
```

**Important:** Make sure the URL:
- Starts with `https://www.google.com/maps/embed?pb=`
- Contains the `!4v` parameter with a valid timestamp
- Is the complete URL (not truncated)

### Step 2: Add to CMS

1. Log in as Owner/Manager
2. Go to **Owner Dashboard** → **CMS**
3. Click **Contact Information** tab
4. Scroll to **"Map Location"** section
5. Paste the URL in the **"Google Maps Embed URL"** field
6. Click **"Save Changes"**

### Step 3: Verify

1. Visit your website's Location page (`/location`)
2. The map should now display correctly
3. Test zoom, pan, and directions features

## Troubleshooting

### Map Still Shows 404 Error

**Possible Causes:**
1. **Invalid URL format**
   - Solution: Make sure you copied from "Embed a map" tab, not "Share link"
   - The URL must start with `https://www.google.com/maps/embed?pb=`

2. **Truncated URL**
   - Solution: Copy the entire URL, it should be quite long (200+ characters)
   - Don't copy just part of it

3. **Wrong tab in Google Maps**
   - Solution: Use "Embed a map" tab, NOT "Share link" tab
   - Share link URLs won't work in iframes

### Map Shows Wrong Location

**Solution:**
1. Search for the correct address in Google Maps
2. Make sure the pin is in the right place
3. Get a new embed URL from the correct location
4. Update in CMS

### Map Not Loading at All

**Possible Causes:**
1. **Browser blocking iframes**
   - Solution: Check browser console for errors
   - Allow iframes from google.com

2. **Network/Firewall issues**
   - Solution: Check if google.com is accessible
   - Try from different network

3. **Empty mapUrl in database**
   - Solution: Configure the map URL in CMS as described above

## Technical Details

### Code Changes Made

**File:** `app/location/page.tsx`

**Changes:**
1. Removed invalid default fallback URL
2. Added conditional rendering:
   - If `contactInfo?.mapUrl` exists → Show iframe with map
   - If not configured → Show placeholder message
3. Added proper iframe attributes:
   - `title` for accessibility
   - `referrerPolicy` for security
   - `loading="lazy"` for performance

### Fallback UI Component
```tsx
{contactInfo?.mapUrl ? (
  <iframe src={contactInfo.mapUrl} ... />
) : (
  <div className="placeholder">
    Map Not Configured
  </div>
)}
```

## Best Practices

### For Administrators:
1. **Always test** the map after configuration
2. **Use specific locations** (not just city names)
3. **Update immediately** if you move locations
4. **Keep URL secure** (though it's public anyway)

### For Users:
1. If map doesn't load, contact administrator
2. Use the address information provided as fallback
3. Can still use "Get Directions" button to open Google Maps

## Alternative: Custom Map Markers

If you want a custom map with your own markers and styling, you would need:
1. Google Maps JavaScript API key
2. Custom map component
3. Code changes to implement

This is beyond the current CMS configuration but can be implemented if needed.

## Summary

✅ **Fixed:** 404 error removed
✅ **Added:** Graceful fallback when not configured
✅ **Improved:** User experience with helpful messages
✅ **Ready:** Just needs map URL configuration in CMS

The location page is now ready to use. Simply configure the Google Maps embed URL in the CMS to display your business location!
