# EventCash Security Recommendations

**Priority:** CRITICAL  
**Date:** February 7, 2026  
**Status:** URGENT - Must be implemented before production

---

## 🚨 CRITICAL SECURITY ISSUES

### 1. Firestore Security Rules - INCOMPLETE & VULNERABLE

**Current State:**
```javascript
// firestore.rules - ONLY covers users and bookings
match /users/{userId} { ... }
match /bookings/{bookingId} { ... }
```

**Missing Collections (EXPOSED):**
- `/managers/{managerId}` - NO RULES
- `/staff/{staffId}` - NO RULES  
- `/transactions/{transactionId}` - NO RULES
- `/cashFlow/{entryId}` - NO RULES
- `/expenses/{expenseId}` - NO RULES

**Risk:** Anyone with Firebase SDK access can read/write/delete ALL manager, staff, transaction, and financial data.

**IMMEDIATE ACTION REQUIRED:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isManager() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/managers/$(request.auth.uid));
    }
    
    function isStaff() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/staff/$(request.auth.uid));
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/managers/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isManager());
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() && (request.auth.uid == userId || isManager());
      allow delete: if isAdmin();
    }
    
    // Managers collection - CRITICAL
    match /managers/{managerId} {
      allow read: if isManager() && request.auth.uid == managerId;
      allow create: if false; // Only create via admin console or Cloud Function
      allow update: if isManager() && request.auth.uid == managerId;
      allow delete: if isAdmin();
    }
    
    // Staff collection - CRITICAL
    match /staff/{staffId} {
      allow read: if isAuthenticated() && (request.auth.uid == staffId || isManager());
      allow create: if isManager();
      allow update: if isManager() || (isStaff() && request.auth.uid == staffId);
      allow delete: if isManager();
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      allow read: if isAuthenticated() && 
                     (request.auth.uid == resource.data.userId || 
                      isManager() || 
                      (isStaff() && request.auth.uid in resource.data.assignedStaff));
      allow create: if isAuthenticated() && 
                       (request.auth.uid == request.resource.data.userId || isManager());
      allow update: if isAuthenticated() && 
                       (request.auth.uid == resource.data.userId || isManager());
      allow delete: if isManager();
    }
    
    // Transactions collection - CRITICAL
    match /transactions/{transactionId} {
      allow read: if isManager();
      allow create: if isManager();
      allow update: if isManager();
      allow delete: if isAdmin();
    }
    
    // Cash Flow collection - CRITICAL
    match /cashFlow/{entryId} {
      allow read: if isManager();
      allow create: if isManager();
      allow update: if isManager();
      allow delete: if isManager();
    }
    
    // Expenses collection (if separate) - CRITICAL
    match /expenses/{expenseId} {
      allow read: if isManager() || isStaff();
      allow create: if isManager() || isStaff();
      allow update: if isManager();
      allow delete: if isManager();
    }
  }
}
```

**Deploy Command:**
```bash
firebase deploy --only firestore:rules
```

---

### 2. Staff Authentication - COMPLETELY INSECURE

**Current Implementation:**
```typescript
// app/staff/dashboard/page.tsx - INSECURE!
const user = JSON.parse(localStorage.getItem('staffUser') || '{}');
if (!user.id) {
  router.push('/staff/login');
}
```

**Problems:**
1. No Firebase Authentication
2. Anyone can set localStorage and impersonate staff
3. No server-side validation
4. No session expiration
5. No token verification

**IMMEDIATE FIX REQUIRED:**

**Option A: Use Firebase Auth with Custom Claims (RECOMMENDED)**

```typescript
// 1. Create Cloud Function to set custom claims
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const setStaffClaim = functions.https.onCall(async (data, context) => {
  // Only managers can set staff claims
  if (!context.auth || !await isManager(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'Only managers can create staff');
  }
  
  await admin.auth().setCustomUserClaims(data.uid, {
    role: 'staff',
    staffId: data.staffId
  });
  
  return { success: true };
});

// 2. Update staff login
export const staffLogin = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const idTokenResult = await userCredential.user.getIdTokenResult();
  
  if (idTokenResult.claims.role !== 'staff') {
    await signOut(auth);
    throw new Error('Not authorized as staff');
  }
  
  return userCredential;
};

// 3. Update staff dashboard
useEffect(() => {
  const checkStaffAuth = async () => {
    if (!user) {
      router.push('/staff/login');
      return;
    }
    
    const idTokenResult = await user.getIdTokenResult();
    if (idTokenResult.claims.role !== 'staff') {
      await signOut(auth);
      router.push('/staff/login');
    }
  };
  
  checkStaffAuth();
}, [user]);
```

**Option B: Separate Firebase Project for Staff (Complex)**
- Create separate Firebase project for staff
- Use different auth instance
- More complex but complete separation

---

### 3. Manager/Customer Auth Conflict

**Current Problem:**
- Both use same Firebase Auth instance
- Logging in as manager logs out customer
- No role separation

**Solution: Use Firebase Custom Claims**

```typescript
// contexts/UnifiedAuthContext.tsx
export const UnifiedAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'customer' | 'manager' | 'staff' | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const role = idTokenResult.claims.role as 'customer' | 'manager' | 'staff';
        
        setUser(firebaseUser);
        setUserRole(role || 'customer'); // Default to customer
      } else {
        setUser(null);
        setUserRole(null);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, userRole, ... }}>
      {children}
    </AuthContext.Provider>
  );
};

// middleware.ts - Role-based routing
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check role from token (requires Edge Runtime)
  if (path.startsWith('/manager/')) {
    // Verify manager role
  } else if (path.startsWith('/staff/')) {
    // Verify staff role
  }
  
  return NextResponse.next();
}
```

---

### 4. Password Storage - INSECURE

**Current Issue:**
```typescript
// ManagerSidebar.tsx - STORING PASSWORDS IN FIRESTORE!
await updateDoc(managerRef, {
  password: passwordForm.newPassword, // NEVER DO THIS!
});
```

**CRITICAL:** Never store passwords in Firestore!

**Fix:** Remove password storage, use Firebase Auth only:

```typescript
// Use Firebase Auth password update
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const handleUpdatePassword = async () => {
  if (!managerUser) return;
  
  try {
    // Re-authenticate first
    const credential = EmailAuthProvider.credential(
      managerUser.email!,
      passwordForm.currentPassword
    );
    await reauthenticateWithCredential(managerUser, credential);
    
    // Update password
    await updatePassword(managerUser, passwordForm.newPassword);
    
    alert('Password updated successfully!');
  } catch (error) {
    console.error('Error updating password:', error);
    alert('Failed to update password. Check your current password.');
  }
};
```

---

### 5. API Keys Exposed in Client Code

**Current State:**
```typescript
// lib/firebase.ts - API keys visible in client bundle
const firebaseConfig = {
  apiKey: "AIzaSyARdK4OYZ04cweeVHSTrrU-74cm4Xf6nIo",
  authDomain: "eventcash-74a3a.firebaseapp.com",
  projectId: "eventcash-74a3a",
  // ...
};
```

**Note:** This is normal for Firebase, but you MUST:

1. **Restrict API Key in Firebase Console:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Select your API key
   - Add restrictions:
     - HTTP referrers: `https://eventcash-74a3a.web.app/*`, `http://localhost:*`
     - API restrictions: Only enable required APIs

2. **Enable App Check:**
```typescript
// lib/firebase.ts
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

---

### 6. No Rate Limiting

**Risk:** API abuse, DDoS attacks, spam bookings

**Solution: Firebase App Check + Cloud Functions**

```typescript
// functions/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const createBooking = functions
  .runWith({ enforceAppCheck: true }) // Requires App Check
  .https.onCall(async (data, context) => {
    // Rate limiting
    const userRef = admin.firestore().collection('users').doc(context.auth!.uid);
    const userDoc = await userRef.get();
    const lastBooking = userDoc.data()?.lastBookingTime;
    
    if (lastBooking && Date.now() - lastBooking < 60000) { // 1 minute
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Please wait before creating another booking'
      );
    }
    
    // Create booking
    const booking = await admin.firestore().collection('bookings').add({
      ...data,
      userId: context.auth!.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update last booking time
    await userRef.update({
      lastBookingTime: Date.now()
    });
    
    return { bookingId: booking.id };
  });
```

---

### 7. No Input Validation (Server-Side)

**Current:** Only client-side validation

**Risk:** Malicious data injection, data corruption

**Solution: Cloud Functions with Validation**

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const bookingSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  eventDate: z.date().min(new Date()),
  guestCount: z.number().int().min(1).max(1000),
  totalPrice: z.number().positive(),
  // ... more fields
});

export const validateAndCreateBooking = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  try {
    const validated = bookingSchema.parse(data);
    
    // Additional business logic validation
    if (validated.totalPrice < 1000) {
      throw new Error('Minimum booking amount is ₱1000');
    }
    
    // Create booking
    const booking = await admin.firestore().collection('bookings').add({
      ...validated,
      userId: context.auth.uid,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, bookingId: booking.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError('invalid-argument', error.message);
    }
    throw error;
  }
});
```

---

### 8. No HTTPS Enforcement

**Fix in firebase.json:**

```json
{
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains; preload"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

### 9. No Two-Factor Authentication (2FA)

**Recommendation:** Implement for manager accounts

```typescript
import { multiFactor, PhoneAuthProvider, PhoneMultiFactorGenerator } from 'firebase/auth';

// Enable 2FA for managers
export const enableTwoFactor = async (phoneNumber: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  const session = await multiFactor(user).getSession();
  const phoneAuthProvider = new PhoneAuthProvider(auth);
  
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(
    phoneNumber,
    session
  );
  
  return verificationId;
};

export const verifyAndEnroll = async (verificationId: string, code: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  const cred = PhoneAuthProvider.credential(verificationId, code);
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
  
  await multiFactor(user).enroll(multiFactorAssertion, 'Phone Number');
};
```

---

### 10. No Audit Logging

**Implement Audit Trail:**

```typescript
// lib/auditLog.ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const logAuditEvent = async (
  action: string,
  userId: string,
  details: any,
  ipAddress?: string
) => {
  await addDoc(collection(db, 'auditLogs'), {
    action,
    userId,
    details,
    ipAddress,
    timestamp: serverTimestamp(),
    userAgent: navigator.userAgent
  });
};

// Usage
await logAuditEvent('booking_created', user.uid, { bookingId: 'abc123' });
await logAuditEvent('booking_cancelled', manager.uid, { bookingId: 'abc123', reason: 'Customer request' });
await logAuditEvent('price_updated', manager.uid, { bookingId: 'abc123', oldPrice: 5000, newPrice: 4500 });
```

---

## 📋 SECURITY CHECKLIST

### Immediate (This Week)
- [ ] Deploy comprehensive Firestore security rules
- [ ] Fix staff authentication system
- [ ] Remove password storage from Firestore
- [ ] Implement role-based auth with custom claims
- [ ] Restrict Firebase API keys
- [ ] Add HTTPS security headers

### Short Term (This Month)
- [ ] Implement Firebase App Check
- [ ] Add server-side validation (Cloud Functions)
- [ ] Implement rate limiting
- [ ] Add audit logging
- [ ] Enable 2FA for managers
- [ ] Add CAPTCHA to forms

### Long Term (Next Quarter)
- [ ] Security audit by professional firm
- [ ] Penetration testing
- [ ] Implement WAF (Web Application Firewall)
- [ ] Set up intrusion detection
- [ ] Regular security training for team
- [ ] Bug bounty program

---

## 🔐 SECURITY BEST PRACTICES

### 1. Never Trust Client-Side Data
- Always validate on server (Cloud Functions)
- Never rely on client-side checks for security
- Use Firestore security rules as second layer

### 2. Principle of Least Privilege
- Users should only access their own data
- Managers should only access what they need
- Staff should have limited permissions

### 3. Defense in Depth
- Multiple layers of security
- Firestore rules + Cloud Functions + App Check
- Client validation + Server validation

### 4. Regular Security Updates
- Keep dependencies updated
- Monitor security advisories
- Regular security audits

### 5. Secure Development Lifecycle
- Code reviews for security
- Security testing in CI/CD
- Threat modeling for new features

---

## 🚨 INCIDENT RESPONSE PLAN

### If Security Breach Detected:

1. **Immediate Actions:**
   - Disable affected accounts
   - Revoke compromised tokens
   - Block suspicious IP addresses
   - Take affected systems offline if necessary

2. **Investigation:**
   - Review audit logs
   - Identify scope of breach
   - Determine attack vector
   - Document findings

3. **Remediation:**
   - Patch vulnerabilities
   - Reset compromised credentials
   - Notify affected users
   - Report to authorities if required

4. **Post-Incident:**
   - Conduct post-mortem
   - Update security measures
   - Improve monitoring
   - Train team on lessons learned

---

## 📞 SECURITY CONTACTS

- **Firebase Security:** https://firebase.google.com/support/troubleshooter/report/bugs
- **Google Cloud Security:** https://cloud.google.com/security/disclosure
- **Emergency:** Escalate to Firebase support immediately

---

**CRITICAL:** Do not deploy to production until at least the "Immediate" checklist items are completed.

**Last Updated:** February 7, 2026  
**Next Review:** Weekly until all critical issues resolved
