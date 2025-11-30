'use client';

import { useState, useEffect } from 'react';
import { WebhookEvent } from '@/lib/models/Webhook';
import { Link2 } from 'lucide-react';

interface Webhook {
  _id: string;
  url: string;
  events: string[];
  active: boolean;
  description?: string;
  lastTriggeredAt?: string;
  failureCount: number;
}

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[],
    secret: '',
    description: '',
    headers: {} as Record<string, string>,
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch('/api/webhooks');
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingWebhook
        ? `/api/webhooks/${editingWebhook._id}`
        : '/api/webhooks';
      const method = editingWebhook ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save webhook');

      await fetchWebhooks();
      setShowForm(false);
      setEditingWebhook(null);
      setFormData({
        url: '',
        events: [],
        secret: '',
        description: '',
        headers: {},
      });
    } catch (error) {
      console.error('Failed to save webhook:', error);
      alert('Failed to save webhook. Please try again.');
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const res = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete webhook');

      await fetchWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      alert('Failed to delete webhook. Please try again.');
    }
  };

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setFormData({
      url: webhook.url,
      events: webhook.events,
      secret: '',
      description: webhook.description || '',
      headers: {},
    });
    setShowForm(true);
  };

  const toggleEvent = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const allEvents = Object.values(WebhookEvent);

  if (loading) {
    return <div className="text-center py-8">Loading webhooks...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Webhooks</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingWebhook(null);
            setFormData({
              url: '',
              events: [],
              secret: '',
              description: '',
              headers: {},
            });
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-medium transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Webhook'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/webhook"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Events
            </label>
            <div className="space-y-2">
              {allEvents.map((event) => (
                <label key={event} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="mr-2"
                  />
                  <span className="text-sm">{event}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secret (optional)
            </label>
            <input
              type="password"
              value={formData.secret}
              onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
              placeholder="Webhook secret for signature verification"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Webhook description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-500 text-white py-2.5 px-4 rounded-lg hover:bg-red-600 font-medium transition-colors"
          >
            {editingWebhook ? 'Update Webhook' : 'Create Webhook'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Link2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-900 mb-2">No webhooks configured</p>
            <p className="text-sm">Create one to get started.</p>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div
              key={webhook._id}
              className="task-card"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{webhook.url}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${
                        webhook.active
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {webhook.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {webhook.description && (
                    <p className="text-sm text-gray-600 mb-2">{webhook.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {webhook.lastTriggeredAt && (
                      <span>
                        Last triggered:{' '}
                        {new Date(webhook.lastTriggeredAt).toLocaleString()}
                      </span>
                    )}
                    {webhook.failureCount > 0 && (
                      <span className="ml-4 text-red-600">
                        Failures: {webhook.failureCount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(webhook)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(webhook._id)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Incoming Webhooks</h3>
        <p className="text-sm text-blue-800 mb-2">
          You can create tasks via webhook by sending a POST request to:
        </p>
        <code className="block text-xs bg-white p-2 rounded mb-2">
          POST /api/webhooks/incoming
        </code>
        <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
          {JSON.stringify(
            {
              userId: 'your-user-id',
              task: {
                title: 'Task title',
                description: 'Optional description',
                priority: 'high',
                tags: ['tag1', 'tag2'],
              },
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}

