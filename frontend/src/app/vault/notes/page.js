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
            <div className="flex items-center justify-center min-h-screen bg-surface">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-surface">
            <Navbar />

            <main className="container mx-auto px-4 py-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-content mb-1">Secure Notes</h1>
                        <p className="text-content-muted text-sm">Store encrypted notes for IDs, bank accounts, and secrets</p>
                    </div>
                    <button onClick={openCreateModal} className="btn-primary">
                        <Plus className="w-5 h-5" />
                        New Note
                    </button>
                </div>

                {(error || success) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-4 rounded-xl text-sm font-medium ${error
                            ? 'bg-accent-red/10 border border-accent-red/20 text-accent-red'
                            : 'bg-accent-green/10 border border-accent-green/20 text-accent-green'
                            }`}
                    >
                        {error || success}
                    </motion.div>
                )}

                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-subtle" />
                    <input
                        type="text"
                        className="input pl-12"
                        placeholder="Search notes by title or content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredNotes.length === 0 ? (
                    <div className="card p-16 text-center border-dashed">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-subtle mb-6">
                            <StickyNote className="w-8 h-8 text-content-subtle" />
                        </div>
                        <h3 className="text-lg font-medium text-content mb-2">
                            {notes.length === 0 ? 'No notes yet' : 'No matching notes'}
                        </h3>
                        <p className="text-content-muted text-sm max-w-sm mx-auto mb-6">
                            {notes.length === 0
                                ? 'Create your first secure note to keep sensitive information safe.'
                                : 'Try adjusting your search terms.'}
                        </p>
                        {notes.length === 0 && (
                            <button onClick={openCreateModal} className="btn-primary">
                                Create your first note
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AnimatePresence>
                            {filteredNotes.map((note) => (
                                <motion.div
                                    key={note.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => openEditModal(note)}
                                    className="card card-hover p-5 cursor-pointer group flex flex-col h-[260px]"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="icon-container icon-purple">
                                            <StickyNote className="w-5 h-5" />
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                                            className="p-2 text-content-subtle hover:text-accent-red hover:bg-accent-red/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <h3 className="font-medium text-content mb-2 line-clamp-1 group-hover:text-accent-blue transition-colors">
                                        {note.title}
                                    </h3>

                                    <p className="text-content-muted text-sm line-clamp-5 flex-1 whitespace-pre-wrap">
                                        {note.content}
                                    </p>

                                    <div className="mt-4 pt-4 border-t border-surface-subtle flex items-center justify-between text-xs text-content-subtle">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(note.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-accent-blue font-medium">
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
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-surface-elevated border border-surface-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-5 border-b border-surface-border flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-content flex items-center gap-2">
                                    <FilePenLine className="w-5 h-5 text-accent-blue" />
                                    {editingNote ? 'Edit Note' : 'New Note'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-2 text-content-subtle hover:text-content hover:bg-surface-border rounded-full transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                                <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                                    <div>
                                        <label className="block text-sm font-medium text-content-muted mb-2">Title</label>
                                        <input
                                            type="text"
                                            className="input font-medium"
                                            value={formTitle}
                                            onChange={(e) => setFormTitle(e.target.value)}
                                            placeholder="Note title"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-content-muted mb-2">Content</label>
                                        <textarea
                                            className="input h-[280px] resize-none font-mono text-sm leading-relaxed"
                                            value={formContent}
                                            onChange={(e) => setFormContent(e.target.value)}
                                            placeholder="Write your secure note here..."
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="p-5 border-t border-surface-border bg-surface flex gap-3">
                                    <button
                                        type="button"
                                        className="btn-secondary flex-1"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary flex-1">
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
