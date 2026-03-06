import React, { useState, useCallback, useRef } from 'react';
import {
    APIProvider,
    Map,
    AdvancedMarker,
    Pin,
    InfoWindow,
    useMap,
    useMapsLibrary,
} from '@vis.gl/react-google-maps';

// ─── Custom minimalist pastel map style ──────────────────────────────────────
// Soft beige roads, desaturated water, muted parks — matches the reference image
const MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#f5f5f0' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#7a7a7a' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f0' }] },

    { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },

    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5eee3', visibility: 'on' }] },
    { featureType: 'poi.park', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },

    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
    { featureType: 'road.arterial', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ede8df' }] },
    { featureType: 'road.highway', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'road.local', stylers: [{ visibility: 'simplified' }] },

    { featureType: 'transit', stylers: [{ visibility: 'off' }] },

    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e4f0' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#a0bec9' }] },
];

function getCategoryColor(category?: string) {
    switch (category) {
        case 'Bakery': return '#F97316';
        case 'Groceries': return '#16A34A';
        case 'Vegan': return '#0D9488';
        case 'Sushi': return '#2563EB';
        case 'Pizza': return '#DB2777';
        default: return '#1A4D2E';
    }
}

interface Bag {
    id: string;
    restaurantName: string;
    price: number;
    originalPrice?: number;
    category?: string;
    image?: string;
    distance?: string;
    available?: number;
    coordinates?: { lat: number; lng: number };
}

interface Props {
    bags: Bag[];
    userLocation: { lat: number; lng: number };
    onBagSelect: (bag: Bag | null) => void;
    selectedBag: Bag | null;
    apiKey: string;
    mapId?: string;
}

// ── Inner map content (needs to be inside APIProvider) ────────────────────────
function MapContent({ bags, userLocation, onBagSelect, selectedBag, mapId }: Omit<Props, 'apiKey'>) {
    const map = useMap();

    // Pan to userLocation when it changes (Set Location)
    React.useEffect(() => {
        if (map) map.panTo(userLocation);
    }, [map, userLocation]);

    return (
        <Map
            defaultCenter={userLocation}
            defaultZoom={14}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
            zoomControl={true}
            styles={!mapId ? MAP_STYLE : undefined}
            mapId={mapId || undefined}
            className="w-full h-full"
        >
            {/* User location dot */}
            <AdvancedMarker position={userLocation}>
                <div style={{
                    width: 20, height: 20,
                    background: '#1A4D2E',
                    border: '3px solid white',
                    borderRadius: '50%',
                    boxShadow: '0 0 0 6px rgba(26,77,46,0.2)',
                }} />
            </AdvancedMarker>

            {/* Bag markers */}
            {bags.map((bag, i) => {
                const fallbackLat = userLocation.lat + (Math.sin(i * 1.9 + 0.5) * 0.012);
                const fallbackLng = userLocation.lng + (Math.cos(i * 2.5 + 1.0) * 0.012);
                const pos = bag.coordinates
                    ? { lat: bag.coordinates.lat, lng: bag.coordinates.lng }
                    : { lat: fallbackLat, lng: fallbackLng };

                const color = getCategoryColor(bag.category);
                const isSelected = selectedBag?.id === bag.id;

                return (
                    <AdvancedMarker
                        key={bag.id}
                        position={pos}
                        onClick={() => onBagSelect(bag)}
                        zIndex={isSelected ? 10 : 1}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                            <div style={{
                                width: isSelected ? 44 : 36,
                                height: isSelected ? 44 : 36,
                                background: color,
                                border: `3px solid white`,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: isSelected ? 18 : 15,
                                boxShadow: isSelected
                                    ? `0 6px 20px ${color}66`
                                    : '0 3px 10px rgba(0,0,0,0.25)',
                                transition: 'all 0.2s',
                            }}>🛍</div>
                            <div style={{
                                background: 'white',
                                color: '#1A4D2E',
                                fontSize: 10,
                                fontWeight: 900,
                                padding: '2px 8px',
                                borderRadius: 20,
                                marginTop: 3,
                                border: `1.5px solid ${color}44`,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                whiteSpace: 'nowrap',
                            }}>{bag.price.toFixed(0)} TL</div>
                        </div>
                    </AdvancedMarker>
                );
            })}
        </Map>
    );
}

// ── Places Autocomplete hook (only when Places library is loaded) ─────────────
export function usePlacesAutocomplete(query: string, map: google.maps.Map | null) {
    const placesLib = useMapsLibrary('places');
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const svcRef = useRef<google.maps.places.AutocompleteService | null>(null);

    React.useEffect(() => {
        if (!placesLib || !query.trim()) { setSuggestions([]); return; }
        if (!svcRef.current) svcRef.current = new placesLib.AutocompleteService();
        svcRef.current.getPlacePredictions(
            { input: query, language: 'tr' },
            (preds, status) => {
                if (status === 'OK' && preds) setSuggestions(preds);
                else setSuggestions([]);
            }
        );
    }, [placesLib, query]);

    return suggestions;
}

// ── Main exported component ───────────────────────────────────────────────────
export default function GoogleMapsView({ bags, userLocation, onBagSelect, selectedBag, apiKey, mapId }: Props) {
    if (!apiKey) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#f5f5f0] gap-6 p-8">
                <div className="text-6xl">🗺️</div>
                <div className="text-center max-w-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Google Maps API Key Gerekli</h3>
                    <p className="text-gray-500 text-sm mb-4">
                        Haritayı aktif etmek için projenizin kök dizinindeki <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">.env.local</code> dosyasına Google Maps API anahtarınızı ekleyin.
                    </p>
                    <div className="bg-gray-900 rounded-xl p-4 text-left">
                        <code className="text-green-400 text-xs font-mono">
                            VITE_GOOGLE_MAPS_API_KEY=<span className="text-yellow-400">AIzaSy...</span>
                        </code>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">
                            Google Cloud Console →
                        </a>
                        {' '}Maps JavaScript API + Places API etkinleştirin, sonra dev sunucusunu yeniden başlatın.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <APIProvider apiKey={apiKey}>
            <MapContent
                bags={bags}
                userLocation={userLocation}
                onBagSelect={onBagSelect}
                selectedBag={selectedBag}
                mapId={mapId}
            />
        </APIProvider>
    );
}
