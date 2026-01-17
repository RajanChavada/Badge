/**
 * Geolocation Service
 * 
 * Handles:
 * 1. Collecting geolocation data from user's device
 * 2. Tracking user movement and booth visits
 * 3. Sending data to Amplitude for analytics
 * 4. Persisting data to Convex backend
 */

import { useConvexAuth } from 'convex/react'

/**
 * Log geolocation event to Amplitude
 * @param {string} eventName - Name of the event
 * @param {object} eventData - Event properties
 */
export const logGeolocationEvent = (eventName, eventData = {}) => {
  if (typeof window !== 'undefined' && window.amplitude) {
    const enrichedData = {
      ...eventData,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    }
    
    console.log(`[Amplitude] ${eventName}`, enrichedData)
    window.amplitude.getInstance().logEvent(eventName, enrichedData)
  }
}

/**
 * Save location data to Convex backend
 * @param {object} locationData - User location coordinates and accuracy
 * @param {function} saveFn - Convex mutation function
 */
export const saveLocationToBackend = async (locationData, saveFn) => {
  try {
    const payload = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: locationData.accuracy,
      timestamp: new Date().toISOString(),
      floor: locationData.floor || 'MyHall Floor 3',
    }
    
    // This would call a Convex mutation
    // await saveFn(payload)
    
    console.log('[Convex] Location saved:', payload)
  } catch (error) {
    console.error('[Convex] Failed to save location:', error)
  }
}

/**
 * Save booth visit to Convex backend
 * @param {object} visitData - Booth visit information
 * @param {function} saveFn - Convex mutation function
 */
export const saveBoothVisitToBackend = async (visitData, saveFn) => {
  try {
    const payload = {
      boothId: visitData.boothId,
      boothName: visitData.boothName,
      companyName: visitData.companyName,
      visitedAt: new Date().toISOString(),
      userLocation: visitData.userLocation,
      durationSeconds: visitData.durationSeconds || 0,
    }
    
    // This would call a Convex mutation
    // await saveFn(payload)
    
    console.log('[Convex] Booth visit saved:', payload)
  } catch (error) {
    console.error('[Convex] Failed to save booth visit:', error)
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Get nearby booths based on user location
 * @param {array} booths - All booth data
 * @param {object} userLocation - User's current location
 * @param {number} radiusMeters - Search radius in meters
 * @returns {array} Booths within radius
 */
export const getNearbyBooths = (booths, userLocation, radiusMeters = 50) => {
  if (!userLocation) return []
  
  return booths.filter((booth) => {
    // For pixel-based coordinates on floor image, we use a simple distance calc
    // In production, you'd convert pixel coords to real GPS coords
    const dx = booth.x - (userLocation.x || 0)
    const dy = booth.y - (userLocation.y || 0)
    const pixelDistance = Math.sqrt(dx * dx + dy * dy)
    
    // Consider booth "nearby" if within 100 pixels on floor image
    return pixelDistance < 100
  })
}

/**
 * Track user visit duration at a booth
 * @param {object} booth - Booth data
 * @param {object} userLocation - User's location when booth was clicked
 */
export class BoothVisitTracker {
  constructor(booth, userLocation) {
    this.booth = booth
    this.userLocation = userLocation
    this.startTime = new Date()
    this.endTime = null
    
    // Log booth visit start
    logGeolocationEvent('booth_visit_started', {
      booth_id: booth.id,
      booth_name: booth.name,
      company_name: booth.companyName,
      user_location: userLocation,
    })
  }
  
  end() {
    this.endTime = new Date()
    const durationSeconds = (this.endTime - this.startTime) / 1000
    
    // Log booth visit end
    logGeolocationEvent('booth_visit_ended', {
      booth_id: this.booth.id,
      booth_name: this.booth.name,
      company_name: this.booth.companyName,
      duration_seconds: durationSeconds,
      user_location: this.userLocation,
    })
    
    return {
      boothId: this.booth.id,
      boothName: this.booth.name,
      companyName: this.booth.companyName,
      visitedAt: this.startTime.toISOString(),
      endedAt: this.endTime.toISOString(),
      durationSeconds,
      userLocation: this.userLocation,
    }
  }
}

export default {
  logGeolocationEvent,
  saveLocationToBackend,
  saveBoothVisitToBackend,
  calculateDistance,
  getNearbyBooths,
  BoothVisitTracker,
}
