import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  providers: [], // Empty providers array on the Edge; overridden on the Node server
  session: {
    strategy: 'jwt',
    maxAge: 365 * 24 * 60 * 60, // 1 year session expiry
  },
  pages: {
    signIn: '/login',
    newUser: '/signup/step1',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.skills = (user as any).skills;
        token.avatarUrl = (user as any).avatarUrl;
        token.avatarColor = (user as any).avatarColor;
        token.location = (user as any).location;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        (session.user as any).skills = token.skills;
        (session.user as any).avatarUrl = token.avatarUrl;
        (session.user as any).avatarColor = token.avatarColor;
        (session.user as any).location = token.location;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
