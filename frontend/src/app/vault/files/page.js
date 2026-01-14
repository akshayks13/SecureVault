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

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <ImageIcon className="w-6 h-6" />;
        if (['js', 'py', 'html', 'css', 'json'].includes(ext)) return <FileCode className="w-6 h-6" />;
        return <FileText className="w-6 h-6" />;
    };

    if (loading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">File Vault</h1>
                        <p className="text-muted-foreground">Encrypted with AES-256 + RSA digital signatures</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                    >
                        <UploadCloud className="w-5 h-5" />
                        Upload File
                    </button>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        className="w-full bg-card border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                        placeholder="Search files by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredFiles.length === 0 ? (
                    <div className="text-center py-20 bg-card/30 rounded-2xl border border-white/5 border-dashed">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6">
                            <File className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">
                            {files.length === 0 ? 'No files stored yet' : 'No matching files'}
                        </h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                            {files.length === 0
                                ? 'Upload essential documents, images, or archives to keep them secure.'
                                : 'Try adjusting your search terms.'}
                        </p>
                        {files.length === 0 && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="text-primary hover:text-primary/80 font-medium hover:underline"
                            >
                                Upload your first file
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <AnimatePresence>
                            {filteredFiles.map((file) => (
                                <motion.div
                                    key={file.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group bg-card border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-black/20"
                                >
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-500 shrink-0">
                                                {getFileIcon(file.file_name)}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-lg truncate pr-4">{file.name}</h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                                    <span className="truncate max-w-[200px]">{file.file_name}</span>
                                                    <span>•</span>
                                                    <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-4 lg:mt-0 w-full lg:w-auto pl-[4.5rem] lg:pl-0">
                                            {isPreviewable(file.file_name) && (
                                                <button
                                                    onClick={() => handlePreview(file)}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Preview
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDownload(file)}
                                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition-colors"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </button>
                                            <button
                                                onClick={() => handleVerify(file.id)}
                                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-sm font-medium transition-colors"
                                            >
                                                <ShieldCheck className="w-4 h-4" />
                                                Verify
                                            </button>
                                            <button
                                                onClick={() => handleDelete(file.id)}
                                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors ml-1"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4.5 h-4.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {verificationStatus[file.id] && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className={`mt-4 p-3 rounded-lg border text-sm ${verificationStatus[file.id].valid
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : 'bg-destructive/10 border-destructive/20 text-destructive'
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
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-xl font-bold">Upload Secure File</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                {error && (
                                    <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">File Label</label>
                                        <input
                                            type="text"
                                            className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="E.g., Passport, Tax Document"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Select File</label>
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-white/5 transition-all group">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <p className="text-sm text-muted-foreground group-hover:text-foreground">
                                                    <span className="font-semibold">Click to upload</span> or drag and drop
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
                                            <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg border border-white/5 text-sm">
                                                <FileText className="w-4 h-4 text-primary" />
                                                <span className="flex-1 truncate">{formData.file.name}</span>
                                                <span className="text-muted-foreground">({(formData.file.size / 1024).toFixed(1)} KB)</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 pt-2">
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
                            className="relative w-full max-w-5xl h-[85vh] bg-card border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-card z-10">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-primary" />
                                    Preview: {previewData.name}
                                </h2>
                                <button onClick={closePreview} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 bg-black/20 p-4 overflow-auto flex items-center justify-center">
                                {previewData.type === 'pdf' ? (
                                    <iframe
                                        src={previewData.url}
                                        className="w-full h-full rounded-lg border border-white/10 bg-white"
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
