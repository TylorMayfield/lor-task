"use client";

import { format } from "date-fns";
import { TaskPriority, TaskStatus } from "@/lib/models/Task";
import {
  FileText,
  Repeat,
  Tag as TagIcon,
  Calendar,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return "bg-[var(--md-error-container)] text-[var(--md-on-error-container)]";
      case TaskPriority.HIGH:
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case TaskPriority.MEDIUM:
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case TaskPriority.LOW:
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      default:
        return "bg-[var(--md-surface-variant)] text-[var(--md-on-surface-variant)]";
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 mx-auto mb-4 text-[var(--md-on-surface-variant)] opacity-40" />
        <p className="md-title-medium text-[var(--md-on-surface)] mb-2">
          No tasks yet
        </p>
        <p className="md-body-medium text-[var(--md-on-surface-variant)]">
          Create your first task above to get started!
        </p>
      </div>
    );
  }

  return (
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
              className="bg-[var(--md-surface)] transition-all cursor-pointer hover:md-elevation-2"
              style={{
                borderRadius: "12px",
                border: "1px solid var(--md-outline-variant)",
                padding: "14px",
                marginBottom: "8px",
              }}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleComplete(task)}
                  disabled={!canEdit}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
                    task.status === TaskStatus.COMPLETED
                      ? "bg-[var(--md-primary)] border-[var(--md-primary)]"
                      : "border-[var(--md-outline-variant)] hover:border-[var(--md-primary)]"
                  } ${
                    !canEdit
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  style={{ borderRadius: "12px" }}
                >
                  {task.status === TaskStatus.COMPLETED && (
                    <Check className="w-4 h-4 text-[var(--md-on-primary)]" />
                  )}
                </button>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`md-title-medium mb-2 ${
                      task.status === TaskStatus.COMPLETED
                        ? "line-through text-[var(--md-on-surface-variant)]"
                        : "text-[var(--md-on-surface)]"
                    }`}
                  >
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="md-body-medium text-[var(--md-on-surface-variant)] mb-3 line-clamp-2">
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
                            className="flex items-center gap-1 px-2 py-1 bg-[var(--md-secondary-container)] text-[var(--md-on-secondary-container)] rounded-full md-label-small"
                            style={{ borderRadius: "8px" }}
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
                      <div className="flex items-center gap-1 md-body-small text-[var(--md-on-surface-variant)]">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(task.dueDate), "MMM d")}
                      </div>
                    )}

                    {task.scheduledDate && (
                      <div className="flex items-center gap-1 md-body-small text-[var(--md-on-surface-variant)]">
                        <Calendar className="w-4 h-4" />
                        Scheduled:{" "}
                        {format(new Date(task.scheduledDate), "MMM d")}
                      </div>
                    )}

                    {task.priority && task.priority !== TaskPriority.MEDIUM && (
                      <div
                        className={`px-2 py-1 rounded-full md-label-small ${getPriorityColor(
                          task.priority
                        )}`}
                        style={{ borderRadius: "8px" }}
                      >
                        {task.priority}
                      </div>
                    )}

                    {task.isRecurring && (
                      <div className="flex items-center gap-1 md-body-small text-[var(--md-on-surface-variant)]">
                        <Repeat className="w-4 h-4" />
                        Recurring
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
