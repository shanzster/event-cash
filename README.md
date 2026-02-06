# Aldea's Catering Company - React Landing Page

A modern, responsive React-based landing page for a premium catering company featuring glassmorphism design with gold, white, and emerald green color scheme.

## Features

### 📄 Pages Included

1. **Home Page** (`/`)
   - Hero section with company tagline and CTA buttons
   - Statistics showcase (500+ events, 10K+ guests)
   - Value proposition cards
   - Call-to-action section

2. **About Us Page** (`/about`)
   - Company story and background
   - Mission, vision, and core values
   - Team highlights section

3. **Services Page** (`/services`)
   - Comprehensive service listings with icons
   - Service categories: Weddings, Corporate Events, Private Parties, Fine Dining, Special Occasions, Dietary Specializations
   - Why choose us section
   - Service details and features

4. **Contact Us Page** (`/contact`)
   - Contact form (name, email, phone, message)
   - Company contact information
   - Social media links
   - Office hours
   - Form validation and success feedback

5. **Location Page** (`/location`)
   - Embedded Google Map
   - Company address and contact details
   - Directions by car and public transit
   - Nearby attractions and parking information

6. **Login Page** (`/login`)
   - Email and password login form
   - Password visibility toggle
   - Remember me option
   - Forgot password link
   - Social login options

7. **Register Page** (`/register`)
   - User registration form with validation
   - Fields: Full Name, Email, Password, Confirm Password
   - Password strength requirements
   - Terms and conditions agreement
   - Success feedback with redirect
   - Social signup options

### 🎨 Design Features

- **Glassmorphism Design**: Modern frosted glass effect with backdrop blur
- **Color Palette**:
  - Primary: Gold (#D4AF37)
  - Secondary: Emerald Green (#27AE60)
  - Neutral: White and Black variants
- **Responsive Design**: Mobile-first approach with breakpoints for tablet and desktop
- **Smooth Transitions**: Hover effects and animations throughout
- **Consistent Components**: Reusable Navigation, Footer, and Hero components

### 🔧 Component Structure

```
/components/
  ├── Navigation.tsx    # Main navigation with mobile menu
  ├── Footer.tsx        # Footer with links and info
  └── Hero.tsx          # Hero section component

/app/
  ├── layout.tsx        # Root layout with metadata
  ├── globals.css       # Global styles and design tokens
  ├── page.tsx          # Home page
  ├── about/page.tsx    # About us page
  ├── services/page.tsx # Services page
  ├── contact/page.tsx  # Contact page
  ├── location/page.tsx # Location page
  ├── login/page.tsx    # Login page
  └── register/page.tsx # Register page
```

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Font**: Geist (via Google Fonts)
- **Form Handling**: React hooks (useState)
- **Responsive Design**: Mobile-first with Tailwind breakpoints

## Key Features

### 🎯 Glassmorphism Classes

Three custom glassmorphism utility classes available:

```tsx
// Standard glass effect
<div className="glass">...</div>

// Dark glass for contrast
<div className="glass-dark">...</div>

// Gold-tinted glass
<div className="glass-gold">...</div>

// Emerald-tinted glass
<div className="glass-emerald">...</div>
```

### 📱 Responsive Navigation

- Desktop: Full horizontal menu with logo
- Mobile: Hamburger menu with slide-out navigation
- Smooth transitions and animations
- Active page indication

### ✅ Form Validation

- **Contact Form**: Email and message required validation
- **Login Form**: Email and password validation
- **Register Form**: 
  - Full name required
  - Valid email format
  - Password minimum 8 characters
  - Password confirmation match
  - Terms agreement required

### 🔄 Smooth User Experience

- Form submission feedback with success messages
- Loading states on buttons
- Error display for invalid inputs
- Smooth page transitions
- Hover effects on interactive elements

## Getting Started

### Prerequisites

- Node.js 18+ or similar runtime
- npm or yarn package manager

### Installation

1. Clone the repository or download the code
2. Navigate to the project directory
3. Install dependencies (dependencies are auto-detected from imports)
4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Customization Guide

### Changing Colors

Edit the design tokens in `/app/globals.css`:

```css
:root {
  --primary: #D4AF37;      /* Gold */
  --secondary: #27AE60;    /* Emerald Green */
  --background: #f5f5f5;   /* Light background */
  --foreground: #1a1a1a;   /* Dark text */
}
```

### Updating Company Information

- **Company Name**: Update in Navigation.tsx and Footer.tsx
- **Contact Details**: Edit in Contact and Location pages
- **Social Links**: Update href attributes in Footer and Contact pages
- **Phone/Email**: Search for placeholder contact info and replace

### Modifying Services

Edit the `services` array in `/app/services/page.tsx` to add or remove service offerings.

### Updating Text Content

All text content can be modified directly in the respective page files. Search for specific text to locate and edit content.

## Deployment

### Deploy to Vercel

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Vercel will automatically build and deploy your site
4. Add environment variables if needed in Vercel settings

### Deploy to Other Platforms

The project is a standard Next.js app and can be deployed to:
- Netlify
- GitHub Pages
- Traditional web servers
- Docker containers

## Performance Optimizations

- Image optimization with Next.js
- CSS and JavaScript minification
- Lazy loading for below-the-fold content
- Responsive images with different breakpoints
- Font optimization via Google Fonts

## Accessibility Features

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliance
- Form labels properly associated with inputs
- Mobile-friendly touch targets

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

- Backend integration for form submissions
- User authentication system
- Event gallery/portfolio section
- Testimonials and reviews
- Blog section
- Email notification system
- Payment integration for bookings
- Admin dashboard

## License

This project is created for Aldea's Catering Company.

## Support

For issues or questions, please contact:
- Email: hello@aldea.com
- Phone: (555) 123-4567

## Credits

- Design Inspiration: Modern Glassmorphism Design Principles
- Icons: Lucide React
- Styling: Tailwind CSS
- Framework: Next.js
