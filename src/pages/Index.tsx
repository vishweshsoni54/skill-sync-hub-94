import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, Rocket, MessageSquare, Trophy, Sparkles, ChevronRight } from "lucide-react";
import heroImage from "@/assets/hero-collaboration.jpg";

const Index = () => {
  const features = [
    {
      icon: Users,
      title: "Find Your Team",
      description: "Browse and filter students by skills, interests, and expertise to find perfect project partners.",
      color: "text-primary",
    },
    {
      icon: Rocket,
      title: "Join Projects",
      description: "Discover open projects that match your skills or create your own and recruit talented teammates.",
      color: "text-accent",
    },
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "Collaborate seamlessly with built-in messaging system for instant communication.",
      color: "text-secondary",
    },
    {
      icon: Trophy,
      title: "Build Your Profile",
      description: "Showcase your skills, projects, and achievements with badges and rankings.",
      color: "text-primary",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 gradient-hero opacity-90" />
          <img 
            src={heroImage} 
            alt="Students collaborating" 
            className="w-full h-full object-cover mix-blend-overlay"
          />
        </div>
        
        {/* Floating decorative elements */}
        <div className="absolute inset-0 z-10">
          <div className="absolute top-20 left-10 w-20 h-20 bg-accent/30 rounded-full blur-2xl animate-float" />
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-40 right-20 w-16 h-16 bg-primary-glow/30 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        {/* Content */}
        <div className="relative z-20 container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <Badge className="bg-white/20 text-white border-white/40 backdrop-blur-sm px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Where Student Talent Meets Opportunity
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg">
              Connect. Collaborate.
              <br />
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Create Together.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow">
              SkillMatch is the student-only platform where you showcase your skills, find project partners with complementary expertise, and bring your ideas to life.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                asChild 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 shadow-glow text-lg px-8 py-6 h-auto"
              >
                <Link to="/signup">
                  Get Started Free
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 backdrop-blur-sm text-lg px-8 py-6 h-auto"
              >
                <Link to="/login">Sign In</Link>
              </Button>
            </div>

            <div className="pt-8 flex flex-wrap justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Student-Friendly</span>
              </div>
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                <span>Project-Based</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <span>Skill Recognition</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              Everything You Need to Know
            </h2>
          </div>

          <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-secondary mb-16" />

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="p-8 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-base text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Ready to Find Your Perfect Project Partner?
            </h2>
            <p className="text-xl text-white/90">
              Join hundreds of students already collaborating on SkillMatch. Create your profile in minutes and start connecting today.
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 shadow-glow text-lg px-8 py-6 h-auto"
            >
              <Link to="/signup">
                Join SkillMatch Now
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-card/50">
        <div className="container mx-auto text-center">
          <h3 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent mb-4">
            SkillMatch
          </h3>
          <p className="text-muted-foreground mb-6">
            Connecting students, one project at a time.
          </p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-primary transition-colors">Sign In</Link>
            <Link to="/signup" className="hover:text-primary transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
