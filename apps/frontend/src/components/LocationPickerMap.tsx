import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    APIProvider,
    Map,
    useMap,
    useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { MapPin, Loader2, LocateFixed, X, Home, Briefcase, Heart, MoreHorizontal, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useStore } from '@/app/store/useStore';
import { reverseGeocodeNominatim, nominatimDisplayName } from '@/lib/geocoding';

const ISTANBUL = { lat: 41.0082, lng: 28.9784 };

const COUNTRY_CODES = [
    { code: '+90', flag: '🇹🇷', label: 'TR' },
    { code: '+1',  flag: '🇺🇸', label: 'US' },
    { code: '+44', flag: '🇬🇧', label: 'GB' },
    { code: '+49', flag: '🇩🇪', label: 'DE' },
    { code: '+33', flag: '🇫🇷', label: 'FR' },
];

type AddressTag = 'home' | 'work' | 'partner' | 'other';

interface AddressForm {
    apartment: string;
    unit: string;
    floor: string;
    company: string;
    countryCode: string;
    phone: string;
    deliveryNote: string;
    tag: AddressTag;
}

interface Props {
    initialLocation?: { lat: number; lng: number };
    initialName?: string;
    onConfirm: (coords: { lat: number; lng: number }, name: string) => void;
    onClose: () => void;
    mode?: 'customer' | 'restaurant';
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// ── Minimalist pastel style (matches GoogleMapsView.tsx) ─────────────────────
const MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#f5f5f0' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#7a7a7a' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f0' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ede8df' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e4f0' }] },
];

/**
 * Inner map content. Handles pan detection + SDK-native reverse geocoding.
 * Must be rendered inside an `<APIProvider>`.
 */
interface MapContentProps {
    initialLocation: { lat: number; lng: number };
    onDraggingChange: (dragging: boolean) => void;
    onCoordsChange: (coords: { lat: number; lng: number }) => void;
}

function MapContent({ initialLocation, onDraggingChange, onCoordsChange }: MapContentProps) {
    const map = useMap();
    const hasFlownRef = useRef(false);

    // Fly to `initialLocation` when it changes (e.g., user confirms a search suggestion).
    useEffect(() => {
        if (!map) return;
        if (hasFlownRef.current) {
            map.panTo(initialLocation);
        }
        hasFlownRef.current = true;
    }, [map, initialLocation]);

    // Wire drag-start / drag-end for pin lift animation + coord emission.
    useEffect(() => {
        if (!map) return;
        const dragStartListener = map.addListener('dragstart', () => onDraggingChange(true));
        const dragEndListener = map.addListener('dragend', () => {
            onDraggingChange(false);
            const center = map.getCenter();
            if (center) onCoordsChange({ lat: center.lat(), lng: center.lng() });
        });
        const idleListener = map.addListener('idle', () => {
            // Emit coords after any camera change (zoom, programmatic pan, etc.).
            const center = map.getCenter();
            if (center) onCoordsChange({ lat: center.lat(), lng: center.lng() });
        });
        return () => {
            dragStartListener.remove();
            dragEndListener.remove();
            idleListener.remove();
        };
    }, [map, onDraggingChange, onCoordsChange]);

    return (
        <Map
            defaultCenter={initialLocation}
            defaultZoom={15}
            gestureHandling="greedy"
            disableDefaultUI
            zoomControl
            styles={MAP_STYLE}
            className="w-full h-full"
        />
    );
}

/**
 * Hook: SDK-native reverse geocoding via Google Geocoding API. Returns a function
 * that resolves to `{ label, apartmentHint }`, falling back to Nominatim + coords.
 */
function useReverseGeocoder() {
    const geocodingLib = useMapsLibrary('geocoding');
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);

    useEffect(() => {
        if (geocodingLib && !geocoderRef.current) {
            geocoderRef.current = new geocodingLib.Geocoder();
        }
    }, [geocodingLib]);

    return useCallback(async (lat: number, lng: number): Promise<{ label: string; apartmentHint: string }> => {
        const fallbackLabel = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        // Prefer Google Geocoding when the library is loaded.
        if (geocoderRef.current) {
            try {
                const response = await geocoderRef.current.geocode({
                    location: { lat, lng },
                    language: 'tr',
                });
                const result = response.results[0];
                if (result) {
                    const get = (type: string) =>
                        result.address_components.find(c => c.types.includes(type))?.long_name ?? '';
                    const label =
                        get('sublocality_level_1') ||
                        get('neighborhood') ||
                        get('sublocality') ||
                        get('locality') ||
                        fallbackLabel;
                    const apartmentHint = [get('route'), get('street_number')].filter(Boolean).join(' ');
                    return { label, apartmentHint };
                }
            } catch {
                // fall through to Nominatim below
            }
        }

        // Fallback: Nominatim (no API key, no structured street fields available).
        const nom = await reverseGeocodeNominatim(lat, lng);
        return { label: nominatimDisplayName(nom, fallbackLabel), apartmentHint: '' };
    }, []);
}

interface PickerBodyProps extends Props {}

function PickerBody({ initialLocation, initialName, onConfirm, onClose, mode = 'customer' }: PickerBodyProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [address, setAddress] = useState(initialName || '');
    const [geocoding, setGeocoding] = useState(false);
    const [pendingCoords, setPendingCoords] = useState(initialLocation || ISTANBUL);
    const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const geocodedApartmentRef = useRef('');

    const map = useMap();
    const reverseGeocode = useReverseGeocoder();

    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showCountryCodes, setShowCountryCodes] = useState(false);
    const [form, setForm] = useState<AddressForm>({
        apartment: '', unit: '', floor: '', company: '',
        countryCode: '+90', phone: '', deliveryNote: '', tag: 'home',
    });

    const { userProfile, setUserProfile } = useStore();

    const handleCoordsChange = useCallback((coords: { lat: number; lng: number }) => {
        setPendingCoords(coords);
        if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
        geocodeTimer.current = setTimeout(async () => {
            setGeocoding(true);
            const { label, apartmentHint } = await reverseGeocode(coords.lat, coords.lng);
            setAddress(label);
            geocodedApartmentRef.current = apartmentHint;
            setGeocoding(false);
        }, 400);
    }, [reverseGeocode]);

    // Initial reverse geocode on mount if no name provided.
    useEffect(() => {
        if (!initialName) {
            const start = initialLocation || ISTANBUL;
            handleCoordsChange(start);
        }
        return () => {
            if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const flyToMyLocation = () => {
        if (!navigator.geolocation || !map) return;
        navigator.geolocation.getCurrentPosition(pos => {
            map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
    };

    const handleSaveAndContinue = async () => {
        if (!form.phone.trim()) {
            toast.error('Please enter your phone number.');
            return;
        }
        setSaving(true);
        try {
            const newAddress = {
                latitude: pendingCoords.lat,
                longitude: pendingCoords.lng,
                addressLabel: address,
                apartment: form.apartment,
                unit: form.unit,
                floor: form.floor,
                company: form.company,
                phone: `${form.countryCode}${form.phone}`,
                deliveryNote: form.deliveryNote,
                tag: form.tag,
            };
            const updatedAddresses = [...(userProfile?.addresses || []), newAddress];
            await api.put('/users/me', { addresses: updatedAddresses });
            if (userProfile) {
                setUserProfile({ ...userProfile, addresses: updatedAddresses });
            }
            toast.success('Address saved!');
            setShowForm(false);
            onConfirm(pendingCoords, address);
        } catch {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const TAG_OPTIONS: { id: AddressTag; label: string; icon: React.ReactNode }[] = [
        { id: 'home',    label: 'Home',    icon: <Home          className="w-4 h-4" /> },
        { id: 'work',    label: 'Work',    icon: <Briefcase     className="w-4 h-4" /> },
        { id: 'partner', label: 'Partner', icon: <Heart         className="w-4 h-4" /> },
        { id: 'other',   label: 'Other',   icon: <MoreHorizontal className="w-4 h-4" /> },
    ];

    return (
        <div className="relative h-full w-full flex flex-col bg-[#F5F0E8] overflow-hidden rounded-none lg:rounded-3xl lg:m-4 lg:h-[calc(100%-32px)] lg:w-[calc(100%-32px)] lg:shadow-2xl lg:border lg:border-[#E8E0D5] lg:overflow-hidden">

            {/* Back button */}
            <button
                onClick={onClose}
                className="absolute top-6 left-6 z-[1000] p-3 bg-white/90 backdrop-blur-md hover:bg-white rounded-full shadow-lg transition-all"
            >
                <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {/* Map */}
            <div className="flex-1 w-full relative">
                <MapContent
                    initialLocation={initialLocation || ISTANBUL}
                    onDraggingChange={setIsDragging}
                    onCoordsChange={handleCoordsChange}
                />
            </div>

            {/* Center pin overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]" style={{ bottom: 40 }}>
                <div className={`flex flex-col items-center transition-transform duration-200 ${isDragging ? '-translate-y-4' : 'translate-y-0'}`}>
                    <div className={`w-3 h-1.5 bg-black/20 rounded-full mt-1 transition-all duration-200 ${isDragging ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}`} style={{ marginTop: 2 }} />
                    <div className="relative -mb-1">
                        <div className="w-10 h-10 bg-[#1B5E52] rounded-full border-3 border-white flex items-center justify-center shadow-2xl" style={{ border: '3px solid white' }}>
                            <MapPin className="w-5 h-5 text-white fill-white" />
                        </div>
                        <div className="w-2 h-3 bg-[#1B5E52] mx-auto" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)', marginTop: -1 }} />
                    </div>
                </div>
            </div>

            {/* Bottom address card + confirm button */}
            <div className="absolute bottom-6 left-4 right-4 z-[1000] flex items-end gap-3 pointer-events-none lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-md">
                <div className="flex-1 bg-white/95 backdrop-blur-xl p-2.5 rounded-[1.5rem] shadow-2xl border border-[#E8E0D5]/50 flex flex-col gap-2 pointer-events-auto">
                    <div className="flex items-center gap-3 px-3 pt-1">
                        <div className="w-8 h-8 rounded-full bg-[#F5F0E8] flex items-center justify-center shrink-0">
                            {geocoding ? <Loader2 className="w-4 h-4 text-[#8FA396] animate-spin" /> : <MapPin className="w-4 h-4 text-[#1B5E52]" />}
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                            <AnimatePresence mode="wait">
                                <motion.p key={address} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="font-bold text-[#1B1B1B] text-sm truncate">
                                    {address || 'Locating...'}
                                </motion.p>
                            </AnimatePresence>
                            <p className="text-[10px] text-[#8FA396] truncate">
                                {pendingCoords.lat.toFixed(4)}, {pendingCoords.lng.toFixed(4)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (mode === 'restaurant') {
                                onConfirm(pendingCoords, address);
                            } else {
                                setForm(f => ({ ...f, apartment: geocodedApartmentRef.current }));
                                setShowForm(true);
                            }
                        }}
                        disabled={geocoding}
                        className="w-full flex items-center justify-center gap-2 bg-[#1B5E52] text-white py-3 rounded-full font-bold text-sm hover:bg-[#164d43] transition-colors disabled:opacity-60"
                    >
                        Confirm Location
                    </button>
                </div>
            </div>

            {/* GPS button */}
            <button
                onClick={flyToMyLocation}
                className="absolute right-6 bottom-6 z-[1000] p-4 bg-white rounded-[1.25rem] shadow-2xl border border-[#E8E0D5]/50 hover:scale-105 transition-transform pointer-events-auto shrink-0 mb-0.5"
            >
                <LocateFixed className="w-6 h-6 text-[#1B5E52]" />
            </button>

            {/* ── Address Details Bottom Sheet ── */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[2000] bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowForm(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                            className="absolute bottom-0 left-0 right-0 z-[2100] bg-white rounded-t-3xl shadow-2xl max-h-[90%] flex flex-col"
                        >
                            <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-[#E8E0D5]">
                                <div className="w-10 h-1 bg-[#E8E0D5] rounded-full mx-auto mb-4" />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-bold text-[#1B1B1B] text-base">Address Details</h2>
                                        <p className="text-xs text-[#8FA396] mt-0.5 truncate max-w-[260px]">{address}</p>
                                    </div>
                                    <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-[#F5F0E8] flex items-center justify-center">
                                        <X className="w-4 h-4 text-[#8FA396]" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block">Apartment</label>
                                        <input
                                            type="text"
                                            placeholder="Building name"
                                            value={form.apartment}
                                            onChange={e => setForm(f => ({ ...f, apartment: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-sm text-[#1B1B1B] placeholder-gray-300 focus:outline-none focus:border-[#1B5E52] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block">Unit</label>
                                        <input
                                            type="text"
                                            placeholder="No"
                                            value={form.unit}
                                            onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-sm text-[#1B1B1B] placeholder-gray-300 focus:outline-none focus:border-[#1B5E52] transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block">Floor</label>
                                        <input
                                            type="text"
                                            placeholder="Floor number"
                                            value={form.floor}
                                            onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-sm text-[#1B1B1B] placeholder-gray-300 focus:outline-none focus:border-[#1B5E52] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block">Company</label>
                                        <input
                                            type="text"
                                            placeholder="Optional"
                                            value={form.company}
                                            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-sm text-[#1B1B1B] placeholder-gray-300 focus:outline-none focus:border-[#1B5E52] transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block">Phone Number <span className="text-red-400">*</span></label>
                                    <div className="flex gap-2">
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setShowCountryCodes(v => !v)}
                                                className="h-full px-3 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] flex items-center gap-1.5 text-sm font-bold text-gray-700 whitespace-nowrap focus:outline-none focus:border-[#1B5E52] transition-colors"
                                            >
                                                <span>{COUNTRY_CODES.find(c => c.code === form.countryCode)?.flag}</span>
                                                <span>{form.countryCode}</span>
                                                <ChevronDown className="w-3 h-3 text-[#8FA396]" />
                                            </button>
                                            <AnimatePresence>
                                                {showCountryCodes && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 4 }}
                                                        className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-[#E8E0D5] z-10 overflow-hidden min-w-[120px]"
                                                    >
                                                        {COUNTRY_CODES.map(c => (
                                                            <button
                                                                key={c.code}
                                                                type="button"
                                                                onClick={() => { setForm(f => ({ ...f, countryCode: c.code })); setShowCountryCodes(false); }}
                                                                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium hover:bg-[#F5F0E8] transition-colors ${form.countryCode === c.code ? 'text-[#1B5E52]' : 'text-gray-700'}`}
                                                            >
                                                                <span>{c.flag}</span>
                                                                <span>{c.code}</span>
                                                                <span className="text-[#8FA396] text-xs">{c.label}</span>
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="5XX XXX XX XX"
                                            value={form.phone}
                                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                            className="flex-1 px-4 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-sm text-[#1B1B1B] placeholder-gray-300 focus:outline-none focus:border-[#1B5E52] transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block">Delivery Note</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Door code, directions for courier…"
                                        value={form.deliveryNote}
                                        onChange={e => setForm(f => ({ ...f, deliveryNote: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-sm text-[#1B1B1B] placeholder-gray-300 focus:outline-none focus:border-[#1B5E52] transition-colors resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-2 block">Address Label</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {TAG_OPTIONS.map(({ id, label, icon }) => (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, tag: id }))}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                                                    form.tag === id
                                                        ? 'bg-[#1B5E52] border-[#1B5E52] text-white'
                                                        : 'bg-[#F5F0E8] border-[#E8E0D5] text-gray-600'
                                                }`}
                                            >
                                                {icon}
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-shrink-0 px-5 py-4 border-t border-[#E8E0D5]">
                                <button
                                    onClick={handleSaveAndContinue}
                                    disabled={saving}
                                    className="w-full py-4 bg-[#1B5E52] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#164d43] transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                                    ) : (
                                        'Save & Continue'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function LocationPickerMap(props: Props) {
    // Gate render on API key; surface the same config error other map surfaces show.
    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#f5f5f0] gap-6 p-8">
                <div className="text-6xl">🗺️</div>
                <div className="text-center max-w-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Google Maps API Key Required</h3>
                    <p className="text-gray-500 text-sm mb-4">
                        Set <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">VITE_GOOGLE_MAPS_API_KEY</code> in your <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">.env.local</code> and restart the dev server.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['geocoding']}>
            <PickerBody {...props} />
        </APIProvider>
    );
}
