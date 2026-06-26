// ─────────────────────────────────────────────────────────────────────────────
//  MapView  |  Leaflet map with item pins + user location marker
//
//  IMPORTANT: You must import Leaflet CSS in the page that uses this:
//    import 'leaflet/dist/leaflet.css'
//
//  Props:
//    items     — Item[] (each needs location.coordinates [lng, lat], title,
//                price, isFree, photos[], category, _id)
//    center    — { lat, lng } (defaults to user's locationStore coords)
//    zoom      — number (default 13)
//    height    — string CSS (default '460px')
//    onItemClick — (item) => void (default: navigate to /items/:id)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocationStore } from '../../store/locationStore';
import { CAT_ICONS, formatPrice } from '../items/helpers';

// ── Fix Leaflet default icon paths (broken in Vite) ───────────────────────────
function fixLeafletIcons(L) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// ── Custom item pin HTML ──────────────────────────────────────────────────────
function itemPinHtml(item) {
  const price = item.isFree ? 'FREE' : `₹${Number(item.price).toLocaleString('en-IN')}`;
  const emoji = CAT_ICONS[item.category] || '📦';
  const isFree = item.isFree || item.price === 0;

  return `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      filter: drop-shadow(0 3px 8px rgba(0,0,0,0.18));
    ">
      <div style="
        background: ${isFree ? 'linear-gradient(135deg,#457a48,#2a4f2d)' : 'linear-gradient(135deg,#e08c2a,#c97520)'};
        color: white;
        font-family: Instrument Sans, system-ui, sans-serif;
        font-size: 11px;
        font-weight: 700;
        padding: 5px 8px;
        border-radius: 12px;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        border: 2px solid white;
      ">
        <span style="font-size:13px">${emoji}</span>
        <span>${price}</span>
      </div>
      <div style="
        width: 0; height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: ${isFree ? '8px solid #2a4f2d' : '8px solid #c97520'};
        margin-top: -1px;
      "></div>
    </div>
  `;
}

// ── User location pin HTML ────────────────────────────────────────────────────
const userPinHtml = `
  <div style="
    width: 20px; height: 20px;
    background: #e08c2a;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 0 3px rgba(224,140,42,0.3), 0 2px 8px rgba(0,0,0,0.2);
  "></div>
`;

// ── Item popup HTML ────────────────────────────────────────────────────────────
function itemPopupHtml(item) {
  const price = item.isFree ? '<span style="color:#457a48;font-weight:800">FREE</span>'
    : `<span style="font-weight:800">₹${Number(item.price).toLocaleString('en-IN')}</span>`;
  const photo = item.photos?.[0];
  const dist  = item.distanceKm !== undefined ? `<span style="color:#a0916d;font-size:10px;font-weight:600">${item.distanceKm}km away</span>` : '';

  return `
    <div style="
      font-family: Instrument Sans, system-ui, sans-serif;
      width: 200px;
      cursor: pointer;
    " onclick="window.location.href='/items/${item._id}'">
      ${photo ? `<img src="${photo}" alt="${item.title}" style="width:100%;height:110px;object-fit:cover;border-radius:10px 10px 0 0;display:block" />` : ''}
      <div style="padding: 10px 12px 12px">
        <p style="font-size:13px;font-weight:700;color:#1c1917;margin:0 0 4px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${item.title}</p>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:14px">${price}</span>
          ${dist}
        </div>
        <div style="margin-top:8px;padding:6px 10px;background:linear-gradient(135deg,#e08c2a,#c97520);color:white;text-align:center;border-radius:8px;font-size:11px;font-weight:700">
          View Item →
        </div>
      </div>
    </div>
  `;
}

export default function MapView({
  items      = [],
  center,
  zoom       = 13,
  height     = '460px',
  onItemClick,
}) {
  const navigate       = useNavigate();
  const { lat: userLat, lng: userLng } = useLocationStore();
  const mapRef         = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef     = useRef([]);

  const centerLat = center?.lat ?? userLat;
  const centerLng = center?.lng ?? userLng;

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    if (!centerLat || !centerLng) return;

    import('leaflet').then((L) => {
      L = L.default || L;
      fixLeafletIcons(L);

      const map = L.map(mapRef.current, {
        center:        [centerLat, centerLng],
        zoom,
        zoomControl:   false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Tile layer — CartoDB Positron (clean, minimal)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Custom zoom control (bottom right)
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Attribution (bottom left, minimal)
      L.control.attribution({ prefix: '© <a href="https://www.openstreetmap.org/copyright">OSM</a>' })
        .addTo(map);
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [centerLat, centerLng]);

  // ── Add user marker ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLat || !userLng) return;

    import('leaflet').then((L) => {
      L = L.default || L;
      const userIcon = L.divIcon({ html: userPinHtml, className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
      L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup('<p style="font-family:Instrument Sans,system-ui;font-size:12px;font-weight:600;color:#1c1917">📍 Your location</p>', { maxWidth: 150 });
    });
  }, [userLat, userLng, mapInstanceRef.current]);

  // ── Add item markers ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    import('leaflet').then((L) => {
      L = L.default || L;

      // Clear previous markers
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];

      items.forEach(item => {
        const coords = item.location?.coordinates;
        if (!coords || coords.length < 2) return;
        const [lng, lat] = coords;
        if (!lat || !lng) return;

        const icon = L.divIcon({
          html:       itemPinHtml(item),
          className:  '',
          iconSize:   [80, 42],
          iconAnchor: [40, 42],
          popupAnchor:[0, -44],
        });

        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(itemPopupHtml(item), {
            maxWidth: 210,
            minWidth: 200,
            className: 'bb-popup',
          });

        marker.on('click', () => {
          onItemClick ? onItemClick(item) : navigate(`/items/${item._id}`);
        });

        markersRef.current.push(marker);
      });

      // Fit bounds to show all markers if we have items
      if (items.length > 0 && markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        try {
          map.fitBounds(group.getBounds().pad(0.2), { maxZoom: 15, animate: true });
        } catch {}
      }
    });
  }, [items, navigate]);

  // ── No location state ───────────────────────────────────────────────────────
  if (!centerLat || !centerLng) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-cream-100 rounded-3xl border-2 border-dashed border-cream-300">
        <div className="text-center space-y-3">
          <div className="text-5xl">🗺️</div>
          <p className="text-sm font-bold text-charcoal-800">Enable location to see the map</p>
          <p className="text-xs text-cream-400">Items near you will appear as pins</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl overflow-hidden border border-cream-200 shadow-card-md" style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Item count badge */}
      {items.length > 0 && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-card border border-cream-200 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          <span className="text-xs font-bold text-charcoal-800">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Recenter button */}
      {userLat && userLng && (
        <button
          onClick={() => mapInstanceRef.current?.setView([userLat, userLng], zoom, { animate: true })}
          className="absolute bottom-12 right-3 z-[1000] w-10 h-10 bg-white rounded-xl shadow-card-md border border-cream-200 flex items-center justify-center text-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all"
          title="Recenter to my location"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      {/* Leaflet popup style overrides */}
      <style>{`
        .bb-popup .leaflet-popup-content-wrapper {
          padding: 0 !important;
          border-radius: 14px !important;
          overflow: hidden;
          border: 1px solid #ecdece;
          box-shadow: 0 8px 28px -4px rgba(0,0,0,0.18);
        }
        .bb-popup .leaflet-popup-content { margin: 0 !important; width: 200px !important; }
        .bb-popup .leaflet-popup-tip { background: white; }
        .leaflet-control-zoom { border: none !important; }
        .leaflet-control-zoom a {
          background: white !important; color: #1c1917 !important;
          border: 1px solid #ecdece !important; border-radius: 10px !important;
          margin-bottom: 4px !important; width: 32px !important; height: 32px !important;
          line-height: 30px !important; font-size: 16px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
        .leaflet-control-zoom a:hover { background: #fdf8f0 !important; color: #e08c2a !important; }
      `}</style>
    </div>
  );
}
