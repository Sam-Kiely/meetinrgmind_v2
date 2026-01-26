'use client'

export default function DebugPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Debug</h1>

      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">NEXT_PUBLIC_SUPABASE_URL:</h2>
          <p className="bg-gray-100 p-2 rounded font-mono text-sm">
            {supabaseUrl ? supabaseUrl : 'MISSING'}
          </p>
          <p className="text-sm text-gray-600">
            Length: {supabaseUrl?.length || 0} characters
          </p>
          <p className="text-sm text-gray-600">
            Starts with https: {supabaseUrl?.startsWith('https://') ? 'YES' : 'NO'}
          </p>
        </div>

        <div>
          <h2 className="font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY:</h2>
          <p className="bg-gray-100 p-2 rounded font-mono text-sm">
            {supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING'}
          </p>
          <p className="text-sm text-gray-600">
            Length: {supabaseKey?.length || 0} characters
          </p>
          <p className="text-sm text-gray-600">
            Starts with eyJ: {supabaseKey?.startsWith('eyJ') ? 'YES' : 'NO'}
          </p>
        </div>

        <div>
          <h2 className="font-semibold">All Environment Variables:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(
              Object.fromEntries(
                Object.entries(process.env).filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
              ),
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  )
}