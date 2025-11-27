import { useEffect, useRef } from 'react';

export default function AddressMap({ coordinates, address }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!coordinates || !mapRef.current) return;

    // Load Leaflet CSS and JS dynamically
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;

      // Load CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      // Load JS
      if (!window.L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
          script.crossOrigin = '';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      // Initialize map
      if (window.L && !mapInstanceRef.current) {
        const L = window.L;
        
        // Create map
        mapInstanceRef.current = L.map(mapRef.current).setView([coordinates.lat, coordinates.lng], 15);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(mapInstanceRef.current);

        // Add marker
        markerRef.current = L.marker([coordinates.lat, coordinates.lng], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(mapInstanceRef.current);

        // Add popup with address
        if (address) {
          const addressText = `${address.street || ''}, ${address.city || ''}, ${address.country || ''}`.trim();
          if (addressText) {
            markerRef.current.bindPopup(addressText).openPopup();
          }
        }
      } else if (window.L && mapInstanceRef.current) {
        // Update existing map
        const L = window.L;
        mapInstanceRef.current.setView([coordinates.lat, coordinates.lng], 15);
        
        if (markerRef.current) {
          markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
          if (address) {
            const addressText = `${address.street || ''}, ${address.city || ''}, ${address.country || ''}`.trim();
            if (addressText) {
              markerRef.current.setPopupContent(addressText).openPopup();
            }
          }
        }
      }
    };

    loadLeaflet();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [coordinates, address]);

  return <div ref={mapRef} className="w-full h-full" />;
}

