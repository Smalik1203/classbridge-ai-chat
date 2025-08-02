import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, LogOut, Edit3, Sparkles } from 'lucide-react';

export default function ChatBot() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [profile, setProfile] = useState(null);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const messagesEndRef = useRef(null);

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
        role: msg.role
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

  const saveMessage = async (role, content) => {
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
      const savedUserMessage = await saveMessage('user', userMessage);
      setMessages(prev => [...prev, { 
        ...savedUserMessage, 
        role: savedUserMessage.role as 'user' | 'assistant' 
      }]);

      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { message: userMessage }
      });

      if (error) throw error;

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

  const handleKeyPress = (e) => {
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

  const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'User';

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
return (
  <div className="h-screen overflow-hidden relative bg-gradient-to-br from-primary/10 via-background to-secondary/10">

    {/* Fixed Header */}
    <header className="fixed top-0 left-0 right-0 h-16 px-4 border-b border-border/30 bg-background/80 backdrop-blur-md z-20 flex items-center">
      <div className="max-w-4xl w-full mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ClassBridge 
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{displayName}</span>
          <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                <Edit3 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Update Display Name</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNameDialogOpen(false)}>Cancel</Button>
                  <Button onClick={updateDisplayName}>Update</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>

    {/* Scrollable Chat */}
    <main className="absolute top-16 bottom-24 left-0 right-0 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-24 space-y-6">
            <Bot className="mx-auto h-10 w-10 text-primary" />
            <h2 className="text-xl font-semibold">Hello {displayName}! 👋</h2>
            <p className="text-muted-foreground max-w-md mx-auto">I'm your AI-powered assistant. Ask me anything about your studies!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <Avatar className="w-8 h-8 border-2 border-background shadow-sm">
                  <AvatarFallback className={
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }>
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap shadow ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-2'
                    : 'bg-muted text-foreground mr-2 border border-border/50'
                }`}>
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 border-2 border-background shadow-sm">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl px-4 py-3 border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                    </div>
                    <span className="text-xs text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </main>

    {/* Fixed Input Bar */}
    <footer className="fixed bottom-0 left-0 right-0 h-24 px-4 py-4 border-t border-border/50 bg-background z-20">
      <div className="max-w-3xl mx-auto">
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
    </footer>
  </div>
);

}
