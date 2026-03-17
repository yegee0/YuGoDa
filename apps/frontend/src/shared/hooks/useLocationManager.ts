import { useState, useEffect, useRef } from 'react';

interface Coords {
  lat: number;
  lng: number;
}

export function useLocationManager() {
  const [userLocation, setUserLocation] = useState<Coords>({ lat: 47.6062, lng: -122.3321 });
  const [locationName, setLocationName] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showSetLocation, setShowSetLocation] = useState(false);

  // Map search state
  const [mapSearch, setMapSearch] = useState('');
  const [mapSuggestions, setMapSuggestions] = useState<any[]>([]);
  const [showMapSuggestions, setShowMapSuggestions] = useState(false);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const mapSearchRef = useRef<HTMLDivElement>(null);
  const mapSearchTimer = useRef<any>(null);

  // Auto-detect location on mount
  useEffect(() => {
    const saved = localStorage.getItem('yugoda_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserLocation(parsed.coords);
        setLocationName(parsed.name || '');
        return;
      } catch { }
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => { }
      );
    }
  }, []);

  // Detect location with reverse geocoding
  const detectLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setUserLocation({ lat, lng });
        // Reverse geocode with Nominatim (free, no API key)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const name = data.address?.city || data.address?.town || data.address?.village || data.display_name?.split(',')[0] || 'Current Location';
          setLocationName(name);
          localStorage.setItem('yugoda_location', JSON.stringify({ coords: { lat, lng }, name }));
        } catch {
          setLocationName('Current Location');
        }
        setLocationLoading(false);
        setShowSetLocation(false);
      },
      () => setLocationLoading(false)
    );
  };

  // Debounced map search: query Nominatim + local bags
  const searchMap = (query: string, bags: any[]) => {
    setMapSearch(query);

    if (!query.trim()) {
      setMapSuggestions([]);
      setShowMapSuggestions(false);
      return;
    }

    clearTimeout(mapSearchTimer.current);
    mapSearchTimer.current = setTimeout(async () => {
      setMapSearchLoading(true);
      const q = query.toLowerCase();
      const results: any[] = [];

      // Local restaurant matches
      bags.forEach(bag => {
        if (bag.restaurantName.toLowerCase().includes(q) || (bag.category || '').toLowerCase().includes(q)) {
          results.push({ type: 'restaurant', label: bag.restaurantName, sublabel: `${bag.category} • ${bag.distance || ''}`, coords: bag.coordinates, bag });
        }
      });

      // Nominatim geocoding (Places API equivalent, free)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'tr,en' } }
        );
        const data = await res.json();
        data.forEach((item: any) => {
          const name = item.display_name?.split(',').slice(0, 2).join(', ') || item.display_name;
          results.push({
            type: 'place',
            label: name,
            sublabel: item.type || 'Location',
            coords: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
          });
        });
      } catch { }

      setMapSuggestions(results.slice(0, 8));
      setShowMapSuggestions(results.length > 0);
      setMapSearchLoading(false);
    }, 350);
  };

  // Close map suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mapSearchRef.current && !mapSearchRef.current.contains(e.target as Node)) setShowMapSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return {
    userLocation,
    setUserLocation,
    locationName,
    setLocationName,
    locationLoading,
    showSetLocation,
    setShowSetLocation,
    detectLocation,
    // Map search
    mapSearch,
    setMapSearch: searchMap,
    mapSuggestions,
    showMapSuggestions,
    setShowMapSuggestions,
    mapSearchLoading,
    mapSearchRef,
  };
}
