/**
 * Documents Page
 * HR Document management page
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DocumentList, DocumentUpload } from '@/components/hrms';
import { useExpiringDocuments } from '@/hooks/hrms';
import { Card, CardHeader, CardContent, Button } from '@/components/ui';

export default function DocumentsPage() {
    const [showUpload, setShowUpload] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

    const { data: expiringDocs } = useExpiringDocuments(30);
    const expiringCount = expiringDocs?.data?.length || 0;

    if (showUpload && selectedEmployeeId) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <DocumentUpload
                    employeeId={selectedEmployeeId}
                    onSuccess={() => {
                        setShowUpload(false);
                        setSelectedEmployeeId('');
                    }}
                    onCancel={() => {
                        setShowUpload(false);
                        setSelectedEmployeeId('');
                    }}
                />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Document Vault</h1>
                    <p className="text-gray-600">Manage employee documents and certifications</p>
                </div>
                <Link to="/hrms">
                    <Button variant="outline">← Back to HRMS</Button>
                </Link>
            </div>

            {/* Alerts */}
            {expiringCount > 0 && (
                <Card className="bg-yellow-50 border-yellow-200 mb-6">
                    <CardContent className="p-4 flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="font-medium text-yellow-800">
                                {expiringCount} document{expiringCount !== 1 ? 's' : ''} expiring soon
                            </p>
                            <p className="text-sm text-yellow-700">
                                Review and renew documents before they expire
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-3xl font-bold text-blue-600">📁</div>
                        <div className="text-sm text-gray-600 mt-1">All Documents</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-3xl font-bold text-green-600">✓</div>
                        <div className="text-sm text-gray-600 mt-1">Verified</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-3xl font-bold text-yellow-600">⏳</div>
                        <div className="text-sm text-gray-600 mt-1">Pending Review</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-3xl font-bold text-red-600">{expiringCount}</div>
                        <div className="text-sm text-gray-600 mt-1">Expiring Soon</div>
                    </CardContent>
                </Card>
            </div>

            {/* Document List */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">All Documents</h2>
                </CardHeader>
                <CardContent>
                    <DocumentList showActions={true} />
                </CardContent>
            </Card>
        </div>
    );
}
