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

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        
        localStorage.setItem('user', JSON.stringify(data.user));
        
        navigate("/home");
      } else {
        toast({
          title: "Login Failed",
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

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
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
            <div className="flex flex-col items-center mb-8">
              <img
                src={textLogo}
                alt="ConnectIT"
                className="w-64 h-auto object-contain"
              />
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-center mb-6 text-white">
                Login
              </h2>

              <form onSubmit={handleLogin} className="space-y-5">
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
                    className="w-full rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder:text-white/60 px-4 py-3 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus-visible:ring-2 focus-visible:ring-white/50 transition-all mb-2"
                    // minLength={8}
                    // required
                    disabled={isLoading}
                  />
                </div>

                {/* Login Button */}
                <Button type="submit" className="w-full gradient-sidebar text-white font-bold rounded-xl py-5 text-base -mb-4" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
                </Button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3 ">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">
                  Or login with
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Google Button */}
              <Button
                onClick={handleGoogleLogin}
                variant="gradient"
                className="w-full rounded-xl flex items-center justify-center text-base font-medium text-white hover:opacity-90 transition duration-150 py-5"
                disabled={isLoading}
              >
                <span className="w-full text-center">Google</span>
              </Button>

              {/* Register Link */}
              <p className="text-center text-sm text-white/80 mt-6">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-sm font-semibold bg-gradient-to-r from-[#6B4BFF] to-[#C9A8FF] bg-clip-text text-transparent hover:underline hover:brightness-125 drop-shadow-sm transition duration-150 ease-out focus:outline-none"
                >
                  Register
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