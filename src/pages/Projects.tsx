import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Users, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Projects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [skills, setSkills] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    max_members: 5,
    required_skills: [] as string[],
  });

  useEffect(() => {
    loadProjects();
    loadSkills();

    const channel = supabase
      .channel("projects-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        () => loadProjects()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_members",
        },
        () => loadProjects()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchQuery, projects]);

  const loadSkills = async () => {
    const { data } = await supabase.from("skills").select("*").order("name");
    setSkills(data || []);
  };

  const loadProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select(`
        *,
        profiles!projects_owner_id_fkey(full_name),
        project_members(count),
        project_skills(*, skills(*))
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    setProjects(data || []);
    setFilteredProjects(data || []);
    setLoading(false);
  };

  const filterProjects = () => {
    if (!searchQuery) {
      setFilteredProjects(projects);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = projects.filter(
      (p) =>
        p.title?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.project_skills?.some((ps: any) => ps.skills.name.toLowerCase().includes(query))
    );
    setFilteredProjects(filtered);
  };

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) {
      toast({ title: "Error", description: "Project title is required", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .insert({
        title: newProject.title,
        description: newProject.description,
        max_members: newProject.max_members,
        owner_id: user.id,
        status: "open",
      })
      .select()
      .single();

    if (projectError) {
      toast({ title: "Error", description: projectError.message, variant: "destructive" });
      return;
    }

    // Add owner as member
    await supabase.from("project_members").insert({
      project_id: projectData.id,
      user_id: user.id,
      role: "owner",
    });

    // Add required skills
    if (newProject.required_skills.length > 0) {
      const skillInserts = newProject.required_skills.map((skillId) => ({
        project_id: projectData.id,
        skill_id: skillId,
      }));
      await supabase.from("project_skills").insert(skillInserts);
    }

    toast({ title: "Success", description: "Project created!" });
    setDialogOpen(false);
    setNewProject({ title: "", description: "", max_members: 5, required_skills: [] });
    loadProjects();
  };

  const handleJoinProject = async (projectId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: user.id,
      role: "member",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Joined project!" });
      loadProjects();
    }
  };

  const toggleSkill = (skillId: string) => {
    setNewProject((prev) => ({
      ...prev,
      required_skills: prev.required_skills.includes(skillId)
        ? prev.required_skills.filter((id) => id !== skillId)
        : [...prev.required_skills, skillId],
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
            <h1 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent">
              Open Projects
            </h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-card">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Start a project and find teammates</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Project Title</label>
                  <Input
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    placeholder="Enter project title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Describe your project..."
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Team Members</label>
                  <Input
                    type="number"
                    min="2"
                    max="20"
                    value={newProject.max_members}
                    onChange={(e) => setNewProject({ ...newProject, max_members: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Required Skills</label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                    {skills.map((skill) => (
                      <Badge
                        key={skill.id}
                        variant={newProject.required_skills.includes(skill.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSkill(skill.id)}
                      >
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreateProject} className="w-full gradient-card">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <Card className="mb-8 shadow-card">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search projects by title, description, or required skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 text-sm text-muted-foreground">
          Found {filteredProjects.length} open project{filteredProjects.length !== 1 ? "s" : ""}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            const memberCount = project.project_members?.[0]?.count || 0;
            const spotsLeft = project.max_members - memberCount;

            return (
              <div
                key={project.id}
                className="p-6 bg-card/30 rounded-lg border-l-4 border-l-accent animate-fade-in hover-scale"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      by {project.profiles?.full_name}
                    </p>
                  </div>
                  <Badge className="bg-accent text-accent-foreground">Open</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {project.description || "No description provided."}
                </p>
                {project.project_skills && project.project_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.project_skills.map((ps: any) => (
                      <Badge key={ps.id} variant="outline">
                        {ps.skills.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>
                      {memberCount}/{project.max_members} members
                    </span>
                  </div>
                  {spotsLeft > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleJoinProject(project.id)}
                    >
                      Join Project
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No projects found. Be the first to create one!</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Projects;
