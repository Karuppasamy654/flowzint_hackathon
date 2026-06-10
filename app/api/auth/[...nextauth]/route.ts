import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { authConfig } from '@/auth.config';

// Build full NextAuth config merging existing authConfig with Credentials provider
const options: NextAuthConfig = {
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Ensure credentials are present
        if (!credentials?.email || !credentials?.password) return null;
        await dbConnect();
        // Normalize email to lowercase for consistent lookup
        const email = (credentials.email as string).toLowerCase();
        const user = await User.findOne({ email });
        if (!user) return null;
        // bcrypt.compare expects strings
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;
        // Return minimal user info for JWT token
        return { id: user._id.toString(), email: user.email, name: user.name };
      },
    }),
  ],
};

// Export request handlers directly from NextAuth (App Router compatible)
export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(options);
