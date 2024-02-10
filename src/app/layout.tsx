import type { Metadata } from 'next'
import { Cabin } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'
import { ClerkProvider } from '@clerk/nextjs'

// importing the cabin font, which will be used throughout the app as the primary font
const font = Cabin({weight: '700', subsets: ['latin']})

// exporting the metadata for the app - this is used for SEO, and provides title, icons, etc that are seen in the browser tab as well
export const metadata: Metadata = {
  title: 'Cliq | Swipe, Connect & Expand Your Circle',
  description: 'A social network for quick platonic connections',

  icons: {
    icon: '/favicon.ico'
  }
  
}

export default function RootLayout({
  children,
}
  :
  {
  children: React.ReactNode
  }
)
{
  
  /*
        NAME

            RootLayout - the outermost layout of the application; where all the other layouts are nested, and where some global styles are applied

        SYNOPSIS

            RootLayout({children})
            - children: the children of the layout, which are the components that are nested within the layout

        DESCRIPTION
          
              The RootLayout is the outermost layout of the app
              It is the parent of all other layouts
              Essentially, it is the template for the entire app
              It is the parent of the Navbar, specifically, which is the only component that is always visible
              Here, we have mostly standard boilerplate combined with some TailwindCSS classes
            
    */


  return (
    <ClerkProvider>
      <html lang='en'>
        <body className={`flex flex-col min-h-screen overflow-hidden ${font.className}`}>

          <Navbar />

          <main className='flex flex-col grow'>
            {children}
          </main>

        </body>
      </html>
    </ClerkProvider>
  )
}