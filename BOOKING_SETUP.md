# Customer Booking System Setup

## Overview
The customer booking system allows users to:
- Create bookings with package selection
- Input event details (date, time, guests, dietary restrictions)
- Select event location using an interactive map with pinpoint
- View all their bookings in a dashboard
- View detailed booking information

## Setup Instructions

### 1. Google Maps API Key

To enable the map functionality, you need a Google Maps API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API (optional, for better address search)
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. Firebase Setup

The booking data is stored in Firebase Firestore. Make sure:
- Firebase is initialized (already done in `lib/firebase.ts`)
- Firestore database is created in Firebase Console
- Security rules are configured (see below)

### 4. Firestore Security Rules

Add these rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Bookings collection
    match /bookings/{bookingId} {
      // Users can read their own bookings
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Users can create bookings
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      
      // Users can update their own bookings (for cancellations, etc.)
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Only admins can delete (you can add admin logic later)
      allow delete: if false;
    }
  }
}
```

## Features

### Customer Dashboard (`/dashboard`)
- View all bookings
- Quick access to create new booking
- See booking status (pending, confirmed, cancelled, completed)
- Click to view detailed booking information

### New Booking Flow (`/booking/new`)

**Step 1: Select Package**
- Choose from 3 packages:
  - Intimate Gathering ($1,500)
  - Grand Celebration ($3,500)
  - Luxury Experience ($7,500)

**Step 2: Event Details**
- Customer information (name, email, phone)
- Event type (wedding, corporate, birthday, etc.)
- Date and time
- Number of guests
- Dietary restrictions (optional)
- Special requests (optional)

**Step 3: Location Selection**
- Interactive Google Map
- Click on map to select location
- Search for address
- Get current location button
- Automatic address geocoding

### Booking Details (`/booking/[id]`)
- Complete booking information
- Event location map
- Contact information
- Booking status
- Option to contact for changes

## Mock Account for Testing

You can use Firebase Authentication to create test accounts:

**Option 1: Create via Register Page**
- Go to `/register`
- Fill in the form
- Account will be created in Firebase

**Option 2: Use Firebase Console**
- Go to Firebase Console > Authentication
- Add user manually
- Use those credentials to login

**Option 3: Use Google/Facebook OAuth**
- Click "Continue with Google" or "Continue with Facebook"
- (Requires OAuth setup in Firebase Console)

## Package Data

Packages are defined in `lib/packages.ts`. You can modify:
- Package names
- Prices
- Features
- Images
- Event types

## Database Structure

### Bookings Collection
```typescript
{
  id: string (auto-generated)
  userId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  eventType: string
  packageId: string
  packageName: string
  eventDate: Timestamp
  eventTime: string
  guestCount: number
  location: {
    lat: number
    lng: number
    address: string
  }
  specialRequests?: string
  dietaryRestrictions?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  totalPrice: number
  createdAt: Timestamp
}
```

## Navigation Updates

The navigation bar now shows:
- **When logged out**: Login | Register
- **When logged in**: Dashboard | Logout

## Next Steps

1. Set up Google Maps API key
2. Test the booking flow
3. Customize packages and pricing
4. Add admin panel (future feature)
5. Add payment integration (future feature)
6. Add email notifications (future feature)

## Troubleshooting

**Map not loading:**
- Check if `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
- Verify API key has correct permissions
- Check browser console for errors

**Booking not saving:**
- Check Firebase Firestore rules
- Verify user is authenticated
- Check browser console for errors

**Location not detected:**
- Enable location services in browser
- Check HTTPS (geolocation requires secure context)
