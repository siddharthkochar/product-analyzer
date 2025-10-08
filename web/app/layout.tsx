import type { Metadata } from 'next'
import { Navigation } from '@/components/navigation'
import { QueryProvider } from '@/components/query-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'Product Analyzer',
  description: 'AI-powered product packaging analyzer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
