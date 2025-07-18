'use client'

import { useSession } from 'next-auth/react'
import { signIn, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function TestAuthPage() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('student1@hust.edu.cn')
  const [password, setPassword] = useState('password123')
  const [result, setResult] = useState<any>(null)

  const handleLogin = async () => {
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    setResult(res)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>
      
      <div className="mb-4">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Session:</strong> {JSON.stringify(session, null, 2)}</p>
        <p><strong>Result:</strong> {JSON.stringify(result, null, 2)}</p>
      </div>

      {!session && (
        <div className="space-y-4">
          <div>
            <label className="block">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 w-full"
            />
          </div>
          <div>
            <label className="block">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 w-full"
            />
          </div>
          <button
            onClick={handleLogin}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Test Login
          </button>
        </div>
      )}

      {session && (
        <button
          onClick={() => signOut()}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Sign Out
        </button>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Test Links:</h2>
        <ul className="space-y-2">
          <li><a href="/topics" className="text-blue-500 underline">/topics (protected)</a></li>
          <li><a href="/dashboard" className="text-blue-500 underline">/dashboard (protected)</a></li>
          <li><a href="/achievements" className="text-blue-500 underline">/achievements (protected)</a></li>
          <li><a href="/login" className="text-blue-500 underline">/login (public)</a></li>
        </ul>
      </div>
    </div>
  )
}