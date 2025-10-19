'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  VideoIcon, 
  CalendarIcon, 
  BriefcaseIcon, 
  SettingsIcon 
} from 'lucide-react'
import { clsx } from 'clsx'

const navigationItems = [
  { name: 'Clips', href: '/', icon: VideoIcon },
  { name: 'Schedule', href: '/schedule', icon: CalendarIcon },
  { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Content Engine
              </h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                      {
                        'border-blue-500 text-gray-900': isActive,
                        'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300': !isActive
                      }
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}