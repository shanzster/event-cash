# Bookings Not Showing - Debug Guide

## 🔍 TROUBLESHOOTING STEPS

### Step 1: Check Browser Console

1. Open your dashboard: `http://localhost:5173/dashboard`
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for these logs:

```
=== FETCHING BOOKINGS ===
Current user UID: YhADbiG8BKffFOn38c492ibdXTB3
Current user email: roseannesumo@gmail.com
Executing query...
Query returned X bookings
```

### Step 2: Check User ID Match

**Your booking has:**
```
userId: "YhADbiG8BKffFOn38c492ibdXTB3"
```

**Check if your logged-in user has the SAME UID:**
1. Look at the debug info box at the top of dashboard
2. Compare the UID shown there with the booking's userId
3. They MUST match exactly

**If they DON'T match:**
- You're logged in as a different user
- Log out and log in with the correct account
- Or use the admin tool to update the booking's userId

### Step 3: Check for Firestore Index Error

Look in console for this error:
```
⚠️ FIRESTORE INDEX REQUIRED!
The query requires an index...
```

**If you see this:**
1. Click the link in the error message
2. It will open Firebase Console
3. Click "Create Index"
4. Wait 2-5 minutes for index to build
5. Refresh your dashboard

### Step 4: Deploy Firestore Indexes

If index isn't created automatically:

```bash
firebase deploy --only firestore:indexes
```

This will create the required composite index for:
- `userId` (ASCENDING) + `createdAt` (DESCENDING)

### Step 5: Check Firestore Rules

Make sure your Firestore rules allow reading:

```javascript
match /bookings/{bookingId} {
  allow read: if request.auth.uid == resource.data.userId;
}
```

**Test in Firebase Console:**
1. Go to Firestore → Rules
2. Click "Rules Playground"
3. Test: `get /bookings/{bookingId}`
4. Should return "Allowed"

---

## 🎯 MOST LIKELY CAUSES

### 1. User ID Mismatch (Most Common)

**Problem:** You're logged in as a different user than who created the booking.

**Solution:**
- Check the debug info at top of dashboard
- Compare with booking's userId in Firestore
- Log in with the correct account

### 2. Missing Firestore Index

**Problem:** Composite index not created yet.

**Solution:**
- Check console for index error
- Click the link to create index
- Or run: `firebase deploy --only firestore:indexes`
- Wait 2-5 minutes

### 3. Firestore Rules Blocking

**Problem:** Security rules preventing read access.

**Solution:**
- Check rules in Firebase Console
- Make sure userId field exists in booking
- Verify you're authenticated

---

## 🧪 QUICK TESTS

### Test 1: Check Your User ID

```javascript
// In browser console on dashboard page
console.log('My UID:', user?.uid);
```

Compare with booking's userId in Firestore.

### Test 2: Query Firestore Directly

In Firebase Console:
1. Go to Firestore
2. Click on bookings collection
3. Look for bookings with YOUR userId
4. If you see them, it's a query/index issue
5. If you don't, check userId field

### Test 3: Create New Booking

1. Create a brand new booking
2. Check if it appears in dashboard immediately
3. If yes: Old bookings have wrong userId
4. If no: Index or rules issue

---

## 📊 WHAT TO CHECK IN CONSOLE

### Good Output (Working):
```
=== FETCHING BOOKINGS ===
Current user UID: YhADbiG8BKffFOn38c492ibdXTB3
Executing query...
Query returned 1 bookings
Booking: abc123 { userId: "YhADbiG8BKffFOn38c492ibdXTB3", ... }
Processed bookings: [{ id: "abc123", ... }]
```

### Bad Output (Index Missing):
```
=== ERROR FETCHING BOOKINGS ===
Error code: failed-precondition
⚠️ FIRESTORE INDEX REQUIRED!
Click the link in the error message to create the index
```

### Bad Output (User Mismatch):
```
=== FETCHING BOOKINGS ===
Current user UID: DIFFERENT_UID_HERE
Executing query...
Query returned 0 bookings
```

---

## ✅ SOLUTIONS

### Solution 1: Fix User ID Mismatch

**Option A: Log in with correct account**
1. Log out
2. Log in with: roseannesumo@gmail.com
3. Check dashboard

**Option B: Update booking userId**
1. Go to: `http://localhost:5173/admin/update-bookings`
2. Click "Add userId to Bookings Without It"
3. This will set all bookings to YOUR current userId

### Solution 2: Create Firestore Index

**Option A: Click the link in error**
1. Check console for error
2. Click the Firebase Console link
3. Click "Create Index"
4. Wait 2-5 minutes

**Option B: Deploy indexes**
```bash
firebase deploy --only firestore:indexes
```

### Solution 3: Check Firestore Rules

1. Firebase Console → Firestore → Rules
2. Make sure rules allow reading by userId
3. Publish rules if changed

---

## 🎯 STEP-BY-STEP DEBUG

1. **Open dashboard** → `http://localhost:5173/dashboard`
2. **Open console** → Press F12
3. **Check debug info** → Blue box at top shows your UID
4. **Check console logs** → Look for "FETCHING BOOKINGS"
5. **Compare UIDs** → Your UID vs booking's userId
6. **Check for errors** → Index errors, permission errors
7. **Take action** → Based on what you find

---

## 📝 COMMON SCENARIOS

### Scenario 1: "Query returned 0 bookings"
- **Cause:** User ID mismatch or no bookings exist
- **Fix:** Check if booking's userId matches your UID

### Scenario 2: "Index required" error
- **Cause:** Composite index not created
- **Fix:** Click link to create index or deploy indexes

### Scenario 3: "Permission denied" error
- **Cause:** Firestore rules blocking access
- **Fix:** Check rules, ensure userId field exists

### Scenario 4: Bookings show in Firestore but not dashboard
- **Cause:** Query issue or index issue
- **Fix:** Check console logs, create index

---

## 🚀 QUICK FIX CHECKLIST

- [ ] Open dashboard and check debug info box
- [ ] Open browser console (F12)
- [ ] Check if your UID matches booking's userId
- [ ] Look for any error messages
- [ ] If index error: Click link to create index
- [ ] If UID mismatch: Use admin tool or log in correctly
- [ ] Wait 2-5 minutes if index was just created
- [ ] Refresh dashboard

---

## 💡 NEED MORE HELP?

**Share these details:**
1. Your user UID (from debug box)
2. Booking's userId (from Firestore)
3. Console error messages (if any)
4. Screenshot of console logs

This will help identify the exact issue!
