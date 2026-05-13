import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    console.log("Attempting login for email:", email)

    const client = await pool.connect()
    const result = await client.query(
      'SELECT id, email, hashed_password FROM "user" WHERE email = $1',
      [email]
    )
    client.release()

    if (result.rows.length === 0) {
      console.log("Error: User not found in database")
      return NextResponse.json(
        { message: 'User not found' },
        { status: 401 }
      )
    }

    const user = result.rows[0]
    const isValid = await bcrypt.compare(password, user.hashed_password)
    console.log("Password match result:", isValid)

    if (!isValid) {
      return NextResponse.json(
        { message: 'Incorrect password' },
        { status: 401 }
      )
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    )

    return NextResponse.json({ token, userId: user.id })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    )
  }
}
