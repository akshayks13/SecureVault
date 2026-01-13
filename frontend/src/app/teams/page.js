'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { teamsAPI, vaultAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function TeamsPage() {
    const { loading: authLoading, isAuthenticated } = useAuth();
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [sharedFiles, setSharedFiles] = useState([]);
    const [myFiles, setMyFiles] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    // Form states
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamDesc, setNewTeamDesc] = useState('');
    const [newMemberUsername, setNewMemberUsername] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('member');
    const [selectedFileToShare, setSelectedFileToShare] = useState('');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchTeams();
        }
    }, [isAuthenticated]);

    const fetchTeams = async () => {
        try {
            const response = await teamsAPI.getMyTeams();
            setTeams(response.data);
        } catch (err) {
            console.error('Failed to fetch teams:', err);
        } finally {
            setLoading(false);
        }
    };

    const selectTeam = async (team) => {
        setSelectedTeam(team);
        setError('');
        setSuccess('');
        try {
            const [membersRes, sharedRes] = await Promise.all([
                teamsAPI.getTeamMembers(team.id),
                teamsAPI.getSharedFiles(team.id)
            ]);
            setMembers(membersRes.data);
            setSharedFiles(sharedRes.data);
        } catch (err) {
            setError('Failed to load team details');
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await teamsAPI.createTeam(newTeamName, newTeamDesc);
            setShowCreateModal(false);
            setNewTeamName('');
            setNewTeamDesc('');
            fetchTeams();
            setSuccess('Team created!');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create team');
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await teamsAPI.addMember(selectedTeam.id, newMemberUsername, newMemberRole);
            setShowAddMemberModal(false);
            setNewMemberUsername('');
            selectTeam(selectedTeam);
            setSuccess('Member added!');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm('Remove this member?')) return;
        try {
            await teamsAPI.removeMember(selectedTeam.id, userId);
            selectTeam(selectedTeam);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to remove member');
        }
    };

    const openShareModal = async () => {
        try {
            const response = await vaultAPI.getFiles();
            setMyFiles(response.data);
            setShowShareModal(true);
        } catch (err) {
            setError('Failed to load your files');
        }
    };

    const handleShareFile = async (e) => {
        e.preventDefault();
        if (!selectedFileToShare) return;
        try {
            await teamsAPI.shareFile(selectedTeam.id, parseInt(selectedFileToShare));
            setShowShareModal(false);
            setSelectedFileToShare('');
            selectTeam(selectedTeam);
            setSuccess('File shared with team!');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to share file');
        }
    };

    const handleDownloadFile = async (file) => {
        try {
            const response = await teamsAPI.downloadSharedFile(selectedTeam.id, file.id);
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.file_name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            setError('Download failed');
        }
    };

    const handleRemoveSharedFile = async (fileId) => {
        if (!confirm('Remove this shared file?')) return;
        try {
            await teamsAPI.removeSharedFile(selectedTeam.id, fileId);
            selectTeam(selectedTeam);
            setSuccess('File removed');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to remove file');
        }
    };

    const handleDeleteTeam = async () => {
        if (!confirm('Delete this team? This cannot be undone.')) return;
        try {
            await teamsAPI.deleteTeam(selectedTeam.id);
            setSelectedTeam(null);
            fetchTeams();
            setSuccess('Team deleted');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete team');
        }
    };

    // Permission helpers
    const isOwner = selectedTeam?.my_role === 'owner';
    const isAdmin = selectedTeam?.my_role === 'admin';
    const canManageMembers = isOwner;
    const canShareFiles = isOwner || isAdmin;

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
                        <h1 className="dashboard-title">Teams</h1>
                        <p className="text-muted">Share encrypted files with your team</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        + Create Team
                    </button>
                </div>

                {/* Role Legend */}
                <div className="card" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)' }}>
                    <strong>Role Permissions:</strong>
                    <ul style={{ margin: 0, paddingLeft: 'var(--space-lg)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <li><strong>Owner:</strong> Add/remove members, share files, view/download</li>
                        <li><strong>Admin:</strong> Share files, view/download</li>
                        <li><strong>Member:</strong> View and download files only</li>
                    </ul>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
                    {/* Teams List */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-lg)' }}>My Teams</h3>
                        {teams.length === 0 ? (
                            <p className="text-muted">No teams yet. Create one!</p>
                        ) : (
                            <div className="vault-list" style={{ border: 'none', background: 'transparent' }}>
                                {teams.map(team => (
                                    <div
                                        key={team.id}
                                        className={`vault-item ${selectedTeam?.id === team.id ? 'active' : ''}`}
                                        onClick={() => selectTeam(team)}
                                        style={{ cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                                    >
                                        <div className="vault-item-info">
                                            <div className="vault-item-icon">👥</div>
                                            <div>
                                                <div className="vault-item-name">{team.name}</div>
                                                <div className="vault-item-meta">
                                                    {team.member_count} member(s) • {team.my_role}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Team Details */}
                    {selectedTeam ? (
                        <div>
                            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <h2>{selectedTeam.name}</h2>
                                        <p className="text-muted">{selectedTeam.description || 'No description'}</p>
                                        <span className="badge" style={{ marginTop: 'var(--space-sm)' }}>
                                            Your role: {selectedTeam.my_role}
                                        </span>
                                    </div>
                                    {isOwner && (
                                        <button className="btn btn-danger" onClick={handleDeleteTeam}>
                                            Delete Team
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Members */}
                            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                    <h3>Members ({members.length})</h3>
                                    {canManageMembers && (
                                        <button className="btn btn-secondary" onClick={() => setShowAddMemberModal(true)}>
                                            + Add Member
                                        </button>
                                    )}
                                </div>
                                <div className="vault-list" style={{ border: 'none', background: 'transparent' }}>
                                    {members.map(member => (
                                        <div key={member.id} className="vault-item">
                                            <div className="vault-item-info">
                                                <div className="vault-item-icon">👤</div>
                                                <div>
                                                    <div className="vault-item-name">{member.username}</div>
                                                    <div className="vault-item-meta" style={{ textTransform: 'capitalize' }}>
                                                        {member.role}
                                                    </div>
                                                </div>
                                            </div>
                                            {canManageMembers && member.role !== 'owner' && (
                                                <button
                                                    className="btn btn-danger"
                                                    style={{ padding: '0.3rem 0.6rem' }}
                                                    onClick={() => handleRemoveMember(member.user_id)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shared Files */}
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                    <h3>Shared Files ({sharedFiles.length})</h3>
                                    {canShareFiles && (
                                        <button className="btn btn-primary" onClick={openShareModal}>
                                            + Share File
                                        </button>
                                    )}
                                </div>
                                {sharedFiles.length === 0 ? (
                                    <p className="text-muted">No shared files yet.</p>
                                ) : (
                                    <div className="vault-list" style={{ border: 'none', background: 'transparent' }}>
                                        {sharedFiles.map(file => (
                                            <div key={file.id} className="vault-item">
                                                <div className="vault-item-info">
                                                    <div className="vault-item-icon">📄</div>
                                                    <div>
                                                        <div className="vault-item-name">{file.name}</div>
                                                        <div className="vault-item-meta">
                                                            {file.file_name} • Shared by {file.shared_by_username}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-sm">
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ padding: '0.3rem 0.6rem' }}
                                                        onClick={() => handleDownloadFile(file)}
                                                    >
                                                        ⬇️ Download
                                                    </button>
                                                    {canShareFiles && (
                                                        <button
                                                            className="btn btn-danger"
                                                            style={{ padding: '0.3rem 0.6rem' }}
                                                            onClick={() => handleRemoveSharedFile(file.id)}
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="card text-center" style={{ padding: 'var(--space-2xl)' }}>
                            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>👥</div>
                            <h3>Select a team</h3>
                            <p className="text-muted">Choose a team from the list or create a new one.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Team Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create Team</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateTeam}>
                            <div className="form-group">
                                <label className="form-label">Team Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description (optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newTeamDesc}
                                    onChange={(e) => setNewTeamDesc(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-md">
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add Member</h2>
                            <button className="modal-close" onClick={() => setShowAddMemberModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleAddMember}>
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newMemberUsername}
                                    onChange={(e) => setNewMemberUsername(e.target.value)}
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select
                                    className="form-input"
                                    value={newMemberRole}
                                    onChange={(e) => setNewMemberRole(e.target.value)}
                                >
                                    <option value="member">Member (view/download only)</option>
                                    <option value="admin">Admin (can share files)</option>
                                </select>
                            </div>
                            <div className="flex gap-md">
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddMemberModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    Add
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Share File Modal */}
            {showShareModal && (
                <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Share File with Team</h2>
                            <button className="modal-close" onClick={() => setShowShareModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleShareFile}>
                            <div className="form-group">
                                <label className="form-label">Select File to Share</label>
                                {myFiles.length === 0 ? (
                                    <p className="text-muted">You have no files in your vault. Upload files first.</p>
                                ) : (
                                    <select
                                        className="form-input"
                                        value={selectedFileToShare}
                                        onChange={(e) => setSelectedFileToShare(e.target.value)}
                                        required
                                    >
                                        <option value="">Select a file...</option>
                                        {myFiles.map(file => (
                                            <option key={file.id} value={file.id}>{file.name} ({file.file_name})</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="flex gap-md">
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowShareModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={myFiles.length === 0}>
                                    Share
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
