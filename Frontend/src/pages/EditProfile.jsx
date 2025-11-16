import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- Base URL (Dynamic for Deployment) ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function EditProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Refs
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  
  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  // 3. Handle Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("profile_pic", file);

    try {
      const res = await fetch(`${API_URL}/api/profile/${user.id}/photo`, {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        // 1. Update local state to show new image immediately
        setProfileData((prev) => ({ ...prev, profile_pic_url: data.profile_pic_url }));
        
        // 2. Update LocalStorage so header/sidebar avatars update immediately
        const updatedUser = { ...user, profile_pic_url: data.profile_pic_url };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        toast({ title: "Success", description: "Profile photo updated!" });
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to upload image.", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 4. Handle Text Data Save
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
        toast({ title: "Success", description: "Profile details updated!" });
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
      <main className="flex-1 p-4 md:p-8 ml-0 md:ml-[22rem] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#5A0395] animate-spin" />
      </main>
    );
  }

  return (
    <>
      {/* Adjusted margins: ml-0 for mobile, ml-[22rem] for desktop */}
      {/* Added pb-24 to prevent bottom nav overlap on mobile */}
      <main className="flex-1 p-4 md:p-8 ml-0 md:ml-[22rem] pb-24 md:pb-8 transition-all duration-300">
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
            <div className="p-4 md:p-6 border-b-2 border-purple-300 bg-gradient-to-r from-[#1D0C69] to-[#5A0395]">
              <h1 className="text-xl md:text-2xl font-bold text-white">Edit Profile</h1>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="p-4 md:p-6 space-y-6 bg-white">
                
                {/* Profile Picture Section */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    {/* Responsive Avatar Size: w-24 on mobile, w-32 on desktop */}
                    <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-purple-200 shadow-md">
                      <AvatarImage src={profileData.profile_pic_url || ''} className="object-cover" />
                      <AvatarFallback className="bg-[#5A0395] text-white text-2xl md:text-4xl">
                        {profileData.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Overlay Loader when uploading */}
                    {isUploadingImage && (
                       <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                       </div>
                    )}
                  </div>

                  {/* Hidden Input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />

                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => fileInputRef.current.click()}
                    disabled={isUploadingImage}
                    className="border-purple-300 text-[#5A0395] hover:bg-purple-100 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Change Photo
                  </Button>
                </div>
                
                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-[#1D0C69] font-semibold">Display Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your display name"
                    autoComplete="off"
                    className="border-purple-300 focus-visible:ring-purple-400 focus-visible:ring-offset-0 bg-white"
                  />
                </div>
                
                {/* Bio Input */}
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

              <div className="p-4 md:p-6 border-t-2 border-purple-300 flex justify-end gap-3 bg-white">
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
                  disabled={isSaving || isUploadingImage}
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