import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Award } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [userSkills, setUserSkills] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [proficiency, setProficiency] = useState("beginner");

  useEffect(() => {
    loadProfile();
    loadSkills();
    loadBadges();

    const channel = supabase
      .channel("profile-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_badges",
        },
        () => loadBadges()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_skills",
        },
        () => loadProfile()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: skillsData } = await supabase
      .from("user_skills")
      .select("*, skills(*)")
      .eq("user_id", user.id);

    setProfile(profileData || { id: user.id, full_name: "", bio: "", year: "", major: "" });
    setUserSkills(skillsData || []);
    setLoading(false);
  };

  const loadSkills = async () => {
    const { data } = await supabase.from("skills").select("*").order("name");
    setSkills(data || []);
  };

  const loadBadges = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userBadges } = await supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", user.id);
    
    setBadges(userBadges || []);

    // Load all badges to show progress
    const { data: allBadgesData } = await supabase
      .from("badges")
      .select("*");

    setAllBadges(allBadgesData || []);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: profile.id,
        full_name: profile.full_name,
        bio: profile.bio,
        year: profile.year,
        major: profile.major,
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile updated!" });
    }
    setSaving(false);
  };

  const addSkill = async () => {
    if (!selectedSkill) return;

    const { error } = await supabase.from("user_skills").insert({
      user_id: profile.id,
      skill_id: selectedSkill,
      proficiency,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      loadProfile();
      setSelectedSkill("");
      toast({ title: "Success", description: "Skill added!" });
    }
  };

  const removeSkill = async (skillId: string) => {
    const { error } = await supabase.from("user_skills").delete().eq("id", skillId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      loadProfile();
      toast({ title: "Success", description: "Skill removed!" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent">
            Edit Profile
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Basic Info */}
        <Card className="mb-6 shadow-card">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Full Name</label>
              <Input
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Bio</label>
              <Textarea
                value={profile.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Year</label>
                <Input
                  value={profile.year || ""}
                  onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                  placeholder="e.g., 3rd Year"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Major</label>
                <Input
                  value={profile.major || ""}
                  onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gradient-card">
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="mb-6 shadow-card">
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Add your skills and proficiency levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={proficiency} onValueChange={setProficiency}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addSkill}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {userSkills.map((us) => (
                <Badge
                  key={us.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/20"
                  onClick={() => removeSkill(us.id)}
                >
                  {us.skills.name} ({us.proficiency}) ×
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Badges & Achievements
            </CardTitle>
            <CardDescription>Track your progress and earn badges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allBadges.map((badge) => {
                const earned = badges.find((b) => b.badges.id === badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-lg border transition-all ${
                      earned ? "bg-primary/10 border-primary/20 shadow-sm" : "bg-muted/20 border-muted opacity-70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{badge.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{badge.name}</h4>
                          {earned && (
                            <Badge className="bg-primary text-primary-foreground text-xs">
                              ✓ Earned
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
