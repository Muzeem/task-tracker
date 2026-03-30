"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  CircleDotDashed,
  FolderPlus,
  ListTodo,
  PauseCircle,
  Plus,
  StickyNote,
  Trash2,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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
const NOTES_STORAGE_KEY = "minimal-task-tracker-notes";

type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

function normalizeStoredNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((item) => {
    const n = item as Partial<Note>;
    const updatedAt =
      typeof n.updatedAt === "string" ? n.updatedAt : new Date().toISOString();
    const createdAt =
      typeof n.createdAt === "string" ? n.createdAt : updatedAt;
    return {
      id: typeof n.id === "string" ? n.id : crypto.randomUUID(),
      title: typeof n.title === "string" ? n.title : "",
      body: typeof n.body === "string" ? n.body : "",
      createdAt,
      updatedAt,
    };
  });
}

function toLocalDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const STATUSES: TaskStatus[] = ["New", "WIP", "On Hold", "Done"];
const STATUS_FILTERS: StatusFilter[] = ["All", ...STATUSES];
const NO_CATEGORY_VALUE = "__none__";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
      {children}
    </p>
  );
}

const fieldClass =
  "rounded-xl border-zinc-800/70 bg-zinc-950/50 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-zinc-600 focus-visible:ring-2 focus-visible:ring-zinc-600/25";
const selectFieldClass =
  "h-10 w-full rounded-xl border-zinc-800/70 bg-zinc-950/50 text-sm text-zinc-200 focus:ring-2 focus:ring-zinc-600/25";
const panelClass =
  "overflow-visible rounded-2xl border border-zinc-800/40 bg-zinc-900/25 shadow-none";
const listShellClass =
  "overflow-hidden rounded-2xl border border-zinc-800/40 bg-zinc-900/20 shadow-none";

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
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    const stored = window.localStorage.getItem(NOTES_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    try {
      return normalizeStoredNotes(JSON.parse(stored));
    } catch {
      return [];
    }
  });
  const [composeTitle, setComposeTitle] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [noteTitleFilter, setNoteTitleFilter] = useState("");
  const [noteCreatedDateFilter, setNoteCreatedDateFilter] = useState("");

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

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

  const filteredNotes = useMemo(() => {
    const q = noteTitleFilter.trim().toLowerCase();
    return notes.filter((note) => {
      if (q && !note.title.toLowerCase().includes(q)) {
        return false;
      }
      if (
        noteCreatedDateFilter &&
        toLocalDateKey(note.createdAt) !== noteCreatedDateFilter
      ) {
        return false;
      }
      return true;
    });
  }, [notes, noteTitleFilter, noteCreatedDateFilter]);

  const notesCountLabel = useMemo(() => {
    if (notes.length === 0) {
      return "0 notes";
    }
    if (
      !noteTitleFilter.trim() &&
      !noteCreatedDateFilter
    ) {
      return `${notes.length} note${notes.length === 1 ? "" : "s"}`;
    }
    return `${filteredNotes.length} shown (${notes.length} total)`;
  }, [
    filteredNotes.length,
    notes.length,
    noteTitleFilter,
    noteCreatedDateFilter,
  ]);

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

  const addNote = () => {
    const title = composeTitle.trim();
    const body = composeBody.trim();
    if (!title && !body) {
      return;
    }
    const now = new Date().toISOString();
    const next: Note = {
      id: crypto.randomUUID(),
      title,
      body,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [next, ...prev]);
    setComposeTitle("");
    setComposeBody("");
  };

  const updateNote = (noteId: string, patch: Partial<Pick<Note, "title" | "body">>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId
          ? {
              ...note,
              ...patch,
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    );
  };

  const deleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex min-w-0 w-full max-w-lg flex-col px-4 pb-10 pt-6 sm:max-w-xl sm:px-6 sm:pt-10">
        <header className="mb-8 space-y-1">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">
            Focus
          </h1>
          <p className="text-sm leading-relaxed text-zinc-500">
            Tasks and notes in one place. Saved on this device only.
          </p>
        </header>

        <Tabs defaultValue="tasks" className="w-full min-w-0 gap-0">
          <TabsList className="mb-8 grid h-11 w-full grid-cols-2 gap-1 rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-1 sm:max-w-xs">
            <TabsTrigger
              value="tasks"
              className="flex-none gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 data-active:bg-zinc-100 data-active:text-zinc-950 aria-selected:bg-zinc-100 aria-selected:text-zinc-950 data-[selected=true]:bg-zinc-100 data-[selected=true]:text-zinc-950 dark:data-active:bg-zinc-100 dark:data-active:text-zinc-950 dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-950 dark:data-[selected=true]:bg-zinc-100 dark:data-[selected=true]:text-zinc-950"
            >
              <ListTodo className="size-4 shrink-0" aria-hidden />
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="flex-none gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 data-active:bg-zinc-100 data-active:text-zinc-950 aria-selected:bg-zinc-100 aria-selected:text-zinc-950 data-[selected=true]:bg-zinc-100 data-[selected=true]:text-zinc-950 dark:data-active:bg-zinc-100 dark:data-active:text-zinc-950 dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-950 dark:data-[selected=true]:bg-zinc-100 dark:data-[selected=true]:text-zinc-950"
            >
              <StickyNote className="size-4 shrink-0" aria-hidden />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-0 flex min-w-0 flex-col gap-8 outline-none">
            <section className={panelClass}>
              <div className="border-b border-zinc-800/40 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <FieldLabel>Show</FieldLabel>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) =>
                        setStatusFilter((value ?? "All") as StatusFilter)
                      }
                    >
                      <SelectTrigger className={`${selectFieldClass} sm:w-[200px]`}>
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
                  <p className="text-xs text-zinc-600">{taskCountLabel}</p>
                </div>
              </div>

              <div className="space-y-5 px-5 py-5 sm:px-6">
                <div>
                  <FieldLabel>New task</FieldLabel>
                  <Input
                    placeholder="What needs doing?"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        addTask();
                      }
                    }}
                    className={`h-11 text-base ${fieldClass}`}
                    aria-label="Task title"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Tentative date</FieldLabel>
                    <div className="relative">
                      <Calendar
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
                        aria-hidden
                      />
                      <Input
                        type="date"
                        value={tentativeDate}
                        onChange={(event) => setTentativeDate(event.target.value)}
                        className={`h-10 pl-9 ${fieldClass}`}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-600">Optional</p>
                  </div>
                  <div>
                    <FieldLabel>Category</FieldLabel>
                    <Select
                      value={newTaskCategoryId}
                      onValueChange={(value) =>
                        setNewTaskCategoryId(value ?? NO_CATEGORY_VALUE)
                      }
                    >
                      <SelectTrigger className={selectFieldClass}>
                        <SelectValue>{getCategoryLabel(newTaskCategoryId)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                        <SelectItem value={NO_CATEGORY_VALUE}>None</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1.5 text-xs text-zinc-600">Optional</p>
                  </div>
                </div>

                <Button
                  onClick={addTask}
                  className="h-11 w-full rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white"
                >
                  <Plus className="size-4" />
                  Add task
                </Button>

                <div className="border-t border-zinc-800/40 pt-5">
                  <FieldLabel>New category</FieldLabel>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Name"
                      value={newCategoryName}
                      onChange={(event) => setNewCategoryName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          addCategory();
                        }
                      }}
                      className={`h-10 flex-1 ${fieldClass}`}
                    />
                    <Button
                      type="button"
                      onClick={addCategory}
                      variant="outline"
                      className="h-10 shrink-0 rounded-xl border-zinc-700/80 bg-transparent text-zinc-300 hover:bg-zinc-800/50 sm:px-5"
                    >
                      <FolderPlus className="size-4" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-baseline justify-between gap-2 px-0.5">
                <h2 className="text-sm font-medium text-zinc-400">Your tasks</h2>
              </div>
              {filteredTasks.length === 0 ? (
                <div className={`${listShellClass} px-5 py-12 sm:px-6`}>
                  <p className="text-center text-sm text-zinc-500">
                    {tasks.length === 0
                      ? "Nothing here yet. Add a task above to get started."
                      : "No tasks match this filter. Try another status."}
                  </p>
                </div>
              ) : (
                <div className={listShellClass}>
                  <ul className="divide-y divide-zinc-800/50">
                    {filteredTasks.map((task) => (
                      <li key={task.id} className="px-5 py-4 sm:px-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="text-[15px] font-medium leading-snug text-zinc-100">
                              {task.title}
                            </p>
                            <p className="text-xs leading-relaxed text-zinc-500">
                              {[
                                task.categoryId && categoryNameById[task.categoryId]
                                  ? categoryNameById[task.categoryId]
                                  : "Uncategorized",
                                task.tentativeDate
                                  ? `Due ${task.tentativeDate}`
                                  : null,
                                task.createdAt
                                  ? `Added ${new Date(task.createdAt).toLocaleDateString()}`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <div className="flex min-w-0 flex-col gap-2 sm:w-[200px] sm:shrink-0">
                            <Select
                              value={task.categoryId ?? NO_CATEGORY_VALUE}
                              onValueChange={(value) =>
                                updateTaskCategory(task.id, value ?? NO_CATEGORY_VALUE)
                              }
                            >
                              <SelectTrigger className={selectFieldClass}>
                                <SelectValue>
                                  {getCategoryLabel(task.categoryId ?? NO_CATEGORY_VALUE)}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                                <SelectItem value={NO_CATEGORY_VALUE}>None</SelectItem>
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
                                className={`${selectFieldClass} ${statusStyles[task.status]}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                                {STATUSES.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    <span
                                      className={`inline-flex items-center gap-2 ${statusStyles[status]}`}
                                    >
                                      {statusIcons[status]}
                                      {status}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="notes" className="mt-0 flex min-w-0 flex-col gap-8 outline-none">
            <section className={panelClass}>
              <div className="border-b border-zinc-800/40 px-5 py-4 sm:px-6">
                <p className="text-sm text-zinc-400">
                  Private to this device.{" "}
                  <span className="text-zinc-600">{notesCountLabel}</span>
                </p>
              </div>

              <div className="space-y-5 px-5 py-5 sm:px-6">
                <div>
                  <FieldLabel>Title</FieldLabel>
                  <Input
                    placeholder="Optional heading"
                    value={composeTitle}
                    onChange={(e) => setComposeTitle(e.target.value)}
                    className={`h-10 ${fieldClass}`}
                  />
                </div>
                <div>
                  <FieldLabel>Note</FieldLabel>
                  <Textarea
                    placeholder="Write freely…"
                    rows={6}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    className={`min-h-[140px] resize-y rounded-xl ${fieldClass}`}
                  />
                </div>
                <Button
                  type="button"
                  onClick={addNote}
                  className="h-11 w-full rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white sm:w-auto sm:min-w-[140px]"
                >
                  <Plus className="size-4" />
                  Save note
                </Button>

                <div className="border-t border-zinc-800/40 pt-5">
                  <FieldLabel>Find notes</FieldLabel>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Input
                        placeholder="Search by title"
                        value={noteTitleFilter}
                        onChange={(e) => setNoteTitleFilter(e.target.value)}
                        className={`h-10 ${fieldClass}`}
                      />
                    </div>
                    <div>
                      <div className="relative">
                        <Calendar
                          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
                          aria-hidden
                        />
                        <Input
                          type="date"
                          value={noteCreatedDateFilter}
                          onChange={(e) => setNoteCreatedDateFilter(e.target.value)}
                          className={`h-10 pl-9 ${fieldClass}`}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-zinc-600">Created on this day</p>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 w-full rounded-xl text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300"
                        onClick={() => {
                          setNoteTitleFilter("");
                          setNoteCreatedDateFilter("");
                        }}
                      >
                        Clear search
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 px-0.5 text-sm font-medium text-zinc-400">Library</h2>
              {notes.length === 0 ? (
                <div className={`${listShellClass} px-5 py-12 sm:px-6`}>
                  <p className="text-center text-sm leading-relaxed text-zinc-500">
                    No notes yet. Write one above — it stays in this browser only.
                  </p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className={`${listShellClass} px-5 py-12 sm:px-6`}>
                  <p className="text-center text-sm text-zinc-500">
                    Nothing matches. Try clearing search or picking another date.
                  </p>
                </div>
              ) : (
                <div className={listShellClass}>
                  <ul className="divide-y divide-zinc-800/50">
                    {filteredNotes.map((note) => (
                      <li key={note.id} className="px-5 py-4 sm:px-6">
                        <div className="flex min-w-0 gap-3">
                          <div className="min-w-0 flex-1 space-y-3">
                            <Input
                              value={note.title}
                              onChange={(e) => updateNote(note.id, { title: e.target.value })}
                              placeholder="Untitled"
                              className={`h-9 text-sm font-medium ${fieldClass}`}
                            />
                            <Textarea
                              value={note.body}
                              onChange={(e) => updateNote(note.id, { body: e.target.value })}
                              placeholder="Empty note"
                              className={`min-h-[100px] resize-y text-sm leading-relaxed text-zinc-300 ${fieldClass}`}
                            />
                            <p className="text-[11px] text-zinc-600">
                              <span className="text-zinc-500">Created</span>{" "}
                              {new Date(note.createdAt).toLocaleString()} ·{" "}
                              <span className="text-zinc-500">Edited</span>{" "}
                              {new Date(note.updatedAt).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNote(note.id)}
                            className="mt-0.5 shrink-0 text-zinc-600 hover:bg-zinc-800/60 hover:text-zinc-300"
                            aria-label="Delete note"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
