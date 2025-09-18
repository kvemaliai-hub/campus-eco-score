import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUsers, getCurrentUser } from '@/lib/storage';
import { User } from '@/types';
import { Trophy, Medal, Award } from 'lucide-react';

export default function Leaderboard() {
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const currentUser = getCurrentUser();

  useEffect(() => {
    const users = getUsers();
    const sorted = users
      .sort((a, b) => a.totalEmissions - b.totalEmissions) // Lower emissions = better
      .slice(0, 10);
    setTopUsers(sorted);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Top eco-friendly campus members</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-campus-primary" />
            Lowest Carbon Footprint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topUsers.map((user, index) => (
              <div 
                key={user.id} 
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  user.id === currentUser?.id ? 'bg-accent border-primary' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                    {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                    {index === 2 && <Award className="h-5 w-5 text-orange-500" />}
                    <span className="font-bold text-lg">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground">{user.collegeId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{user.totalEmissions.toFixed(1)} kg CO₂</p>
                  <Badge variant="outline">{user.rewardPoints} points</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}