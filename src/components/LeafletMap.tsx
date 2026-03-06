import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
}

// ---------------------------------------------------------------
// Stadia Maps – Alidade Smooth
// Pastel, low-saturation, Google Maps-like aesthetic
// Free for development (no API key required in localhost)
// ---------------------------------------------------------------
const TILE_URL = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';
const TILE_ATTR =
    '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> ' +
    '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> ' +
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function getCategoryColor(category?: string) {
    switch (category) {
        case 'Bakery': return { bg: '#F97316', light: 'rgba(249,115,22,0.15)' };
        case 'Groceries': return { bg: '#16A34A', light: 'rgba(22,163,74,0.15)' };
        case 'Vegan': return { bg: '#0D9488', light: 'rgba(13,148,136,0.15)' };
        case 'Sushi': return { bg: '#8B5CF6', light: 'rgba(139,92,246,0.15)' };
        case 'Pizza': return { bg: '#DB2777', light: 'rgba(219,39,119,0.15)' };
        default: return { bg: '#7C3AED', light: 'rgba(124,58,237,0.15)' };
    }
}

export default function LeafletMap({ bags, userLocation, onBagSelect, selectedBag }: Props) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const prevLocRef = useRef(userLocation);

    // ── Init map once ───────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [userLocation.lat, userLocation.lng],
            zoom: 14,
            zoomControl: false,
            attributionControl: true,
        });

        L.tileLayer(TILE_URL, {
            attribution: TILE_ATTR,
            maxZoom: 20,
        }).addTo(map);

        // Custom zoom — bottom left, away from info popup
        L.control.zoom({ position: 'bottomleft' }).addTo(map);

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Pan map when userLocation changes (e.g. after "Set Location") ──
    useEffect(() => {
        if (!mapRef.current) return;
        const prev = prevLocRef.current;
        if (prev.lat !== userLocation.lat || prev.lng !== userLocation.lng) {
            mapRef.current.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.2 });
            prevLocRef.current = userLocation;
        }
    }, [userLocation]);

    // ── User location marker ─────────────────────────────────────
    useEffect(() => {
        if (!mapRef.current) return;
        if (userMarkerRef.current) userMarkerRef.current.remove();

        const userIcon = L.divIcon({
            html: `
        <div style="
          position: relative;
          width: 22px; height: 22px;
        ">
          <!-- Pulse ring -->
          <div style="
            position: absolute; inset: -8px;
            background: rgba(124,58,237,0.15);
            border-radius: 50%;
            animation: pulse-ring 2s infinite;
          "></div>
          <!-- Dot -->
          <div style="
            width: 22px; height: 22px;
            background: #7C3AED;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(124,58,237,0.45);
          "></div>
        </div>
        <style>
          @keyframes pulse-ring {
            0%   { transform: scale(0.8); opacity: 0.8; }
            70%  { transform: scale(1.6); opacity: 0;   }
            100% { transform: scale(1.6); opacity: 0;   }
          }
        </style>
      `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            className: '',
        });

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
            .addTo(mapRef.current)
            .bindTooltip('You are here', {
                permanent: false, direction: 'top',
                className: 'leaflet-tooltip-custom',
            });
    }, [userLocation]);

    // ── Bag markers ──────────────────────────────────────────────
    useEffect(() => {
        if (!mapRef.current) return;

        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        bags.forEach((bag, i) => {
            // Spread bags around user if no coords stored
            const fallbackLat = userLocation.lat + (Math.sin(i * 1.9 + 0.5) * 0.012);
            const fallbackLng = userLocation.lng + (Math.cos(i * 2.5 + 1.0) * 0.012);
            const pos: [number, number] = bag.coordinates
                ? [bag.coordinates.lat, bag.coordinates.lng]
                : [fallbackLat, fallbackLng];

            const { bg } = getCategoryColor(bag.category);
            const isSelected = selectedBag?.id === bag.id;
            const size = isSelected ? 42 : 34;

            // Pastel minimalist pin — soft drop-shadow, white border, price pill
            const icon = L.divIcon({
                html: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.18));
          ">
            <!-- Circle marker -->
            <div style="
              width: ${size}px; height: ${size}px;
              background: ${bg};
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${isSelected ? 18 : 15}px;
              transition: all 0.2s;
              opacity: ${isSelected ? 1 : 0.9};
            ">🛍</div>
            <!-- Price pill -->
            <div style="
              background: white;
              color: #7C3AED;
              font-size: 9px;
              font-weight: 900;
              letter-spacing: -0.3px;
              padding: 2px 7px;
              border-radius: 20px;
              margin-top: 2px;
              border: 1.5px solid ${bg}33;
              box-shadow: 0 1px 6px rgba(0,0,0,0.1);
              white-space: nowrap;
            ">${bag.price.toFixed(0)} TL</div>
          </div>
        `,
                iconSize: [50, 60],
                iconAnchor: [25, 52],
                className: '',
            });

            const marker = L.marker(pos, { icon })
                .addTo(mapRef.current!)
                .on('click', () => onBagSelect(bag));

            // Mini tooltip on hover
            marker.bindTooltip(
                `<strong>${bag.restaurantName}</strong><br/><span style="color:#9CA3AF">${bag.category || ''}</span>`,
                { direction: 'top', className: 'leaflet-tooltip-custom', offset: [0, -55] }
            );

            markersRef.current.push(marker);
        });
    }, [bags, selectedBag, userLocation]);

    return (
        <>
            <div ref={containerRef} className="w-full h-full" />
            <style>{`
        /* Override leaflet tooltip style */
        .leaflet-tooltip-custom {
          background: #1a1a2e !important;
          color: white !important;
          border: none !important;
          border-radius: 10px !important;
          padding: 6px 12px !important;
          font-size: 12px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
        }
        .leaflet-tooltip-custom::before {
          border-top-color: #1a1a2e !important;
        }
        /* Stadia map feels like Google Maps light — boost saturation slightly */
        .leaflet-tile-pane { filter: saturate(0.85) brightness(1.02); }
      `}</style>
        </>
    );
}
