import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateOTP, storeOTP, verifyOTP, getUsers, saveUser, setCurrentUser } from "@/lib/storage";
import { User } from "@/types";
import { Leaf, Phone, Shield } from "lucide-react";

export default function Login() {
  const [step, setStep] = useState<'phone' | 'otp' | 'signup'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signupData, setSignupData] = useState({
    fullName: '',
    collegeId: '',
    email: '',
    role: 'student' as 'student' | 'staff',
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Check if user exists
    const users = getUsers();
    const existingUser = users.find(u => u.phone === phone);
    
    // Generate and store OTP
    const generatedOTP = generateOTP();
    storeOTP(phone, generatedOTP);
    
    if (existingUser) {
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${phone}. Check console for demo OTP.`,
      });
    } else {
      setStep('signup');
      toast({
        title: "New User",
        description: "Please complete your profile to continue.",
      });
    }
    
    setIsLoading(false);
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast({
        title: "Error",
        description: "Please enter the OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    if (verifyOTP(phone, otp)) {
      const users = getUsers();
      const user = users.find(u => u.phone === phone);
      
      if (user) {
        setCurrentUser(user);
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.fullName}!`,
        });
        navigate('/dashboard');
      }
    } else {
      toast({
        title: "Invalid OTP",
        description: "Please check your OTP and try again",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.fullName || !signupData.collegeId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const generatedOTP = generateOTP();
    storeOTP(phone, generatedOTP);
    
    // Store signup data temporarily
    localStorage.setItem('temp_signup_data', JSON.stringify({ ...signupData, phone }));
    
    setStep('otp');
    toast({
      title: "OTP Sent",
      description: `Verification code sent to ${phone}. Check console for demo OTP.`,
    });
    
    setIsLoading(false);
  };

  const handleSignupOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast({
        title: "Error",
        description: "Please enter the OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    if (verifyOTP(phone, otp)) {
      const tempData = JSON.parse(localStorage.getItem('temp_signup_data') || '{}');
      
      const newUser: User = {
        id: Date.now().toString(),
        fullName: tempData.fullName,
        collegeId: tempData.collegeId,
        email: tempData.email,
        phone: tempData.phone,
        role: tempData.role,
        rewardPoints: 0,
        totalEmissions: 0,
        createdAt: new Date(),
      };
      
      saveUser(newUser);
      setCurrentUser(newUser);
      localStorage.removeItem('temp_signup_data');
      
      toast({
        title: "Account Created",
        description: `Welcome to Green Campus, ${newUser.fullName}!`,
      });
      navigate('/dashboard');
    } else {
      toast({
        title: "Invalid OTP",
        description: "Please check your OTP and try again",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-campus">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-campus">
              <Leaf className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Green Campus</CardTitle>
          <CardDescription>
            {step === 'phone' && "Enter your phone number to continue"}
            {step === 'otp' && "Enter the verification code"}
            {step === 'signup' && "Complete your profile"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={signupData.fullName ? handleSignupOTPVerify : handleOTPVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="pl-10"
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Check browser console for demo OTP: {phone}
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => setStep('phone')}
              >
                Back to Phone
              </Button>
            </form>
          )}

          {step === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={signupData.fullName}
                  onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="collegeId">College ID *</Label>
                <Input
                  id="collegeId"
                  type="text"
                  placeholder="e.g., CS2021001"
                  value={signupData.collegeId}
                  onChange={(e) => setSignupData(prev => ({ ...prev, collegeId: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@university.edu"
                  value={signupData.email}
                  onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select 
                  value={signupData.role} 
                  onValueChange={(value: 'student' | 'staff') => 
                    setSignupData(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => setStep('phone')}
              >
                Back to Phone
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}