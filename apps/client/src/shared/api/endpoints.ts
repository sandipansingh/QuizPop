export const openApiSpecPath = '/openapi.json';

export const apiPaths = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  quiz: {
    questions: '/quiz/questions',
    submit: '/quiz/submit',
  },
  user: {
    profile: '/user/profile',
    profileByIdPrefix: '/user/profile',
    profileByUsernamePrefix: '/user/profile/username',
    stats: '/user/stats',
    avatar: '/user/avatar',
  },
  leaderboard: {
    list: '/leaderboard',
  },
  room: {
    create: '/room/create',
    join: '/room/join',
  },
} as const;
