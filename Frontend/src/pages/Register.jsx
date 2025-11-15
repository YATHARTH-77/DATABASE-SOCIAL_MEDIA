import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import textLogo from "@/assets/white_text_logo.png";
import { Loader2 } from "lucide-react"; 

export default function Register() {
  // --- Step 1 Fields ---
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // --- Step 2 Field ---
  const [otp, setOtp] = useState("");
  
  // --- UI State ---
  const [step, setStep] = useState(1); // 1 for details, 2 for OTP
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- Step 1: Send OTP ---
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match!",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // We only need to send username and email to check for duplicates and send the OTP
      const res = await fetch("http://localhost:5000/api/register/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "OTP Sent!",
          description: "A 6-digit code has been sent to your email.",
        });
        setStep(2); // Move to OTP verification step
      } else {
        toast({
          title: "Registration Failed",
          description: data.message || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not connect to the server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 2: Verify OTP and Create User ---
  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Now we send all the data, including the password and OTP
      const res = await fetch("http://localhost:5000/api/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, otp }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Welcome to ConnectIT!",
          description: "Account created! Please log in to continue.",
        });
        navigate("/login"); // Redirect to login
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not connect to the server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="w-full max-w-md p-8">
        {/* Logos (unchanged) */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={textLogo}
            alt="ConnectIT"
            className="h-[17rem] -mt-20 -mb-20"
          />
        </div>

        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border -mt-10">
          
          {/* --- Step 1: User Details --- */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-center mb-6 text-foreground">
                Create Account
              </h2>
              <form onSubmit={handleSendOtp} className="space-y-4">
                {/* Username Field */}
                <div>
                  <Label htmlFor="username" className="text-bold-foreground text-xs mb-1">
                    Username
                  </Label>
                  <div className={`rounded-xl p-[3px] overflow-hidden transition focus-within:bg-gradient-to-r focus-within:from-[#6B4BFF] focus-within:to-[#C9A8FF] ${username ? 'bg-gradient-to-r from-[#6B4BFF] to-[#C9A8FF]' : 'bg-transparent'}`}>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full rounded-lg bg-black text-white placeholder:text-white/70 px-3 py-2 border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 transition-all`}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                {/* Email Field */}
                <div>
                  <Label htmlFor="email" className="text-bold-foreground text-xs mb-1">
                    Email
                  </Label>
                  <div className={`rounded-xl p-[3px] overflow-hidden transition focus-within:bg-gradient-to-r focus-within:from-[#6B4BFF] focus-within:to-[#C9A8FF] ${email ? 'bg-gradient-to-r from-[#6B4BFF] to-[#C9A8FF]' : 'bg-transparent'}`}>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full rounded-lg bg-black text-white placeholder:text-white/70 px-3 py-2 border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 transition-all`}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                {/* Password Field */}
                <div>
                  <Label htmlFor="password" className="text-bold-foreground text-xs mb-1">
                    Password
                  </Label>
                  <div className={`rounded-xl p-[3px] overflow-hidden transition focus-within:bg-gradient-to-r focus-within:from-[#6B4BFF] focus-within:to-[#C9A8FF] ${password ? 'bg-gradient-to-r from-[#6B4BFF] to-[#C9A8FF]' : 'bg-transparent'}`}>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full rounded-lg bg-black text-white placeholder:text-white/70 px-3 py-2 border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 transition-all`}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                {/* Confirm Password Field */}
                <div>
                  <Label htmlFor="confirmPassword" className="text-bold-foreground text-xs mb-1">
                    Confirm Password
                  </Label>
                  <div className={`rounded-xl p-[3px] overflow-hidden transition focus-within:bg-gradient-to-r focus-within:from-[#6B4BFF] focus-within:to-[#C9A8FF] ${confirmPassword ? 'bg-gradient-to-r from-[#6B4BFF] to-[#C9A8FF]' : 'bg-transparent'}`}>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full rounded-lg bg-black text-white placeholder:text-white/70 px-3 py-2 border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 transition-all`}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-sidebar text-white font-bold rounded-xl mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
                </Button>
              </form>
            </>
          )}

          {/* --- Step 2: OTP Verification --- */}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold text-center mb-6 text-foreground">
                Verify Your Email
              </h2>
              <p className="text-center text-sm text-muted-foreground -mt-4 mb-6">
                A 6-digit OTP was sent to {email}.
              </p>
              <form onSubmit={handleVerify} className="space-y-4">
                {/* OTP Field */}
                <div>
                  <Label htmlFor="otp" className="text-muted-foreground text-xs mb-1">
                    6-Digit OTP
                  </Label>
                  <div className={`rounded-xl p-[3px] mx-auto overflow-hidden transition focus-within:bg-gradient-to-r focus-within:from-[#6B4BFF] focus-within:to-[#C9A8FF] ${otp ? 'bg-gradient-to-r from-[#6B4BFF] to-[#C9A8FF]' : 'bg-transparent'}`}>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="rounded-lg bg-black text-center text-lg tracking-[0.3em] px-6 py-2 border-0 focus:outline-none focus:ring-0 focus-visible:ring-0"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full gradient-sidebar text-white font-bold rounded-xl mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Register"}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="w-full text-muted-foreground"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  Go Back
                </Button>
              </form>
            </>
          )}

          {/* Login Link (unchanged) */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-sm font-semibold bg-gradient-to-r from-[#6B4BFF] to-[#C9A8FF] bg-clip-text text-transparent hover:underline hover:brightness-125 drop-shadow-sm transition duration-150 ease-out focus:outline-none"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}