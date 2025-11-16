import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import textLogo from "@/assets/white_text_logo1.png";
import { Loader2 } from "lucide-react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation.jsx";

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
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  
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
      const res = await fetch("https://backend-sm-seven.vercel.app/api/register/send-otp", {
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
      const res = await fetch("https://backend-sm-seven.vercel.app/api/register/verify", {
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

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <>
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-background-clip: text;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
          box-shadow: inset 0 0 20px 20px rgba(255, 255, 255, 0.1) !important;
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
      <div 
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        <BackgroundGradientAnimation containerClassName="absolute inset-0" interactive={true} cursor={cursor}>
          <div className="min-h-screen flex items-center justify-center py-8 px-4">
            <div className="w-full max-w-md relative z-10">
              {/* Logo */}
              <div className="flex flex-col items-center mb-6">
                <img
                  src={textLogo}
                  alt="ConnectIT"
                  className="w-64 h-auto object-contain"
                />
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-white/20">
                
                {/* --- Step 1: User Details --- */}
                {step === 1 && (
                  <>
                    <h2 className="text-2xl font-bold text-center mb-4 text-white">
                      Create Account
                    </h2>
                    <form onSubmit={handleSendOtp} className="space-y-3">
                      {/* Username Field */}
                      <div>
                        <Label htmlFor="username" className="text-white text-sm mb-2 block font-medium">
                          Username
                        </Label>
                        <Input
                          id="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder:text-white/60 px-4 py-3 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus-visible:ring-2 focus-visible:ring-white/50 transition-all"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      {/* Email Field */}
                      <div>
                        <Label htmlFor="email" className="text-white text-sm mb-2 block font-medium">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder:text-white/60 px-4 py-3 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus-visible:ring-2 focus-visible:ring-white/50 transition-all"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      {/* Password Field */}
                      <div>
                        <Label htmlFor="password" className="text-white text-sm mb-2 block font-medium">
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onInvalid={(e) => {
                            e.target.setCustomValidity('Password must be at least 8 characters long');
                          }}
                          onInput={(e) => {
                            e.target.setCustomValidity('');
                          }}
                          className="w-full rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder:text-white/60 px-4 py-3 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus-visible:ring-2 focus-visible:ring-white/50 transition-all"
                          minLength={8}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      {/* Confirm Password Field */}
                      <div>
                        <Label htmlFor="confirmPassword" className="text-white text-sm mb-2 block font-medium">
                          Confirm Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onInvalid={(e) => {
                            e.target.setCustomValidity('Password must be at least 8 characters long');
                          }}
                          onInput={(e) => {
                            e.target.setCustomValidity('');
                          }}
                          className="w-full rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder:text-white/60 px-4 py-3 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus-visible:ring-2 focus-visible:ring-white/50 transition-all mb-2"
                          minLength={8}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full gradient-sidebar text-white font-bold rounded-xl py-5 text-base mt-4"
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
                    <h2 className="text-2xl font-bold text-center mb-4 text-white">
                      Verify Your Email
                    </h2>
                    <p className="text-center text-sm text-white/80 mb-6">
                      A 6-digit OTP was sent to {email}.
                    </p>
                    <form onSubmit={handleVerify} className="space-y-4">
                      {/* OTP Field */}
                      <div>
                        <Label htmlFor="otp" className="text-white text-sm mb-2 block font-medium">
                          6-Digit OTP
                        </Label>
                        <Input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full rounded-lg bg-white/10 backdrop-blur-sm text-white text-center text-lg tracking-[0.3em] placeholder:text-white/60 px-4 py-3 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus-visible:ring-2 focus-visible:ring-white/50 transition-all"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full gradient-sidebar text-white font-bold rounded-xl py-5 text-base mt-2"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Register"}
                      </Button>

                      <Button
                        type="button"
                        variant="link"
                        className="w-full text-white/80 hover:text-white"
                        onClick={() => setStep(1)}
                        disabled={isLoading}
                      >
                        Go Back
                      </Button>
                    </form>
                  </>
                )}

                {/* Login Link */}
                <p className="text-center text-sm text-white/80 mt-6">
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
        </BackgroundGradientAnimation>
      </div>
    </>
  );
}