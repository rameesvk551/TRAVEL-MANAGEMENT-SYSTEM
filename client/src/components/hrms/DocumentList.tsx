/**
 * Document List Component
 * Displays a list of employee documents with filters
 */
import { useState } from 'react';
import { useDocuments, useDeleteDocument, useVerifyDocument, useRejectDocument } from '@/hooks/hrms';
import { Card, CardHeader, CardContent, Button, Input } from '@/components/ui';
import type { DocumentCategory, DocumentStatus, EmployeeDocument } from '@/types/hrms.types';

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
    IDENTITY: 'Identity',
    CONTRACT: 'Contract',
    CERTIFICATION: 'Certification',
    PERMIT: 'Permit',
    MEDICAL: 'Medical',
    EDUCATION: 'Education',
    BANK: 'Bank',
    TAX: 'Tax',
    OTHER: 'Other',
};

const STATUS_COLORS: Record<DocumentStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    VERIFIED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
};

interface DocumentListProps {
    employeeId?: string;
    showActions?: boolean;
    onDocumentSelect?: (doc: EmployeeDocument) => void;
}

export function DocumentList({ employeeId, showActions = true, onDocumentSelect }: DocumentListProps) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | ''>('');
    const [statusFilter, setStatusFilter] = useState<DocumentStatus | ''>('');
    const [rejectDocId, setRejectDocId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const { data, isLoading, error } = useDocuments({
        employeeId,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
    });

    const deleteDocument = useDeleteDocument();
    const verifyDocument = useVerifyDocument();
    const rejectDocument = useRejectDocument();

    const documents = data?.data || [];

    const handleVerify = async (id: string) => {
        try {
            await verifyDocument.mutateAsync(id);
        } catch (error) {
            console.error('Failed to verify document:', error);
        }
    };

    const handleReject = async () => {
        if (!rejectDocId || !rejectReason) return;
        try {
            await rejectDocument.mutateAsync({ id: rejectDocId, reason: rejectReason });
            setRejectDocId(null);
            setRejectReason('');
        } catch (error) {
            console.error('Failed to reject document:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await deleteDocument.mutateAsync(id);
            } catch (error) {
                console.error('Failed to delete document:', error);
            }
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString();
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    Loading documents...
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-red-600">
                    Failed to load documents
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <Input
                    placeholder="Search documents..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64"
                />
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | '')}
                    className="px-3 py-2 border rounded-md"
                >
                    <option value="">All Categories</option>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | '')}
                    className="px-3 py-2 border rounded-md"
                >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="EXPIRED">Expired</option>
                </select>
            </div>

            {/* Document Grid */}
            {documents.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                        No documents found
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                        <Card 
                            key={doc.id} 
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => onDocumentSelect?.(doc)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium truncate">{doc.name}</h3>
                                        <p className="text-sm text-gray-500">{doc.documentType}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[doc.status]}`}>
                                        {doc.status}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-sm space-y-1 text-gray-600">
                                    <p>Category: {CATEGORY_LABELS[doc.category]}</p>
                                    {doc.documentNumber && <p>Number: {doc.documentNumber}</p>}
                                    <p>Size: {formatFileSize(doc.fileSize)}</p>
                                    {doc.expiryDate && (
                                        <p className={new Date(doc.expiryDate) < new Date() ? 'text-red-600' : ''}>
                                            Expires: {formatDate(doc.expiryDate)}
                                        </p>
                                    )}
                                    {doc.employeeName && (
                                        <p>Employee: {doc.employeeName}</p>
                                    )}
                                </div>

                                {showActions && (
                                    <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                                        <a
                                            href={doc.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            View
                                        </a>
                                        {doc.status === 'PENDING' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleVerify(doc.id)}
                                                    disabled={verifyDocument.isPending}
                                                >
                                                    ✓ Verify
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setRejectDocId(doc.id)}
                                                >
                                                    ✗ Reject
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(doc.id)}
                                            disabled={deleteDocument.isPending}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            {rejectDocId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Reject Document</h3>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <textarea
                                placeholder="Enter rejection reason..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full p-3 border rounded-md"
                                rows={3}
                            />
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setRejectDocId(null)}>
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleReject}
                                    disabled={!rejectReason || rejectDocument.isPending}
                                >
                                    Reject
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
