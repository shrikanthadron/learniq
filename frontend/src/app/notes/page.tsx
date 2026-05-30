"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Sparkles, Layers, X, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  noteId?: string | null;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [flashcardTitle, setFlashcardTitle] = useState("");
  const [flashcardNoteId, setFlashcardNoteId] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadNotes = useCallback(async () => {
    const data = await api<Note[]>("/notes");
    setNotes(data);
  }, []);

  useEffect(() => {
    loadNotes().catch((e) => setError(e instanceof Error ? e.message : "Failed to load notes"));
  }, [loadNotes]);

  const addNote = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const note = await api<Note>("/notes", {
        method: "POST",
        body: JSON.stringify({ title, content }),
      });
      setNotes((n) => [note, ...n]);
      setTitle("");
      setContent("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (note: Note) => {
    if (!confirm(`Delete "${note.title}" and its flashcards?`)) return;
    setDeletingNoteId(note.id);
    setError("");
    try {
      await api(`/notes/${note.id}`, { method: "DELETE" });
      setNotes((n) => n.filter((x) => x.id !== note.id));
      if (flashcardNoteId === note.id) setFlashcards(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete note");
    } finally {
      setDeletingNoteId(null);
    }
  };

  const openFlashcards = async (note: Note) => {
    setError("");
    try {
      const cards = await api<Flashcard[]>(`/notes/${note.id}/flashcards`);
      setFlashcards(cards);
      setFlashcardTitle(note.title);
      setFlashcardNoteId(note.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load flashcards");
    }
  };

  const generateFlashcards = async (note: Note) => {
    setGeneratingId(note.id);
    setError("");
    try {
      const cards = await api<Flashcard[]>(`/notes/${note.id}/flashcards`, { method: "POST" });
      if (!cards.length) {
        setError("No flashcards generated. Add more content to the note.");
        return;
      }
      setFlashcards(cards);
      setFlashcardTitle(note.title);
      setFlashcardNoteId(note.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Flashcard generation failed");
    } finally {
      setGeneratingId(null);
    }
  };

  const deleteFlashcard = async (cardId: string) => {
    setDeletingCardId(cardId);
    setError("");
    try {
      await api(`/flashcards/${cardId}`, { method: "DELETE" });
      setFlashcards((cards) => (cards ? cards.filter((c) => c.id !== cardId) : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete flashcard");
    } finally {
      setDeletingCardId(null);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <FileText className="w-8 h-8 text-brand-500" />
              Notes & Flashcards
            </h1>
            <p className="text-[var(--text-secondary)]">Save notes, AI summaries, generate flashcards</p>
          </div>

          {error && <p className="text-red-500 text-sm glass-card">{error}</p>}

          <div className="glass-card">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add Note
            </h2>
            <input
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field mb-3"
            />
            <textarea
              placeholder="Paste your study notes here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-field min-h-[120px] resize-y"
            />
            <button onClick={addNote} disabled={saving} className="btn-primary mt-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {saving ? "Saving..." : "Save & Summarize"}
            </button>
          </div>

          {notes.length === 0 ? (
            <p className="text-center text-[var(--text-secondary)] glass-card py-8">No notes yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {notes.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card relative"
                >
                  <button
                    type="button"
                    onClick={() => deleteNote(note)}
                    disabled={deletingNoteId === note.id}
                    className="absolute top-3 right-3 p-2 rounded-lg hover:bg-red-500/10 text-red-500"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <h3 className="font-semibold text-lg pr-10">{note.title}</h3>
                  <pre className="text-sm text-[var(--text-secondary)] mt-3 whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">
                    {note.summary || note.content || "No summary yet."}
                  </pre>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => generateFlashcards(note)}
                      disabled={generatingId === note.id}
                      className="text-sm text-brand-500 flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                      <Layers className="w-4 h-4" />
                      {generatingId === note.id ? "Generating..." : "Generate Flashcards"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openFlashcards(note)}
                      className="text-sm text-[var(--text-secondary)] hover:text-brand-500"
                    >
                      View flashcards
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence>
          {flashcards && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">Flashcards — {flashcardTitle}</h2>
                  <button type="button" onClick={() => setFlashcards(null)} className="p-2 rounded-lg hover:bg-brand-500/10">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {flashcards.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)] py-8 text-center">No flashcards yet. Generate some from your note.</p>
                ) : (
                  <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                    {flashcards.map((card, idx) => (
                      <div key={card.id} className="p-4 rounded-xl bg-brand-500/5 border border-[var(--glass-border)] relative">
                        <button
                          type="button"
                          onClick={() => deleteFlashcard(card.id)}
                          disabled={deletingCardId === card.id}
                          className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                          title="Delete flashcard"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <p className="text-xs text-brand-500 font-medium mb-1">Card {idx + 1}</p>
                        <p className="font-medium text-sm pr-8">{card.front}</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-2 border-t border-[var(--glass-border)] pt-2">
                          {card.back}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => setFlashcards(null)} className="btn-primary mt-4 w-full">
                  Done
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
