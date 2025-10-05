import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lightbulb, Plus, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AnonymousPitches = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pitches, setPitches] = useState<any[]>([]);
  const [myPitches, setMyPitches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [skills, setSkills] = useState<any[]>([]);
  const [newPitch, setNewPitch] = useState({
    title: "",
    description: "",
    required_skills: [] as string[],
  });

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("pitches-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anonymous_pitches",
        },
        () => loadData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pitch_interest",
        },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    // Load all open pitches
    const { data: pitchesData } = await supabase
      .from("anonymous_pitches")
      .select("*")
      .eq("status", "open")
      .neq("creator_id", user.id)
      .order("created_at", { ascending: false });

    setPitches(pitchesData || []);

    // Load my pitches
    const { data: myPitchesData } = await supabase
      .from("anonymous_pitches")
      .select(`
        *,
        pitch_interest(*, profiles(*))
      `)
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    setMyPitches(myPitchesData || []);

    // Load skills
    const { data: skillsData } = await supabase.from("skills").select("*").order("name");
    setSkills(skillsData || []);

    setLoading(false);
  };

  const handleCreatePitch = async () => {
    if (!newPitch.title.trim()) {
      toast({ title: "Error", description: "Pitch title is required", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("anonymous_pitches").insert({
      creator_id: user.id,
      title: newPitch.title,
      description: newPitch.description,
      required_skills: newPitch.required_skills,
      status: "open",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Anonymous pitch created!" });
      setDialogOpen(false);
      setNewPitch({ title: "", description: "", required_skills: [] });
      loadData();
    }
  };

  const handleExpressInterest = async (pitchId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("pitch_interest").insert({
      pitch_id: pitchId,
      user_id: user.id,
      message: "I'm interested in joining this project!",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Interest expressed! Creator will see your profile." });
      loadData();
    }
  };

  const handleRevealPitch = async (pitchId: string) => {
    const { error } = await supabase
      .from("anonymous_pitches")
      .update({ status: "revealed", revealed_at: new Date().toISOString() })
      .eq("id", pitchId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Identity revealed to interested users!" });
      loadData();
    }
  };

  const toggleSkill = (skillName: string) => {
    setNewPitch((prev) => ({
      ...prev,
      required_skills: prev.required_skills.includes(skillName)
        ? prev.required_skills.filter((s) => s !== skillName)
        : [...prev.required_skills, skillName],
    }));
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent">
                Anonymous Pitches
              </h1>
              <p className="text-sm text-muted-foreground">Share ideas anonymously, reveal when ready</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-card">
                <Plus className="w-4 h-4 mr-2" />
                Create Pitch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Anonymous Pitch</DialogTitle>
                <DialogDescription>
                  Your identity will remain hidden until you choose to reveal it
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Idea Title</label>
                  <Input
                    value={newPitch.title}
                    onChange={(e) => setNewPitch({ ...newPitch, title: e.target.value })}
                    placeholder="Enter your idea title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    value={newPitch.description}
                    onChange={(e) => setNewPitch({ ...newPitch, description: e.target.value })}
                    placeholder="Describe your idea..."
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Required Skills</label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                    {skills.map((skill) => (
                      <Badge
                        key={skill.id}
                        variant={newPitch.required_skills.includes(skill.name) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSkill(skill.name)}
                      >
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreatePitch} className="w-full gradient-card">
                  Create Anonymous Pitch
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* My Pitches */}
        {myPitches.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-accent" />
              My Pitches
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {myPitches.map((pitch) => (
                <div key={pitch.id} className="p-6 bg-card/30 rounded-lg border-l-4 border-l-secondary">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{pitch.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {pitch.pitch_interest?.length || 0} interested users
                      </p>
                    </div>
                    <Badge variant={pitch.status === "open" ? "default" : "secondary"}>
                      {pitch.status === "open" ? "Anonymous" : "Revealed"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{pitch.description}</p>
                  {pitch.required_skills && pitch.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {pitch.required_skills.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  )}
                  {pitch.status === "open" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleRevealPitch(pitch.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Reveal Identity
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Interested Users:</p>
                      {pitch.pitch_interest?.map((interest: any) => (
                        <div key={interest.id} className="flex items-center gap-2 p-2 bg-accent/10 rounded">
                          <div className="w-8 h-8 rounded-full gradient-card" />
                          <span className="text-sm">{interest.profiles?.full_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Browse Pitches */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Browse Anonymous Ideas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pitches.map((pitch) => (
              <div key={pitch.id} className="p-6 bg-card/30 rounded-lg border border-border animate-fade-in hover-scale">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <EyeOff className="w-4 h-4" />
                    {pitch.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Posted anonymously</p>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {pitch.description}
                </p>
                {pitch.required_skills && pitch.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pitch.required_skills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleExpressInterest(pitch.id)}
                >
                  Express Interest
                </Button>
              </div>
            ))}
          </div>

          {pitches.length === 0 && (
            <Card className="shadow-card">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No anonymous pitches available. Create one to get started!
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
};

export default AnonymousPitches;
