import { writable } from 'svelte/store'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  createdAt: number
  data?: any
}

class NotificationStore {
  private store = writable<Notification[]>([])
  private notifications: Notification[] = []

  constructor() {
    this.loadFromLocalStorage()
  }

  subscribe = this.store.subscribe

  add(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      read: false
    }

    this.notifications = [newNotification, ...this.notifications]
    this.store.set(this.notifications)
    this.saveToLocalStorage()
  }

  markAsRead(id: string) {
    this.notifications = this.notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    )
    this.store.set(this.notifications)
    this.saveToLocalStorage()
  }

  markAllAsRead() {
    this.notifications = this.notifications.map(notification => ({ ...notification, read: true }))
    this.store.set(this.notifications)
    this.saveToLocalStorage()
  }

  remove(id: string) {
    this.notifications = this.notifications.filter(notification => notification.id !== id)
    this.store.set(this.notifications)
    this.saveToLocalStorage()
  }

  clear() {
    this.notifications = []
    this.store.set(this.notifications)
    this.saveToLocalStorage()
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  private loadFromLocalStorage() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('notifications')
      if (stored) {
        try {
          this.notifications = JSON.parse(stored)
          this.store.set(this.notifications)
        } catch (e) {
          console.warn('Failed to load notifications from localStorage:', e)
        }
      }
    }
  }

  private saveToLocalStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(this.notifications))
    }
  }
}

export const notificationStore = new NotificationStore()