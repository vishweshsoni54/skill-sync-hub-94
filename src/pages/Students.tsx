import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MessageSquare, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [skills, setSkills] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState("all");

  useEffect(() => {
    loadStudents();
    loadSkills();

    const channel = supabase
      .channel("students-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => loadStudents()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_skills",
        },
        () => loadStudents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, selectedSkill, students]);

  const loadSkills = async () => {
    const { data } = await supabase.from("skills").select("*").order("name");
    setSkills(data || []);
  };

  const loadStudents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: studentsData } = await supabase
      .from("profiles")
      .select(`
        *,
        user_skills(*, skills(*)),
        user_badges(*, badges(*))
      `)
      .neq("id", user?.id || "");

    setStudents(studentsData || []);
    setFilteredStudents(studentsData || []);
    setLoading(false);
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(query) ||
          s.bio?.toLowerCase().includes(query) ||
          s.major?.toLowerCase().includes(query) ||
          s.user_skills?.some((us: any) => us.skills.name.toLowerCase().includes(query))
      );
    }

    if (selectedSkill !== "all") {
      filtered = filtered.filter((s) =>
        s.user_skills?.some((us: any) => us.skill_id === selectedSkill)
      );
    }

    setFilteredStudents(filtered);
  };

  const handleMessage = (studentId: string) => {
    navigate(`/messages?user=${studentId}`);
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
            Browse Students
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="mb-8">
          <div className="pt-6">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search by name, skills, or interests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  {skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 text-sm text-muted-foreground">
          Found {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="p-6 animate-fade-in hover-scale">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{student.full_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {student.major && student.year
                      ? `${student.major} • ${student.year}`
                      : student.major || student.year || "Student"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full gradient-card" />
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {student.bio || "No bio yet."}
              </p>
              {student.user_skills && student.user_skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {student.user_skills.slice(0, 3).map((us: any) => (
                    <Badge key={us.id} variant="secondary">
                      {us.skills.name}
                    </Badge>
                  ))}
                  {student.user_skills.length > 3 && (
                    <Badge variant="outline">+{student.user_skills.length - 3}</Badge>
                  )}
                </div>
              )}
              {student.user_badges && student.user_badges.length > 0 && (
                <div className="flex gap-1 mb-4">
                  {student.user_badges.slice(0, 4).map((ub: any) => (
                    <span key={ub.id} className="text-xl" title={ub.badges.name}>
                      {ub.badges.icon}
                    </span>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleMessage(student.id)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No students found matching your criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Students;
