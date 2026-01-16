export const endpoints = {
  // Events
  events: {
    list: '/api/events/',
    create: '/api/events/',
    get: (id: number) => `/api/events/${id}`,
    update: (id: number) => `/api/events/${id}`,
    delete: (id: number) => `/api/events/${id}`,
  },
  
  // Participants
  participants: {
    list: (eventId: number) => `/api/events/${eventId}/participants`,
    verify: '/api/participants/verify',
    checkIn: '/api/participants/check-in',
    checkOut: '/api/participants/check-out',
  },
  
  // Proof Submissions
  proofs: {
    list: '/api/proofs',
    approve: (proofId: number) => `/api/proofs/${proofId}/approve`,
    reject: (proofId: number) => `/api/proofs/${proofId}/reject`,
  },
  
  // Logs
  logs: {
    list: '/api/logs',
    websocket: 'ws://localhost:3000/api/logs/stream', // ← WebSocket endpoint
  },
  
  // Rewards
  rewards: {
    leaderboard: (eventId: number) => `/api/reward-leaderboards/events/${eventId}/users`,
    config: (eventId: number) => `/api/reward-leaderboards/configs/event/${eventId}`,
    entries: (configId: number) => `/api/reward-leaderboards/configs/${configId}/entries`,
    finalize: (configId: number) => `/api/reward-leaderboards/configs/${configId}/finalize`,
    sendMessage: '/api/rewards/send-message',
  },
  
  // Auth
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
  },
  
  // Users
  users: {
    unlock: '/api/users/unlock',
    profile: '/api/users/profile',
    updateProfile: '/api/users/profile',
    changePassword: '/api/users/change-password', // ← เพิ่มบรรทัดนี้
  }
};