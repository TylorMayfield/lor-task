import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from './mongodb';
import User from './models/User';

// Require a stable NEXTAUTH_SECRET in all environments so JWTs can be decrypted reliably
const getNextAuthSecret = () => {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error(
      'NEXTAUTH_SECRET is not set. Please add NEXTAUTH_SECRET to your .env.local and restart the dev server.'
    );
  }
  return process.env.NEXTAUTH_SECRET;
};

export const authOptions: NextAuthOptions = {
  secret: getNextAuthSecret(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // For demo purposes, we'll allow any email/password
        // In production, implement proper password hashing and verification
        if (!credentials?.email) {
          return null;
        }

        try {
          await connectDB();
        } catch (error) {
          console.error('Database connection failed:', error);
          return null;
        }
        
        let user = await User.findOne({ email: credentials.email });

        if (!user) {
          user = await User.create({
            email: credentials.email,
            name: credentials.email.split('@')[0],
          });
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          await connectDB();
        } catch (error) {
          console.error('Database connection failed:', error);
          return false;
        }
        
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          await User.create({
            email: user.email!,
            name: user.name || profile?.name || '',
            image: user.image || (profile as any)?.picture,
          });
        } else if (user.image && !existingUser.image) {
          existingUser.image = user.image;
          await existingUser.save();
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        try {
          await connectDB();
          const user = await User.findOne({ email: session.user.email });
          if (user) {
            session.user.id = user._id.toString();
          }
        } catch (error) {
          console.error('Database connection failed in session:', error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
};

