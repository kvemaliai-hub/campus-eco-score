import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getDefaultUser, getUsers, getUserActivities, getActivities } from '@/lib/supabase-data';
import { Activity, User } from '@/types';
import { TrendingDown, TrendingUp, Award, Users, Zap, Car } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const [userActivities, setUserActivities] = useState<Activity[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    campusEmissions: 0,
    avgDailyEmissions: 0,
    userRank: 0,
  });
  const [loading, setLoading] = useState(true);

  const currentUser = getDefaultUser();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [activities, allUsers, allActivities] = await Promise.all([
          getUserActivities(currentUser.id),
          getUsers(),
          getActivities()
        ]);

        setUserActivities(activities);

        // Calculate campus stats
        const totalEmissions = allActivities.reduce((sum, a) => sum + a.totalEmissions, 0);
        const avgDaily = totalEmissions / Math.max(allActivities.length, 1);

        // Calculate user rank (based on total emissions - lower is better)
        const rankedUsers = allUsers
          .sort((a, b) => a.totalEmissions - b.totalEmissions)
          .map((user, index) => ({ ...user, rank: index + 1 }));
        
        const userRank = rankedUsers.find(u => u.id === currentUser.id)?.rank || 0;

        setDashboardStats({
          totalUsers: allUsers.length,
          campusEmissions: totalEmissions,
          avgDailyEmissions: avgDaily,
          userRank,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser.id]);

  // Chart data for last 14 days
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const dailyEmissionsData = last14Days.map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    const dateStr = date.toISOString().split('T')[0];
    
    const dayActivities = userActivities.filter(a => a.date === dateStr);
    return dayActivities.reduce((sum, a) => sum + a.totalEmissions, 0);
  });

  const chartData = {
    labels: last14Days,
    datasets: [
      {
        label: 'Daily Emissions (kg CO₂)',
        data: dailyEmissionsData,
        fill: true,
        borderColor: 'hsl(var(--campus-primary))',
        backgroundColor: 'hsl(var(--campus-primary) / 0.1)',
        tension: 0.4,
        pointBackgroundColor: 'hsl(var(--campus-primary))',
        pointBorderColor: 'hsl(var(--campus-primary))',
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Your Carbon Footprint Trend (Last 14 Days)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'kg CO₂',
        },
      },
    },
  };

  const recentActivity = userActivities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const weeklyEmissions = dailyEmissionsData.slice(-7).reduce((sum, val) => sum + val, 0);
  const dailyTarget = 5.0; // kg CO₂
  const weeklyTarget = dailyTarget * 7;
  const progressPercent = Math.min((weeklyTarget - weeklyEmissions) / weeklyTarget * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {currentUser.fullName}! Track your environmental impact.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
            <Award className="h-4 w-4 text-campus-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{dashboardStats.userRank}</div>
            <p className="text-xs text-muted-foreground">
              Out of {dashboardStats.totalUsers} users
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reward Points</CardTitle>
            <Zap className="h-4 w-4 text-campus-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUser.rewardPoints}</div>
            <p className="text-xs text-muted-foreground">
              Available for redemption
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emissions</CardTitle>
            <Car className="h-4 w-4 text-campus-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUser.totalEmissions.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              kg CO₂ lifetime
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
            {progressPercent > 0 ? (
              <TrendingDown className="h-4 w-4 text-campus-success" />
            ) : (
              <TrendingUp className="h-4 w-4 text-campus-error" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyEmissions.toFixed(1)}</div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Target: {weeklyTarget} kg CO₂/week
              </p>
              <Progress value={Math.max(progressPercent, 0)} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Emissions Trend</CardTitle>
          <CardDescription>
            Your daily carbon footprint over the last 14 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Tips */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Your latest logged activities</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.travelMode} • {activity.foodItem}
                      </p>
                    </div>
                    <Badge variant={activity.totalEmissions <= 5 ? "default" : "destructive"}>
                      {activity.totalEmissions.toFixed(1)} kg CO₂
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activities logged yet. Start tracking your carbon footprint!
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Eco Tips</CardTitle>
            <CardDescription>Ways to reduce your carbon footprint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-campus-success rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Use Public Transport</p>
                  <p className="text-xs text-muted-foreground">
                    Buses emit 60% less CO₂ per passenger than cars
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-campus-success rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Choose Plant-Based Meals</p>
                  <p className="text-xs text-muted-foreground">
                    Vegan meals have 85% lower emissions than red meat
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-campus-success rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Walk or Cycle</p>
                  <p className="text-xs text-muted-foreground">
                    Zero emissions and great for your health!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}