import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = "http://localhost:5000";

export default function EditProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Get Logged-in User
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // 2. Fetch current profile data
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/profile/${user.username}?loggedInUserId=${user.id}`);
        const data = await res.json();
        
        if (data.success) {
          setProfileData(data.user);
          setFullName(data.user.full_name || "");
          setBio(data.user.bio || "");
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to load profile data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user, toast]);

  // 3. Handle Save
  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, bio })
      });
      const data = await res.json();
      
      if (data.success) {
        toast({ title: "Success", description: "Profile updated!" });
        navigate("/profile");
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !profileData) {
    return (
      <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#5A0395] animate-spin" />
      </main>
    );
  }

  return (
    <>
      <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] transition-all duration-300">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="mb-4 hover:bg-purple-100 text-[#5A0395]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Card className="shadow-lg rounded-lg overflow-hidden border-2 border-purple-300">
            <div className="p-6 border-b-2 border-purple-300 bg-gradient-to-r from-[#1D0C69] to-[#5A0395]">
              <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-6 bg-white">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-24 h-24 border-2 border-purple-200">
                    <AvatarImage src={profileData.profile_pic_url ? `${API_URL}${profileData.profile_pic_url}` : ''} />
                    <AvatarFallback className="bg-[#5A0395] text-white text-3xl">
                      {profileData.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => toast({title: "Not Implemented"})}
                    className="border-purple-300 text-[#5A0395] hover:bg-purple-100"
                  >
                    Change Photo
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-[#1D0C69] font-semibold">Display Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your display name"
                    autoComplete="off"
                    className="border-purple-300 focus-visible:ring-purple-400 focus-visible:ring-offset-0 bg-white [&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:inherit]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-[#1D0C69] font-semibold">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell everyone a little about yourself..."
                    className="min-h-[100px] border-purple-300 focus-visible:ring-purple-400 focus-visible:ring-offset-0 bg-white resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t-2 border-purple-300 flex justify-end gap-3 bg-white">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/profile")}
                  className="border-purple-300 text-[#5A0395] hover:bg-purple-100"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#1D0C69] to-[#5A0395] text-white hover:opacity-90" 
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}