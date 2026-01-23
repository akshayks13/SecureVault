'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { teamsAPI, vaultAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Users, FileText, Settings, X, Search, Shield, UserPlus, FileUp, MoreVertical, Check, Folder, AlertTriangle, Info, Download, Share2, File, Loader2, User } from 'lucide-react';

export default function TeamsPage() {
    const { loading: authLoading, isAuthenticated } = useAuth();
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [sharedFiles, setSharedFiles] = useState([]);
    const [myFiles, setMyFiles] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [modalError, setModalError] = useState(null);

    const [memberToRemove, setMemberToRemove] = useState(null);
    const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] = useState(false);
    const router = useRouter();

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

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

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
        setModalError(null);
        try {
            if (!newMemberUsername) return;

            const updatedTeam = await teamsAPI.addMember(selectedTeam.id, newMemberUsername, newMemberRole);
            setTeams(teams.map(t => t.id === selectedTeam.id ? { ...t, member_count: updatedTeam.member_count } : t));
            selectTeam(selectedTeam);
            setIsAddMemberModalOpen(false);
            setNewMemberUsername('');
            setSuccess('Member added!');
        } catch (err) {
            setModalError(err.response?.data?.detail || 'Failed to add member. Please check the username and try again.');
        }
    };

    const handleRemoveMember = (userId) => {
        setMemberToRemove(userId);
        setIsRemoveMemberModalOpen(true);
    };

    const confirmRemoveMember = async () => {
        if (!memberToRemove || !selectedTeam) return;
        try {
            await teamsAPI.removeMember(selectedTeam.id, memberToRemove);
            setTeams(teams.map(t => t.id === selectedTeam.id ? { ...t, member_count: t.member_count - 1 } : t));
            selectTeam(selectedTeam);
            setIsRemoveMemberModalOpen(false);
            setMemberToRemove(null);
            setSuccess('Member removed!');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to remove member');
            setIsRemoveMemberModalOpen(false);
            setMemberToRemove(null);
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

    const isOwner = selectedTeam?.my_role === 'owner';
    const isAdmin = selectedTeam?.my_role === 'admin';
    const canManageMembers = isOwner;
    const canShareFiles = isOwner || isAdmin;

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-surface">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-surface pb-12">
            <Navbar />

            <main className="container mx-auto px-4 py-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-content mb-1">Teams</h1>
                        <p className="text-content-muted text-sm">Share encrypted files with your team securely</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        Create Team
                    </button>
                </div>

                {/* Role Legend */}
                <div className="mb-8 p-4 rounded-xl bg-surface-elevated border border-surface-border text-sm">
                    <strong className="text-content">Role Permissions:</strong>
                    <ul className="mt-2 space-y-1 text-content-muted list-disc list-inside">
                        <li><strong className="text-accent-green">Owner:</strong> Full access (manage members, delete team, share files)</li>
                        <li><strong className="text-accent-blue">Admin:</strong> Share files, view/download</li>
                        <li><strong className="text-content-muted">Member:</strong> View and download files only</li>
                    </ul>
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm font-medium"
                        >
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 rounded-xl bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm font-medium"
                        >
                            {success}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    {/* Teams List (Left Sidebar) */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="text-lg font-semibold text-content px-2">My Teams</h3>
                        <div className="space-y-2">
                            {teams.length === 0 ? (
                                <div className="text-center p-8 card">
                                    <Users className="w-8 h-8 text-content-subtle mx-auto mb-2 opacity-50" />
                                    <p className="text-sm text-content-muted">No teams yet</p>
                                </div>
                            ) : (
                                teams.map(team => (
                                    <motion.div
                                        key={team.id}
                                        onClick={() => selectTeam(team)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedTeam?.id === team.id ? 'bg-accent-blue/10 border-accent-blue/50 shadow-lg shadow-accent-blue/10' : 'bg-surface-elevated border-surface-border hover:border-surface-border'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-surface-subtle">
                                                <Users className="w-5 h-5 text-accent-blue" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-content truncate">{team.name}</div>
                                                <div className="text-xs text-content-muted flex items-center gap-2">
                                                    <span>{team.member_count} members</span>
                                                    <span>•</span>
                                                    <span className="capitalize text-accent-blue/80">{team.my_role}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Team Details (Main Content) */}
                    <div className="lg:col-span-3">
                        {selectedTeam ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                {/* Header Card */}
                                <div className="card p-6 relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                                        <div>
                                            <h2 className="text-2xl font-bold text-content mb-1">{selectedTeam.name}</h2>
                                            <p className="text-content-muted">{selectedTeam.description || 'No description provided'}</p>
                                        </div>
                                        {isOwner && (
                                            <button
                                                onClick={handleDeleteTeam}
                                                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete Team
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Members Section */}
                                <div className="card overflow-hidden">
                                    <div className="p-6 border-b border-surface-subtle flex items-center justify-between">
                                        <h3 className="font-semibold text-content flex items-center gap-2">
                                            <Users className="w-5 h-5 text-accent-blue" />
                                            Team Members
                                            <span className="bg-surface-subtle text-xs px-2 py-0.5 rounded-full text-content-muted">{members.length}</span>
                                        </h3>
                                        {canManageMembers && (
                                            <button
                                                onClick={() => setIsAddMemberModalOpen(true)}
                                                className="btn-secondary text-sm px-3 py-2"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                                Add Member
                                            </button>
                                        )}
                                    </div>
                                    <div className="divide-y divide-surface-subtle">
                                        {members.map(member => (
                                            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-surface-elevated transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-blue/20 to-accent-purple/20 flex items-center justify-center text-accent-blue font-bold text-lg">
                                                        {member.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-content">{member.username}</div>
                                                        <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${member.role === 'owner' ? 'bg-accent-green/10 text-accent-green' : member.role === 'admin' ? 'bg-accent-blue/10 text-accent-blue' : 'bg-surface-subtle text-content-muted'}`}>
                                                            {member.role}
                                                        </div>
                                                    </div>
                                                </div>

                                                {canManageMembers && member.role !== 'owner' && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.user_id)}
                                                        className="p-2 hover:bg-accent-red/10 text-content-muted hover:text-accent-red rounded-lg transition-colors"
                                                        title="Remove Member"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Shared Files Section */}
                                <div className="card overflow-hidden">
                                    <div className="p-6 border-b border-surface-subtle flex items-center justify-between">
                                        <h3 className="font-semibold text-content flex items-center gap-2">
                                            <Share2 className="w-5 h-5 text-accent-blue" />
                                            Shared Files
                                            <span className="bg-surface-subtle text-xs px-2 py-0.5 rounded-full text-content-muted">{sharedFiles.length}</span>
                                        </h3>
                                        {canShareFiles && (
                                            <button
                                                onClick={openShareModal}
                                                className="btn-primary text-sm px-3 py-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Share File
                                            </button>
                                        )}
                                    </div>

                                    {sharedFiles.length === 0 ? (
                                        <div className="p-8 text-center text-content-muted">
                                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No files have been shared with this team yet.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-surface-subtle">
                                            {sharedFiles.map(file => (
                                                <div key={file.id} className="p-4 flex items-center justify-between hover:bg-surface-elevated transition-colors group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="p-2 rounded-lg bg-accent-blue/10 text-accent-blue">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-content truncate">{file.name}</div>
                                                            <div className="text-xs text-content-muted flex items-center gap-2">
                                                                <span className="truncate">{file.file_name}</span>
                                                                <span>•</span>
                                                                <span>Shared by {file.shared_by_username}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleDownloadFile(file)}
                                                            className="p-2 hover:bg-accent-blue/10 text-content-muted hover:text-accent-blue rounded-lg transition-colors"
                                                            title="Download"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        {canShareFiles && (
                                                            <button
                                                                onClick={() => handleRemoveSharedFile(file.id)}
                                                                className="p-2 hover:bg-accent-red/10 text-content-muted hover:text-accent-red rounded-lg transition-colors"
                                                                title="Remove Share"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center card border-dashed">
                                <div className="w-24 h-24 bg-surface-subtle rounded-full flex items-center justify-center mb-6">
                                    <Users className="w-10 h-10 text-content-subtle opacity-50" />
                                </div>
                                <h3 className="text-xl font-bold text-content mb-2">Select a Team</h3>
                                <p className="text-content-muted max-w-sm mx-auto mb-6">
                                    Select a team from the sidebar to view members and shared files, or create a new team to get started.
                                </p>
                                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                                    Create New Team
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Create Team Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-surface-elevated border border-surface-border rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-surface-border flex justify-between items-center">
                                <h2 className="text-xl font-bold text-content">Create Team</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-content-muted hover:text-content">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-content-muted">Team Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                        placeholder="e.g. Engineering"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-content-muted">Description (optional)</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={newTeamDesc}
                                        onChange={(e) => setNewTeamDesc(e.target.value)}
                                        placeholder="Brief description..."
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary flex-1"
                                    >
                                        Create Team
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Member Modal */}
            <AnimatePresence>
                {isAddMemberModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddMemberModalOpen(false)}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-surface-elevated border border-surface-border rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-surface-border flex justify-between items-center">
                                <h3 className="text-xl font-bold text-content">Add Team Member</h3>
                                <button
                                    onClick={() => setIsAddMemberModalOpen(false)}
                                    className="p-2 text-content-muted hover:text-content hover:bg-surface-subtle rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddMember} className="p-6 space-y-4">
                                {modalError && (
                                    <div className="p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm font-medium flex items-start gap-3">
                                        <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                                        <span>{modalError}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-content-muted mb-1">
                                        Username
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" size={18} />
                                        <input
                                            type="text"
                                            value={newMemberUsername}
                                            onChange={(e) => setNewMemberUsername(e.target.value)}
                                            placeholder="Enter username"
                                            className="input pl-10"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-content-muted">Role</label>
                                    <div className="relative">
                                        <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                                        <select
                                            className="input pl-9 appearance-none"
                                            value={newMemberRole}
                                            onChange={(e) => setNewMemberRole(e.target.value)}
                                        >
                                            <option value="member">Member (view/download only)</option>
                                            <option value="admin">Admin (can share files)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddMemberModalOpen(false)}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newMemberUsername}
                                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Add Member
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Remove Member Confirmation Modal */}
            <AnimatePresence>
                {isRemoveMemberModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsRemoveMemberModalOpen(false)}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-surface-elevated border border-surface-border rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="p-3 bg-accent-red/10 rounded-full">
                                        <AlertTriangle size={24} className="text-accent-red" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-content">Remove Member</h3>
                                        <p className="text-content-muted text-sm mt-1">
                                            Are you sure you want to remove this member from the team?
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end space-x-3 mt-6">
                                    <button
                                        onClick={() => setIsRemoveMemberModalOpen(false)}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmRemoveMember}
                                        className="inline-flex items-center gap-2 px-4 py-2 font-bold rounded-lg bg-accent-red text-white hover:bg-accent-red/90 transition-colors"
                                    >
                                        Remove Member
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Share File Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-surface-elevated border border-surface-border rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-surface-border flex justify-between items-center">
                                <h2 className="text-xl font-bold text-content">Share File</h2>
                                <button onClick={() => setShowShareModal(false)} className="text-content-muted hover:text-content">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleShareFile} className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-content-muted">Select File</label>
                                    {myFiles.length === 0 ? (
                                        <div className="p-4 rounded-xl bg-surface-subtle text-center text-sm text-content-muted">
                                            You have no files in your vault. Upload files first.
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <File className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                                            <select
                                                className="input pl-9 appearance-none"
                                                value={selectedFileToShare}
                                                onChange={(e) => setSelectedFileToShare(e.target.value)}
                                                required
                                            >
                                                <option value="">Select a file...</option>
                                                {myFiles.map(file => (
                                                    <option key={file.id} value={file.id}>{file.name} ({file.file_name})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowShareModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary flex-1"
                                        disabled={myFiles.length === 0}
                                    >
                                        Share File
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
