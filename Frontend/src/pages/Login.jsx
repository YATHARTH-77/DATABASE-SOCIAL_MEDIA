import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import textLogo from "@/assets/text_logo_dbis.png";
import { Loader2 } from "lucide-react"; 

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); 
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

  // --- *** MODIFIED: Real Google Login *** ---
  const handleGoogleLogin = () => {
    // This just redirects the browser to the backend auth route.
    // The backend will then redirect to Google.
    // It's not an async fetch call.
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="w-full max-w-md p-8">
        {/* Logos (unchanged) */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={logo}
            alt="ConnectIT Logo"
            className="w-40 h-40 object-contain -mt-12 -mb-12"
          />
          <img
            src={textLogo}
            alt="ConnectIT"
            className="h-[17rem] -mt-20 -mb-20"
          />
        </div>

        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border -mt-10">
          <h2 className="text-2xl font-bold text-center mb-6 text-foreground">
            Login
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Field (unchanged) */}
            <div>
              <Label
                htmlFor="username"
                className="text-muted-foreground text-xs mb-1"
              >
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-xl"
                required
                disabled={isLoading} 
              />
              <button
                type="button"
                className="text-xs text-primary hover:underline mt-1"
              >
                Forgot Username?
              </button>
            </div>

            {/* Password Field (unchanged) */}
            <div>
              <Label
                htmlFor="password"
                className="text-muted-foreground text-xs mb-1"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl"
                required
                disabled={isLoading} 
              />
              <button
                type="button"
                className="text-xs text-primary hover:underline mt-1"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button (unchanged) */}
            <Button
              type="submit"
              className="w-full gradient-primary text-white font-bold rounded-xl"
              disabled={isLoading} 
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Login"
              )}
            </Button>
          </form>

          {/* Divider (unchanged) */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">
              Or login with
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google Button (changed) */}
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full rounded-xl"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">{/* (svg path unchanged) */}</svg>
            Google
          </Button>

          {/* Register Link (unchanged) */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary font-semibold hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}