'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { vaultAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Search, Plus, Trash2, Edit2, StickyNote, X, Save, Loader2, FilePenLine, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotesPage() {
    const { loading: authLoading, isAuthenticated } = useAuth();
    const [notes, setNotes] = useState([]);
    const [filteredNotes, setFilteredNotes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    // Form states
    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotes();
        }
    }, [isAuthenticated]);

    // Search filter
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredNotes(notes);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredNotes(
                notes.filter(note =>
                    note.title.toLowerCase().includes(query) ||
                    note.content.toLowerCase().includes(query)
                )
            );
        }
    }, [searchQuery, notes]);

    const fetchNotes = async () => {
        try {
            const response = await vaultAPI.getNotes();
            setNotes(response.data);
            setFilteredNotes(response.data);
        } catch (err) {
            console.error('Failed to fetch notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingNote(null);
        setFormTitle('');
        setFormContent('');
        setShowModal(true);
    };

    const openEditModal = (note) => {
        setEditingNote(note);
        setFormTitle(note.title);
        setFormContent(note.content);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingNote) {
                await vaultAPI.updateNote(editingNote.id, formTitle, formContent);
                setSuccess('Note updated successfully!');
            } else {
                await vaultAPI.createNote(formTitle, formContent);
                setSuccess('Note created successfully!');
            }
            setShowModal(false);
            fetchNotes();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save note');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this note?')) return;
        try {
            await vaultAPI.deleteNote(id);
            fetchNotes();
            setSuccess('Note deleted');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to delete note');
            setTimeout(() => setError(''), 3000);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Secure Notes</h1>
                        <p className="text-muted-foreground">Store encrypted notes for IDs, bank accounts, and secrets</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        New Note
                    </button>
                </div>

                {(error || success) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-4 rounded-lg border text-sm font-medium ${error
                                ? 'bg-destructive/10 border-destructive/20 text-destructive'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}
                    >
                        {error || success}
                    </motion.div>
                )}

                <div className="relative mb-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        className="w-full bg-card border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                        placeholder="Search notes by title or content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredNotes.length === 0 ? (
                    <div className="text-center py-20 bg-card/30 rounded-2xl border border-white/5 border-dashed">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6">
                            <StickyNote className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">
                            {notes.length === 0 ? 'No notes yet' : 'No matching notes'}
                        </h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                            {notes.length === 0
                                ? 'Create your first secure note to keep sensitive information safe.'
                                : 'Try adjusting your search terms.'}
                        </p>
                        {notes.length === 0 && (
                            <button
                                onClick={openCreateModal}
                                className="text-primary hover:text-primary/80 font-medium hover:underline"
                            >
                                Create your first note
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {filteredNotes.map((note) => (
                                <motion.div
                                    key={note.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => openEditModal(note)}
                                    className="group bg-card border border-white/5 hover:border-white/10 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1 flex flex-col h-[280px]"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <StickyNote className="w-5 h-5" />
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                        {note.title}
                                    </h3>

                                    <p className="text-muted-foreground text-sm line-clamp-6 flex-1 whitespace-pre-wrap">
                                        {note.content}
                                    </p>

                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(note.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium">
                                            <Edit2 className="w-3 h-3" />
                                            Edit
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Note Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <FilePenLine className="w-5 h-5 text-primary" />
                                    {editingNote ? 'Edit Note' : 'New Note'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Title</label>
                                        <input
                                            type="text"
                                            className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium text-lg"
                                            value={formTitle}
                                            onChange={(e) => setFormTitle(e.target.value)}
                                            placeholder="Note title"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <label className="text-sm font-medium text-muted-foreground">Content</label>
                                        <textarea
                                            className="w-full h-[300px] bg-secondary/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none font-mono text-sm leading-relaxed"
                                            value={formContent}
                                            onChange={(e) => setFormContent(e.target.value)}
                                            placeholder="Write your secure note here..."
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="p-6 border-t border-white/10 bg-black/20 flex gap-3">
                                    <button
                                        type="button"
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors font-medium"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {editingNote ? 'Update Note' : 'Create Note'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
