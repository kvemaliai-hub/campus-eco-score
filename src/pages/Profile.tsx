import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getDefaultUser, getUserTransactions, getCafeteriaItems, saveTransaction, updateUser } from '@/lib/supabase-data';
import { useToast } from '@/hooks/use-toast';
import { User, Award, Gift, Calendar } from 'lucide-react';

export default function Profile() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cafeteriaItems, setCafeteriaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getDefaultUser();
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [userTransactions, items] = await Promise.all([
          getUserTransactions(currentUser.id),
          getCafeteriaItems()
        ]);
        
        setTransactions(userTransactions);
        setCafeteriaItems(items.length > 0 ? items : [
          { name: 'BLU', item: 'Coffee Snack', pointsCost: 50 },
          { name: 'NEW', item: 'Sandwich Juice', pointsCost: 75 },
          { name: 'RISE', item: 'Meal Voucher', pointsCost: 120 },
          { name: 'CUP OF JOE', item: 'Dessert Voucher', pointsCost: 60 },
        ]);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser.id]);

  const handleRedeem = async (item: any) => {
    if (currentUser.rewardPoints < item.pointsCost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${item.pointsCost} points but only have ${currentUser.rewardPoints}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedUser = {
        ...currentUser,
        rewardPoints: currentUser.rewardPoints - item.pointsCost,
      };

      await updateUser(currentUser.id, updatedUser);
      
      await saveTransaction({
        userId: currentUser.id,
        type: 'redeem',
        points: -item.pointsCost,
        reason: `Redeemed ${item.item} from ${item.name}`
      });

      // Refresh transactions
      const userTransactions = await getUserTransactions(currentUser.id);
      setTransactions(userTransactions);

      toast({
        title: "Redemption Successful!",
        description: `${item.item} voucher from ${item.name} redeemed!`,
      });
    } catch (error) {
      console.error('Error redeeming item:', error);
      toast({
        title: "Error",
        description: "Failed to redeem item. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{currentUser.fullName}</p>
              <p className="text-sm text-muted-foreground">{currentUser.collegeId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone: {currentUser.phone}</p>
              {currentUser.email && <p className="text-sm text-muted-foreground">Email: {currentUser.email}</p>}
            </div>
            <Badge variant={currentUser.role === 'staff' ? 'default' : 'secondary'}>
              {currentUser.role.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Eco Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Reward Points:</span>
              <span className="font-bold text-campus-primary">{currentUser.rewardPoints}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Emissions:</span>
              <span>{currentUser.totalEmissions.toFixed(1)} kg CO₂</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Redeem Points
          </CardTitle>
          <CardDescription>Use your reward points at campus cafeterias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cafeteriaItems.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.item}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold">{item.pointsCost} pts</span>
                  <Button 
                    size="sm" 
                    onClick={() => handleRedeem(item)}
                    disabled={currentUser.rewardPoints < item.pointsCost}
                  >
                    Redeem
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}