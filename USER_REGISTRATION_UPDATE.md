# User Registration System Update

## ✅ COMPLETED CHANGES

### 1. **Firestore User Collection**

Upon registration, a user document is now created in the `users` collection with the following structure:

```typescript
interface UserData {
  uid: string;                    // Firebase Auth UID
  email: string;                  // User's email
  displayName: string;            // User's full name
  phoneNumber?: string;           // User's phone number (optional)
  userRole: 'customer' | 'admin'; // User role (default: 'customer')
  createdAt: Timestamp;           // Account creation timestamp
  updatedAt: Timestamp;           // Last update timestamp
}
```

### 2. **Updated Registration Form**

Added phone number field to the registration form:
- **Full Name** (required)
- **Email** (required)
- **Phone Number** (optional)
- **Password** (required)
- **Confirm Password** (required)

### 3. **Enhanced AuthContext**

Updated `contexts/AuthContext.tsx`:
- Added `userData` state to store Firestore user data
- Modified `signup()` to accept phone number parameter
- Creates Firestore document automatically on registration
- Fetches user data on authentication state change
- Handles Google and Facebook OAuth with automatic user document creation

### 4. **User Role System**

Default role assignment:
- **New registrations**: `userRole: 'customer'`
- **Admin role**: Must be manually set in Firestore

To make a user an admin:
1. Go to Firebase Console → Firestore
2. Find the user document in `users` collection
3. Edit `userRole` field to `'admin'`

### 5. **OAuth Integration**

Google and Facebook sign-in now:
- Check if user document exists
- Create user document if it doesn't exist
- Set default role as 'customer'

## 📁 FILES MODIFIED

1. **contexts/AuthContext.tsx**
   - Added UserData interface
   - Added userData state
   - Updated signup function signature
   - Added Firestore document creation
   - Enhanced OAuth handlers

2. **app/register/page.tsx**
   - Added phoneNumber field to form
   - Updated form state
   - Pass phone number to signup function
   - Added Phone icon import

## 🔐 SECURITY RULES

Firestore security rules have been created in `firestore.rules`:

```javascript
// Users can read/write their own data
match /users/{userId} {
  allow read: if isOwner(userId) || isAdmin();
  allow create: if isOwner(userId);
  allow update: if isOwner(userId) || isAdmin();
  allow delete: if isAdmin();
}
```

## 🚀 USAGE

### For Customers

1. Register with email, password, name, and phone
2. User document automatically created with role 'customer'
3. Access customer portal features

### For Admins

1. Register normally as customer
2. Admin manually updates userRole to 'admin' in Firestore
3. Access admin features (to be implemented)

### Accessing User Data in Components

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, userData } = useAuth();
  
  // user = Firebase Auth user object
  // userData = Firestore user document
  
  if (userData?.userRole === 'admin') {
    // Show admin features
  }
  
  return (
    <div>
      <p>Name: {userData?.displayName}</p>
      <p>Phone: {userData?.phoneNumber}</p>
      <p>Role: {userData?.userRole}</p>
    </div>
  );
}
```

## 📊 DATABASE STRUCTURE

```
Firestore
├── users (collection)
│   ├── {userId} (document)
│   │   ├── uid: string
│   │   ├── email: string
│   │   ├── displayName: string
│   │   ├── phoneNumber: string
│   │   ├── userRole: 'customer' | 'admin'
│   │   ├── createdAt: Timestamp
│   │   └── updatedAt: Timestamp
│   └── ...
└── bookings (collection)
    ├── {bookingId} (document)
    │   ├── userId: string (references users/{userId})
    │   └── ...
    └── ...
```

## 🔄 NEXT STEPS

1. **Role-Based Access Control**
   - Implement admin dashboard
   - Add role checks to protected routes
   - Create admin-only features

2. **User Profile Management**
   - Add profile edit page
   - Allow users to update phone number
   - Add profile picture upload

3. **Enhanced User Data**
   - Add address fields
   - Add preferences
   - Add notification settings

## ✅ TESTING

To test the new registration system:

1. **Register a new user**:
   - Go to `/register`
   - Fill in all fields including phone number
   - Submit form

2. **Verify in Firebase Console**:
   - Go to Authentication → Users (should see new user)
   - Go to Firestore → users collection (should see user document)
   - Check that all fields are populated correctly

3. **Test OAuth**:
   - Sign in with Google/Facebook
   - Check that user document is created automatically

4. **Test role-based features**:
   - Access customer portal as customer
   - Manually change role to admin in Firestore
   - Test admin features (when implemented)
