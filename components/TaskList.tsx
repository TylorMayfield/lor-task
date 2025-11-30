"use client";

import { format } from "date-fns";
import { TaskPriority, TaskStatus } from "@/lib/models/Task";
import { FileText, Repeat, Inbox as InboxIcon } from "lucide-react";

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

      const data = await res.json();
      onTaskUpdated(data.task);
    } catch (error) {
      console.error("Failed to update task:", error);
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
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return "bg-red-50 text-red-700 border-red-200";
      case TaskPriority.HIGH:
        return "bg-orange-50 text-orange-700 border-orange-200";
      case TaskPriority.MEDIUM:
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case TaskPriority.LOW:
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (tasks.length === 0) {
    return (
      <div
        className="bg-white border border-gray-200 p-12 text-center shadow-sm"
        style={{ borderRadius: "12px" }}
      >
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-900 mb-2">No tasks yet</p>
        <p className="text-sm text-gray-500">
          Create your first task above to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3 list-none">
        {tasks.map((task) => (
          <li key={task._id} className="task-card">
            <div className="flex items-start space-x-3">
              <button
                onClick={() => handleToggleComplete(task)}
                disabled={!canEdit}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  task.status === TaskStatus.COMPLETED
                    ? "border-transparent"
                    : "border-gray-300"
                } ${
                  !canEdit ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
                style={
                  task.status === TaskStatus.COMPLETED
                    ? {
                        backgroundColor: "var(--primary-color)",
                        borderColor: "var(--primary-color)",
                      }
                    : {}
                }
                onMouseEnter={(e) => {
                  if (!canEdit || task.status === TaskStatus.COMPLETED) return;
                  e.currentTarget.style.borderColor = "var(--primary-color)";
                }}
                onMouseLeave={(e) => {
                  if (!canEdit || task.status === TaskStatus.COMPLETED) return;
                  e.currentTarget.style.borderColor = "";
                }}
              >
                {task.status === TaskStatus.COMPLETED && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3
                      className={`text-base font-medium ${
                        task.status === TaskStatus.COMPLETED
                          ? "line-through text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="ml-3 text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Delete task"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {task.dueDate && (
                    <div className="flex items-center text-xs text-gray-500">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {format(new Date(task.dueDate), "MMM d")}
                    </div>
                  )}
                  {task.scheduledDate && !task.dueDate && (
                    <div className="flex items-center text-xs text-gray-500">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {format(new Date(task.scheduledDate), "MMM d")}
                    </div>
                  )}

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>

                  {task.tags?.map((tag: any) => (
                    <span
                      key={typeof tag === "string" ? tag : tag._id || tag.name}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {typeof tag === "string" ? tag : tag.name || tag._id}
                    </span>
                  ))}

                  {task.categoryId && typeof task.categoryId === "object" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      {task.categoryId.name}
                    </span>
                  )}

                  {task.boardId && typeof task.boardId === "object" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {task.boardId.name}
                    </span>
                  )}

                  {task.isRecurring && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      <Repeat className="w-3 h-3 mr-1" />
                      Recurring
                    </span>
                  )}

                  {task.isInbox && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                      <InboxIcon className="w-3 h-3 mr-1" />
                      Inbox
                    </span>
                  )}

                  {/* Show project path if board or category exists */}
                  {(task.boardId || task.categoryId) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                      {task.boardId &&
                        typeof task.boardId === "object" &&
                        task.boardId.name}
                      {task.boardId && task.categoryId && " > "}
                      {task.categoryId &&
                        typeof task.categoryId === "object" &&
                        task.categoryId.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
