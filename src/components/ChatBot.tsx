import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, LogOut, Edit3, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  user_id?: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  email: string;
}

export default function ChatBot() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadMessages();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setDisplayNameInput(data.display_name || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const updateDisplayName = async () => {
    if (!displayNameInput.trim()) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayNameInput.trim() })
        .eq('id', user?.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, display_name: displayNameInput.trim() } : null);
      setNameDialogOpen(false);
      toast({
        title: "Display name updated!",
        description: "Your display name has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating display name:', error);
      toast({
        title: "Error",
        description: "Failed to update display name. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant'
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            user_id: user?.id,
            role,
            content,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setLoading(true);

    try {
      // Save user message
      const savedUserMessage = await saveMessage('user', userMessage);
      setMessages(prev => [...prev, { 
        ...savedUserMessage, 
        role: savedUserMessage.role as 'user' | 'assistant' 
      }]);

      // Call the chatbot edge function
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { message: userMessage }
      });

      if (error) throw error;

      // Save assistant response
      const assistantResponse = data.response;
      const savedAssistantMessage = await saveMessage('assistant', assistantResponse);
      setMessages(prev => [...prev, { 
        ...savedAssistantMessage, 
        role: savedAssistantMessage.role as 'user' | 'assistant' 
      }]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (loadingMessages) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary mx-auto"></div>
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground animate-fade-in">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto p-4 h-screen flex flex-col max-w-4xl">
        {/* Header */}
        <Card className="mb-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Bot className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      ClassBridge AI
                    </h1>
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Educational Assistant
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Welcome back,</span>
                  <span className="font-semibold text-primary">{displayName}</span>
                  <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary/10">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Update Display Name</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input
                            id="displayName"
                            value={displayNameInput}
                            onChange={(e) => setDisplayNameInput(e.target.value)}
                            placeholder="Enter your preferred name"
                            className="mt-2"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setNameDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={updateDisplayName}>
                            Update
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Chat Messages */}
        <Card className="flex-1 flex flex-col bg-card/50 backdrop-blur-sm border-primary/10 shadow-xl">
          <CardContent className="flex-1 flex flex-col p-6">
            <ScrollArea className="flex-1 pr-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Bot className="h-10 w-10 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Hello {displayName}! 👋
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      I'm your AI-powered educational assistant. I'm here to help you with your studies, answer questions, and provide guidance. What would you like to explore today?
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline" className="animate-fade-in">📚 Study Help</Badge>
                    <Badge variant="outline" className="animate-fade-in" style={{animationDelay: '0.1s'}}>🤔 Questions</Badge>
                    <Badge variant="outline" className="animate-fade-in" style={{animationDelay: '0.2s'}}>💡 Explanations</Badge>
                    <Badge variant="outline" className="animate-fade-in" style={{animationDelay: '0.3s'}}>📝 Homework</Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 animate-fade-in ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      <Avatar className="w-8 h-8 border-2 border-background shadow-sm">
                        <AvatarFallback className={`${
                          message.role === 'user' 
                            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
                            : 'bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground'
                        }`}>
                          {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ml-4'
                            : 'bg-gradient-to-br from-muted to-muted/50 text-foreground mr-4 border border-border/50'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex items-start gap-3 animate-fade-in">
                      <Avatar className="w-8 h-8 border-2 border-background shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gradient-to-br from-muted to-muted/50 rounded-2xl px-4 py-3 border border-border/50">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-xs text-muted-foreground">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border/50 pt-4 mt-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message... (Press Enter to send)"
                    disabled={loading}
                    className="pr-12 py-3 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Sparkles className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || loading}
                  size="lg"
                  className="px-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Shift+Enter for a new line
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}