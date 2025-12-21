/**
 * Employee Documents Component
 * Shows documents for a specific employee with upload capability
 */
import { useState } from 'react';
import { useEmployeeDocuments } from '@/hooks/hrms';
import { Card, CardHeader, CardContent, Button } from '@/components/ui';
import { DocumentUpload } from './DocumentUpload';
import type { DocumentCategory, DocumentStatus, EmployeeDocument } from '@/types/hrms.types';

const CATEGORY_ICONS: Record<DocumentCategory, string> = {
    IDENTITY: '🪪',
    CONTRACT: '📄',
    CERTIFICATION: '🏆',
    PERMIT: '📋',
    MEDICAL: '🏥',
    EDUCATION: '🎓',
    BANK: '🏦',
    TAX: '💰',
    OTHER: '📁',
};

const STATUS_BADGES: Record<DocumentStatus, { color: string; label: string }> = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
    VERIFIED: { color: 'bg-green-100 text-green-800', label: 'Verified' },
    REJECTED: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    EXPIRED: { color: 'bg-gray-100 text-gray-800', label: 'Expired' },
};

interface EmployeeDocumentsProps {
    employeeId: string;
    employeeName?: string;
    canUpload?: boolean;
}

export function EmployeeDocuments({ 
    employeeId, 
    employeeName, 
    canUpload = true,
}: EmployeeDocumentsProps) {
    const [showUpload, setShowUpload] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<EmployeeDocument | null>(null);

    const { data, isLoading, error, refetch } = useEmployeeDocuments(employeeId);
    const documents = data?.data || [];

    // Group documents by category
    const groupedDocs = documents.reduce((acc, doc) => {
        if (!acc[doc.category]) {
            acc[doc.category] = [];
        }
        acc[doc.category].push(doc);
        return acc;
    }, {} as Record<DocumentCategory, EmployeeDocument[]>);

    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString();
    };

    const isExpiringSoon = (dateStr?: string): boolean => {
        if (!dateStr) return false;
        const expiryDate = new Date(dateStr);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow;
    };

    const handleUploadSuccess = () => {
        setShowUpload(false);
        refetch();
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

    if (showUpload) {
        return (
            <DocumentUpload
                employeeId={employeeId}
                onSuccess={handleUploadSuccess}
                onCancel={() => setShowUpload(false)}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Documents</h2>
                    {employeeName && (
                        <p className="text-gray-600">{employeeName}</p>
                    )}
                </div>
                {canUpload && (
                    <Button onClick={() => setShowUpload(true)}>
                        + Upload Document
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="bg-blue-50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{documents.length}</div>
                        <div className="text-sm text-gray-600">Total</div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">
                            {documents.filter(d => d.status === 'VERIFIED').length}
                        </div>
                        <div className="text-sm text-gray-600">Verified</div>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">
                            {documents.filter(d => d.status === 'PENDING').length}
                        </div>
                        <div className="text-sm text-gray-600">Pending</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">
                            {documents.filter(d => d.expiryDate && isExpiringSoon(d.expiryDate)).length}
                        </div>
                        <div className="text-sm text-gray-600">Expiring Soon</div>
                    </CardContent>
                </Card>
            </div>

            {/* Document Categories */}
            {documents.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                        <p className="text-4xl mb-4">📂</p>
                        <p>No documents uploaded yet</p>
                        {canUpload && (
                            <Button className="mt-4" onClick={() => setShowUpload(true)}>
                                Upload First Document
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                Object.entries(groupedDocs).map(([category, docs]) => (
                    <Card key={category}>
                        <CardHeader className="pb-2">
                            <h3 className="font-medium flex items-center gap-2">
                                <span>{CATEGORY_ICONS[category as DocumentCategory]}</span>
                                {category.charAt(0) + category.slice(1).toLowerCase()} Documents
                                <span className="text-sm text-gray-500">({docs.length})</span>
                            </h3>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y">
                                {docs.map(doc => (
                                    <div 
                                        key={doc.id} 
                                        className="py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer rounded px-2"
                                        onClick={() => setSelectedDoc(doc)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{doc.name}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs ${STATUS_BADGES[doc.status].color}`}>
                                                    {STATUS_BADGES[doc.status].label}
                                                </span>
                                                {doc.isConfidential && (
                                                    <span className="text-xs text-red-600">🔒 Confidential</span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500 flex gap-4">
                                                <span>{doc.documentType}</span>
                                                {doc.documentNumber && <span>#{doc.documentNumber}</span>}
                                                {doc.expiryDate && (
                                                    <span className={isExpiringSoon(doc.expiryDate) ? 'text-red-600' : ''}>
                                                        Expires: {formatDate(doc.expiryDate)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <a
                                            href={doc.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}

            {/* Document Detail Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-lg">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold">{selectedDoc.name}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_BADGES[selectedDoc.status].color}`}>
                                        {STATUS_BADGES[selectedDoc.status].label}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => setSelectedDoc(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Category:</span>
                                    <p className="font-medium">{selectedDoc.category}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Type:</span>
                                    <p className="font-medium">{selectedDoc.documentType}</p>
                                </div>
                                {selectedDoc.documentNumber && (
                                    <div>
                                        <span className="text-gray-500">Number:</span>
                                        <p className="font-medium">{selectedDoc.documentNumber}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-500">File Size:</span>
                                    <p className="font-medium">
                                        {(selectedDoc.fileSize / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                {selectedDoc.issuedDate && (
                                    <div>
                                        <span className="text-gray-500">Issued:</span>
                                        <p className="font-medium">{formatDate(selectedDoc.issuedDate)}</p>
                                    </div>
                                )}
                                {selectedDoc.expiryDate && (
                                    <div>
                                        <span className="text-gray-500">Expires:</span>
                                        <p className={`font-medium ${isExpiringSoon(selectedDoc.expiryDate) ? 'text-red-600' : ''}`}>
                                            {formatDate(selectedDoc.expiryDate)}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-500">Uploaded:</span>
                                    <p className="font-medium">{formatDate(selectedDoc.createdAt)}</p>
                                </div>
                                {selectedDoc.verifiedAt && (
                                    <div>
                                        <span className="text-gray-500">Verified:</span>
                                        <p className="font-medium">{formatDate(selectedDoc.verifiedAt)}</p>
                                    </div>
                                )}
                            </div>

                            {selectedDoc.notes && (
                                <div>
                                    <span className="text-gray-500 text-sm">Notes:</span>
                                    <p className="mt-1">{selectedDoc.notes}</p>
                                </div>
                            )}

                            {selectedDoc.rejectionReason && (
                                <div className="bg-red-50 p-3 rounded">
                                    <span className="text-red-600 text-sm font-medium">Rejection Reason:</span>
                                    <p className="mt-1 text-red-800">{selectedDoc.rejectionReason}</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setSelectedDoc(null)}>
                                    Close
                                </Button>
                                <a
                                    href={selectedDoc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button>View Document</Button>
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
