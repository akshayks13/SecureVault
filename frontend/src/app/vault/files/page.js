'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { vaultAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function FilesPage() {
    const { loading, isAuthenticated } = useAuth();
    const [files, setFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState({ url: '', type: '', name: '' });
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

    // Search filter
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredFiles(files);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredFiles(
                files.filter(file =>
                    file.name.toLowerCase().includes(query) ||
                    file.file_name.toLowerCase().includes(query)
                )
            );
        }
    }, [searchQuery, files]);

    const fetchFiles = async () => {
        try {
            const response = await vaultAPI.getFiles();
            setFiles(response.data);
            setFilteredFiles(response.data);
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

    const handlePreview = async (file) => {
        const previewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf'];
        const extension = file.file_name.split('.').pop().toLowerCase();

        if (!previewableExtensions.includes(extension)) {
            alert('Preview not supported for this file type. Supported: Images (jpg, png, gif, webp, svg) and PDFs.');
            return;
        }

        try {
            const response = await vaultAPI.previewFile(file.id);
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);

            setPreviewData({
                url,
                type: extension === 'pdf' ? 'pdf' : 'image',
                name: file.file_name
            });
            setShowPreview(true);
        } catch (error) {
            alert('Preview failed: ' + (error.response?.data?.detail || 'Unknown error'));
        }
    };

    const closePreview = () => {
        if (previewData.url) {
            window.URL.revokeObjectURL(previewData.url);
        }
        setShowPreview(false);
        setPreviewData({ url: '', type: '', name: '' });
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

    const isPreviewable = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf'].includes(ext);
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

                {/* Search Bar */}
                <div className="card" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)' }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="🔍 Search files by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ marginBottom: 0 }}
                    />
                </div>

                {filteredFiles.length === 0 ? (
                    <div className="card text-center" style={{ padding: 'var(--space-2xl)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>📁</div>
                        <h3>{files.length === 0 ? 'No files stored yet' : 'No matching files'}</h3>
                        <p className="text-muted mt-sm">
                            {files.length === 0
                                ? 'Click "Upload File" to encrypt and store your first file.'
                                : 'Try a different search term'}
                        </p>
                    </div>
                ) : (
                    <div className="vault-list">
                        {filteredFiles.map(file => (
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
                                        {isPreviewable(file.file_name) && (
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => handlePreview(file)}
                                                style={{ padding: '0.4rem 0.8rem' }}
                                            >
                                                👁️ Preview
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleDownload(file)}
                                            style={{ padding: '0.4rem 0.8rem' }}
                                        >
                                            ⬇️ Download
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handleVerify(file.id)}
                                            style={{ padding: '0.4rem 0.8rem' }}
                                        >
                                            ✓ Verify
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleDelete(file.id)}
                                            style={{ padding: '0.4rem 0.8rem' }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                {verificationStatus[file.id] && (
                                    <div className={`alert ${verificationStatus[file.id].valid ? 'alert-success' : 'alert-error'}`}>
                                        {verificationStatus[file.id].message}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Upload Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Upload File</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">File Label</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="E.g., Passport, Tax Document"
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
                                />
                                {formData.file && (
                                    <p className="text-muted mt-sm">
                                        Selected: {formData.file.name} ({(formData.file.size / 1024).toFixed(1)} KB)
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-md">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    disabled={uploading}
                                >
                                    {uploading ? <span className="spinner"></span> : 'Encrypt & Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && (
                <div className="modal-overlay" onClick={closePreview}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Preview: {previewData.name}</h2>
                            <button className="modal-close" onClick={closePreview}>&times;</button>
                        </div>
                        <div style={{
                            overflow: 'auto',
                            maxHeight: 'calc(90vh - 100px)',
                            display: 'flex',
                            justifyContent: 'center',
                            padding: 'var(--space-md)',
                            backgroundColor: 'var(--surface)'
                        }}>
                            {previewData.type === 'pdf' ? (
                                <iframe
                                    src={previewData.url}
                                    style={{ width: '100%', height: '70vh', border: 'none' }}
                                    title="PDF Preview"
                                />
                            ) : (
                                <img
                                    src={previewData.url}
                                    alt={previewData.name}
                                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
