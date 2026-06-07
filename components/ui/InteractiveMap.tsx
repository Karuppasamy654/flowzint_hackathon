'use client';

import * as React from 'react';

interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  body?: string;
  color?: string; // Hex color for marker icon
  name?: string;
  skills?: string[];
  avatarColor?: string;
  avatarUrl?: string;
}

interface InteractiveMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  interactive?: boolean; // If true, allows dropping a pin on click (for signup/profile location selection)
  onLocationSelect?: (lat: number, lng: number, addressName: string) => void;
  className?: string;
}

// Default to Chennai coordinates
const DEFAULT_CENTER: [number, number] = [13.0827, 80.2707];

export function InteractiveMap({
  center = DEFAULT_CENTER,
  zoom = 12,
  markers = [],
  interactive = false,
  onLocationSelect,
  className = 'h-72 w-full rounded-md shadow-inner border border-gray-200',
}: InteractiveMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const mapInstanceRef = React.useRef<any>(null);
  const markersGroupRef = React.useRef<any>(null);
  const userMarkerRef = React.useRef<any>(null);

  // 1. Inject Leaflet CDN files dynamically (Edge/SSR safe)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if leaflet is already loaded
    if ((window as any).L) {
      setMapLoaded(true);
      return;
    }

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    cssLink.crossOrigin = '';
    document.head.appendChild(cssLink);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;
    script.onload = () => {
      setMapLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup to prevent duplicate script tags
      try {
        if (document.head.contains(cssLink)) {
          document.head.removeChild(cssLink);
        }
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      } catch (e) {
        // Safe catch
      }
    };
  }, []);

  // 2. Initialize Map once Leaflet script is loaded
  React.useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Initialize Map instance
    const map = L.map(mapContainerRef.current).setView(center, zoom);
    
    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Handle interactive selection map clicks
    if (interactive) {
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        
        // Update user pin locally
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng(e.latlng);
        } else {
          const pinHtml = `
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary border-2 border-white shadow-md text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          `;
          
          const customIcon = L.divIcon({
            html: pinHtml,
            className: 'custom-marker-wrapper',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });
          
          userMarkerRef.current = L.marker(e.latlng, { icon: customIcon }).addTo(map);
        }

        // Reverse geocoding using Nominatim (OpenStreetMap)
        let addressName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`
          );
          const data = await res.json();
          if (data && data.display_name) {
            // Pick a readable segment: e.g. "Adyar, Chennai" or "Neighborhood, City"
            const parts = data.address;
            const neighborhood = parts.suburb || parts.neighbourhood || parts.village || parts.subdivision || '';
            const city = parts.city || parts.town || parts.county || '';
            if (neighborhood && city) {
              addressName = `${neighborhood}, ${city}`;
            } else {
              addressName = data.name || data.display_name.split(',').slice(0, 2).join(',').trim();
            }
          }
        } catch (err) {
          console.warn('Reverse geocoding fetch failed, using coordinate fallback');
        }

        if (onLocationSelect) {
          onLocationSelect(lat, lng, addressName);
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, interactive, onLocationSelect]);

  // 3. Update Map view center if center changes
  React.useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(center, mapInstanceRef.current.getZoom());
  }, [center]);

  // 4. Update Map Markers dynamically (e.g. showing chatbot helper matches)
  React.useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || !mapLoaded) return;

    const L = (window as any).L;
    if (!L) return;

    // Clear previous markers
    markersGroupRef.current.clearLayers();

    if (markers.length === 0) return;

    const bounds = L.latLngBounds();

    markers.forEach((marker) => {
      const pinColor = marker.avatarColor || '#7C3AED';
      const initial = marker.name ? marker.name[0].toUpperCase() : 'H';
      
      const pinHtml = `
        <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-md text-white font-bold select-none" style="background-color: ${pinColor}">
          <span>${initial}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: pinHtml,
        className: 'custom-marker-wrapper',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const popupHtml = `
        <div class="p-2 space-y-1 font-sans text-left min-w-[150px]">
          <h4 class="text-sm font-bold text-gray-800">${marker.name || marker.title}</h4>
          ${marker.skills && marker.skills.length > 0 ? `
            <div class="flex flex-wrap gap-1 mt-1">
              ${marker.skills.slice(0, 2).map(s => `<span class="text-[9px] font-semibold bg-gray-100 border border-gray-200 text-gray-700 px-1 py-0.5 rounded capitalize">${s}</span>`).join('')}
            </div>
          ` : ''}
          ${marker.body ? `<p class="text-xs text-gray-500 mt-1">${marker.body}</p>` : ''}
        </div>
      `;

      const lMarker = L.marker([marker.lat, marker.lng], { icon: customIcon })
        .bindPopup(popupHtml)
        .addTo(markersGroupRef.current);

      bounds.extend([marker.lat, marker.lng]);
    });

    // Fit map view to bound markers if there are multiple
    if (markers.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [markers, mapLoaded]);

  return (
    <div className="relative w-full h-full min-h-[250px]">
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center space-y-2 rounded-md border border-gray-200 z-10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
          <span className="text-xs font-medium text-gray-400">Loading Map...</span>
        </div>
      )}
      <div ref={mapContainerRef} className={className} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
