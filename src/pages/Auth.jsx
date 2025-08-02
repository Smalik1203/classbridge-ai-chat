import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';

const { Title, Text } = Typography;

export default function Auth() {
  const { user, signIn, signUp, loading } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (values) => {
    setSubmitLoading(true);
    try {
      const { error } = await signIn(values.email, values.password);
      if (error) {
        message.error(error.message);
      } else {
        message.success('Welcome back!');
      }
    } catch (error) {
      message.error('An unexpected error occurred');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSignUp = async (values) => {
    setSubmitLoading(true);
    try {
      const { error } = await signUp(values.email, values.password);
      if (error) {
        message.error(error.message);
      } else {
        message.success('Account created successfully! Please check your email to verify your account.');
      }
    } catch (error) {
      message.error('An unexpected error occurred');
    } finally {
      setSubmitLoading(false);
    }
  };

  const signInForm = (
    <Form
      name="signin"
      onFinish={handleSignIn}
      autoComplete="off"
      layout="vertical"
    >
      <Form.Item
        name="email"
        rules={[
          { required: true, message: 'Please input your email!' },
          { type: 'email', message: 'Please enter a valid email!' }
        ]}
      >
        <Input 
          prefix={<MailOutlined />} 
          placeholder="Email" 
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Please input your password!' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Password"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={submitLoading}
          size="large"
          block
        >
          Sign In
        </Button>
      </Form.Item>
    </Form>
  );

  const signUpForm = (
    <Form
      name="signup"
      onFinish={handleSignUp}
      autoComplete="off"
      layout="vertical"
    >
      <Form.Item
        name="email"
        rules={[
          { required: true, message: 'Please input your email!' },
          { type: 'email', message: 'Please enter a valid email!' }
        ]}
      >
        <Input 
          prefix={<MailOutlined />} 
          placeholder="Email" 
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: 'Please input your password!' },
          { min: 6, message: 'Password must be at least 6 characters!' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Password (min 6 characters)"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={submitLoading}
          size="large"
          block
        >
          Sign Up
        </Button>
      </Form.Item>
    </Form>
  );

  const tabItems = [
    {
      key: 'signin',
      label: 'Sign In',
      children: signInForm,
    },
    {
      key: 'signup',
      label: 'Sign Up',
      children: signUpForm,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <Text className="mt-2">Loading...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="text-center mb-6">
          <Title level={2} className="mb-2">ClassBridge</Title>
          <Text type="secondary">AI-Powered Education Platform</Text>
        </div>
        
        <Tabs 
          defaultActiveKey="signin" 
          items={tabItems} 
          centered
        />
      </Card>
    </div>
  );
}