import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error: any) {
    // Handle JWT decryption errors gracefully
    // This can happen if NEXTAUTH_SECRET changes or session is corrupted
    if (error?.message?.includes('decryption') || error?.name === 'JWEDecryptionFailed') {
      console.warn('Session decryption failed. User may need to sign in again.');
      // Return null to indicate no valid session, which will trigger re-authentication
      return null;
    }
    // Re-throw other errors
    throw error;
  }
}

