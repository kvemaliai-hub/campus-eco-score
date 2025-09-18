import { EmissionFactors, Activity } from '@/types';

// Default emission factors dataset
export const DEFAULT_EMISSION_FACTORS: EmissionFactors = {
  transport: {
    'Walk': 0.0,
    'Cycle': 0.0,
    'Bus': 0.06,
    'Motorcycle': 0.09,
    'Car': 0.21,
    'Train': 0.045,
  },
  food: {
    'Vegan': 1.1,
    'Veg': 1.7,
    'Non-Veg': 2.5,
    'Red-Meat': 6.5,
    'Fast-Food': 3.0,
  },
  electricity: 0.7, // kg CO2 per kWh
};

// Load emission factors from localStorage or return defaults
export function getEmissionFactors(): EmissionFactors {
  try {
    const stored = localStorage.getItem('emission_factors');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading emission factors:', error);
  }
  return DEFAULT_EMISSION_FACTORS;
}

// Save emission factors to localStorage
export function saveEmissionFactors(factors: EmissionFactors): void {
  try {
    localStorage.setItem('emission_factors', JSON.stringify(factors));
  } catch (error) {
    console.error('Error saving emission factors:', error);
  }
}

// Calculate emissions for an activity
export function calculateEmissions(
  travelMode: string,
  distanceKm: number,
  foodItem: string,
  electricityKwh: number = 0,
  factors: EmissionFactors = getEmissionFactors()
): {
  travelEmissions: number;
  foodEmissions: number;
  electricityEmissions: number;
  totalEmissions: number;
} {
  const travelEmissions = distanceKm * (factors.transport[travelMode] || 0);
  const foodEmissions = factors.food[foodItem] || 0;
  const electricityEmissions = electricityKwh * factors.electricity;
  const totalEmissions = travelEmissions + foodEmissions + electricityEmissions;

  return {
    travelEmissions: Number(travelEmissions.toFixed(3)),
    foodEmissions: Number(foodEmissions.toFixed(3)),
    electricityEmissions: Number(electricityEmissions.toFixed(3)),
    totalEmissions: Number(totalEmissions.toFixed(3)),
  };
}

// Points calculation based on daily emissions
export function calculatePoints(dailyEmissions: number, threshold: number = 5.0): number {
  if (dailyEmissions <= threshold) {
    return 100 + Math.round((threshold - dailyEmissions) * 20);
  } else {
    return Math.max(0, 10 - Math.round(dailyEmissions - threshold));
  }
}

// Parse CSV content for emission factors
export function parseEmissionFactorsCSV(csvContent: string, type: 'transport' | 'food'): Record<string, number> {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const result: Record<string, number> = {};

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const [name, value] = lines[i].split(',').map(s => s.trim());
    if (name && value && !isNaN(Number(value))) {
      result[name] = Number(value);
    }
  }

  return result;
}

// Generate example CSV content
export function generateExampleCSV(type: 'transport' | 'food'): string {
  const factors = DEFAULT_EMISSION_FACTORS;
  
  if (type === 'transport') {
    let csv = 'mode,kg_per_km\n';
    Object.entries(factors.transport).forEach(([mode, value]) => {
      csv += `${mode},${value}\n`;
    });
    return csv;
  } else {
    let csv = 'item,kg_per_meal\n';
    Object.entries(factors.food).forEach(([item, value]) => {
      csv += `${item},${value}\n`;
    });
    return csv;
  }
}