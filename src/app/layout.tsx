import type { Metadata } from 'next'
import { Cabin } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'
import { ClerkProvider } from '@clerk/nextjs'

const font = Cabin({weight: '700', subsets: ['latin']})

export const metadata: Metadata = {
  title: 'Cliq | Swipe, Connect & Expand Your Circle',
  description: 'A social network for quick platonic connections.',
  icons: {
    icon: '/favicon.ico'
  }
  
}

/**
 * The RootLayout is the outermost layout of the app
 * It is the parent of all other layouts
 * Essentially, it is the template for the entire app
 * It is the parent of the Navbar, specifically, which is the only component that is always visible
 * Here, we have mostly standard boilerplate combined with some TailwindCSS classes
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`flex flex-col min-h-screen overflow-hidden ${font.className}`}>
          <Navbar />
          <main className="flex flex-col grow">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}