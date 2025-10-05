import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const recipientId = searchParams.get("user");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showUserBrowser, setShowUserBrowser] = useState(false);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    if (recipientId && conversations.length > 0) {
      const user = conversations.find((c) => c.id === recipientId);
      if (user) selectConversation(user);
    }
  }, [recipientId, conversations]);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          if (selectedUser) loadMessages();
          initializeChat();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, currentUser]);

  const initializeChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setCurrentUser(profile);

    // Get all users with whom current user has exchanged messages
    const { data: sentMessages } = await supabase
      .from("messages")
      .select("recipient_id")
      .eq("sender_id", user.id);

    const { data: receivedMessages } = await supabase
      .from("messages")
      .select("sender_id")
      .eq("recipient_id", user.id);

    const userIds = new Set([
      ...(sentMessages?.map((m) => m.recipient_id) || []),
      ...(receivedMessages?.map((m) => m.sender_id) || []),
    ]);

    if (userIds.size > 0) {
      const { data: users } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(userIds));

      setConversations(users || []);
    }

    // Get all users for browsing
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id);

    setAllUsers(allProfiles || []);
    setLoading(false);
  };

  const selectConversation = async (user: any) => {
    setSelectedUser(user);
    await loadMessages(user.id);
    await markAsRead(user.id);
  };

  const loadMessages = async (userId?: string) => {
    const otherId = userId || selectedUser?.id;
    if (!otherId || !currentUser) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUser.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${currentUser.id})`
      )
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  const markAsRead = async (senderId: string) => {
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", senderId)
      .eq("recipient_id", currentUser?.id)
      .eq("read", false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    const { error } = await supabase.from("messages").insert({
      sender_id: currentUser.id,
      recipient_id: selectedUser.id,
      content: newMessage.trim(),
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewMessage("");
      loadMessages();
      
      // Add to conversations if not there
      if (!conversations.find((c) => c.id === selectedUser.id)) {
        setConversations([...conversations, selectedUser]);
      }
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent">
            Messages
          </h1>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6 flex gap-4 overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 bg-card/30 rounded-lg border border-border flex flex-col">
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Conversations</h3>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowUserBrowser(!showUserBrowser)}
              >
                {showUserBrowser ? "Hide" : "New Chat"}
              </Button>
            </div>

            {showUserBrowser ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Select a user to message:</p>
                {allUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      selectConversation(user);
                      setShowUserBrowser(false);
                    }}
                    className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-card" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.major}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No conversations yet. Click "New Chat" to start!
              </p>
            ) : (
              <div className="space-y-2">
                {conversations.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => selectConversation(user)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.id === user.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-accent/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-card" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.major}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-card/30 rounded-lg border border-border flex flex-col">
          {selectedUser ? (
            <>
              <div className="border-b p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-card" />
                  <div>
                    <p className="font-semibold">{selectedUser.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.major}</p>
                   </div>
                 </div>
               </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                   })}
                 </div>
               </div>
               <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                  />
                  <Button onClick={sendMessage} className="gradient-card">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
             </>
           ) : (
             <div className="flex-1 flex items-center justify-center p-4">
               <p className="text-muted-foreground">Select a conversation to start messaging</p>
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

export default Messages;
