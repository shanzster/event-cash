# EventCash Catering - Content Management System Analysis

## Overview
This document outlines all content across the public-facing website that should be manageable through a CMS interface. The goal is to allow owners to edit text, images, and other content without touching code.

---

## 1. HOME PAGE (`/`)

### Hero Section (Component: `Hero.tsx`)
- **Main Title**: "EventCash" (animated gradient text)
- **Subtitle**: "Elevate your events with exquisite catering from EventCash Catering. Premium culinary excellence for every occasion."
- **Background Image**: Currently Unsplash image
- **CTA Buttons**: "Book Now" and "Explore Services" (text + links)

### Stats Section (Component: `StatsSection.tsx`)
- **Section Title**: "Our Track Record"
- **Section Subtitle**: "Numbers that speak to our commitment to excellence"
- **4 Stat Cards**:
  1. Events Catered: "500+" (with TrendingUp icon)
  2. Happy Guests: "10,000+" (with Users icon)
  3. Awards Won: "25+" (with Award icon)
  4. Client Satisfaction: "98%" (with Heart icon)
- **Background Image**: Currently Unsplash image

### Packages Section (Component: `PackagesSection.tsx`)
- **Section Title**: "Our Packages"
- **Section Subtitle**: "Choose the perfect catering package for your special occasion"
- **Package Cards**: Dynamically loaded from Firestore `packages` collection
  - Each package has: name, price, description, features[], gallery[] (unlimited images), icon, gradient
  - ✅ FULLY MANAGED via `/owner/packages` page
  - ✅ **IMAGE CAROUSEL**: Supports unlimited images per package with swipeable carousel
  - Backward compatible with old `imageUrl` field

### Event Types Section (Component: `EventTypesSection.tsx`)
- **Section Title**: "Events We Cater"
- **Section Subtitle**: "From intimate gatherings to grand celebrations, we bring culinary excellence to every occasion"
- **6 Event Type Cards** (STATIC - needs CMS):
  1. **Weddings**
     - Description
     - Full description
     - 6 features
     - 4 gallery images
  2. **Corporate Events**
     - Description
     - Full description
     - 6 features
     - 4 gallery images
  3. **Birthday Parties**
     - Description
     - Full description
     - 6 features
     - 4 gallery images
  4. **Graduations**
     - Description
     - Full description
     - 6 features
     - 4 gallery images
  5. **Baby Showers**
     - Description
     - Full description
     - 6 features
     - 4 gallery images
  6. **Special Occasions**
     - Description
     - Full description
     - 6 features
     - 4 gallery images

### Process Section (Component: `ProcessSection.tsx`)
- **Section Title**: "How It Works"
- **Section Subtitle**: "Our simple 4-step process ensures your event is perfectly catered"
- **4 Process Steps** (STATIC - needs CMS):
  1. Consultation - description
  2. Menu Planning - description
  3. Preparation - description
  4. Flawless Execution - description

### Why Choose Us Section (In `page.tsx`)
- **Section Title**: "Why Choose EventCash?" ✅ EDITABLE
- **3 Feature Cards**:
  1. **Excellence & Quality** ✅ EDITABLE
     - Title
     - Description
  2. **Professional Team** ✅ EDITABLE
     - Title
     - Description
  3. **Personalized Touch** ✅ EDITABLE
     - Title
     - Description

### Testimonials Section (Component: `TestimonialsSection.tsx`)
- **Section Title**: "What Our Clients Say"
- **Section Subtitle**: "Don't just take our word for it - hear from our satisfied clients"
- **3 Testimonial Cards** (STATIC - needs CMS):
  1. Sarah Johnson - Wedding Client
  2. Michael Chen - Corporate Event Manager
  3. Emily Rodriguez - Birthday Celebration
  - Each has: name, role, image, rating, testimonial text

### CTA Section (In `page.tsx`)
- **Title**: "Ready to Plan Your Event?" ✅ EDITABLE
- **Description**: "Let's create a memorable culinary experience for your special occasion." ✅ EDITABLE
- **Button Text**: "Get in Touch"

---

## 2. ABOUT PAGE (`/about`)

### Hero Section
- **Badge**: "Est. 2009"
- **Main Title**: "About EventCash Catering"
- **Subtitle**: "15 years of culinary excellence, dedicated to making every event unforgettable"
- **Background Image**: Currently Unsplash image

### Featured Story Section
- **Main Image**: Catering team photo
- **Image Caption**: "The EventCash team preparing for a grand celebration"
- **Title**: "15 Years of Culinary Excellence"
- **Subtitle**: "From humble beginnings to becoming the city's premier catering service"
- **2 Paragraphs** of company history

### Three Column Layout
- **Column 1: The Beginning**
  - Title
  - 2 paragraphs
  - Image with caption
- **Column 2: Our Philosophy**
  - Title
  - Paragraphs
  - Quote box with quote and attribution
- **Column 3: Today & Tomorrow**
  - Title
  - 2 paragraphs
  - "By The Numbers" stats box (4 stats)

### Mission, Vision, Values Section
- **Section Title**: "Our Guiding Principles"
- **3 Cards**:
  1. **Mission** - full text
  2. **Vision** - full text
  3. **Values** - 5 bullet points

### Team Section
- **Section Title**: "Meet The Team"
- **Team Image** with caption
- **Description paragraphs**
- **3 Role Cards**:
  - Executive Chef
  - Event Manager
  - Service Director

### Why Choose Us Section
- **Section Title**: "Why Choose EventCash Catering?"
- **6 Feature Cards**:
  1. Premium Cuisine
  2. Flawless Execution
  3. Proven Track Record
  4. Expert Team
  5. Industry Recognition
  6. Personal Touch

### CTA Section
- **Title**: "Ready to Elevate Your Event?"
- **Description**
- **Button**: "Get Started Today"

### Developers Section
- **Badge**: "The Tech Behind"
- **Title**: "Makers of Event Cash"
- **Subtitle**
- **4 Developer Profiles**:
  1. Kynna - Full Stack Developer
  2. Rose Ann - Frontend Developer & UX Designer
  3. Glynnes - Backend Developer
  4. Carlo - DevOps & QA Engineer
  - Each has: name, role, description, image
- **Closing paragraph**: "Passion for Innovation"

---

## 3. SERVICES PAGE (`/services`)

### Hero Section
- **Main Title**: "Our Services"
- **Subtitle**: "Comprehensive catering solutions tailored to your event's unique needs and vision"
- **Background Image**: Currently Unsplash image

### Services Grid
- **6 Service Cards** (STATIC - needs CMS):
  1. **Wedding Catering**
     - Description
     - 3 features
     - Icon + gradient
  2. **Corporate Events**
     - Description
     - 3 features
     - Icon + gradient
  3. **Private Parties**
     - Description
     - 3 features
     - Icon + gradient
  4. **Fine Dining Events**
     - Description
     - 3 features
     - Icon + gradient
  5. **Special Occasions**
     - Description
     - 3 features
     - Icon + gradient
  6. **Dietary Specializations**
     - Description
     - 3 features
     - Icon + gradient

### Why Stand Out Section
- **Section Title**: "Why Our Services Stand Out"
- **3 Feature Cards**:
  1. Flexible Scheduling
  2. Fresh Ingredients
  3. Any Location

### CTA Section
- **Title**: "Ready to Book Your Event?"
- **Description**: "Contact us today to discuss your catering needs and get a personalized quote."
- **Button**: "Request a Consultation"

---

## 4. CONTACT PAGE (`/contact`)

### Hero Section
- **Main Title**: "Get in Touch"
- **Subtitle**: "Have questions about our catering services? We'd love to hear from you."
- **Background Image**: Currently Unsplash image

### Contact Information
- **Phone**: (555) 123-4567
- **Email**: info@eventcash.com
- **Address**:
  - 123 Culinary Lane
  - Gourmet City, FC 12345
  - United States
- **Social Media Links**: Facebook, Instagram, Twitter

### Office Hours
- **Section Title**: "Office Hours"
- **Monday - Friday**: 9:00 AM - 6:00 PM
- **Saturday - Sunday**: 10:00 AM - 4:00 PM

---

## 5. LOCATION PAGE (`/location`)

### Hero Section
- **Main Title**: "Visit Us"
- **Subtitle**: "Located in the heart of Gourmet City, easily accessible and ready to serve you"
- **Background Image**: Currently Unsplash image

### Location Information
- **Section Title**: "Our Location"
- **Address** (same as contact page)
- **Phone** (same as contact page)
- **Email** (same as contact page)
- **Hours** (same as contact page)
- **Google Maps Embed**: Currently hardcoded iframe

### Directions Section
- **Section Title**: "Directions & Parking"
- **By Car**:
  - Description
  - "Get Directions" button
- **By Public Transit**:
  - Description
  - "Transit Info" button

### Why Choose Our Location
- **Section Title**: "Why Choose Our Location"
- **3 Feature Cards**:
  1. Central Location
  2. Ample Parking
  3. Modern Facilities

---

## 6. FOOTER (Component: `Footer.tsx`)

### Company Info
- **Company Name**: "EventCash Catering"
- **Tagline**: "Crafting unforgettable culinary experiences for your most special occasions."
- **Phone**: (555) 123-4567
- **Email**: info@eventcash.com

### Quick Links
- About Us
- Services
- Contact Us
- Location

### Services List
- Corporate Events
- Weddings
- Private Parties
- Conferences

### Social Links
- Facebook
- Instagram
- Twitter

### Bottom Bar
- Copyright text
- Privacy Policy link
- Terms of Service link

---

## CONTENT MANAGEMENT PRIORITIES

### ✅ ALREADY IMPLEMENTED (Live Editing on Homepage)
1. Home - Why Choose Us section title
2. Home - Feature 1 (Excellence & Quality) title + description
3. Home - Feature 2 (Professional Team) title + description
4. Home - Feature 3 (Personalized Touch) title + description
5. Home - CTA section title + description

### ✅ ALREADY IMPLEMENTED (Package Management)
- Packages section (fully managed via `/owner/packages`)
  - ✅ Supports unlimited images per package with carousel
  - ✅ Swipeable image gallery in modal view
  - ✅ Shows image count badge on cards
  - ✅ Cloudinary integration for image uploads
  - ✅ Backward compatible with old single-image packages

### 🔴 HIGH PRIORITY (Most Visible Content)
1. **Hero Section** - Main title, subtitle, background image
2. **Stats Section** - All 4 stats (numbers + labels), background image
3. **Event Types Section** - All 6 event types with descriptions, features, and gallery images
4. **Testimonials Section** - All 3 testimonials with names, roles, images, and text
5. **Process Section** - All 4 steps with titles and descriptions

### 🟡 MEDIUM PRIORITY (Important but Less Frequently Changed)
6. **About Page** - Company history, mission, vision, values
7. **Services Page** - All 6 service cards with descriptions and features
8. **Contact Information** - Phone, email, address, hours (used across multiple pages)
9. **Footer Content** - Company tagline, service list, social links

### 🟢 LOW PRIORITY (Rarely Changed)
10. **Developer Profiles** - Team member information on About page
11. **Location Page** - Directions and parking information
12. **Social Media Links** - URLs for Facebook, Instagram, Twitter

---

## RECOMMENDED CMS STRUCTURE

### Firestore Collections

```
cms/
├── content/
│   ├── home/
│   │   ├── hero/
│   │   │   ├── title
│   │   │   ├── subtitle
│   │   │   └── backgroundImage
│   │   ├── stats/
│   │   │   ├── title
│   │   │   ├── subtitle
│   │   │   ├── backgroundImage
│   │   │   └── stats[] (array of 4 stat objects)
│   │   ├── whyus/ ✅ DONE
│   │   │   ├── title
│   │   │   ├── feature1/
│   │   │   ├── feature2/
│   │   │   └── feature3/
│   │   └── cta/ ✅ DONE
│   │       ├── title
│   │       └── description
│   ├── about/
│   │   ├── hero/
│   │   ├── story/
│   │   ├── mission/
│   │   ├── vision/
│   │   └── values/
│   ├── services/
│   │   └── services[] (array of service objects)
│   ├── contact/
│   │   ├── phone
│   │   ├── email
│   │   ├── address/
│   │   ├── hours/
│   │   └── social/
│   └── footer/
│       ├── tagline
│       ├── services[]
│       └── social/

eventTypes/
└── (collection of event type documents)
    ├── id
    ├── name
    ├── description
    ├── fullDescription
    ├── features[]
    ├── gallery[]
    ├── icon
    └── gradient

testimonials/
└── (collection of testimonial documents)
    ├── id
    ├── name
    ├── role
    ├── image
    ├── rating
    └── text

processSteps/
└── (collection of process step documents)
    ├── id
    ├── number
    ├── title
    ├── description
    ├── icon
    └── gradient
```

---

## IMPLEMENTATION RECOMMENDATIONS

### Phase 1: Core Content (Week 1)
1. Extend live editing to Hero section
2. Add Stats section management
3. Create Event Types management page
4. Create Testimonials management page

### Phase 2: Secondary Content (Week 2)
5. Create Process Steps management
6. Add About page content management
7. Add Services page content management

### Phase 3: Global Content (Week 3)
8. Create Contact Info management (shared across pages)
9. Add Footer content management
10. Add image upload for all sections

### Phase 4: Advanced Features (Week 4)
11. Add image gallery management for Event Types
12. Add bulk import/export functionality
13. Add content versioning/history
14. Add preview mode before publishing

---

## IMAGE MANAGEMENT NEEDS

### Images That Need Upload Capability
1. **Hero backgrounds** (Home, About, Services, Contact, Location pages)
2. **Stats section background**
3. **Package images** ✅ DONE
   - ✅ Cloudinary integration exists
   - ✅ Unlimited images per package with carousel
   - ✅ Swipeable gallery in modal view
4. **Event Type gallery images** (4 images per event type = 24 images)
5. **Testimonial profile photos** (3 images)
6. **About page photos** (team photos, facility photos)
7. **Developer profile photos** (4 images)

### Recommended: Cloudinary Integration
- ✅ Already configured for packages
- Extend to all image uploads
- Use upload presets for different image types
- Implement image optimization and responsive images

---

## NOTES

- All static content should be moved to Firestore
- Implement Cloudinary for all image uploads
- Create a unified CMS dashboard at `/owner/cms`
- Add live preview functionality
- Consider adding content scheduling (publish date/time)
- Add SEO meta tags management for each page
