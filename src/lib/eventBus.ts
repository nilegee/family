import { writable } from 'svelte/store'

export interface EventBusEvents {
  gratitudePosted: { itemId: string; content: string }
  pollAnswered: { itemId: string; answerIndex: number; userId: string }
  postCreated: { itemId: string; authorEmail: string; content: string }
  birthdayToday: { userId: string; name: string }
  notificationSent: { type: string; recipientEmail: string; content: string }
  widgetViewed: { widgetType: string; duration: number; userId: string }
  widgetInteracted: { widgetType: string; action: string; userId: string }
}

export type EventType = keyof EventBusEvents

class EventBus {
  private events = writable<{ type: EventType; data: any; timestamp: number }[]>([])

  emit<T extends EventType>(type: T, data: EventBusEvents[T]) {
    this.events.update(events => [
      ...events,
      { type, data, timestamp: Date.now() }
    ])
  }

  subscribe(callback: (events: { type: EventType; data: any; timestamp: number }[]) => void) {
    return this.events.subscribe(callback)
  }

  on<T extends EventType>(type: T, callback: (data: EventBusEvents[T]) => void) {
    return this.events.subscribe(events => {
      const latestEvent = events.find(event => event.type === type && event.timestamp > Date.now() - 1000)
      if (latestEvent) {
        callback(latestEvent.data)
      }
    })
  }
}

export const eventBus = new EventBus()