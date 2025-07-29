import React, { useState, useEffect, useRef } from 'react';
import { Card, List, Input, Button, Avatar, Typography, Space, message } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, LogoutOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const { TextArea } = Input;
const { Text } = Typography;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  user_id?: string;
}

export default function ChatBot() {
  const { user, signOut } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

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
      message.error('Failed to load chat history');
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
      message.error('Failed to send message. Please try again.');
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
      message.success('Signed out successfully');
    } catch (error) {
      message.error('Failed to sign out');
    }
  };

  if (loadingMessages) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <Text className="mt-2">Loading chat...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <Card className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">ClassBridge AI Assistant</h1>
              <Text type="secondary">Welcome, {user?.email}</Text>
            </div>
            <Button 
              type="text" 
              icon={<LogoutOutlined />} 
              onClick={handleSignOut}
              danger
            >
              Sign Out
            </Button>
          </div>
        </Card>

        {/* Chat Messages */}
        <Card className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <RobotOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                <div className="mt-4">
                  <Text strong>Hello! I'm your AI assistant.</Text>
                  <br />
                  <Text type="secondary">Ask me anything about your studies!</Text>
                </div>
              </div>
            ) : (
              <List
                dataSource={messages}
                renderItem={(message) => (
                  <List.Item style={{ border: 'none', padding: '8px 0' }}>
                    <div className={`w-full flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar 
                          icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                          style={{ 
                            backgroundColor: message.role === 'user' ? '#1890ff' : '#52c41a',
                            flexShrink: 0
                          }}
                        />
                        <div 
                          className={`px-4 py-2 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          <Text className={message.role === 'user' ? 'text-white' : ''}>
                            {message.content}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t pt-4">
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={loading}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={loading}
                disabled={!inputValue.trim()}
              >
                Send
              </Button>
            </Space.Compact>
          </div>
        </Card>
      </div>
    </div>
  );
}