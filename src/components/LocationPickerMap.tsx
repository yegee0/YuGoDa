import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, CheckCircle2, LocateFixed } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Stadia Alidade Smooth — pastel, minimal
const TILE_URL = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';
const TILE_ATTR =
    '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> ' +
    '&copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> ' +
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const ISTANBUL = { lat: 41.0082, lng: 28.9784 };

interface Props {
    initialLocation?: { lat: number; lng: number };
    initialName?: string;
    onConfirm: (coords: { lat: number; lng: number }, name: string) => void;
    onClose: () => void;
}

export default function LocationPickerMap({ initialLocation, initialName, onConfirm, onClose }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [address, setAddress] = useState(initialName || '');
    const [geocoding, setGeocoding] = useState(false);
    const [pendingCoords, setPendingCoords] = useState(initialLocation || ISTANBUL);
    const geocodeTimer = useRef<any>(null);

    // Reverse-geocode with Nominatim
    const reverseGeocode = useCallback(async (lat: number, lng: number) => {
        setGeocoding(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { 'Accept-Language': 'tr,en' } }
            );
            const data = await res.json();
            const name =
                data.address?.neighbourhood ||
                data.address?.suburb ||
                data.address?.quarter ||
                data.address?.district ||
                data.address?.city ||
                data.address?.town ||
                data.display_name?.split(',')[0] ||
                `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setAddress(name);
        } catch {
            setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
            setGeocoding(false);
        }
    }, []);

    // Init Leaflet map
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const start = initialLocation || ISTANBUL;
        const map = L.map(containerRef.current, {
            center: [start.lat, start.lng],
            zoom: 15,
            zoomControl: false,
            attributionControl: false,
        });

        L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 20 }).addTo(map);
        L.control.zoom({ position: 'bottomleft' }).addTo(map);

        // Events
        map.on('movestart', () => setIsDragging(true));
        map.on('moveend', () => {
            setIsDragging(false);
            const center = map.getCenter();
            const coords = { lat: center.lat, lng: center.lng };
            setPendingCoords(coords);
            clearTimeout(geocodeTimer.current);
            geocodeTimer.current = setTimeout(() => reverseGeocode(coords.lat, coords.lng), 400);
        });

        mapRef.current = map;

        // Initial geocode
        if (!initialName) reverseGeocode(start.lat, start.lng);

        return () => {
            clearTimeout(geocodeTimer.current);
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync map when initialLocation changes from search bar in parent
    useEffect(() => {
        if (mapRef.current && initialLocation) {
            mapRef.current.flyTo([initialLocation.lat, initialLocation.lng], 15, { duration: 1 });
            if (initialName) setAddress(initialName);
        }
    }, [initialLocation, initialName]);

    // Fly to user's GPS location
    const flyToMyLocation = () => {
        if (!navigator.geolocation || !mapRef.current) return;
        navigator.geolocation.getCurrentPosition(pos => {
            mapRef.current!.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1 });
        });
    };

    const handleConfirm = () => {
        onConfirm(pendingCoords, address);
    };

    return (
        <div className="relative h-full w-full flex flex-col bg-[#f5f5f0] dark:bg-[#0a0a0a] overflow-hidden rounded-none lg:rounded-3xl lg:m-4 lg:h-[calc(100%-32px)] lg:w-[calc(100%-32px)] lg:shadow-2xl lg:border lg:border-gray-200 dark:border-gray-800 lg:overflow-hidden">
            {/* Minimalist modern back button */}
            <button
                onClick={onClose}
                className="absolute top-6 left-6 z-[1000] p-3 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-md hover:bg-white dark:hover:bg-[#222] rounded-full shadow-lg transition-all"
            >
                <svg className="w-5 h-5 text-gray-800 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {/* Map container */}
            <div ref={containerRef} className="flex-1 w-full" />

            {/* Fixed center pin — minimalist */}
            <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]"
                style={{ bottom: 40 }}
            >
                <div className={`flex flex-col items-center transition-transform duration-200 ${isDragging ? '-translate-y-4' : 'translate-y-0'}`}>
                    {/* Drop shadow dot on ground */}
                    <div className={`w-3 h-1.5 bg-black/20 rounded-full mt-1 transition-all duration-200 ${isDragging ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}`} style={{ marginTop: 2 }} />
                    {/* Pin body */}
                    <div className="relative -mb-1">
                        <div className="w-10 h-10 bg-[#1A4D2E] rounded-full border-3 border-white flex items-center justify-center shadow-2xl"
                            style={{ border: '3px solid white' }}>
                            <MapPin className="w-5 h-5 text-white fill-white" />
                        </div>
                        {/* Pin tail */}
                        <div className="w-2 h-3 bg-[#1A4D2E] mx-auto"
                            style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)', marginTop: -1 }} />
                    </div>
                </div>
            </div>

            {/* Minimalist Bottom Control Area */}
            <div className="absolute bottom-6 left-4 right-4 z-[1000] flex items-end gap-3 pointer-events-none lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-md">

                {/* Address & Confirm Card */}
                <div className="flex-1 bg-white/95 dark:bg-[#111]/95 backdrop-blur-xl p-2.5 rounded-[1.5rem] shadow-2xl border border-gray-200/50 dark:border-gray-800/50 flex flex-col gap-2 pointer-events-auto">
                    {/* Compact Address Info */}
                    <div className="flex items-center gap-3 px-3 pt-1">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                            {geocoding ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : <MapPin className="w-4 h-4 text-[#1A4D2E]" />}
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={address}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="font-bold text-gray-900 dark:text-white text-sm truncate"
                                >
                                    {address || 'Locating...'}
                                </motion.p>
                            </AnimatePresence>
                            <p className="text-[10px] text-gray-500 truncate">
                                {pendingCoords.lat.toFixed(4)}, {pendingCoords.lng.toFixed(4)}
                            </p>
                        </div>
                    </div>

                    {/* Sleek Confirm Button */}
                    <button
                        onClick={handleConfirm}
                        disabled={geocoding}
                        className="w-full flex items-center justify-center gap-2 bg-[#1A4D2E] text-white py-3 rounded-full font-bold text-sm hover:bg-[#133b23] transition-colors disabled:opacity-60"
                    >
                        Confirm Location
                    </button>
                </div>
            </div>

            {/* Floating GPS Button - Absolute Bottom Right */}
            <button
                onClick={flyToMyLocation}
                className="absolute right-6 bottom-6 z-[1000] p-4 bg-white dark:bg-[#1a1a1a] rounded-[1.25rem] shadow-2xl border border-gray-200/50 dark:border-gray-800/50 hover:scale-105 transition-transform pointer-events-auto shrink-0 mb-0.5"
            >
                <LocateFixed className="w-6 h-6 text-[#1A4D2E]" />
            </button>
        </div>
    );
}
