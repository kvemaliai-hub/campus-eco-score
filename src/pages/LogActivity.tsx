import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, saveActivity, saveTransaction, saveUser } from '@/lib/storage';
import { calculateEmissions, calculatePoints, getEmissionFactors } from '@/lib/emissions';
import { Activity, Transaction } from '@/types';
import { Car, Utensils, Zap, Calculator, Award } from 'lucide-react';

export default function LogActivity() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    travelMode: '',
    distanceKm: '',
    foodItem: '',
    electricityKwh: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [emissionFactors, setEmissionFactors] = useState(getEmissionFactors());
  const [previewEmissions, setPreviewEmissions] = useState({
    travelEmissions: 0,
    foodEmissions: 0,
    electricityEmissions: 0,
    totalEmissions: 0,
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    // Update emission factors when component mounts
    setEmissionFactors(getEmissionFactors());
  }, []);

  useEffect(() => {
    // Calculate preview emissions whenever form data changes
    if (formData.travelMode && formData.distanceKm && formData.foodItem) {
      const emissions = calculateEmissions(
        formData.travelMode,
        parseFloat(formData.distanceKm) || 0,
        formData.foodItem,
        parseFloat(formData.electricityKwh) || 0,
        emissionFactors
      );
      setPreviewEmissions(emissions);
    } else {
      setPreviewEmissions({
        travelEmissions: 0,
        foodEmissions: 0,
        electricityEmissions: 0,
        totalEmissions: 0,
      });
    }
  }, [formData, emissionFactors]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to track your activities.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.travelMode || !formData.distanceKm || !formData.foodItem) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const emissions = calculateEmissions(
        formData.travelMode,
        parseFloat(formData.distanceKm),
        formData.foodItem,
        parseFloat(formData.electricityKwh) || 0,
        emissionFactors
      );

      // Create activity record
      const activity: Activity = {
        id: Date.now().toString(),
        userId: currentUser.id,
        date: formData.date,
        travelMode: formData.travelMode,
        distanceKm: parseFloat(formData.distanceKm),
        foodItem: formData.foodItem,
        electricityKwh: parseFloat(formData.electricityKwh) || 0,
        ...emissions,
        createdAt: new Date(),
      };

      saveActivity(activity);

      // Update user's total emissions
      const updatedUser = {
        ...currentUser,
        totalEmissions: currentUser.totalEmissions + emissions.totalEmissions,
      };

      // Calculate and award points
      const pointsEarned = calculatePoints(emissions.totalEmissions);
      if (pointsEarned > 0) {
        updatedUser.rewardPoints += pointsEarned;

        // Create points transaction
        const transaction: Transaction = {
          id: Date.now().toString() + '_points',
          userId: currentUser.id,
          type: 'earn',
          points: pointsEarned,
          reason: emissions.totalEmissions <= 5.0 
            ? `Low daily emissions (${emissions.totalEmissions.toFixed(1)} kg CO₂)`
            : `Daily activity logged`,
          date: new Date(),
        };

        saveTransaction(transaction);
      }

      saveUser(updatedUser);

      toast({
        title: "Activity Logged!",
        description: `Added ${emissions.totalEmissions.toFixed(1)} kg CO₂ to your footprint. ${pointsEarned > 0 ? `Earned ${pointsEarned} points!` : ''}`,
      });

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        travelMode: '',
        distanceKm: '',
        foodItem: '',
        electricityKwh: '',
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
      setIsLoading(false);
    }
  };

  const transportModes = Object.keys(emissionFactors.transport);
  const foodItems = Object.keys(emissionFactors.food);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Log Daily Activity</h1>
        <p className="text-muted-foreground">
          Track your carbon footprint and earn reward points for sustainable choices.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Activity Details</CardTitle>
              <CardDescription>
                Enter your daily activities to calculate your carbon footprint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {/* Travel */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-campus-primary" />
                    <h3 className="font-semibold">Transportation</h3>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="travelMode">Travel Mode</Label>
                      <Select 
                        value={formData.travelMode} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, travelMode: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select travel mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {transportModes.map((mode) => (
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
                        value={formData.distanceKm}
                        onChange={(e) => setFormData(prev => ({ ...prev, distanceKm: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Food */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-campus-secondary" />
                    <h3 className="font-semibold">Food</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="foodItem">Meal Type</Label>
                    <Select 
                      value={formData.foodItem} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, foodItem: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal type" />
                      </SelectTrigger>
                      <SelectContent>
                        {foodItems.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item} ({emissionFactors.food[item]} kg CO₂/meal)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Electricity */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-campus-warning" />
                    <h3 className="font-semibold">Electricity (Optional)</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="electricity">Energy Usage (kWh)</Label>
                    <Input
                      id="electricity"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      value={formData.electricityKwh}
                      onChange={(e) => setFormData(prev => ({ ...prev, electricityKwh: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Electricity factor: {emissionFactors.electricity} kg CO₂/kWh
                    </p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Calculating..." : "Log Activity"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Emissions Preview */}
        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Emissions Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Travel:</span>
                  <span>{previewEmissions.travelEmissions.toFixed(3)} kg CO₂</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Food:</span>
                  <span>{previewEmissions.foodEmissions.toFixed(3)} kg CO₂</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Electricity:</span>
                  <span>{previewEmissions.electricityEmissions.toFixed(3)} kg CO₂</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className={previewEmissions.totalEmissions <= 5 ? "text-campus-success" : "text-campus-warning"}>
                      {previewEmissions.totalEmissions.toFixed(3)} kg CO₂
                    </span>
                  </div>
                </div>
              </div>

              {previewEmissions.totalEmissions > 0 && (
                <div className="mt-4 p-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4" />
                    <span className="font-medium">
                      Potential Points: {calculatePoints(previewEmissions.totalEmissions)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {previewEmissions.totalEmissions <= 5 
                      ? "Great job staying under the 5kg daily target!" 
                      : "Try to reduce emissions to earn more points!"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Daily Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-campus-success">5.0 kg</div>
                <p className="text-sm text-muted-foreground">CO₂ per day</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Stay under this target to earn bonus reward points!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}