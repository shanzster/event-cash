'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon - only on client side
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface MapSelectorProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number; address: string };
}

function LocationMarker({ position, onLocationChange }: any) {
  const map = useMapEvents({
    click(e) {
      onLocationChange(e.latlng);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position ? <Marker position={position} /> : null;
}

export default function MapSelector({ onLocationSelect, initialLocation }: MapSelectorProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null
  );
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<any>(null);

  const handleLocationChange = async (latlng: { lat: number; lng: number }) => {
    setPosition(latlng);
    
    // Reverse geocoding using Nominatim (OpenStreetMap)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = await response.json();
      const formattedAddress = data.display_name || `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
      setAddress(formattedAddress);
      onLocationSelect({ lat: latlng.lat, lng: latlng.lng, address: formattedAddress });
    } catch (error) {
      console.error('Error getting address:', error);
      const fallbackAddress = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
      setAddress(fallbackAddress);
      onLocationSelect({ lat: latlng.lat, lng: latlng.lng, address: fallbackAddress });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Geocoding using Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const newPosition = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        setPosition(newPosition);
        setAddress(result.display_name);
        onLocationSelect({ ...newPosition, address: result.display_name });
      } else {
        alert('Location not found. Please try a different search.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Error searching location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          handleLocationChange(newPos);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for an address..."
            className="w-full pl-10 pr-4 py-3 bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary text-gray-900 transition-all"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSearch}
          disabled={isSearching}
          className="px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGetCurrentLocation}
          className="px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2"
          title="Use my current location"
        >
          <Navigation size={20} />
        </motion.button>
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg" style={{ height: '400px' }}>
        <MapContainer
          center={position || { lat: 40.7128, lng: -74.0060 }}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} onLocationChange={handleLocationChange} />
        </MapContainer>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <MapPin size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">How to select location:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click anywhere on the map to place a marker</li>
              <li>• Search for an address using the search bar</li>
              <li>• Use the navigation button to get your current location</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Selected Address Display */}
      {address && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 mb-1">Selected Location</p>
              <p className="text-sm text-green-800">{address}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
