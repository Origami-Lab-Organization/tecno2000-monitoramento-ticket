'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wrench, PlusCircle, List, Truck } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/assistencias', label: 'Assistências', icon: List },
    { href: '/motoristas', label: 'Dash por Motorista', icon: Truck },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-brand rounded-lg p-2">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-brand text-lg">Tecno2000</span>
              <span className="text-gray-brand text-sm ml-2">Assistência Técnica</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-brand-light text-brand'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
