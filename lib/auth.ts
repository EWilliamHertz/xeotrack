import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function getUserIdFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  console.log("\n--- Auth Check ---")
  console.log("1. Header received:", authHeader ? "Yes" : "No")

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("2. Error: Missing or invalid format")
    return null
  }
  
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
    console.log("2. Success! User ID:", decoded.userId || decoded.sub)
    return decoded.userId || decoded.sub 
  } catch (err: any) {
    console.error("2. JWT Verification Failed:", err.message)
    return null
  }
}