'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 border-t bg-white/80 backdrop-blur-lg p-3 md:hidden transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <Link
        href="/register"
        className="block w-full rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors"
      >
        Get Started Free
      </Link>
    </div>
  );
}
