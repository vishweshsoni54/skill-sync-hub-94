import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Rocket, LogOut } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
    loadDashboardData();

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        () => loadDashboardData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => loadDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
    } else {
      setUser(user);
      
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);
    }
    setLoading(false);
  };

  const loadDashboardData = async () => {
    // Load featured students
    const { data: studentsData } = await supabase
      .from("profiles")
      .select(`
        *,
        user_skills(*, skills(*))
      `)
      .limit(3);
    setStudents(studentsData || []);

    // Load open projects
    const { data: projectsData } = await supabase
      .from("projects")
      .select(`
        *,
        profiles!projects_owner_id_fkey(full_name),
        project_members(count),
        project_skills(*, skills(*))
      `)
      .eq("status", "open")
      .limit(2);
    setProjects(projectsData || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
    navigate("/");
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
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent">
            SkillMatch
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
              {profile?.full_name || user?.email}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-4xl font-bold mb-2">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
          </h2>
          <p className="text-muted-foreground text-lg">
            Discover talented students and exciting projects
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search by skills, interests, or project names..."
              className="pl-10 h-12 text-lg shadow-card"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-8 animate-fade-in border-l-4 border-l-primary bg-card/30 rounded-lg cursor-pointer hover-scale" style={{ animationDelay: '0.2s' }} onClick={() => navigate("/students")}>
            <Users className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Browse Students</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Find students with complementary skills
            </p>
            <Button className="w-full gradient-card">
              Explore Profiles
            </Button>
          </div>

          <div className="p-8 animate-fade-in border-l-4 border-l-accent bg-card/30 rounded-lg cursor-pointer hover-scale" style={{ animationDelay: '0.3s' }} onClick={() => navigate("/projects")}>
            <Rocket className="w-8 h-8 text-accent mb-4" />
            <h3 className="text-xl font-bold mb-2">Browse Projects</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Join exciting open projects and collaborate
            </p>
            <Button className="w-full" style={{ background: 'var(--gradient-accent)' }}>
              View Projects
            </Button>
          </div>

          <div className="p-8 animate-fade-in border-l-4 border-l-secondary bg-card/30 rounded-lg cursor-pointer hover-scale" style={{ animationDelay: '0.4s' }} onClick={() => navigate("/pitches")}>
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
              <span className="text-secondary font-bold text-xl">💡</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Anonymous Pitches</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Share ideas without revealing identity
            </p>
            <Button variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary/10">
              Browse Pitches
            </Button>
          </div>
        </div>

        {/* Featured Students Preview */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Featured Students</h3>
            <Button variant="link" onClick={() => navigate("/students")}>View All</Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student, i) => (
              <div key={student.id} className="p-6 bg-card/30 rounded-lg border border-border animate-fade-in cursor-pointer hover-scale" style={{ animationDelay: `${0.5 + i * 0.1}s` }} onClick={() => navigate(`/messages?user=${student.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold">{student.full_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {student.major && student.year ? `${student.major} • ${student.year}` : student.major || student.year || "Student"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full gradient-card" />
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {student.bio || "No bio yet."}
                </p>
                {student.user_skills && student.user_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {student.user_skills.slice(0, 3).map((us: any) => (
                      <Badge key={us.id} variant="secondary">{us.skills.name}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Featured Projects Preview */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Open Projects</h3>
            <Button variant="link" onClick={() => navigate("/projects")}>View All</Button>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((project, i) => {
              const memberCount = project.project_members?.[0]?.count || 0;
              return (
                <div key={project.id} className="p-6 bg-card/30 rounded-lg border-l-4 border-l-accent animate-fade-in cursor-pointer hover-scale" style={{ animationDelay: `${0.8 + i * 0.1}s` }} onClick={() => navigate("/projects")}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold">{project.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        by {project.profiles?.full_name} • {memberCount}/{project.max_members} members
                      </p>
                    </div>
                    <Badge className="bg-accent text-accent-foreground">Open</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description || "No description provided."}
                  </p>
                  {project.project_skills && project.project_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.project_skills.slice(0, 3).map((ps: any) => (
                        <Badge key={ps.id} variant="outline">{ps.skills.name}</Badge>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
