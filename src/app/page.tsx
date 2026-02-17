import { Suspense } from 'react';
import MainPage from '@/app/mainPage';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <MainPage />
      </Suspense>
    </main>
  );
}
