# Map Configuration Improvement

## Problem Solved
Users were confused about whether to paste the entire iframe code or just the URL. The system now accepts BOTH and automatically extracts the URL!

## What Changed

### Before:
- Field only accepted the URL
- Users had to manually extract URL from iframe code
- Confusing instructions
- Easy to make mistakes

### After:
- ✅ Accepts full iframe code
- ✅ Accepts just the URL
- ✅ Automatically extracts URL from iframe
- ✅ Clear step-by-step instructions
- ✅ Visual confirmation when configured

## How It Works Now

### You Can Paste Either:

**Option 1: Full iframe code (EASIEST)**
```html
<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15566.763477078872!2d121.88088268133836!3d12.733578599999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2926019cd2bdf74d%3A0x1c6cccf2f4e240d4!2sALDEA%20Lights%20and%20Sounds!5e0!3m2!1sen!2sph!4v1773292197154!5m2!1sen!2sph" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
```
✨ System automatically extracts: `https://www.google.com/maps/embed?pb=!1m18...`

**Option 2: Just the URL**
```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15566.763477078872!2d121.88088268133836!3d12.733578599999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2926019cd2bdf74d%3A0x1c6cccf2f4e240d4!2sALDEA%20Lights%20and%20Sounds!5e0!3m2!1sen!2sph!4v1773292197154!5m2!1sen!2sph
```
✅ Works directly

## New Features

### 1. Auto-Extraction
The system now automatically detects if you pasted an iframe code and extracts the URL:
```javascript
if (value.includes('<iframe') && value.includes('src=')) {
  const srcMatch = value.match(/src=["']([^"']+)["']/);
  if (srcMatch && srcMatch[1]) {
    value = srcMatch[1]; // Extract just the URL
  }
}
```

### 2. Clear Instructions
New blue info box with step-by-step guide:
```
📍 How to get your map:
1. Go to Google Maps
2. Search for your business location
3. Click "Share" button
4. Click "Embed a map" tab
5. Copy the entire iframe code and paste it here

✨ Tip: You can paste the entire iframe code - we'll automatically extract the URL!
```

### 3. Visual Confirmation
Green success box shows when map is configured:
```
✓ Map URL Configured:
https://www.google.com/maps/embed?pb=!1m18...
```

## Step-by-Step Guide

### For Your Specific Location (ALDEA Lights and Sounds):

1. **Go to CMS**
   - Owner Dashboard → CMS → Contact Information tab

2. **Paste Your Code**
   - In the "Google Maps Embed Code or URL" field
   - Paste this entire code:
   ```html
   <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15566.763477078872!2d121.88088268133836!3d12.733578599999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2926019cd2bdf74d%3A0x1c6cccf2f4e240d4!2sALDEA%20Lights%20and%20Sounds!5e0!3m2!1sen!2sph!4v1773292197154!5m2!1sen!2sph" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
   ```

3. **System Auto-Extracts**
   - The URL is automatically extracted
   - You'll see a green confirmation box

4. **Save Changes**
   - Click "Save Changes" button

5. **Verify**
   - Visit `/location` page
   - Map should now display ALDEA Lights and Sounds location

## Benefits

✅ **User-Friendly**: No need to manually extract URL
✅ **Foolproof**: Works with either format
✅ **Clear Instructions**: Step-by-step guide included
✅ **Visual Feedback**: See confirmation when configured
✅ **Error Prevention**: Reduces configuration mistakes

## Technical Details

### Auto-Extraction Logic
```typescript
onChange={(e) => {
  let value = e.target.value.trim();
  
  // Auto-extract URL from iframe code
  if (value.includes('<iframe') && value.includes('src=')) {
    const srcMatch = value.match(/src=["']([^"']+)["']/);
    if (srcMatch && srcMatch[1]) {
      value = srcMatch[1];
    }
  }
  
  setContactInfo({ ...contactInfo, mapUrl: value });
}}
```

### Regex Pattern
- Matches: `src="URL"` or `src='URL'`
- Extracts: Everything between the quotes
- Handles: Both single and double quotes

## Testing

### Test Cases:
1. ✅ Paste full iframe code → URL extracted
2. ✅ Paste just URL → Works directly
3. ✅ Paste with extra whitespace → Trimmed automatically
4. ✅ Empty field → Shows placeholder
5. ✅ Invalid format → Shows as-is (user can fix)

## Summary

The map configuration is now much easier! You can simply:
1. Copy the entire iframe code from Google Maps
2. Paste it in the CMS field
3. System automatically extracts the URL
4. Save and done!

No more confusion about what to paste or how to extract the URL. Just paste and go! 🎉
