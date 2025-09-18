import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, TreePine, Recycle, Award } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-campus">
              <Leaf className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-campus bg-clip-text text-transparent">
            Green Campus
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Track your carbon footprint, earn rewards, and help build a sustainable campus community
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/login')} className="text-lg px-8">
              Get Started
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/leaderboard')} className="text-lg px-8">
              View Leaderboard
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="shadow-card">
              <CardHeader>
                <TreePine className="h-8 w-8 text-campus-primary mb-2" />
                <CardTitle>Track Activities</CardTitle>
                <CardDescription>
                  Log your daily transport, food, and energy usage to calculate your carbon footprint
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="shadow-card">
              <CardHeader>
                <Award className="h-8 w-8 text-campus-secondary mb-2" />
                <CardTitle>Earn Rewards</CardTitle>
                <CardDescription>
                  Get points for sustainable choices and redeem them at campus cafeterias
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="shadow-card">
              <CardHeader>
                <Recycle className="h-8 w-8 text-campus-accent mb-2" />
                <CardTitle>Compete & Learn</CardTitle>
                <CardDescription>
                  See how you rank against peers and discover tips to reduce your environmental impact
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
