import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    await dbConnect();

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: 'demo@example.com' });
    
    if (existingUser) {
      return NextResponse.json({ 
        message: 'Demo user already exists',
        user: {
          email: existingUser.email,
          name: existingUser.name
        }
      });
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 12);
    
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@example.com',
      password: hashedPassword,
      provider: 'credentials',
      emailVerified: new Date(),
    });

    return NextResponse.json({ 
      message: 'Demo user created successfully',
      user: {
        email: demoUser.email,
        name: demoUser.name
      }
    });
    
  } catch (error) {
    console.error('Error setting up demo user:', error);
    return NextResponse.json(
      { error: 'Failed to setup demo user' },
      { status: 500 }
    );
  }
}