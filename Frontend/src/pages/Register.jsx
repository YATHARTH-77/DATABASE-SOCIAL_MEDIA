import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import textLogo from "@/assets/text_logo_dbis.png";
import { Loader2 } from "lucide-react"; // Import a loading icon

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match!",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true); // Set loading to true
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Welcome to ConnectIT!",
          // Updated description to be more clear
          description: "Account created! Please log in to continue.",
        });
        
        // --- CRITICAL UPDATE ---
        // Redirect to LOGIN, not home. The user isn't logged in yet.
        navigate("/login");
      } else {
        // Use toast for errors instead of alert
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
      setIsLoading(false); // Set loading to false
    }
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
            Create Account
          </h2>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Username Field */}
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
                disabled={isLoading} // Disable when loading
              />
            </div>

            {/* Email Field */}
            <div>
              <Label
                htmlFor="email"
                className="text-muted-foreground text-xs mb-1"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
                required
                disabled={isLoading} // Disable when loading
              />
            </div>

            {/* Password Field */}
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
                disabled={isLoading} // Disable when loading
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <Label
                htmlFor="confirmPassword"
                className="text-muted-foreground text-xs mb-1"
              >
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl"
                required
                disabled={isLoading} // Disable when loading
              />
            </div>

            {/* --- UPDATED BUTTON --- */}
            <Button
              type="submit"
              className="w-full gradient-primary text-white font-bold rounded-xl mt-6"
              disabled={isLoading} // Disable when loading
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Register"
              )}
            </Button>
          </form>

          {/* Login Link (unchanged) */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}