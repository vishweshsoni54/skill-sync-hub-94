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

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
    } else {
      setUser(user);
    }
    setLoading(false);
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
            <span className="text-sm text-muted-foreground">
              {user?.user_metadata?.full_name || user?.email}
            </span>
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
            Welcome, {user?.user_metadata?.full_name?.split(' ')[0] || 'Student'}! 👋
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
          <Card className="hover-scale cursor-pointer shadow-card animate-fade-in border-primary/20" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <Users className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Browse Students</CardTitle>
              <CardDescription>
                Find students with complementary skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full gradient-card">
                Explore Profiles
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-scale cursor-pointer shadow-card animate-fade-in border-accent/20" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <Rocket className="w-8 h-8 text-accent mb-2" />
              <CardTitle>Browse Projects</CardTitle>
              <CardDescription>
                Join exciting open projects and collaborate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" style={{ background: 'var(--gradient-accent)' }}>
                View Projects
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-scale cursor-pointer shadow-card animate-fade-in border-secondary/20" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mb-2">
                <span className="text-secondary font-bold">+</span>
              </div>
              <CardTitle>Create Project</CardTitle>
              <CardDescription>
                Start a new project and find teammates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary/10">
                New Project
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Featured Students Preview */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Featured Students</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="hover-scale shadow-card animate-fade-in" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Student Name</CardTitle>
                      <CardDescription>Computer Science • 3rd Year</CardDescription>
                    </div>
                    <div className="w-12 h-12 rounded-full gradient-card" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Passionate about web development and AI. Looking to collaborate on innovative projects.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">React</Badge>
                    <Badge variant="secondary">Python</Badge>
                    <Badge variant="secondary">UI/UX</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Projects Preview */}
        <section>
          <h3 className="text-2xl font-bold mb-6">Open Projects</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Card key={i} className="hover-scale shadow-card animate-fade-in border-l-4 border-l-accent" style={{ animationDelay: `${0.8 + i * 0.1}s` }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>AI Study Assistant</CardTitle>
                      <CardDescription>3 members • Looking for 2 more</CardDescription>
                    </div>
                    <Badge className="bg-accent text-accent-foreground">Open</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Building an AI-powered study assistant to help students organize notes and generate quizzes.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline">React Native</Badge>
                    <Badge variant="outline">TensorFlow</Badge>
                    <Badge variant="outline">MongoDB</Badge>
                  </div>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
