"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  CircleDotDashed,
  FolderPlus,
  PauseCircle,
  Plus,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TaskStatus = "New" | "WIP" | "On Hold" | "Done";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  categoryId?: string;
  tentativeDate?: string;
  createdAt?: string;
};

type Category = {
  id: string;
  name: string;
};

type StatusFilter = "All" | TaskStatus;

const TASKS_STORAGE_KEY = "minimal-task-tracker-tasks";
const CATEGORIES_STORAGE_KEY = "minimal-task-tracker-categories";
const STATUSES: TaskStatus[] = ["New", "WIP", "On Hold", "Done"];
const STATUS_FILTERS: StatusFilter[] = ["All", ...STATUSES];
const NO_CATEGORY_VALUE = "__none__";

const statusStyles: Record<TaskStatus, string> = {
  New: "text-zinc-300",
  WIP: "text-zinc-200",
  "On Hold": "text-zinc-400",
  Done: "text-emerald-300",
};

const statusIcons: Record<TaskStatus, ReactNode> = {
  New: <CircleDotDashed className="h-4 w-4" />,
  WIP: <Wrench className="h-4 w-4" />,
  "On Hold": <PauseCircle className="h-4 w-4" />,
  Done: <CheckCircle2 className="h-4 w-4" />,
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const stored = window.localStorage.getItem(TASKS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    try {
      const parsed = JSON.parse(stored) as Task[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const stored = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    try {
      const parsed = JSON.parse(stored) as Category[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [title, setTitle] = useState("");
  const [tentativeDate, setTentativeDate] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTaskCategoryId, setNewTaskCategoryId] = useState(NO_CATEGORY_VALUE);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  const categoryNameById = useMemo(
    () =>
      categories.reduce<Record<string, string>>((acc, category) => {
        acc[category.id] = category.name;
        return acc;
      }, {}),
    [categories],
  );

  const filteredTasks = useMemo(
    () =>
      statusFilter === "All"
        ? tasks
        : tasks.filter((task) => task.status === statusFilter),
    [tasks, statusFilter],
  );

  const taskCountLabel = useMemo(() => {
    const shownCount = filteredTasks.length;
    const totalCount = tasks.length;

    if (statusFilter === "All") {
      return `${totalCount} task${totalCount === 1 ? "" : "s"}`;
    }

    return `${shownCount} shown (${totalCount} total)`;
  }, [filteredTasks.length, tasks.length, statusFilter]);

  const addTask = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return;
    }

    const nextTask: Task = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      status: "New",
      categoryId: newTaskCategoryId === NO_CATEGORY_VALUE ? undefined : newTaskCategoryId,
      tentativeDate: tentativeDate || undefined,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [nextTask, ...prev]);
    setTitle("");
    setTentativeDate("");
    setNewTaskCategoryId(NO_CATEGORY_VALUE);
  };

  const updateTaskStatus = (taskId: string, nextStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)),
    );
  };

  const addCategory = () => {
    const cleanName = newCategoryName.trim();
    if (!cleanName) {
      return;
    }

    const exists = categories.some(
      (category) => category.name.toLowerCase() === cleanName.toLowerCase(),
    );
    if (exists) {
      setNewCategoryName("");
      return;
    }

    const nextCategory: Category = {
      id: crypto.randomUUID(),
      name: cleanName,
    };

    setCategories((prev) => [...prev, nextCategory]);
    setNewCategoryName("");
  };

  const updateTaskCategory = (taskId: string, nextCategoryId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              categoryId:
                nextCategoryId === NO_CATEGORY_VALUE ? undefined : nextCategoryId,
            }
          : task,
      ),
    );
  };

  const getCategoryLabel = (categoryId: string) => {
    if (categoryId === NO_CATEGORY_VALUE) {
      return "No category";
    }
    return categoryNameById[categoryId] ?? "No category";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8">
        <Card className="border-zinc-800 bg-zinc-900/80 shadow-none">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl tracking-tight text-zinc-100">Tasks</CardTitle>
            <p className="text-sm text-zinc-400">{taskCountLabel}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">Filter by status</p>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter((value ?? "All") as StatusFilter)
                  }
                >
                  <SelectTrigger className="w-full border-zinc-800 bg-zinc-950 text-xs text-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                    {STATUS_FILTERS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Input
              placeholder="Add a task title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addTask();
                }
              }}
              className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-700"
            />
            <div className="space-y-1">
              <p className="text-xs text-zinc-500">Tentative date (optional)</p>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="date"
                  value={tentativeDate}
                  onChange={(event) => setTentativeDate(event.target.value)}
                  className="border-zinc-800 bg-zinc-950 pl-9 text-zinc-100 focus-visible:ring-zinc-700"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={newTaskCategoryId}
                onValueChange={(value) => setNewTaskCategoryId(value ?? NO_CATEGORY_VALUE)}
              >
                <SelectTrigger className="flex-1 border-zinc-800 bg-zinc-950 text-xs text-zinc-200">
                  <SelectValue>{getCategoryLabel(newTaskCategoryId)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                  <SelectItem value={NO_CATEGORY_VALUE}>No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={addTask}
                className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Create category"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addCategory();
                  }
                }}
                className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-700"
              />
              <Button
                onClick={addCategory}
                variant="outline"
                className="border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
              >
                <FolderPlus className="h-4 w-4" />
                Category
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-2">
          {filteredTasks.length === 0 ? (
            <Card className="border-zinc-800 bg-zinc-900/60 shadow-none">
              <CardContent className="py-8 text-center text-sm text-zinc-500">
                {tasks.length === 0 ? "No tasks yet." : "No tasks in this status."}
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} className="border-zinc-800 bg-zinc-900/60 shadow-none">
                <CardContent className="flex flex-col gap-3 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-100">{task.title}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span>
                        Category{" "}
                        {task.categoryId && categoryNameById[task.categoryId]
                          ? categoryNameById[task.categoryId]
                          : "No category"}
                      </span>
                      {task.tentativeDate ? (
                        <span>Tentative {task.tentativeDate}</span>
                      ) : (
                        <span>No date</span>
                      )}
                      {task.createdAt ? (
                        <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <Select
                      value={task.categoryId ?? NO_CATEGORY_VALUE}
                      onValueChange={(value) =>
                        updateTaskCategory(task.id, value ?? NO_CATEGORY_VALUE)
                      }
                    >
                      <SelectTrigger className="w-full border-zinc-800 bg-zinc-950 text-xs text-zinc-200 sm:w-[170px]">
                        <SelectValue>
                          {getCategoryLabel(task.categoryId ?? NO_CATEGORY_VALUE)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                        <SelectItem value={NO_CATEGORY_VALUE}>No category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={task.status}
                      onValueChange={(value) =>
                        updateTaskStatus(task.id, (value ?? "New") as TaskStatus)
                      }
                    >
                      <SelectTrigger
                        className={`w-full border-zinc-800 bg-zinc-950 text-xs sm:w-[150px] ${statusStyles[task.status]}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            <span className={`inline-flex items-center gap-2 ${statusStyles[status]}`}>
                              {statusIcons[status]}
                              {status}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
