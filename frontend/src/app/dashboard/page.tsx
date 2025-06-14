import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Welcome to your Amazon Advertising Audit dashboard!</p>
        <p className="text-gray-600 mt-2">Start by creating a new audit to analyze your advertising performance.</p>
      </div>
    </div>
  )
}