export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Amazon Advertising Audit Tool</h1>
        <p className="text-lg text-gray-600 mb-8">Development Environment Ready</p>
        <div className="space-y-2">
          <p>✅ Clerk Authentication Configured</p>
          <p>✅ Supabase Database Connected</p>
          <p>✅ Storage Bucket Created</p>
        </div>
      </div>
    </div>
  );
}
