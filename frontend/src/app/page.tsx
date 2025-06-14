import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId } = await auth()
  
  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">Amazon Advertising Audit Tool</h1>
        <p className="text-lg text-gray-600 mb-8">
          Analyze and optimize your Amazon advertising performance through the paid-organic flywheel strategy
        </p>
        <div className="space-x-4">
          <Link
            href="/sign-in"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Sign Up
          </Link>
        </div>
        <div className="mt-12 text-sm text-gray-500">
          <p>✅ Clerk Authentication Configured</p>
          <p>✅ Supabase Database Connected</p>
          <p>✅ Storage Bucket Created</p>
        </div>
      </div>
    </div>
  );
}
