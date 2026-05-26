import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Our App',
    short_name: 'Our App',
    description: 'A private space for just the two of us.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b', // zinc-950
    theme_color: '#09090b',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  }
}
