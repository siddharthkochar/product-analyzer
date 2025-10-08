import Link from 'next/link'
import { Package, Upload } from 'lucide-react'

export function Navigation() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <Package className="h-6 w-6" />
            Product Analyzer
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
