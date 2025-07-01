// src/background/geofenceTask.ts

import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'

export const GEOFENCE_TASK = 'BATHROOM_GEOFENCE_TASK'

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Geofence task error:', error)
    return
  }

  // The OS passes in an object with eventType and region
  // We know eventType is one of Location.GeofencingEventType
  // and region has identifier, latitude, longitude, radius
  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType
    region: {
      identifier: string
      latitude: number
      longitude: number
      radius: number
    }
  }

  if (eventType === Location.GeofencingEventType.Enter) {
    // Convert meters to feet for the notification
    const feet = Math.round(region.radius * 3.28084)

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚻 Nearby bathroom!',
        body: `You’re within ${feet} ft of a bathroom.`,
        data: { bathroomId: region.identifier },
      },
      trigger: null,
    })
  }
})
