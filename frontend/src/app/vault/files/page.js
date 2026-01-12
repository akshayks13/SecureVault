'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { vaultAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function FilesPage() {
    const { loading, isAuthenticated } = useAuth();
    const [files, setFiles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', file: null });
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [verificationStatus, setVerificationStatus] = useState({});
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchFiles();
        }
    }, [isAuthenticated]);

    const fetchFiles = async () => {
        try {
            const response = await vaultAPI.getFiles();
            setFiles(response.data);
        } catch (error) {
            console.error('Failed to fetch files:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.file) {
            setError('Please select a file');
            return;
        }

        setError('');
        setUploading(true);

        try {
            await vaultAPI.uploadFile(formData.name, formData.file);
            setShowModal(false);
            setFormData({ name: '', file: null });
            fetchFiles();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (file) => {
        try {
            const response = await vaultAPI.downloadFile(file.id);
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.file_name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed: ' + (error.response?.data?.detail || 'Unknown error'));
        }
    };

    const handleVerify = async (fileId) => {
        try {
            const response = await vaultAPI.verifyFile(fileId);
            setVerificationStatus(prev => ({
                ...prev,
                [fileId]: response.data
            }));
        } catch (error) {
            setVerificationStatus(prev => ({
                ...prev,
                [fileId]: { valid: false, message: 'Verification failed' }
            }));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await vaultAPI.deletePassword(id); // Same endpoint for delete
            fetchFiles();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    if (loading || !isAuthenticated) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh' }}>
                <span className="spinner" style={{ width: 40, height: 40 }}></span>
            </div>
        );
    }

    return (
        <div>
            <Navbar />

            <main className="container dashboard">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">File Vault</h1>
                        <p className="text-muted">Encrypted with AES-256 + RSA digital signatures</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Upload File
                    </button>
                </div>

                {files.length === 0 ? (
                    <div className="card text-center" style={{ padding: 'var(--space-2xl)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>📁</div>
                        <h3>No files stored yet</h3>
                        <p className="text-muted mt-sm">Click "Upload File" to encrypt and store your first file.</p>
                    </div>
                ) : (
                    <div className="vault-list">
                        {files.map(file => (
                            <div key={file.id} className="vault-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-md)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="vault-item-info">
                                        <div className="vault-item-icon">📄</div>
                                        <div>
                                            <div className="vault-item-name">{file.name}</div>
                                            <div className="vault-item-meta">
                                                {file.file_name} • {new Date(file.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-sm">
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handleVerify(file.id)}
                                            style={{ padding: '0.4rem 0.8rem' }}
                                        >
                                            🔍 Verify
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleDownload(file)}
                                            style={{ padding: '0.4rem 0.8rem' }}
                                        >
                                            ⬇️ Download
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleDelete(file.id)}
                                            style={{ padding: '0.4rem 0.8rem' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {verificationStatus[file.id] && (
                                    <div className={`alert ${verificationStatus[file.id].valid ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 0 }}>
                                        <strong>{verificationStatus[file.id].valid ? '✅ Verified:' : '❌ Failed:'}</strong> {verificationStatus[file.id].message}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Upload File Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Upload File</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <div className="alert alert-info">
                            Your file will be encrypted with AES-256-GCM and signed with RSA-2048 for tamper detection.
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Label / Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Tax Documents 2024"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Select File</label>
                                <input
                                    type="file"
                                    className="form-input"
                                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                                    required
                                    style={{ padding: 'var(--space-sm)' }}
                                />
                            </div>

                            {formData.file && (
                                <div className="alert alert-info" style={{ marginBottom: 'var(--space-lg)' }}>
                                    Selected: <strong>{formData.file.name}</strong> ({(formData.file.size / 1024).toFixed(1)} KB)
                                </div>
                            )}

                            <div className="flex gap-md">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={uploading} style={{ flex: 1 }}>
                                    {uploading ? <span className="spinner"></span> : 'Encrypt & Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
