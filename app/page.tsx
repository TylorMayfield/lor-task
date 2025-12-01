
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Dashboard from '@/components/Dashboard';
import LandingPage from '@/components/LandingPage';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <LandingPage />;
  }

  return <Dashboard />;
}

