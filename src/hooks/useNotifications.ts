import { useCallback, useEffect, useState } from 'react'

export type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export interface NotifyOptions {
  title: string
  body?: string
  requireInteraction?: boolean
  tag?: string
}

export function useNotifications() {
  const [permission, setPermission] = useState<PermissionState>(() => {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission as PermissionState
  })

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    setPermission(Notification.permission as PermissionState)
  }, [])

  const requestPermission = useCallback(async (): Promise<PermissionState> => {
    if (typeof Notification === 'undefined') return 'unsupported'
    const result = await Notification.requestPermission()
    setPermission(result as PermissionState)
    return result as PermissionState
  }, [])

  const notify = useCallback(
    async (opts: NotifyOptions) => {
      if (permission !== 'granted') return

      // Prefere SW (aparece na Central de Ações mesmo com aba em background)
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg) {
          await reg.showNotification(opts.title, {
            body: opts.body,
            icon: '/icons/icon-192.svg',
            badge: '/icons/icon-192.svg',
            requireInteraction: opts.requireInteraction ?? true,
            tag: opts.tag,
          })
          return
        }
      }

      // Fallback: Notification API direta
      new Notification(opts.title, {
        body: opts.body,
        icon: '/icons/icon-192.svg',
        requireInteraction: opts.requireInteraction ?? true,
        tag: opts.tag,
      })
    },
    [permission]
  )

  return { permission, requestPermission, notify }
}
