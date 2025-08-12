'use client';

import React, { useState } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  avatar?: string;
  action?: {
    label: string;
    link: string;
  };
}

export default function NotifikasiPage() {
  const [notifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <section className="w-full p-4 md:p-8 box-border min-h-full flex flex-col">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap shrink-0">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight">
              Notifications
            </h1>
            <p className="text-base text-gray-400/80 font-light max-w-md">
              Stay updated with real-time alerts and system events
            </p>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-sm text-amber-400 font-medium">{unreadCount} New</span>
              </div>
            )}
            <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all duration-300 text-sm font-medium">
              Mark All Read
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6 flex-1 min-h-0">
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 p-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all duration-300 text-sm"
                />
                <svg className="absolute left-3 top-3.5 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>



            <div className="rounded-2xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 p-4">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Today</span>
                  <span className="text-sm text-white/80 font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">This Week</span>
                  <span className="text-sm text-white/80 font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">This Month</span>
                  <span className="text-sm text-white/80 font-semibold">0</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 overflow-hidden flex flex-col">
            <div className="border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-white/90">Notification Feed</h2>
                  <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-lg">
                    {filteredNotifications.length} items
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white/80 transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white/80 transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto uv-scrollbar">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-white/70 font-medium mb-2">No notifications found</h3>
                  <p className="text-white/40 text-sm text-center max-w-xs">
                    Try adjusting your filters or search query
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`group px-6 py-4 hover:bg-white/[0.03] transition-all duration-300 cursor-pointer ${
                        !notification.read ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border bg-white/5 border-white/10">
                          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-1">
                            <div className="flex items-center gap-3">
                              <h3 className={`text-sm font-semibold ${!notification.read ? 'text-white' : 'text-white/80'}`}>
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                              )}
                            </div>
                            <span className="text-xs text-white/40 whitespace-nowrap">{formatTime(notification.timestamp)}</span>
                          </div>
                          <p className="text-sm text-white/60 mb-3 line-clamp-2">{notification.message}</p>
                          <div className="flex items-center gap-3">
                            {notification.action && (
                              <button className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300">
                                {notification.action.label} →
                              </button>
                            )}
                          </div>
                        </div>
                        <button className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-sm px-6 py-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-medium">Real-time updates active</span>
                </div>
                <button className="text-white/40 hover:text-white/60 font-medium transition-colors duration-300">
                  Load More →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}