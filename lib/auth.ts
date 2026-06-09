import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from './mongodb';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { authConfig } from '../auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await dbConnect();

        // 1. Find user by email in MongoDB
        const user = await User.findOne({ email: (credentials.email as string).toLowerCase() });
        if (!user) {
          return null;
        }

        // 2. Verify password with bcrypt
        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // 3. Return user profile fields
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl || '',
          avatarColor: user.avatarColor,
          // Ensure skills is a plain array
          skills: user.skills ? [...user.skills] : [],
          location: user.location,
        };
      },
    }),
  ],
});
