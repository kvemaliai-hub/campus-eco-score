import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser, getUserTransactions, CAFETERIA_ITEMS, saveTransaction, saveUser } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { User, Award, Gift, Calendar } from 'lucide-react';

export default function Profile() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const currentUser = getCurrentUser();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      setTransactions(getUserTransactions(currentUser.id));
    }
  }, [currentUser]);

  const handleRedeem = (item: any) => {
    if (!currentUser) return;
    
    if (currentUser.rewardPoints < item.pointsCost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${item.pointsCost} points but only have ${currentUser.rewardPoints}`,
        variant: "destructive",
      });
      return;
    }

    const transaction = {
      id: Date.now().toString(),
      userId: currentUser.id,
      type: 'redeem' as const,
      points: -item.pointsCost,
      reason: `Redeemed ${item.item}`,
      cafeteria: item.name,
      item: item.item,
      date: new Date(),
    };

    const updatedUser = {
      ...currentUser,
      rewardPoints: currentUser.rewardPoints - item.pointsCost,
    };

    saveTransaction(transaction);
    saveUser(updatedUser);
    setTransactions(getUserTransactions(currentUser.id));

    toast({
      title: "Redemption Successful!",
      description: `${item.item} voucher from ${item.name} redeemed!`,
    });
  };

  if (!currentUser) {
    return <div className="text-center">Please log in to view your profile.</div>;
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
            {CAFETERIA_ITEMS.map((item) => (
              <div key={item.name} className="p-4 border rounded-lg">
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