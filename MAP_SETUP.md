# Map Integration - OpenStreetMap with Leaflet

## ✅ Switched from Google Maps to OpenStreetMap

### Why OpenStreetMap?
- **100% Free** - No API keys required
- **No billing** - Unlimited usage
- **Open source** - Community-driven
- **No setup** - Works out of the box

### What Changed?
- Removed `@react-google-maps/api` dependency
- Added `leaflet` and `react-leaflet` packages
- Updated `MapSelector.tsx` component
- Updated booking details page map display

## 🗺️ Features

### MapSelector Component
- **Click to select** - Click anywhere on the map to place a marker
- **Search addresses** - Search bar with Nominatim geocoding
- **Current location** - Get user's current location with GPS
- **Reverse geocoding** - Automatically gets address from coordinates
- **Visual feedback** - Green confirmation card when location selected

### Booking Details Page
- **Static map display** - Shows event location
- **Marker** - Pin at exact location
- **Zoom controls** - Users can zoom in/out
- **Pan** - Users can drag to explore area

## 🔧 Technical Details

### Libraries Used
- `leaflet` - Core mapping library
- `react-leaflet` - React wrapper for Leaflet
- `@types/leaflet` - TypeScript definitions

### Map Tiles
- Provider: OpenStreetMap
- URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Attribution: OpenStreetMap contributors

### Geocoding Service
- Provider: Nominatim (OpenStreetMap)
- Geocoding: `https://nominatim.openstreetmap.org/search`
- Reverse Geocoding: `https://nominatim.openstreetmap.org/reverse`
- Rate Limit: 1 request per second (fair use)

## 📝 Usage

### In Booking Flow (Step 3)
```tsx
<MapSelector 
  onLocationSelect={(location) => {
    // location = { lat, lng, address }
  }}
  initialLocation={formData.location}
/>
```

### In Booking Details Page
```tsx
<MapContainer
  center={[lat, lng]}
  zoom={15}
  style={{ height: '300px', width: '100%' }}
>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  <Marker position={[lat, lng]} />
</MapContainer>
```

## 🎨 Styling

Custom styles added to `app/globals.css`:
- Consistent font family
- Rounded popup corners
- Smaller attribution text
- Proper z-index handling

## 🚀 No Setup Required!

Just run:
```bash
npm run dev
```

The maps will work immediately with no configuration needed!

## 🌍 Alternative Tile Providers (Optional)

If you want different map styles, you can change the TileLayer URL:

### CartoDB Positron (Light theme)
```tsx
<TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
```

### CartoDB Dark Matter (Dark theme)
```tsx
<TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
```

### Stamen Terrain (Topographic)
```tsx
<TileLayer url="https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg" />
```

All of these are also free!

## ⚠️ Important Notes

### Nominatim Usage Policy
- Maximum 1 request per second
- Include a valid User-Agent or Referer header
- For high-volume applications, consider self-hosting Nominatim

### Production Considerations
- Current implementation is perfect for small to medium applications
- For high-traffic sites, consider:
  - Caching geocoding results
  - Self-hosting Nominatim
  - Using a commercial geocoding service

## 🎯 Benefits Over Google Maps

✅ No API key setup
✅ No billing concerns
✅ No usage limits
✅ Open source
✅ Privacy-friendly
✅ Works offline (with cached tiles)
✅ Customizable tile providers
✅ Active community support

## 📚 Resources

- [Leaflet Documentation](https://leafletjs.com/)
- [React Leaflet Documentation](https://react-leaflet.js.org/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Nominatim API](https://nominatim.org/release-docs/latest/api/Overview/)
