'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { vaultAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Search, Plus, FileText, Download, Eye, ShieldCheck, Trash2, X, UploadCloud, Loader2, File, Image as ImageIcon, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
            alert('Preview not supported for this file type.');
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
            await vaultAPI.deletePassword(id);
            fetchFiles();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const isPreviewable = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf'].includes(ext);
    };

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <ImageIcon className="w-5 h-5" />;
        if (['js', 'py', 'html', 'css', 'json'].includes(ext)) return <FileCode className="w-5 h-5" />;
        return <FileText className="w-5 h-5" />;
    };

    if (loading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-surface">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface">
            <Navbar />

            <main className="container mx-auto px-4 py-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-content mb-1">File Vault</h1>
                        <p className="text-content-muted text-sm">Encrypted with AES-256 + RSA digital signatures</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary"
                    >
                        <UploadCloud className="w-5 h-5" />
                        Upload File
                    </button>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-subtle" />
                    <input
                        type="text"
                        className="input pl-12"
                        placeholder="Search files by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredFiles.length === 0 ? (
                    <div className="card p-16 text-center border-dashed">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-subtle mb-6">
                            <File className="w-8 h-8 text-content-subtle" />
                        </div>
                        <h3 className="text-lg font-medium text-content mb-2">
                            {files.length === 0 ? 'No files stored yet' : 'No matching files'}
                        </h3>
                        <p className="text-content-muted text-sm max-w-sm mx-auto mb-6">
                            {files.length === 0
                                ? 'Upload essential documents and archives to keep them secure.'
                                : 'Try adjusting your search terms.'}
                        </p>
                        {files.length === 0 && (
                            <button onClick={() => setShowModal(true)} className="btn-primary">
                                Upload your first file
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {filteredFiles.map((file) => (
                                <motion.div
                                    key={file.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="card card-hover p-4 group"
                                >
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="icon-container icon-yellow shrink-0">
                                                {getFileIcon(file.file_name)}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-medium text-content truncate pr-4">{file.name}</h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-subtle mt-1">
                                                    <span className="truncate max-w-[200px]">{file.file_name}</span>
                                                    <span>•</span>
                                                    <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-4 lg:mt-0 w-full lg:w-auto pl-14 lg:pl-0">
                                            {isPreviewable(file.file_name) && (
                                                <button
                                                    onClick={() => handlePreview(file)}
                                                    className="btn-secondary px-3 py-1.5 text-xs"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Preview
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDownload(file)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </button>
                                            <button
                                                onClick={() => handleVerify(file.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green hover:bg-accent-green/20 transition-colors"
                                            >
                                                <ShieldCheck className="w-4 h-4" />
                                                Verify
                                            </button>
                                            <button
                                                onClick={() => handleDelete(file.id)}
                                                className="p-2.5 text-content-subtle hover:text-accent-red hover:bg-accent-red/10 rounded-full transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {verificationStatus[file.id] && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className={`mt-4 p-3 rounded-xl text-sm ${verificationStatus[file.id].valid
                                                ? 'bg-accent-green/10 border border-accent-green/20 text-accent-green'
                                                : 'bg-accent-red/10 border border-accent-red/20 text-accent-red'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {verificationStatus[file.id].valid ? <ShieldCheck className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                {verificationStatus[file.id].message}
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Upload Modal */}
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
                            className="relative w-full max-w-lg bg-surface-elevated border border-surface-border rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-5 border-b border-surface-border flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-content">Upload Secure File</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 text-content-subtle hover:text-content hover:bg-surface-border rounded-full transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-5">
                                {error && (
                                    <div className="mb-5 p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-content-muted mb-2">File Label</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="E.g., Passport, Tax Document"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-content-muted mb-2">Select File</label>
                                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-surface-border rounded-xl cursor-pointer hover:border-accent-blue/50 hover:bg-surface-subtle transition-all group">
                                            <div className="flex flex-col items-center justify-center py-4">
                                                <UploadCloud className="w-8 h-8 mb-2 text-content-subtle group-hover:text-accent-blue transition-colors" />
                                                <p className="text-sm text-content-muted group-hover:text-content">
                                                    Click to upload
                                                </p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                                                required
                                            />
                                        </label>
                                        {formData.file && (
                                            <div className="flex items-center gap-2 mt-3 p-3 bg-surface-subtle rounded-lg border border-surface-border text-sm">
                                                <FileText className="w-4 h-4 text-accent-blue" />
                                                <span className="flex-1 truncate text-content">{formData.file.name}</span>
                                                <span className="text-content-subtle">({(formData.file.size / 1024).toFixed(1)} KB)</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            className="btn-secondary flex-1"
                                            onClick={() => setShowModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-primary flex-1"
                                            disabled={uploading}
                                        >
                                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Encrypt & Upload'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closePreview}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-5xl h-[85vh] bg-surface-elevated border border-surface-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-elevated z-10">
                                <h2 className="text-base font-medium text-content flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-accent-blue" />
                                    {previewData.name}
                                </h2>
                                <button onClick={closePreview} className="p-2 text-content-subtle hover:text-content hover:bg-surface-border rounded-full transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 bg-surface p-4 overflow-auto flex items-center justify-center">
                                {previewData.type === 'pdf' ? (
                                    <iframe
                                        src={previewData.url}
                                        className="w-full h-full rounded-lg border border-surface-border bg-white"
                                        title="PDF Preview"
                                    />
                                ) : (
                                    <img
                                        src={previewData.url}
                                        alt={previewData.name}
                                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                    />
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
