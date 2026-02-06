import React from "react"
import type { Metadata } from 'next'
import { Poppins, Geist_Mono } from 'next/font/google'
import FloatingIcons from '@/components/FloatingIcons'
import { AuthProvider } from '@/contexts/AuthContext'
import { ManagerProvider } from '@/contexts/ManagerContext'
import './globals.css'

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-poppins'
});
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EventCash Catering - Premium Event Catering",
  description: 'Elevate your events with exquisite catering services from EventCash Catering. Luxury dining experiences for all occasions.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <ManagerProvider>
            <FloatingIcons />
            {children}
          </ManagerProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
