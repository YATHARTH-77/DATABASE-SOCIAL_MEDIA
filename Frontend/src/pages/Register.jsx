import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import textLogo from "@/assets/text_logo_dbis.png";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async(e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match!",
        variant: "destructive",
      });
      return;
    }
    else{
      const res = await fetch("http://localhost:5000/api/register", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ username,email,password }),
         });
      const data = await res.json();
      if (data.success){
      toast({
        title: "Welcome to ConnectIT!",
        description: "Your account has been created successfully.",
      });
      navigate("/home");
    }
    else{
      alert(data.message);
    }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          {/* MODIFICATION: Replicating Main Logo styles from Login.jsx */}
          <img 
            src={logo} 
            alt="ConnectIT Logo" 
            className="w-40 h-40 object-contain -mt-12 -mb-12" 
          />
          
          {/* MODIFICATION: Replicating Text Logo styles from Login.jsx */}
          <img 
            src={textLogo} 
            alt="ConnectIT" 
            className="h-[17rem] -mt-20 -mb-20" 
          />
        </div>

        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border -mt-10">
          <h2 className="text-2xl font-bold text-center mb-6 text-foreground">Create Account</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-muted-foreground text-xs mb-1">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-muted-foreground text-xs mb-1">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-muted-foreground text-xs mb-1">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-muted-foreground text-xs mb-1">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <Button type="submit" className="w-full gradient-primary text-white font-bold rounded-xl mt-6">
              Register
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}