"use client";

import { useState } from "react";
import { format } from "date-fns";
import { TaskPriority, TaskStatus } from "@/lib/models/Task";
import {
  FileText,
  Repeat,
  Tag as TagIcon,
  Calendar,
  Check,
  Sparkles,
  Trash2,
  Folder,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ContextMenu from "./ContextMenu";

interface TaskListProps {
  tasks: any[];
  onTaskUpdated: (task: any) => void;
  onTaskDeleted: (taskId: string) => void;
  canEdit?: boolean;
}

export default function TaskList({
  tasks,
  onTaskUpdated,
  onTaskDeleted,
  canEdit = true,
}: TaskListProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; task: any } | null>(null);

  const handleToggleComplete = async (task: any) => {
    const newStatus =
      task.status === TaskStatus.COMPLETED
        ? TaskStatus.TODO
        : TaskStatus.COMPLETED;
    try {
      const res = await fetch(`/api/tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      const updatedTask = await res.json();
      onTaskUpdated(updatedTask.task);
    } catch (error) {
      console.error("Failed to toggle task status:", error);
    }
  };

  const handleScheduleToday = async (taskId: string) => {
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    await handleSchedule(taskId, today);
  };

  const handleScheduleTomorrow = async (taskId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    await handleSchedule(taskId, tomorrow);
  };

  const handleSchedule = async (taskId: string, scheduledDate: Date) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate: scheduledDate.toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to schedule task");
      const updatedTask = await res.json();
      onTaskUpdated(updatedTask.task);
      setContextMenu(null);
    } catch (error) {
      console.error("Failed to schedule task:", error);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      onTaskDeleted(taskId);
      setContextMenu(null);
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, task: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, task });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return "bg-red-900/30 text-red-400 border border-red-800/50";
      case TaskPriority.HIGH:
        return "bg-orange-900/30 text-orange-400 border border-orange-800/50";
      case TaskPriority.MEDIUM:
        return "bg-blue-900/30 text-blue-400 border border-blue-800/50";
      case TaskPriority.LOW:
        return "bg-green-900/30 text-green-400 border border-green-800/50";
      default:
        return "bg-[#2c2c2e] text-gray-300 border border-[#38383a]";
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <p className="ios-headline text-white mb-2">No tasks yet</p>
        <p className="ios-body text-gray-400">
          Create your first task above to get started!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => {
            const tags = Array.isArray(task.tags)
              ? task.tags.filter(
                  (t: any) => t && (typeof t === "object" ? t.name : t)
                )
              : [];

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                key={task._id}
                onContextMenu={(e) => canEdit && handleContextMenu(e, task)}
                className="ios-list-item group"
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(task)}
                    disabled={!canEdit}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
                    task.status === TaskStatus.COMPLETED
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-600 hover:border-blue-500"
                  } ${
                    !canEdit
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  style={{ borderRadius: "6px" }}
                >
                  {task.status === TaskStatus.COMPLETED && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`ios-headline mb-1 ${
                      task.status === TaskStatus.COMPLETED
                        ? "line-through text-gray-500"
                        : "text-white"
                    }`}
                  >
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="ios-body text-gray-400 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map((tag: any, idx: number) => {
                        const tagName =
                          typeof tag === "object" ? tag.name : tag;
                        const tagId = typeof tag === "object" ? tag._id : idx;
                        return (
                          <div
                            key={tagId}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full ios-footnote font-medium"
                          >
                            <TagIcon className="w-3 h-3" />
                            {tagName}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Metadata Row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {task.dueDate && (
                      <div className="flex items-center gap-1 ios-footnote text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(task.dueDate), "MMM d")}
                      </div>
                    )}

                    {task.scheduledDate && (
                      <div className="flex items-center gap-1 ios-footnote text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        Scheduled: {format(new Date(task.scheduledDate), "MMM d")}
                      </div>
                    )}

                    {task.priority && task.priority !== TaskPriority.MEDIUM && (
                      <div
                        className={`px-2 py-1 rounded-full ios-footnote font-medium ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </div>
                    )}

                    {task.isRecurring && (
                      <div className="flex items-center gap-1 ios-footnote text-gray-400">
                        <Repeat className="w-3.5 h-3.5" />
                        Recurring
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions (visible on hover) */}
                {canEdit && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleScheduleToday(task._id)}
                      className="px-2 py-1 ios-footnote font-semibold text-blue-500 hover:bg-blue-600/20 rounded transition-colors"
                      title="Schedule for today"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => handleScheduleTomorrow(task._id)}
                      className="px-2 py-1 ios-footnote font-semibold text-gray-400 hover:bg-[#2c2c2e] rounded transition-colors"
                      title="Schedule for tomorrow"
                    >
                      Tomorrow
                    </button>
                  </div>
                )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={[
            {
              id: "today",
              label: "Do Today",
              icon: <Calendar className="w-5 h-5" />,
              onClick: () => handleScheduleToday(contextMenu.task._id),
            },
            {
              id: "tomorrow",
              label: "Do Tomorrow",
              icon: <Calendar className="w-5 h-5" />,
              onClick: () => handleScheduleTomorrow(contextMenu.task._id),
            },
            {
              id: "delete",
              label: "Delete",
              icon: <Trash2 className="w-5 h-5" />,
              onClick: () => handleDelete(contextMenu.task._id),
              destructive: true,
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
