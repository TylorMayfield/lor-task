'use client';

import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { CheckCircle2, Zap, Layout, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--ios-grouped-background)',
        color: 'var(--ios-label)',
      }}
    >
      {/* Navigation */}
      <nav 
        className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full"
        style={{
          borderBottom: '1px solid var(--ios-separator)',
        }}
      >
        <div className="flex items-center space-x-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'var(--ios-blue)',
            }}
          >
            <CheckCircle2 className="text-white w-5 h-5" />
          </div>
          <span 
            className="text-xl font-bold"
            style={{
              color: 'var(--ios-label)',
            }}
          >
            LOR Task
          </span>
        </div>
        <button
          onClick={() => signIn()}
          className="text-sm font-medium transition-colors"
          style={{
            color: 'var(--ios-secondary-label)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--ios-blue)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--ios-secondary-label)';
          }}
        >
          Log in
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto mt-10 md:mt-20 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
            style={{
              color: 'var(--ios-label)',
            }}
          >
            Organize your life <br />
            <span style={{ color: 'var(--ios-blue)' }}>with AI intelligence</span>
          </h1>
          <p 
            className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{
              color: 'var(--ios-secondary-label)',
            }}
          >
            The task manager that learns from you. Smart scheduling, natural language processing, and automated organization in one beautiful app.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => signIn()}
            className="px-8 py-4 rounded-full text-lg font-semibold transition-all flex items-center mx-auto text-white"
            style={{
              background: 'var(--ios-blue)',
              boxShadow: '0 4px 14px rgba(10, 132, 255, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#0071e3';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(10, 132, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--ios-blue)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(10, 132, 255, 0.3)';
            }}
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full"
        >
          <FeatureCard 
            icon={<Zap className="w-6 h-6" style={{ color: 'var(--ios-yellow)' }} />}
            title="Smart Scheduling"
            description="AI automatically suggests the best time for your tasks based on your habits."
          />
          <FeatureCard 
            icon={<Layout className="w-6 h-6" style={{ color: 'var(--ios-purple)' }} />}
            title="Flexible Views"
            description="Switch between List, Kanban, and Calendar views to visualize your work your way."
          />
          <FeatureCard 
            icon={<CheckCircle2 className="w-6 h-6" style={{ color: 'var(--ios-green)' }} />}
            title="Natural Language"
            description="Just type 'Meeting tomorrow at 2pm' and we'll handle the rest."
          />
        </motion.div>
      </main>

      {/* Footer */}
      <footer 
        className="py-8 text-center text-sm"
        style={{
          color: 'var(--ios-tertiary-label)',
          borderTop: '1px solid var(--ios-separator)',
        }}
      >
        © {new Date().getFullYear()} LOR Task. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div 
      className="p-6 rounded-2xl text-left transition-all"
      style={{
        background: 'var(--ios-secondary-system-background)',
        border: '1px solid var(--ios-separator)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--ios-tertiary-system-background)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--ios-secondary-system-background)';
      }}
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: 'var(--ios-system-background)',
          boxShadow: 'var(--ios-shadow-sm)',
        }}
      >
        {icon}
      </div>
      <h3 
        className="text-lg font-bold mb-2"
        style={{
          color: 'var(--ios-label)',
        }}
      >
        {title}
      </h3>
      <p 
        className="leading-relaxed"
        style={{
          color: 'var(--ios-secondary-label)',
        }}
      >
        {description}
      </p>
    </div>
  );
}
