import { supabase } from '@/integrations/supabase/client';
import { User, Activity, Transaction } from '@/types';

// User management
export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  return data.map(user => ({
    id: user.id,
    fullName: user.name,
    collegeId: user.college_id,
    email: user.email,
    phone: user.phone,
    role: user.role as 'student' | 'staff',
    rewardPoints: user.reward_points || 0,
    totalEmissions: Number(user.total_emissions) || 0,
    avatar: user.avatar_url,
    createdAt: new Date(user.created_at)
  })) as User[];
}

export async function getUser(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return {
    id: data.id,
    fullName: data.name,
    collegeId: data.college_id,
    email: data.email,
    phone: data.phone,
    role: data.role as 'student' | 'staff',
    rewardPoints: data.reward_points || 0,
    totalEmissions: Number(data.total_emissions) || 0,
    avatar: data.avatar_url,
    createdAt: new Date(data.created_at)
  } as User;
}

export async function updateUser(userId: string, updates: Partial<User>) {
  const { error } = await supabase
    .from('users')
    .update({
      name: updates.fullName,
      college_id: updates.collegeId,
      email: updates.email,
      phone: updates.phone,
      role: updates.role,
      reward_points: updates.rewardPoints,
      total_emissions: updates.totalEmissions,
      avatar_url: updates.avatar
    })
    .eq('id', userId);
  
  if (error) {
    console.error('Error updating user:', error);
    return false;
  }
  
  return true;
}

// Activity management
export async function getActivities() {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
  
  return data.map(activity => ({
    id: activity.id,
    userId: activity.user_id,
    date: activity.date,
    travelMode: activity.travel_mode,
    distanceKm: Number(activity.distance) || 0,
    foodItem: activity.food_item,
    electricityKwh: Number(activity.electricity) || 0,
    travelEmissions: Number(activity.travel_emission) || 0,
    foodEmissions: Number(activity.food_emission) || 0,
    electricityEmissions: Number(activity.electricity_emission) || 0,
    totalEmissions: Number(activity.total_emission) || 0,
    createdAt: new Date(activity.created_at)
  })) as Activity[];
}

export async function getUserActivities(userId: string) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user activities:', error);
    return [];
  }
  
  return data.map(activity => ({
    id: activity.id,
    userId: activity.user_id,
    date: activity.date,
    travelMode: activity.travel_mode,
    distanceKm: Number(activity.distance) || 0,
    foodItem: activity.food_item,
    electricityKwh: Number(activity.electricity) || 0,
    travelEmissions: Number(activity.travel_emission) || 0,
    foodEmissions: Number(activity.food_emission) || 0,
    electricityEmissions: Number(activity.electricity_emission) || 0,
    totalEmissions: Number(activity.total_emission) || 0,
    createdAt: new Date(activity.created_at)
  })) as Activity[];
}

export async function saveActivity(activity: Omit<Activity, 'id' | 'createdAt'>) {
  const { error } = await supabase
    .from('activities')
    .insert({
      user_id: activity.userId,
      date: activity.date,
      travel_mode: activity.travelMode,
      distance: activity.distanceKm,
      food_item: activity.foodItem,
      electricity: activity.electricityKwh,
      travel_emission: activity.travelEmissions,
      food_emission: activity.foodEmissions,
      electricity_emission: activity.electricityEmissions,
      total_emission: activity.totalEmissions
    });
  
  if (error) {
    console.error('Error saving activity:', error);
    return false;
  }
  
  return true;
}

// Transaction management
export async function getUserTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  
  return data.map(transaction => ({
    id: transaction.id,
    userId: transaction.user_id,
    type: transaction.type as 'earn' | 'redeem',
    points: transaction.points,
    reason: transaction.source,
    date: new Date(transaction.created_at)
  })) as Transaction[];
}

export async function saveTransaction(transaction: Omit<Transaction, 'id' | 'date'>) {
  const { error } = await supabase
    .from('transactions')
    .insert({
      user_id: transaction.userId,
      type: transaction.type,
      points: transaction.points,
      source: transaction.reason
    });
  
  if (error) {
    console.error('Error saving transaction:', error);
    return false;
  }
  
  return true;
}

// Cafeteria items
export async function getCafeteriaItems() {
  const { data, error } = await supabase
    .from('cafeteria_items')
    .select('*')
    .order('points_required', { ascending: true });
  
  if (error) {
    console.error('Error fetching cafeteria items:', error);
    return [];
  }
  
  return data.map(item => ({
    name: item.cafeteria,
    item: item.item_name,
    pointsCost: item.points_required
  }));
}

// Emission factors
export async function getEmissionFactors() {
  const { data, error } = await supabase
    .from('emission_factors')
    .select('*');
  
  if (error) {
    console.error('Error fetching emission factors:', error);
    return {
      transport: {},
      food: {},
      electricity: 0.7
    };
  }
  
  const transport: Record<string, number> = {};
  const food: Record<string, number> = {};
  let electricity = 0.7;
  
  data.forEach(factor => {
    if (factor.category === 'transport') {
      transport[factor.name] = Number(factor.factor);
    } else if (factor.category === 'food') {
      food[factor.name] = Number(factor.factor);
    } else if (factor.category === 'electricity') {
      electricity = Number(factor.factor);
    }
  });
  
  return { transport, food, electricity };
}

// Default user (since we're removing authentication)
export function getDefaultUser(): User {
  return {
    id: '1',
    fullName: 'Demo User',
    collegeId: 'DEMO001',
    email: 'demo@university.edu',
    phone: '+1234567890',
    role: 'student',
    rewardPoints: 0,
    totalEmissions: 0,
    createdAt: new Date()
  };
}