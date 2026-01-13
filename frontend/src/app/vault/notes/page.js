'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { vaultAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';

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
                setSuccess('Note updated!');
            } else {
                await vaultAPI.createNote(formTitle, formContent);
                setSuccess('Note created!');
            }
            setShowModal(false);
            fetchNotes();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save note');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this note?')) return;
        try {
            await vaultAPI.deleteNote(id);
            fetchNotes();
            setSuccess('Note deleted');
        } catch (err) {
            setError('Failed to delete note');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh' }}>
                <span className="spinner" style={{ width: 40, height: 40 }}></span>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div>
            <Navbar />

            <main className="container dashboard">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Secure Notes</h1>
                        <p className="text-muted">Store encrypted notes securely</p>
                    </div>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        + New Note
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {/* Search Bar */}
                <div className="card" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)' }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="🔍 Search notes by title or content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ marginBottom: 0 }}
                    />
                </div>

                {filteredNotes.length === 0 ? (
                    <div className="card text-center" style={{ padding: 'var(--space-2xl)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>📝</div>
                        <h3>{notes.length === 0 ? 'No notes yet' : 'No matching notes'}</h3>
                        <p className="text-muted">
                            {notes.length === 0
                                ? 'Create your first secure note!'
                                : 'Try a different search term'}
                        </p>
                    </div>
                ) : (
                    <div className="notes-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 'var(--space-lg)'
                    }}>
                        {filteredNotes.map(note => (
                            <div key={note.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openEditModal(note)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-md)' }}>
                                    <h3 style={{ margin: 0 }}>{note.title}</h3>
                                    <button
                                        className="btn btn-danger"
                                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                                        onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                                <p className="text-muted" style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    marginBottom: 'var(--space-md)'
                                }}>
                                    {note.content}
                                </p>
                                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                    {new Date(note.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Note Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingNote ? 'Edit Note' : 'New Note'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="Note title"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Content</label>
                                <textarea
                                    className="form-input"
                                    value={formContent}
                                    onChange={(e) => setFormContent(e.target.value)}
                                    placeholder="Write your secure note here..."
                                    required
                                    rows={10}
                                    style={{ resize: 'vertical', minHeight: '200px' }}
                                />
                            </div>
                            <div className="flex gap-md">
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editingNote ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
