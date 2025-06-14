declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      config?: {
        page_path?: string
        page_title?: string
        page_location?: string
        send_page_view?: boolean
        [key: string]: any
      }
    ) => void
  }
}

export {}