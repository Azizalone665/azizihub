'use client';

import { usePathname } from 'next/navigation';
import Navbar from './ui/Navbar';
import Footer from './ui/Footer';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <main className="min-h-screen">{children}</main>
      {!isAdminRoute && <Footer />}
    </>
  );
}