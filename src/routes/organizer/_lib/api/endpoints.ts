export const endpoints = {
  // Events
  events: {
    list: '/api/events/',
    create: '/api/events/',
    get: (id: number | string) => `/api/events/${id}`,
    update: (id: number | string) => `/api/events/${id}`,
    delete: (id: number | string) => `/api/events/${id}`,
  },
  
  // Participants
  participants: {
    list: (eventId: number | string) => `/api/events/${eventId}/participants`,
    verify: '/api/participants/verify',
    checkIn: '/api/participants/check-in',
    checkOut: '/api/participants/check-out',
  },
  
  // Proof Submissions
  proofs: {
    list: '/api/proofs',
    approve: (proofId: number | string) => `/api/proofs/${proofId}/approve`,
    reject: (proofId: number | string) => `/api/proofs/${proofId}/reject`,
  },
  
  // ✅ Logs (แก้ไขส่วนนี้)
  logs: {
    list: '/api/logs',
    // ดึง Logs ทั้งหมดของกิจกรรม
    getByEvent: (eventId: number | string) => `/api/events/${eventId}/logs`,
    // ดึง Logs เฉพาะบุคคล
    getByUser: (eventId: number | string, userId: number | string) => `/api/events/${eventId}/participants/${userId}/logs`,
    websocket: 'ws://localhost:3000/api/logs/stream',
  },
  
  // Rewards
  rewards: {
    leaderboard: (eventId: number | string) => `/api/reward-leaderboards/events/${eventId}/users`,
    config: (eventId: number | string) => `/api/reward-leaderboards/configs/event/${eventId}`,
    entries: (configId: number | string) => `/api/reward-leaderboards/configs/${configId}/entries`,
    finalize: (configId: number | string) => `/api/reward-leaderboards/configs/${configId}/finalize`,
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
    changePassword: '/api/users/change-password',
  }
};