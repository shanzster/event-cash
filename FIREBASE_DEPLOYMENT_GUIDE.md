# Firebase Deployment Guide

## Overview
This guide explains how to deploy your Next.js catering website to Firebase Hosting.

## Prerequisites

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

## Deployment Steps

### Step 1: Initialize Firebase in Your Project

If you haven't already initialized Firebase, run:

```bash
firebase init
```

Select the following options:
- **Hosting**: Configure files for Firebase Hosting
- **Use an existing project**: Select `eventcash-74a3a`
- **Public directory**: Enter `out` (for static export) or `.next` (for server-side)
- **Configure as single-page app**: Yes
- **Set up automatic builds with GitHub**: Optional

### Step 2: Configure Next.js for Firebase

#### Option A: Static Export (Recommended for this project)

1. Update `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

2. Build the project:
```bash
npm run build
```

3. Update `firebase.json`:
```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
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

#### Option B: Server-Side Rendering with Cloud Functions

For dynamic features (requires Firebase Blaze plan):

1. Install dependencies:
```bash
npm install firebase-functions firebase-admin
```

2. Configure `firebase.json` for functions
3. Deploy with functions enabled

### Step 3: Deploy to Firebase

```bash
firebase deploy
```

Or deploy only hosting:
```bash
firebase deploy --only hosting
```

## Environment Variables

### For Firebase Hosting

Create `.env.production`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyARdK4OYZ04cweeVHSTrrU-74cm4Xf6nIo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=eventcash-74a3a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=eventcash-74a3a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=eventcash-74a3a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=670848651839
NEXT_PUBLIC_FIREBASE_APP_ID=1:670848651839:web:0c1b1d912708aa87765e8a
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-5HWTP0HKF3
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Note**: Environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

## Post-Deployment

### 1. Verify Deployment
After deployment, Firebase will provide a hosting URL:
```
https://eventcash-74a3a.web.app
```
or
```
https://eventcash-74a3a.firebaseapp.com
```

### 2. Set Up Custom Domain (Optional)

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the DNS configuration steps

### 3. Configure Firebase Authentication

Ensure your Firebase Authentication settings include your deployment URL:

1. Go to Firebase Console → Authentication → Settings
2. Add your deployment URL to "Authorized domains"

## Firestore Security Rules

Update your Firestore security rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bookings collection - users can only read/write their own bookings
    match /bookings/{bookingId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == resource.data.userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userRole == 'admin');
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && 
                       (request.auth.uid == resource.data.userId || 
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userRole == 'admin');
      allow delete: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userRole == 'admin';
    }
  }
}
```

## Continuous Deployment

### Option 1: GitHub Actions

Create `.github/workflows/firebase-hosting.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: eventcash-74a3a
```

### Option 2: Firebase CLI

Set up automatic deployment:
```bash
firebase init hosting:github
```

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Check for dynamic imports that need static paths
2. Ensure all environment variables are set
3. Verify API routes are compatible with static export

### Authentication Issues

If authentication doesn't work after deployment:

1. Check authorized domains in Firebase Console
2. Verify environment variables are correctly set
3. Check browser console for CORS errors

### Firestore Permission Errors

If you get permission denied errors:

1. Review Firestore security rules
2. Ensure user is authenticated
3. Check that userRole is correctly set in user documents

## Monitoring

### Firebase Console

Monitor your deployment:
- **Hosting**: View deployment history and traffic
- **Authentication**: Monitor user signups and logins
- **Firestore**: Check database usage and queries
- **Analytics**: Track user behavior

### Performance

Use Firebase Performance Monitoring:
```bash
npm install firebase
```

Add to your app:
```javascript
import { getPerformance } from 'firebase/performance';
const perf = getPerformance(app);
```

## Cost Considerations

### Free Tier (Spark Plan)
- Hosting: 10 GB storage, 360 MB/day transfer
- Firestore: 1 GB storage, 50K reads/day, 20K writes/day
- Authentication: Unlimited

### Paid Tier (Blaze Plan)
Required for:
- Cloud Functions
- Higher usage limits
- Custom domains with SSL

## Support

For issues:
1. Check Firebase Status: https://status.firebase.google.com/
2. Firebase Documentation: https://firebase.google.com/docs
3. Stack Overflow: Tag questions with `firebase` and `next.js`

## Quick Deploy Commands

```bash
# Build and deploy
npm run build && firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy to preview channel
firebase hosting:channel:deploy preview

# View deployment history
firebase hosting:sites:list
```
