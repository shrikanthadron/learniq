"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface PlannerEventForm {
  id?: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  priority: number;
  completed?: boolean;
}

interface Props {
  open: boolean;
  event?: PlannerEventForm | null;
  onClose: () => void;
  onSave: (data: PlannerEventForm) => Promise<void>;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventModal({ open, event, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [priority, setPriority] = useState(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setStartAt(toLocalInput(event.startAt));
      setEndAt(toLocalInput(event.endAt));
      setPriority(event.priority);
    } else {
      const start = new Date();
      start.setMinutes(0, 0, 0);
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      setTitle("");
      setDescription("");
      setStartAt(toLocalInput(start.toISOString()));
      setEndAt(toLocalInput(end.toISOString()));
      setPriority(2);
    }
    setError("");
  }, [open, event]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setError("End time must be after start time");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        id: event?.id,
        title: title.trim(),
        description: description.trim() || undefined,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        priority,
        completed: event?.completed,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{event?.id ? "Edit Event" : "Add Event"}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-brand-500/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input-field"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="input-field min-h-[80px] resize-y"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">Start</label>
            <input
              type="datetime-local"
              className="input-field"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">End</label>
            <input
              type="datetime-local"
              className="input-field"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">Priority</label>
            <select
              className="input-field"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            >
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving..." : event?.id ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
