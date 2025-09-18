import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getDefaultUser, saveActivity, updateUser, saveTransaction, getEmissionFactors } from '@/lib/supabase-data';
import { EmissionFactors } from '@/types';
import { Car, Utensils, Zap, Target, Calculator } from 'lucide-react';

export default function LogActivity() {
  const [loading, setLoading] = useState(false);
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactors>({
    transport: {},
    food: {},
    electricity: 0.7
  });
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    travelMode: '',
    distance: '',
    foodItem: '',
    electricity: ''
  });

  const currentUser = getDefaultUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function loadEmissionFactors() {
      try {
        const factors = await getEmissionFactors();
        setEmissionFactors(factors);

        // If no data from database, use defaults
        if (Object.keys(factors.transport).length === 0) {
          setEmissionFactors({
            transport: {
              'Walk': 0,
              'Cycle': 0,
              'Bus': 0.06,
              'Bike': 0.09,
              'Car': 0.21
            },
            food: {
              'Vegan': 1.1,
              'Veg': 1.7,
              'Non-Veg': 2.5,
              'Red-Meat': 6.5
            },
            electricity: 0.7
          });
        }
      } catch (error) {
        console.error('Error loading emission factors:', error);
        // Use default values
        setEmissionFactors({
          transport: {
            'Walk': 0,
            'Cycle': 0,
            'Bus': 0.06,
            'Bike': 0.09,
            'Car': 0.21
          },
          food: {
            'Vegan': 1.1,
            'Veg': 1.7,
            'Non-Veg': 2.5,
            'Red-Meat': 6.5
          },
          electricity: 0.7
        });
      }
    }

    loadEmissionFactors();
  }, []);

  // Calculate preview emissions
  const previewEmissions = () => {
    const distance = parseFloat(formData.distance) || 0;
    const electricity = parseFloat(formData.electricity) || 0;
    
    const travelEmission = distance * (emissionFactors.transport[formData.travelMode] || 0);
    const foodEmission = emissionFactors.food[formData.foodItem] || 0;
    const electricityEmission = electricity * emissionFactors.electricity;
    const total = travelEmission + foodEmission + electricityEmission;
    
    return {
      travel: travelEmission,
      food: foodEmission,
      electricity: electricityEmission,
      total
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.travelMode || !formData.foodItem) {
      toast({
        title: "Missing Information",
        description: "Please select both travel mode and food item.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const emissions = previewEmissions();
      
      // Save activity
      const activityData = {
        userId: currentUser.id,
        date: formData.date,
        travelMode: formData.travelMode,
        distanceKm: parseFloat(formData.distance) || 0,
        foodItem: formData.foodItem,
        electricityKwh: parseFloat(formData.electricity) || 0,
        travelEmissions: emissions.travel,
        foodEmissions: emissions.food,
        electricityEmissions: emissions.electricity,
        totalEmissions: emissions.total
      };

      await saveActivity(activityData);

      // Update user's total emissions and calculate points
      const updatedTotalEmissions = currentUser.totalEmissions + emissions.total;
      const dailyThreshold = 5.0; // kg CO₂
      let pointsEarned = 0;

      if (emissions.total <= dailyThreshold) {
        pointsEarned = Math.floor(100 + (dailyThreshold - emissions.total) * 20);
      }

      const updatedUser = {
        ...currentUser,
        totalEmissions: updatedTotalEmissions,
        rewardPoints: currentUser.rewardPoints + pointsEarned
      };

      await updateUser(currentUser.id, updatedUser);

      // Save transaction for points earned
      if (pointsEarned > 0) {
        await saveTransaction({
          userId: currentUser.id,
          type: 'earn',
          points: pointsEarned,
          reason: 'Daily activity logged - eco-friendly choices!'
        });
      }

      toast({
        title: "Activity Logged Successfully!",
        description: `Total emissions: ${emissions.total.toFixed(1)} kg CO₂${pointsEarned > 0 ? ` • Earned ${pointsEarned} points!` : ''}`,
      });

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        travelMode: '',
        distance: '',
        foodItem: '',
        electricity: ''
      });

      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: "Error",
        description: "Failed to save activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const emissions = previewEmissions();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Log Daily Activity</h1>
        <p className="text-muted-foreground">
          Track your carbon footprint and earn points for sustainable choices
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Activity Date</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Transportation */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Transportation
                </CardTitle>
                <CardDescription>How did you travel today?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="travelMode">Travel Mode</Label>
                    <Select value={formData.travelMode} onValueChange={(value) => setFormData({ ...formData, travelMode: value })}>
                      <SelectTrigger id="travelMode">
                        <SelectValue placeholder="Select travel mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(emissionFactors.transport).map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode} ({emissionFactors.transport[mode]} kg CO₂/km)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distance">Distance (km)</Label>
                    <Input
                      id="distance"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      value={formData.distance}
                      onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Food */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Food Consumption
                </CardTitle>
                <CardDescription>What type of meals did you have?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="foodItem">Primary Food Type</Label>
                  <Select value={formData.foodItem} onValueChange={(value) => setFormData({ ...formData, foodItem: value })}>
                    <SelectTrigger id="foodItem">
                      <SelectValue placeholder="Select food type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(emissionFactors.food).map((food) => (
                        <SelectItem key={food} value={food}>
                          {food} ({emissionFactors.food[food]} kg CO₂/meal)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Electricity */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Electricity Usage (Optional)
                </CardTitle>
                <CardDescription>Additional electricity consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="electricity">Electricity (kWh)</Label>
                  <Input
                    id="electricity"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    value={formData.electricity}
                    onChange={(e) => setFormData({ ...formData, electricity: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Emission factor: {emissionFactors.electricity} kg CO₂/kWh
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Calculating...' : 'Log Activity & Calculate Emissions'}
              <Calculator className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          {/* Emissions Preview */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Emissions Preview
              </CardTitle>
              <CardDescription>Live calculation based on your inputs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Travel:</span>
                <span className="font-medium">{emissions.travel.toFixed(2)} kg CO₂</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Food:</span>
                <span className="font-medium">{emissions.food.toFixed(2)} kg CO₂</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Electricity:</span>
                <span className="font-medium">{emissions.electricity.toFixed(2)} kg CO₂</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">{emissions.total.toFixed(2)} kg CO₂</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Target */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Daily Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">5.0 kg CO₂</div>
                <p className="text-sm text-muted-foreground">
                  Stay below this to earn bonus points
                </p>
                {emissions.total <= 5.0 && emissions.total > 0 && (
                  <div className="mt-4 p-3 bg-campus-success/10 rounded-lg border border-campus-success/20">
                    <p className="text-sm font-medium text-campus-success">
                      🎉 Great job! You'll earn {Math.floor(100 + (5.0 - emissions.total) * 20)} points!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}