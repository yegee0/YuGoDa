import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, LocateFixed, X, Home, Briefcase, Heart, MoreHorizontal, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useStore } from '@/app/store/useStore';

const TILE_URL = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';
const TILE_ATTR =
    '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> ' +
    '&copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> ' +
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

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
}

export default function LocationPickerMap({ initialLocation, initialName, onConfirm, onClose }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [address, setAddress] = useState(initialName || '');
    const [geocoding, setGeocoding] = useState(false);
    const [pendingCoords, setPendingCoords] = useState(initialLocation || ISTANBUL);
    const geocodeTimer = useRef<any>(null);

    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showCountryCodes, setShowCountryCodes] = useState(false);
    const [form, setForm] = useState<AddressForm>({
        apartment: '', unit: '', floor: '', company: '',
        countryCode: '+90', phone: '', deliveryNote: '', tag: 'home',
    });

    const { userProfile, setUserProfile } = useStore();

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
        if (!initialName) reverseGeocode(start.lat, start.lng);
        return () => {
            clearTimeout(geocodeTimer.current);
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (mapRef.current && initialLocation) {
            mapRef.current.flyTo([initialLocation.lat, initialLocation.lng], 15, { duration: 1 });
            if (initialName) setAddress(initialName);
        }
    }, [initialLocation, initialName]);

    const flyToMyLocation = () => {
        if (!navigator.geolocation || !mapRef.current) return;
        navigator.geolocation.getCurrentPosition(pos => {
            mapRef.current!.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1 });
        });
    };

    const handleSaveAndContinue = async () => {
        if (!form.phone.trim()) {
            toast.error('Please enter your phone number.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                lat: pendingCoords.lat,
                lng: pendingCoords.lng,
                addressLabel: address,
                apartment: form.apartment,
                unit: form.unit,
                floor: form.floor,
                company: form.company,
                phone: `${form.countryCode}${form.phone}`,
                deliveryNote: form.deliveryNote,
                tag: form.tag,
            };

            // Save to local state + localStorage immediately — never fails
            const updatedAddresses = [...(userProfile?.addresses || []), payload];
            if (userProfile) {
                setUserProfile({ ...userProfile, addresses: updatedAddresses });
            }
            localStorage.setItem('yugoda_saved_address', JSON.stringify(payload));

            // Fire-and-forget API sync — isolated so any error never reaches the outer catch
            try { api.patch('/user/address', payload).catch(() => {}); } catch { /* ignore */ }

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
        <div className="relative h-full w-full flex flex-col bg-[#f5f5f0] dark:bg-[#0a0a0a] overflow-hidden rounded-none lg:rounded-3xl lg:m-4 lg:h-[calc(100%-32px)] lg:w-[calc(100%-32px)] lg:shadow-2xl lg:border lg:border-gray-200 dark:border-gray-800 lg:overflow-hidden">

            {/* Back button */}
            <button
                onClick={onClose}
                className="absolute top-6 left-6 z-[1000] p-3 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-md hover:bg-white dark:hover:bg-[#222] rounded-full shadow-lg transition-all"
            >
                <svg className="w-5 h-5 text-gray-800 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {/* Map */}
            <div ref={containerRef} className="flex-1 w-full" />

            {/* Center pin */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]" style={{ bottom: 40 }}>
                <div className={`flex flex-col items-center transition-transform duration-200 ${isDragging ? '-translate-y-4' : 'translate-y-0'}`}>
                    <div className={`w-3 h-1.5 bg-black/20 rounded-full mt-1 transition-all duration-200 ${isDragging ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}`} style={{ marginTop: 2 }} />
                    <div className="relative -mb-1">
                        <div className="w-10 h-10 bg-[#1A4D2E] rounded-full border-3 border-white flex items-center justify-center shadow-2xl" style={{ border: '3px solid white' }}>
                            <MapPin className="w-5 h-5 text-white fill-white" />
                        </div>
                        <div className="w-2 h-3 bg-[#1A4D2E] mx-auto" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)', marginTop: -1 }} />
                    </div>
                </div>
            </div>

            {/* Bottom address card + confirm button */}
            <div className="absolute bottom-6 left-4 right-4 z-[1000] flex items-end gap-3 pointer-events-none lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-md">
                <div className="flex-1 bg-white/95 dark:bg-[#111]/95 backdrop-blur-xl p-2.5 rounded-[1.5rem] shadow-2xl border border-gray-200/50 dark:border-gray-800/50 flex flex-col gap-2 pointer-events-auto">
                    <div className="flex items-center gap-3 px-3 pt-1">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                            {geocoding ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : <MapPin className="w-4 h-4 text-[#1A4D2E]" />}
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                            <AnimatePresence mode="wait">
                                <motion.p key={address} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                    {address || 'Locating...'}
                                </motion.p>
                            </AnimatePresence>
                            <p className="text-[10px] text-gray-500 truncate">
                                {pendingCoords.lat.toFixed(4)}, {pendingCoords.lng.toFixed(4)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        disabled={geocoding}
                        className="w-full flex items-center justify-center gap-2 bg-[#1A4D2E] text-white py-3 rounded-full font-bold text-sm hover:bg-[#133b23] transition-colors disabled:opacity-60"
                    >
                        Confirm Location
                    </button>
                </div>
            </div>

            {/* GPS button */}
            <button
                onClick={flyToMyLocation}
                className="absolute right-6 bottom-6 z-[1000] p-4 bg-white dark:bg-[#1a1a1a] rounded-[1.25rem] shadow-2xl border border-gray-200/50 dark:border-gray-800/50 hover:scale-105 transition-transform pointer-events-auto shrink-0 mb-0.5"
            >
                <LocateFixed className="w-6 h-6 text-[#1A4D2E]" />
            </button>

            {/* ── Address Details Bottom Sheet ── */}
            <AnimatePresence>
                {showForm && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[2000] bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowForm(false)}
                        />

                        {/* Sheet */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                            className="absolute bottom-0 left-0 right-0 z-[2100] bg-white dark:bg-[#111] rounded-t-3xl shadow-2xl max-h-[90%] flex flex-col"
                        >
                            {/* Handle + header */}
                            <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-gray-100 dark:border-white/5">
                                <div className="w-10 h-1 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-4" />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-bold text-gray-900 dark:text-white text-base">Address Details</h2>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[260px]">{address}</p>
                                    </div>
                                    <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable form body */}
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                                {/* Row 1: Apartman + Daire */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Apartment</label>
                                        <input
                                            type="text"
                                            placeholder="Building name"
                                            value={form.apartment}
                                            onChange={e => setForm(f => ({ ...f, apartment: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-[#1A4D2E] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Unit</label>
                                        <input
                                            type="text"
                                            placeholder="No"
                                            value={form.unit}
                                            onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-[#1A4D2E] transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Kat + Şirket */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Floor</label>
                                        <input
                                            type="text"
                                            placeholder="Floor number"
                                            value={form.floor}
                                            onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-[#1A4D2E] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Company</label>
                                        <input
                                            type="text"
                                            placeholder="Optional"
                                            value={form.company}
                                            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-[#1A4D2E] transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Phone with country code */}
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Phone Number <span className="text-red-400">*</span></label>
                                    <div className="flex gap-2">
                                        {/* Country code selector */}
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setShowCountryCodes(v => !v)}
                                                className="h-full px-3 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap focus:outline-none focus:border-[#1A4D2E] transition-colors"
                                            >
                                                <span>{COUNTRY_CODES.find(c => c.code === form.countryCode)?.flag}</span>
                                                <span>{form.countryCode}</span>
                                                <ChevronDown className="w-3 h-3 text-gray-400" />
                                            </button>
                                            <AnimatePresence>
                                                {showCountryCodes && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 4 }}
                                                        className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-10 overflow-hidden min-w-[120px]"
                                                    >
                                                        {COUNTRY_CODES.map(c => (
                                                            <button
                                                                key={c.code}
                                                                type="button"
                                                                onClick={() => { setForm(f => ({ ...f, countryCode: c.code })); setShowCountryCodes(false); }}
                                                                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${form.countryCode === c.code ? 'text-[#1A4D2E]' : 'text-gray-700 dark:text-gray-200'}`}
                                                            >
                                                                <span>{c.flag}</span>
                                                                <span>{c.code}</span>
                                                                <span className="text-gray-400 text-xs">{c.label}</span>
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
                                            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-[#1A4D2E] transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Delivery note */}
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Delivery Note</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Door code, directions for courier…"
                                        value={form.deliveryNote}
                                        onChange={e => setForm(f => ({ ...f, deliveryNote: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-[#1A4D2E] transition-colors resize-none"
                                    />
                                </div>

                                {/* Address tag */}
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">Address Label</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {TAG_OPTIONS.map(({ id, label, icon }) => (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, tag: id }))}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                                                    form.tag === id
                                                        ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white'
                                                        : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300'
                                                }`}
                                            >
                                                {icon}
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Submit button */}
                            <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-white/5">
                                <button
                                    onClick={handleSaveAndContinue}
                                    disabled={saving}
                                    className="w-full py-4 bg-[#1A4D2E] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#133b23] transition-colors disabled:opacity-50"
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
