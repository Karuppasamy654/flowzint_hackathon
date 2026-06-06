const STORAGE_KEYS = {
  USERS: 'help_social_users',
  REQUESTS: 'help_social_requests',
  CHATS: 'help_social_chats'
};

export const DEFAULT_SKILLS = [
  'Web Development',
  'Content Writing',
  'Mathematics',
  'Mechanics',
  'Design',
  'Mental Health',
  'Career Advice',
  'Productivity',
  'Data Analysis'
];

const generateId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id_${Math.random().toString(36).slice(2, 12)}`;
};

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
};

export function loadUsers() {
  return safeParse(localStorage.getItem(STORAGE_KEYS.USERS), []);
}

export function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function loadRequests() {
  return safeParse(localStorage.getItem(STORAGE_KEYS.REQUESTS), []);
}

export function saveRequests(requests) {
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
}

export function loadChats() {
  return safeParse(localStorage.getItem(STORAGE_KEYS.CHATS), []);
}

export function saveChats(chats) {
  localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
}

const buildSampleUsers = () => [
  {
    id: generateId(),
    name: 'Valerie Kim',
    email: 'valerie@helpflow.app',
    password: 'valerie123',
    bio: 'Product designer who loves turning confusion into clarity.',
    skills: ['Design', 'Content Writing', 'Career Advice']
  },
  {
    id: generateId(),
    name: 'Aamir Khan',
    email: 'aamir@helpflow.app',
    password: 'aamir123',
    bio: 'Software engineer mentoring juniors on frontend systems.',
    skills: ['Web Development', 'Mathematics', 'Productivity']
  },
  {
    id: generateId(),
    name: 'Leila Moss',
    email: 'leila@helpflow.app',
    password: 'leila123',
    bio: 'Community helper focused on mental health and confidence.',
    skills: ['Mental Health', 'Career Advice', 'Mechanics']
  }
];

const buildSampleRequests = (users) => [
  {
    id: generateId(),
    title: 'Landing page review for portfolio',
    description: 'I need a designer or content writer to help improve my portfolio page language and layout.',
    requiredSkills: ['Design', 'Content Writing'],
    urgency: 'Medium',
    status: 'Pending',
    requesterId: users[1].id,
    helperId: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: generateId(),
    title: 'Quick React bug with state update',
    description: 'My component state resets unexpectedly after navigation. Need help debugging.',
    requiredSkills: ['Web Development'],
    urgency: 'High',
    status: 'Pending',
    requesterId: users[2].id,
    helperId: null,
    createdAt: Date.now() - 1000 * 60 * 20,
    updatedAt: Date.now() - 1000 * 60 * 20
  },
  {
    id: generateId(),
    title: 'Need morning focus routine ideas',
    description: 'Working from home is hard. Looking for a better plan to stay focused all day.',
    requiredSkills: ['Productivity', 'Mental Health'],
    urgency: 'Low',
    status: 'Pending',
    requesterId: users[0].id,
    helperId: null,
    createdAt: Date.now() - 1000 * 60 * 45,
    updatedAt: Date.now() - 1000 * 60 * 45
  }
];

export function ensureEngineSeed() {
  let users = loadUsers();
  let requests = loadRequests();
  let chats = loadChats();

  if (!users || users.length === 0) {
    users = buildSampleUsers();
    saveUsers(users);
  }

  if (!requests || requests.length === 0) {
    requests = buildSampleRequests(users);
    saveRequests(requests);
  }

  if (!chats || chats.length === 0) {
    chats = [];
    saveChats(chats);
  }

  return { users, requests, chats };
}

export function findUserByEmail(email) {
  const users = loadUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function updateUser(updatedUser) {
  const users = loadUsers();
  const nextUsers = users.map((user) => (user.id === updatedUser.id ? updatedUser : user));
  saveUsers(nextUsers);
  return nextUsers;
}

export function createUser(user) {
  const users = loadUsers();
  const nextUser = { id: generateId(), ...user };
  const nextUsers = [...users, nextUser];
  saveUsers(nextUsers);
  return nextUser;
}
