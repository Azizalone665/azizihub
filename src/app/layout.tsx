import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import LayoutWrapper from '@/components/LayoutWrapper'
import FloatingSupportButton from '@/components/ui/FloatingSupportButton'   // <-- add this

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AziziHub - Best Online Shopping',
  description: 'Shop the latest trends in fashion, electronics, and more at AziziHub. Best prices, fast delivery, and secure payments.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <FloatingSupportButton />   {/* <-- render floating button */}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}