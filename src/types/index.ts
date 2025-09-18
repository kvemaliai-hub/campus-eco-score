// Types for Green Campus Carbon Footprint Tracker

export interface User {
  id: string;
  fullName: string;
  collegeId: string;
  email?: string;
  phone: string;
  role: 'student' | 'staff';
  rewardPoints: number;
  totalEmissions: number; // cumulative kg CO2
  avatar?: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  userId: string;
  date: string; // ISO date string
  travelMode: string;
  distanceKm: number;
  foodItem: string;
  electricityKwh?: number;
  travelEmissions: number; // calculated kg CO2
  foodEmissions: number; // calculated kg CO2
  electricityEmissions: number; // calculated kg CO2
  totalEmissions: number; // sum of all emissions
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'earn' | 'redeem';
  points: number;
  reason: string;
  cafeteria?: string;
  item?: string;
  date: Date;
}

export interface EmissionFactors {
  transport: Record<string, number>; // kg CO2 per km
  food: Record<string, number>; // kg CO2 per meal
  electricity: number; // kg CO2 per kWh
}

export interface CafeteriaItem {
  name: string;
  item: string;
  pointsCost: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalEmissions: number;
  avgDailyEmissions: number;
  topPerformers: User[];
}

export interface UserStats {
  dailyEmissions: { date: string; emissions: number }[];
  weeklyAverage: number;
  monthlyTotal: number;
  rank: number;
  pointsEarned: number;
  pointsSpent: number;
}