# Location Configuration Guide

## Overview
The location displayed on your website's Location page is fully configurable through the CMS. This allows you to easily update your business location if you move or open new offices.

## How to Configure Location

### Step 1: Access the CMS
1. Log in as Owner/Manager
2. Navigate to **Owner Dashboard** → **CMS**
3. Click on the **Contact Information** tab

### Step 2: Update Address Information
In the "Business Address" section, you can update:
- **Street Address**: Your physical street address
- **City**: City name
- **State/Province**: State or province code
- **ZIP/Postal Code**: Postal code
- **Country**: Country name

These fields will be displayed on the Location page and used throughout the website.

### Step 3: Configure Google Maps Embed

#### Getting the Google Maps Embed URL:
1. Go to [Google Maps](https://www.google.com/maps)
2. Search for your business location
3. Click the **"Share"** button
4. Click **"Embed a map"** tab
5. Copy the URL from the `src` attribute of the iframe code
   - Example: `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024...`

#### Adding the URL to CMS:
1. In the CMS Contact Information tab, scroll to **"Map Location"** section
2. Paste the Google Maps embed URL into the **"Google Maps Embed URL"** field
3. Click **"Save Changes"**

### Step 4: Update Contact Details
Also update in the Contact Information tab:
- **Phone Number**: Your business phone
- **Email Address**: Your business email
- **Business Hours**: 
  - Monday - Friday hours
  - Saturday - Sunday hours

### Step 5: Update Social Media Links
In the "Social Media Links" section:
- Facebook URL
- Instagram URL
- Twitter URL

## What Gets Updated

When you save changes in the CMS, the following pages are automatically updated:
- **Location Page** (`/location`): Shows the map, address, and contact information
- **Contact Page** (`/contact`): Displays contact details
- **Footer**: Shows address and contact information across all pages

## Example Configuration

```
Street Address: 123 Culinary Lane
City: Gourmet City
State: FC
ZIP: 12345
Country: United States

Phone: (555) 123-4567
Email: info@eventcash.com

Hours:
- Weekdays: 9:00 AM - 6:00 PM
- Weekends: 10:00 AM - 4:00 PM

Map URL: https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290355!2d-74.00601!3d40.71282...
```

## Tips

1. **Test the Map**: After saving, visit the Location page to ensure the map displays correctly
2. **Keep Information Current**: Update immediately if you move locations
3. **Consistent Formatting**: Use consistent phone number and address formatting
4. **Verify Hours**: Double-check business hours are accurate for customer expectations

## Troubleshooting

### Map Not Displaying
- Ensure you copied the complete embed URL from Google Maps
- The URL should start with `https://www.google.com/maps/embed?pb=`
- Check that you clicked "Embed a map" (not "Share link")

### Address Not Updating
- Make sure you clicked "Save Changes" after editing
- Refresh the Location page (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache if needed

### Contact Information Not Showing
- Verify all required fields are filled in
- Check that the data was saved successfully (you should see a success message)

## Database Structure

The location data is stored in Firebase Firestore:
- **Collection**: `settings`
- **Document**: `contact`
- **Fields**:
  - `phone`: string
  - `email`: string
  - `address`: object (street, city, state, zip, country)
  - `hours`: object (weekdays, weekends)
  - `social`: object (facebook, instagram, twitter)
  - `mapUrl`: string (Google Maps embed URL)

## Future Enhancements

Potential improvements for the location system:
- Multiple location support (for businesses with multiple offices)
- Custom map markers and styling
- Directions integration
- Location-specific hours (different hours per location)
- Geolocation-based nearest location finder
