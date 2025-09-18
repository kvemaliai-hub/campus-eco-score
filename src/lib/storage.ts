import { User, Activity, Transaction, CafeteriaItem } from '@/types';

// Local storage keys
const STORAGE_KEYS = {
  USERS: 'green_campus_users',
  ACTIVITIES: 'green_campus_activities',
  TRANSACTIONS: 'green_campus_transactions',
  CURRENT_USER: 'green_campus_current_user',
  OTP_STORE: 'green_campus_otp_store',
} as const;

// Cafeteria redemption catalog
export const CAFETERIA_ITEMS: CafeteriaItem[] = [
  { name: 'BLU', item: 'Coffee Snack', pointsCost: 50 },
  { name: 'NEW', item: 'Sandwich Juice', pointsCost: 75 },
  { name: 'RISE', item: 'Meal Voucher', pointsCost: 120 },
  { name: 'CUP_OF_JOE', item: 'Dessert Voucher', pointsCost: 60 },
];

// Generic storage functions
function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
}

// User management
export function getUsers(): User[] {
  return getFromStorage<User>(STORAGE_KEYS.USERS);
}

export function saveUser(user: User): void {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  saveToStorage(STORAGE_KEYS.USERS, users);
}

export function getCurrentUser(): User | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading current user:', error);
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  } catch (error) {
    console.error('Error saving current user:', error);
  }
}

// Activity management
export function getActivities(): Activity[] {
  return getFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES);
}

export function saveActivity(activity: Activity): void {
  const activities = getActivities();
  activities.push(activity);
  saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);
}

export function getUserActivities(userId: string): Activity[] {
  return getActivities().filter(a => a.userId === userId);
}

// Transaction management
export function getTransactions(): Transaction[] {
  return getFromStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
}

export function saveTransaction(transaction: Transaction): void {
  const transactions = getTransactions();
  transactions.push(transaction);
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
}

export function getUserTransactions(userId: string): Transaction[] {
  return getTransactions().filter(t => t.userId === userId);
}

// OTP simulation
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(phone: string, otp: string): void {
  try {
    const otpStore = JSON.parse(localStorage.getItem(STORAGE_KEYS.OTP_STORE) || '{}');
    otpStore[phone] = { otp, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEYS.OTP_STORE, JSON.stringify(otpStore));
    
    // Log OTP for demo purposes
    console.log(`🔐 OTP for ${phone}: ${otp}`);
  } catch (error) {
    console.error('Error storing OTP:', error);
  }
}

export function verifyOTP(phone: string, otp: string): boolean {
  try {
    const otpStore = JSON.parse(localStorage.getItem(STORAGE_KEYS.OTP_STORE) || '{}');
    const stored = otpStore[phone];
    
    if (!stored) return false;
    
    // OTP expires after 5 minutes
    const isExpired = Date.now() - stored.timestamp > 5 * 60 * 1000;
    if (isExpired) {
      delete otpStore[phone];
      localStorage.setItem(STORAGE_KEYS.OTP_STORE, JSON.stringify(otpStore));
      return false;
    }
    
    if (stored.otp === otp) {
      delete otpStore[phone];
      localStorage.setItem(STORAGE_KEYS.OTP_STORE, JSON.stringify(otpStore));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}

// Demo data seeding
export function seedDemoData(): void {
  const users = getUsers();
  if (users.length > 0) return; // Already seeded

  // Create demo users
  const demoUsers: User[] = [
    {
      id: '1',
      fullName: 'Alice Johnson',
      collegeId: 'CS2021001',
      email: 'alice@university.edu',
      phone: '+1234567890',
      role: 'student',
      rewardPoints: 450,
      totalEmissions: 45.2,
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      fullName: 'Bob Chen',
      collegeId: 'CS2021002',
      phone: '+1234567891',
      role: 'student',
      rewardPoints: 380,
      totalEmissions: 52.8,
      createdAt: new Date('2024-01-16'),
    },
    {
      id: '3',
      fullName: 'Dr. Sarah Wilson',
      collegeId: 'STAFF001',
      email: 'sarah.wilson@university.edu',
      phone: '+1234567892',
      role: 'staff',
      rewardPoints: 620,
      totalEmissions: 38.9,
      createdAt: new Date('2024-01-10'),
    },
  ];

  demoUsers.forEach(saveUser);

  // Create demo activities
  const demoActivities: Activity[] = [
    {
      id: '1',
      userId: '1',
      date: '2024-12-17',
      travelMode: 'Bus',
      distanceKm: 15,
      foodItem: 'Veg',
      electricityKwh: 2.5,
      travelEmissions: 0.9,
      foodEmissions: 1.7,
      electricityEmissions: 1.75,
      totalEmissions: 4.35,
      createdAt: new Date(),
    },
    {
      id: '2',
      userId: '2',
      date: '2024-12-17',
      travelMode: 'Car',
      distanceKm: 20,
      foodItem: 'Non-Veg',
      electricityKwh: 3.0,
      travelEmissions: 4.2,
      foodEmissions: 2.5,
      electricityEmissions: 2.1,
      totalEmissions: 8.8,
      createdAt: new Date(),
    },
  ];

  demoActivities.forEach(saveActivity);

  console.log('✅ Demo data seeded successfully!');
}