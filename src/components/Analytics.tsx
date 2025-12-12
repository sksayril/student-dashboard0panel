import { useState, useEffect, useRef } from 'react';
import { useToast } from './ToastContainer';
import { locationApi } from '../api';
import { LocationData, NearbyLocation } from '../api/types';
import { MapPin, Navigation, History, Users, Play, Square, RefreshCw, Search } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

interface AnalyticsProps {
  userData?: any;
}

declare global {
  interface Window {
    L: any;
    io: any;
  }
}

export default function Analytics({ userData }: AnalyticsProps) {
  const { showSuccess, showError } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const socketRef = useRef<any>(null);
  
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [nearbyLocations, setNearbyLocations] = useState<NearbyLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [searchRadius, setSearchRadius] = useState(1000);
  const [showHistory, setShowHistory] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [manualLatitude, setManualLatitude] = useState<string>('');
  const [manualLongitude, setManualLongitude] = useState<string>('');
  const [isLoadingManualLocation, setIsLoadingManualLocation] = useState(false);

  useEffect(() => {
    let checkLeaflet: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Wait for Leaflet to load
    checkLeaflet = setInterval(() => {
      if (window.L && mapRef.current && !mapInstanceRef.current) {
        clearInterval(checkLeaflet!);
        if (isMounted) {
          initializeMap();
          loadSocketIO();
          // Don't fetch on mount - let user start tracking manually
          // This prevents unnecessary API calls that will timeout
        }
      }
    }, 100);

    // Timeout after 5 seconds
    timeoutId = setTimeout(() => {
      if (checkLeaflet) clearInterval(checkLeaflet);
      if (window.L && mapRef.current && !mapInstanceRef.current && isMounted) {
        initializeMap();
        loadSocketIO();
        // Don't fetch on mount - let user start tracking manually
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (checkLeaflet) clearInterval(checkLeaflet);
      if (timeoutId) clearTimeout(timeoutId);
      cleanup();
    };
  }, []);

  const loadSocketIO = () => {
    if (window.io) {
      return; // Already loaded
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
    script.async = true;
    script.onload = () => {
      connectSocket();
    };
    script.onerror = () => {
      console.error('Failed to load Socket.IO');
    };
    document.body.appendChild(script);
  };

  const connectSocket = () => {
    if (!window.io) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token found for Socket.IO connection');
      return;
    }

    try {
      const socket = window.io(API_BASE_URL, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket.IO connected');
        showSuccess('Real-time location tracking connected');
      });

      socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
      });

      socket.on('location:update', (data: any) => {
        console.log('Location update received:', data);
        
        // Handle different data structures
        let location: { latitude: number; longitude: number; accuracy?: number; address?: string } | null = null;
        
        if (data.location) {
          // Structure: { userId, userType, location: { latitude, longitude, accuracy, address }, timestamp }
          location = {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            accuracy: data.location.accuracy,
            address: data.location.address,
          };
        } else if (data.latitude && data.longitude) {
          // Structure: { latitude, longitude, accuracy, address }
          location = {
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            address: data.address,
          };
        }
        
        if (location) {
          const isCurrentUser = data.userId === userData?.id || data.userId === userData?.studentId;
          const accuracy = location.accuracy;
          
          // Always update for current user, regardless of accuracy
          // For other users, only update if accuracy is reasonable (less than 1000m)
          if (isCurrentUser || !accuracy || accuracy < 1000) {
            updateMapMarker(data.userId || userData?.id || 'current', location, data.userType || 'Student');
            
            // Update current location state if it's the current user
            if (isCurrentUser) {
              setCurrentLocation({
                _id: data.userId || userData?.id || 'current',
                userId: data.userId || userData?.id || 'current',
                userType: data.userType || 'Student',
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                address: location.address,
                isActive: true,
                lastUpdated: data.timestamp || new Date().toISOString(),
              });
              
              // Update address state
              if (location.address) {
                setLocationAddress(location.address);
              }
              
              // Show warning if accuracy is too high
              if (accuracy && accuracy > 1000) {
                showError(`Location accuracy is low (±${(accuracy / 1000).toFixed(1)}km). Location may be approximate. Try getting location again for better accuracy.`);
              }
            }
          } else {
            console.warn('Location accuracy too low, ignoring update:', accuracy);
          }
        }
      });

      socket.on('location:confirmed', (data: any) => {
        console.log('Location confirmed:', data);
      });

      socket.on('location:nearby:response', (data: any) => {
        if (data.locations) {
          setNearbyLocations(data.locations);
          updateNearbyMarkers(data.locations);
        }
      });

      socket.on('location:stopped', (data: any) => {
        console.log('Location stopped:', data);
        if (data.userId === userData?.id) {
          setIsTracking(false);
        }
      });

      socket.on('error', (error: any) => {
        console.error('Socket error:', error);
        showError(error.message || 'Socket connection error');
      });
    } catch (error) {
      console.error('Error connecting to Socket.IO:', error);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.L || mapInstanceRef.current) return;

    // Default to Kolkata if no location
    const defaultLat = 22.5726;
    const defaultLng = 88.3639;

    try {
      const map = window.L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      setIsLoading(false);
    }
  };

  const updateMapMarker = (userId: string, location: { latitude: number; longitude: number; accuracy?: number; address?: string }, userType?: string) => {
    if (!mapInstanceRef.current || !window.L) return;

    const { latitude, longitude, accuracy, address } = location;
    const isCurrentUser = userId === userData?.id || userId === 'current';

    // Remove existing marker
    if (markersRef.current.has(userId)) {
      mapInstanceRef.current.removeLayer(markersRef.current.get(userId));
    }

    // Create new marker
    const icon = window.L.divIcon({
      className: `custom-marker ${isCurrentUser ? 'current-user' : ''}`,
      html: `<div class="marker-pin ${isCurrentUser ? 'current' : ''}"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 20],
    });

    let popupContent = '';
    const displayAddress = address || locationAddress || currentLocation?.address || '';
    const displayAccuracy = accuracy !== undefined ? accuracy : currentLocation?.accuracy;
    
    if (isCurrentUser) {
      // Show accuracy warning if it's too high (more than 1000m)
      const accuracyWarning = displayAccuracy && displayAccuracy > 1000 
        ? `<div style="font-size: 11px; color: #ef4444; margin-top: 4px; padding: 4px; background: #fee2e2; border-radius: 4px;">
            ⚠️ Low accuracy: ±${(displayAccuracy / 1000).toFixed(1)}km - Location may be approximate
          </div>`
        : displayAccuracy && displayAccuracy <= 1000
        ? `<div style="font-size: 11px; color: #10b981; margin-top: 4px;">
            ✓ High accuracy: ±${Math.round(displayAccuracy)}m
          </div>`
        : '';
      
      popupContent = `
        <div style="min-width: 250px; font-family: system-ui;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #10b981;">
            📍 Your Exact Location
          </div>
          <div style="font-size: 12px; margin-bottom: 6px;">
            <strong>Exact Coordinates:</strong><br/>
            Lat: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-weight: bold;">${latitude.toFixed(6)}</code><br/>
            Lng: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-weight: bold;">${longitude.toFixed(6)}</code>
          </div>
          ${displayAddress ? `
            <div style="font-size: 12px; margin-bottom: 6px;">
              <strong>Address:</strong><br/>
              <span style="color: #4b5563;">${displayAddress}</span>
            </div>
          ` : ''}
          ${accuracyWarning}
        </div>
      `;
    } else {
      popupContent = `
        <div style="min-width: 200px; font-family: system-ui;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">
            ${userType || 'User'}
          </div>
          <div style="font-size: 12px; margin-bottom: 4px;">
            <strong>Coordinates:</strong><br/>
            Lat: ${latitude.toFixed(6)}<br/>
            Lng: ${longitude.toFixed(6)}
          </div>
          ${displayAddress ? `
            <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
              ${displayAddress}
            </div>
          ` : ''}
        </div>
      `;
    }

    const marker = window.L.marker([latitude, longitude], { icon })
      .addTo(mapInstanceRef.current)
      .bindPopup(popupContent);

    markersRef.current.set(userId, marker);

    // Center map on current user
    if (isCurrentUser) {
      mapInstanceRef.current.setView([latitude, longitude], 15);
      setCurrentLocation({
        _id: userId,
        userId: userId,
        userType: userType || 'Student',
        latitude,
        longitude,
        isActive: true,
        lastUpdated: new Date().toISOString(),
      });
    }
  };

  const updateNearbyMarkers = (locations: NearbyLocation[]) => {
    locations.forEach((item) => {
      updateMapMarker(item.userId, item.location, item.userType);
    });
  };

  const fetchCurrentLocation = async () => {
    try {
      const result = await locationApi.getCurrentLocation();
      if (result.success && result.data) {
        setCurrentLocation(result.data);
        if (mapInstanceRef.current && window.L) {
          updateMapMarker(result.data.userId, {
            latitude: result.data.latitude,
            longitude: result.data.longitude,
          }, result.data.userType);
        }
      }
    } catch (error: any) {
      // Silently handle errors - API may not be available or may timeout
      if (error?.message && !error.message.includes('demo mode')) {
        console.warn('Could not fetch current location:', error.message);
      }
    }
  };

  const fetchLocationHistory = async () => {
    try {
      const result = await locationApi.getLocationHistory(1, 50);
      if (result.success && result.data) {
        setLocationHistory(result.data.items);
      }
    } catch (error: any) {
      // Silently handle errors - API may not be available or may timeout
      // Don't log timeout errors as they're expected if API is unavailable
      if (error?.message && !error.message.includes('timeout') && !error.message.includes('demo mode') && !error.name?.includes('Abort')) {
        console.warn('Could not fetch location history:', error.message);
      }
      // Re-throw to allow caller to handle if needed
      throw error;
    }
  };

  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Use OpenStreetMap Nominatim API for reverse geocoding (free, no API key)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Adhyanguru-Student-Dashboard/1.0',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.address) {
          const addr = data.address;
          const parts = [];
          if (addr.road) parts.push(addr.road);
          if (addr.suburb || addr.neighbourhood) parts.push(addr.suburb || addr.neighbourhood);
          if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
          if (addr.state) parts.push(addr.state);
          if (addr.postcode) parts.push(addr.postcode);
          if (addr.country) parts.push(addr.country);
          return parts.join(', ') || data.display_name || 'Address not available';
        }
        return data.display_name || 'Address not available';
      }
      return 'Address lookup failed';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unable to fetch address';
    }
  };

  const startTracking = async () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser');
      return;
    }

    setIsRequestingPermission(true);

    // First, get current position to request permission and get exact location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsRequestingPermission(false);
        setIsTracking(true);
        const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
        const userId = userData?.id || 'current';

        // Get address for the exact location
        const address = await getAddressFromCoordinates(latitude, longitude);
        setLocationAddress(address);

        // Update map with exact location and pin it
        if (mapInstanceRef.current && window.L) {
          
          // Remove existing marker
          if (markersRef.current.has(userId)) {
            mapInstanceRef.current.removeLayer(markersRef.current.get(userId));
          }

          // Create marker with custom icon
          const icon = window.L.divIcon({
            className: 'custom-marker current-user',
            html: `<div class="marker-pin current"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
          });

          // Create popup with exact location details
          const popupContent = `
            <div style="min-width: 250px; font-family: system-ui;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #10b981;">
                📍 Your Exact Location
              </div>
              <div style="font-size: 12px; margin-bottom: 6px;">
                <strong>Coordinates:</strong><br/>
                Lat: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${latitude.toFixed(6)}</code><br/>
                Lng: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${longitude.toFixed(6)}</code>
              </div>
              <div style="font-size: 12px; margin-bottom: 6px;">
                <strong>Address:</strong><br/>
                <span style="color: #4b5563;">${address}</span>
              </div>
              ${accuracy ? `<div style="font-size: 11px; color: #6b7280;">Accuracy: ±${Math.round(accuracy)}m</div>` : ''}
            </div>
          `;

          const marker = window.L.marker([latitude, longitude], { icon })
            .addTo(mapInstanceRef.current)
            .bindPopup(popupContent)
            .openPopup(); // Auto-open popup to show exact location

          markersRef.current.set(userId, marker);
          
          // Center map on exact location with zoom
          mapInstanceRef.current.setView([latitude, longitude], 17);
        }

        const locationData = {
          latitude,
          longitude,
          accuracy,
          altitude: altitude || undefined,
          heading: heading || undefined,
          speed: speed || undefined,
          address,
          sessionId: socketRef.current?.id,
          deviceInfo: {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            appVersion: '1.0.0',
          },
        };

        // Update via API (handle errors gracefully)
        try {
          const result = await locationApi.updateLocation(locationData);
          if (result.success) {
            setCurrentLocation({
              _id: userId,
              userId: userId,
              userType: userData?.role || 'Student',
              latitude,
              longitude,
              accuracy,
              address,
              isActive: true,
              lastUpdated: new Date().toISOString(),
            });
            
            // Also send via Socket.IO
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('location:update', locationData);
            }
            
            showSuccess('Location tracking started! Exact location pinned on map 📍');
          } else {
            // API returned error but still update locally
            setCurrentLocation({
              _id: userId,
              userId: userId,
              userType: userData?.role || 'Student',
              latitude,
              longitude,
              accuracy,
              address,
              isActive: true,
              lastUpdated: new Date().toISOString(),
            });
            
            // Try Socket.IO if available
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('location:update', locationData);
            }
            
            // Only show error if not a timeout
            if (result.message && !result.message.includes('timeout') && !result.message.includes('demo mode')) {
              console.warn('Location API error:', result.message);
            }
            
            showSuccess('Location tracking started! Exact location pinned on map 📍');
          }
        } catch (error: any) {
          // Still show location on map even if API fails
          setCurrentLocation({
            _id: userId,
            userId: userId,
            userType: userData?.role || 'Student',
            latitude,
            longitude,
            accuracy,
            address,
            isActive: true,
            lastUpdated: new Date().toISOString(),
          });
          
          // Try Socket.IO if available
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('location:update', locationData);
          }
          
          // Silently handle timeouts - they're expected when API is unavailable
          if (error?.message && !error.message.includes('timeout') && !error.message.includes('TimeoutError') && !error.message.includes('demo mode')) {
            console.warn('Location API unavailable, using local tracking only');
          }
          
          showSuccess('Location tracking started! Exact location pinned on map 📍');
        }

        // Start watching position for continuous updates
        const id = navigator.geolocation.watchPosition(
          async (watchPosition) => {
            const { latitude: lat, longitude: lng, accuracy: acc, altitude: alt, heading: hdg, speed: spd } = watchPosition.coords;

            // Get updated address
            const updatedAddress = await getAddressFromCoordinates(lat, lng);
            setLocationAddress(updatedAddress);

            // Update map marker
            if (mapInstanceRef.current && window.L) {
              const userId = userData?.id || 'current';
              if (markersRef.current.has(userId)) {
                const marker = markersRef.current.get(userId);
                marker.setLatLng([lat, lng]);
                marker.setPopupContent(`
                  <div style="min-width: 250px; font-family: system-ui;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #10b981;">
                      📍 Your Exact Location
                    </div>
                    <div style="font-size: 12px; margin-bottom: 6px;">
                      <strong>Coordinates:</strong><br/>
                      Lat: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${lat.toFixed(6)}</code><br/>
                      Lng: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${lng.toFixed(6)}</code>
                    </div>
                    <div style="font-size: 12px; margin-bottom: 6px;">
                      <strong>Address:</strong><br/>
                      <span style="color: #4b5563;">${updatedAddress}</span>
                    </div>
                    ${acc ? `<div style="font-size: 11px; color: #6b7280;">Accuracy: ±${Math.round(acc)}m</div>` : ''}
                  </div>
                `);
              }
            }

            const updateData = {
              latitude: lat,
              longitude: lng,
              accuracy: acc,
              altitude: alt || undefined,
              heading: hdg || undefined,
              speed: spd || undefined,
              address: updatedAddress,
              sessionId: socketRef.current?.id,
              deviceInfo: {
                platform: navigator.platform,
                userAgent: navigator.userAgent,
                appVersion: '1.0.0',
              },
            };

            // Update via API (handle errors gracefully)
            try {
              const result = await locationApi.updateLocation(updateData);
              if (result.success) {
                if (socketRef.current && socketRef.current.connected) {
                  socketRef.current.emit('location:update', updateData);
                }
              }
              
              // Always update local state regardless of API result
              setCurrentLocation({
                _id: userId,
                userId: userId,
                userType: userData?.role || 'Student',
                latitude: lat,
                longitude: lng,
                accuracy: acc,
                address: updatedAddress,
                isActive: true,
                lastUpdated: new Date().toISOString(),
              });
              
              // Try Socket.IO if available even if API failed
              if (!result.success && socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('location:update', updateData);
              }
            } catch (error: any) {
              // Still update local state even if API fails
              setCurrentLocation({
                _id: userId,
                userId: userId,
                userType: userData?.role || 'Student',
                latitude: lat,
                longitude: lng,
                accuracy: acc,
                address: updatedAddress,
                isActive: true,
                lastUpdated: new Date().toISOString(),
              });
              
              // Try Socket.IO if available
              if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('location:update', updateData);
              }
              
              // Silently handle timeouts - they're expected when API is unavailable
              if (error?.message && !error.message.includes('timeout') && !error.message.includes('TimeoutError') && !error.message.includes('demo mode')) {
                console.warn('Location update failed, continuing local tracking');
              }
            }
          },
          (error) => {
            console.error('Geolocation watch error:', error);
            let errorMsg = 'Unable to retrieve your location';
            if (error.code === error.PERMISSION_DENIED) {
              errorMsg = 'Location permission denied. Please allow location access.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMsg = 'Location information unavailable.';
            } else if (error.code === error.TIMEOUT) {
              errorMsg = 'Location request timed out.';
            }
            showError(errorMsg);
            setIsTracking(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );

        setWatchId(id);
      },
      (error) => {
        setIsRequestingPermission(false);
        console.error('Geolocation permission error:', error);
        let errorMsg = 'Unable to access your location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied. Please allow location access in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location information unavailable.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out. Please try again.';
        }
        showError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = async () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    setIsTracking(false);

    // API returns ApiResponse, doesn't throw
    const result = await locationApi.stopLocationTracking();
    
    // Always emit Socket.IO stop event regardless of API result
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('location:stop');
    }
    
    // Silently handle timeouts - they're expected when API is unavailable
    if (!result.success && result.message && !result.message.includes('timeout') && !result.message.includes('TimeoutError') && !result.message.includes('demo mode')) {
      console.warn('Stop tracking API error:', result.message);
    }
    
    showSuccess('Location tracking stopped');
  };

  const searchNearby = async () => {
    if (!currentLocation) {
      showError('Please start location tracking first');
      return;
    }

    try {
      const result = await locationApi.getNearbyLocations(
        currentLocation.latitude,
        currentLocation.longitude,
        searchRadius
      );

      if (result.success && result.data) {
        setNearbyLocations(result.data.locations);
        updateNearbyMarkers(result.data.locations);
        showSuccess(`Found ${result.data.count} nearby locations`);
      }
    } catch (error) {
      console.error('Error searching nearby:', error);
      showError('Failed to search nearby locations');
    }
  };

  const getLocationFromCoordinates = async () => {
    const lat = parseFloat(manualLatitude.trim());
    const lng = parseFloat(manualLongitude.trim());

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      showError('Please enter valid latitude and longitude values');
      return;
    }

    if (lat < -90 || lat > 90) {
      showError('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      showError('Longitude must be between -180 and 180');
      return;
    }

    setIsLoadingManualLocation(true);
    const userId = userData?.id || 'current';

    try {
      // Get address for the coordinates
      const address = await getAddressFromCoordinates(lat, lng);
      setLocationAddress(address);

      // Update map with the location
      if (mapInstanceRef.current && window.L) {
        // Remove existing marker
        if (markersRef.current.has(userId)) {
          mapInstanceRef.current.removeLayer(markersRef.current.get(userId));
        }

        // Create marker with custom icon
        const icon = window.L.divIcon({
          className: 'custom-marker current-user',
          html: `<div class="marker-pin current"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        });

        // Create popup with exact location details
        const popupContent = `
          <div style="min-width: 250px; font-family: system-ui;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #10b981;">
              📍 Location from Coordinates
            </div>
            <div style="font-size: 12px; margin-bottom: 6px;">
              <strong>Coordinates:</strong><br/>
              Lat: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${lat.toFixed(6)}</code><br/>
              Lng: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${lng.toFixed(6)}</code>
            </div>
            <div style="font-size: 12px; margin-bottom: 6px;">
              <strong>Address:</strong><br/>
              <span style="color: #4b5563;">${address}</span>
            </div>
          </div>
        `;

        const marker = window.L.marker([lat, lng], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(popupContent)
          .openPopup(); // Auto-open popup to show location

        markersRef.current.set(userId, marker);
        
        // Center map on location with zoom
        mapInstanceRef.current.setView([lat, lng], 17);

        // Update current location state
        setCurrentLocation({
          _id: userId,
          userId: userId,
          userType: userData?.role || 'Student',
          latitude: lat,
          longitude: lng,
          address,
          isActive: true,
          lastUpdated: new Date().toISOString(),
        });

        // Try to update via API (handle errors gracefully)
        const locationData = {
          latitude: lat,
          longitude: lng,
          address,
          sessionId: socketRef.current?.id,
          deviceInfo: {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            appVersion: '1.0.0',
          },
        };

        // API returns ApiResponse, doesn't throw
        const result = await locationApi.updateLocation(locationData);
        
        // Always try Socket.IO regardless of API result
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('location:update', locationData);
        }
        
        // Silently handle timeouts - they're expected when API is unavailable
        if (!result.success && result.message && !result.message.includes('timeout') && !result.message.includes('TimeoutError') && !result.message.includes('demo mode')) {
          console.warn('Location API unavailable, using local display only');
        }

        showSuccess(`Location set from coordinates! 📍`);
      } else {
        showError('Map not initialized. Please wait for map to load.');
      }
    } catch (error: any) {
      console.error('Error getting location from coordinates:', error);
      showError('Failed to get location from coordinates');
    } finally {
      setIsLoadingManualLocation(false);
    }
  };

  const getCurrentLocationFromBrowser = async () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingManualLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const userId = userData?.id || 'current';

        // Update manual input fields with current coordinates
        setManualLatitude(latitude.toFixed(6));
        setManualLongitude(longitude.toFixed(6));

        // Get address for the exact location
        const address = await getAddressFromCoordinates(latitude, longitude);
        setLocationAddress(address);

        // Update map with exact location and pin it
        if (mapInstanceRef.current && window.L) {
          // Remove existing marker
          if (markersRef.current.has(userId)) {
            mapInstanceRef.current.removeLayer(markersRef.current.get(userId));
          }

          // Create marker with custom icon
          const icon = window.L.divIcon({
            className: 'custom-marker current-user',
            html: `<div class="marker-pin current"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
          });

          // Create popup with exact location details
          const popupContent = `
            <div style="min-width: 250px; font-family: system-ui;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #10b981;">
                📍 Your Exact Location
              </div>
              <div style="font-size: 12px; margin-bottom: 6px;">
                <strong>Coordinates:</strong><br/>
                Lat: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${latitude.toFixed(6)}</code><br/>
                Lng: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${longitude.toFixed(6)}</code>
              </div>
              <div style="font-size: 12px; margin-bottom: 6px;">
                <strong>Address:</strong><br/>
                <span style="color: #4b5563;">${address}</span>
              </div>
              ${accuracy ? `<div style="font-size: 11px; color: #6b7280;">Accuracy: ±${Math.round(accuracy)}m</div>` : ''}
            </div>
          `;

          const marker = window.L.marker([latitude, longitude], { icon })
            .addTo(mapInstanceRef.current)
            .bindPopup(popupContent)
            .openPopup(); // Auto-open popup to show exact location

          markersRef.current.set(userId, marker);
          
          // Center map on exact location with zoom
          mapInstanceRef.current.setView([latitude, longitude], 17);
        }

        // Update current location state
        setCurrentLocation({
          _id: userId,
          userId: userId,
          userType: userData?.role || 'Student',
          latitude,
          longitude,
          accuracy,
          address,
          isActive: true,
          lastUpdated: new Date().toISOString(),
        });

        // Try to update via API (handle errors gracefully)
        const locationData = {
          latitude,
          longitude,
          accuracy,
          address,
          sessionId: socketRef.current?.id,
          deviceInfo: {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            appVersion: '1.0.0',
          },
        };

        // API returns ApiResponse, doesn't throw
        const result = await locationApi.updateLocation(locationData);
        
        // Always try Socket.IO regardless of API result
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('location:update', locationData);
        }
        
        // Silently handle timeouts - they're expected when API is unavailable
        if (!result.success && result.message && !result.message.includes('timeout') && !result.message.includes('TimeoutError') && !result.message.includes('demo mode')) {
          console.warn('Location API unavailable, using local display only');
        }

        setIsLoadingManualLocation(false);
        showSuccess('Exact current location retrieved and pinned! 📍');
      },
      (error) => {
        setIsLoadingManualLocation(false);
        console.error('Geolocation error:', error);
        let errorMsg = 'Unable to retrieve your location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied. Please allow location access in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location information unavailable.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out. Please try again.';
        }
        showError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleGetLocation = () => {
    // If coordinates are entered, use them; otherwise get current location
    if (manualLatitude.trim() && manualLongitude.trim()) {
      getLocationFromCoordinates();
    } else {
      getCurrentLocationFromBrowser();
    }
  };

  const cleanup = () => {
    // Clear geolocation watch
    if (watchId !== null) {
      try {
        navigator.geolocation.clearWatch(watchId);
      } catch (error) {
        // Ignore errors
      }
      setWatchId(null);
    }
    
    // Disconnect socket
    if (socketRef.current) {
      try {
        if (socketRef.current.connected) {
          socketRef.current.disconnect();
        }
      } catch (error) {
        // Ignore errors
      }
      socketRef.current = null;
    }
    
    // Clean up map instance
    if (mapInstanceRef.current && mapRef.current) {
      try {
        // Check if map instance is still valid
        const mapInstance = mapInstanceRef.current as any;
        if (mapInstance && mapInstance._container) {
          // Remove all markers first
          markersRef.current.forEach((marker) => {
            try {
              if (marker && mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(marker);
              }
            } catch (error) {
              // Ignore errors when removing markers
            }
          });
          markersRef.current.clear();
          
          // Remove map instance only if container is still valid
          try {
            mapInstanceRef.current.remove();
          } catch (error: any) {
            // Map may already be removed or container reused - this is expected during hot reload
            if (error.message && !error.message.includes('reused')) {
              // Only log if it's not the expected reuse error
            }
          }
        }
      } catch (error: any) {
        // Map may already be removed or container reused - this is expected during hot reload
        if (error.message && !error.message.includes('reused')) {
          // Only log if it's not the expected reuse error
        }
      } finally {
        mapInstanceRef.current = null;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Analytics & Location Tracking</h1>
          <p className="text-blue-200">Real-time location tracking and analytics</p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={isTracking ? stopTracking : startTracking}
              disabled={isRequestingPermission}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isTracking
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRequestingPermission ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  Requesting Access...
                </>
              ) : isTracking ? (
                <>
                  <Square size={20} />
                  Stop Tracking
                </>
              ) : (
                <>
                  <Play size={20} />
                  Start Tracking & Pin Location
                </>
              )}
            </button>

            <button
              onClick={fetchCurrentLocation}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all"
            >
              <RefreshCw size={20} />
              Refresh Location
            </button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30 w-32"
                placeholder="Radius (m)"
                min={100}
                max={50000}
              />
              <button
                onClick={searchNearby}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all"
              >
                <Search size={20} />
                Find Nearby
              </button>
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-yellow-600 hover:bg-yellow-700 text-white transition-all"
            >
              <History size={20} />
              {showHistory ? 'Hide' : 'Show'} History
            </button>
          </div>

          {/* Manual Coordinate Input */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <MapPin size={18} />
              Enter Coordinates Manually
            </h3>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-blue-200 text-sm mb-1">Latitude</label>
                <input
                  type="number"
                  value={manualLatitude}
                  onChange={(e) => setManualLatitude(e.target.value)}
                  placeholder="e.g., 22.5726"
                  step="any"
                  min="-90"
                  max="90"
                  className="w-full bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-blue-300/50"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-blue-200 text-sm mb-1">Longitude</label>
                <input
                  type="number"
                  value={manualLongitude}
                  onChange={(e) => setManualLongitude(e.target.value)}
                  placeholder="e.g., 88.3639"
                  step="any"
                  min="-180"
                  max="180"
                  className="w-full bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-blue-300/50"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleGetLocation}
                  disabled={isLoadingManualLocation}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingManualLocation ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      Loading...
                    </>
                  ) : (
                    <>
                      <MapPin size={18} />
                      Get Location
                    </>
                  )}
                </button>
                <button
                  onClick={getCurrentLocationFromBrowser}
                  disabled={isLoadingManualLocation}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Get your current exact location from browser"
                >
                  <Navigation size={18} />
                </button>
              </div>
            </div>
            <p className="text-blue-300 text-xs mt-2">
              {manualLatitude && manualLongitude 
                ? 'Click "Get Location" to use entered coordinates, or click the green button to get your current exact location'
                : 'Enter coordinates manually OR click "Get Location" to get your current exact location from browser'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MapPin size={24} />
                Location Map
              </h2>
              <div
                ref={mapRef}
                className="w-full h-[600px] rounded-xl overflow-hidden border border-white/20"
                style={{ zIndex: 1 }}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-900/50">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Current Location */}
            {(currentLocation || locationAddress) && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Navigation size={20} />
                  Your Exact Location
                </h3>
                <div className="space-y-3 text-sm">
                  {currentLocation && (
                    <>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex justify-between mb-2">
                          <span className="text-blue-200">Exact Latitude:</span>
                          <span className="text-white font-bold font-mono">{currentLocation.latitude.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-200">Exact Longitude:</span>
                          <span className="text-white font-bold font-mono">{currentLocation.longitude.toFixed(6)}</span>
                        </div>
                        {currentLocation.accuracy !== undefined && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <div className="flex justify-between mb-1">
                              <span className="text-blue-200">Accuracy:</span>
                              <span className={`font-semibold ${
                                currentLocation.accuracy > 1000 
                                  ? 'text-red-400' 
                                  : currentLocation.accuracy > 500 
                                  ? 'text-yellow-400' 
                                  : 'text-green-300'
                              }`}>
                                ±{currentLocation.accuracy > 1000 
                                  ? `${(currentLocation.accuracy / 1000).toFixed(1)}km` 
                                  : `${Math.round(currentLocation.accuracy)}m`}
                              </span>
                            </div>
                            {currentLocation.accuracy > 1000 && (
                              <p className="text-red-300 text-xs mt-1">
                                ⚠️ Low accuracy - Location may be approximate. Try getting location again for better accuracy.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  {(locationAddress || currentLocation?.address) && (
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-blue-200 text-xs mb-2 font-semibold">Exact Address:</p>
                      <p className="text-white text-sm leading-relaxed">
                        {locationAddress || currentLocation?.address || 'Fetching address...'}
                      </p>
                    </div>
                  )}
                  
                  {currentLocation?.lastUpdated && (
                    <div className="text-center pt-2 border-t border-white/10">
                      <p className="text-blue-300 text-xs">
                        Last Updated: {new Date(currentLocation.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {isTracking && (
                    <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/10">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-300 text-xs font-semibold">Live Tracking Active</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nearby Locations */}
            {nearbyLocations.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Users size={20} />
                  Nearby ({nearbyLocations.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                  {nearbyLocations.map((location, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-semibold text-sm">{location.userType}</span>
                        <span className="text-green-400 text-xs">{location.distanceKm} km</span>
                      </div>
                      <p className="text-blue-200 text-xs">
                        {location.location.latitude.toFixed(4)}, {location.location.longitude.toFixed(4)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location History */}
            {showHistory && locationHistory.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <History size={20} />
                  History ({locationHistory.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {locationHistory.slice(0, 10).map((location, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-2 border border-white/10">
                      <p className="text-white text-xs font-semibold">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </p>
                      <p className="text-blue-300 text-xs">
                        {new Date(location.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Marker Styles */}
      <style>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        .marker-pin {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .marker-pin.current {
          background: #10b981;
          width: 24px;
          height: 24px;
          border: 4px solid white;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}

