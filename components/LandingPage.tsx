'use client';

import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { CheckCircle2, Zap, Layout, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
            <CheckCircle2 className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-gray-900">LOR Task</span>
        </div>
        <button
          onClick={() => signIn()}
          className="text-sm font-medium text-gray-600 hover:text-brand-blue transition-colors"
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
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-6">
            Organize your life <br />
            <span className="text-brand-blue">with AI intelligence</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            The task manager that learns from you. Smart scheduling, natural language processing, and automated organization in one beautiful app.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => signIn()}
            className="bg-brand-blue text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all flex items-center mx-auto"
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
            icon={<Zap className="w-6 h-6 text-yellow-500" />}
            title="Smart Scheduling"
            description="AI automatically suggests the best time for your tasks based on your habits."
          />
          <FeatureCard 
            icon={<Layout className="w-6 h-6 text-purple-500" />}
            title="Flexible Views"
            description="Switch between List, Kanban, and Calendar views to visualize your work your way."
          />
          <FeatureCard 
            icon={<CheckCircle2 className="w-6 h-6 text-green-500" />}
            title="Natural Language"
            description="Just type 'Meeting tomorrow at 2pm' and we'll handle the rest."
          />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} LOR Task. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-gray-50 p-6 rounded-2xl text-left hover:bg-gray-100 transition-colors">
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
