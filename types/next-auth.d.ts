import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    skills?: string[];
    avatarUrl?: string;
    avatarColor?: string;
    location?: string;
  }

  interface Session {
    user: {
      id: string;
      skills?: string[];
      avatarUrl?: string;
      avatarColor?: string;
      location?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    skills?: string[];
    avatarUrl?: string;
    avatarColor?: string;
    location?: string;
  }
}
