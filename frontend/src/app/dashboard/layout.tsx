import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Home, FileText } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold">Amazon Advertising Audit Tool</h1>
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/audits" 
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Audits
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}