/**
 * Document Upload Component
 * Upload new documents for employees
 */
import { useState, useRef } from 'react';
import { useCreateDocument, useUploadFile } from '@/hooks/hrms';
import { Card, CardHeader, CardContent, Button, Input } from '@/components/ui';
import type { DocumentCategory, CreateDocumentDTO } from '@/types/hrms.types';

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
    { value: 'IDENTITY', label: 'Identity Document' },
    { value: 'CONTRACT', label: 'Employment Contract' },
    { value: 'CERTIFICATION', label: 'Certification' },
    { value: 'PERMIT', label: 'Permit/License' },
    { value: 'MEDICAL', label: 'Medical Document' },
    { value: 'EDUCATION', label: 'Educational Document' },
    { value: 'BANK', label: 'Bank Document' },
    { value: 'TAX', label: 'Tax Document' },
    { value: 'OTHER', label: 'Other' },
];

const DOCUMENT_TYPES: Record<DocumentCategory, string[]> = {
    IDENTITY: ['Aadhaar Card', 'PAN Card', 'Passport', 'Driving License', 'Voter ID'],
    CONTRACT: ['Offer Letter', 'Appointment Letter', 'NDA', 'Employment Agreement'],
    CERTIFICATION: ['First Aid Certificate', 'Safety Training', 'Professional Certificate'],
    PERMIT: ['Work Permit', 'Travel Permit', 'License'],
    MEDICAL: ['Medical Fitness Certificate', 'Insurance Card', 'Health Report'],
    EDUCATION: ['Degree Certificate', 'Diploma', 'Mark Sheet', 'Training Certificate'],
    BANK: ['Bank Statement', 'Cancelled Cheque', 'Account Details'],
    TAX: ['Form 16', 'PAN Card', 'Tax Return'],
    OTHER: ['Other Document'],
};

interface DocumentUploadProps {
    employeeId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function DocumentUpload({ employeeId, onSuccess, onCancel }: DocumentUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'IDENTITY' as DocumentCategory,
        documentType: '',
        documentNumber: '',
        issuedDate: '',
        expiryDate: '',
        isConfidential: false,
        notes: '',
    });

    const uploadFile = useUploadFile();
    const createDocument = useCreateDocument();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (!formData.name) {
                setFormData(prev => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, '') }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedFile) {
            alert('Please select a file to upload');
            return;
        }

        try {
            // Upload file first
            const uploadResult = await uploadFile.mutateAsync(selectedFile);

            // Create document record
            const documentData: CreateDocumentDTO = {
                employeeId,
                name: formData.name,
                category: formData.category,
                documentType: formData.documentType || 'Other',
                documentNumber: formData.documentNumber || undefined,
                fileUrl: uploadResult.url,
                fileName: uploadResult.fileName,
                fileSize: uploadResult.fileSize,
                mimeType: uploadResult.mimeType,
                issuedDate: formData.issuedDate || undefined,
                expiryDate: formData.expiryDate || undefined,
                isConfidential: formData.isConfidential,
                notes: formData.notes || undefined,
            };

            await createDocument.mutateAsync(documentData);
            onSuccess?.();
        } catch (error) {
            console.error('Failed to upload document:', error);
            alert('Failed to upload document. Please try again.');
        }
    };

    const isSubmitting = uploadFile.isPending || createDocument.isPending;

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <h2 className="text-xl font-semibold">Upload Document</h2>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            File <span className="text-red-500">*</span>
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                        <div 
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {selectedFile ? (
                                <div>
                                    <p className="font-medium">{selectedFile.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-gray-600">Click to select a file</p>
                                    <p className="text-sm text-gray-400">PDF, JPG, PNG, DOC (max 10MB)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Document Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Document Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter document name"
                            required
                        />
                    </div>

                    {/* Category & Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    category: e.target.value as DocumentCategory,
                                    documentType: '',
                                }))}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Document Type</label>
                            <select
                                value={formData.documentType}
                                onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="">Select type</option>
                                {DOCUMENT_TYPES[formData.category].map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Document Number */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Document Number</label>
                        <Input
                            value={formData.documentNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                            placeholder="e.g., AADHAAR number, PAN number"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Issued Date</label>
                            <Input
                                type="date"
                                value={formData.issuedDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, issuedDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Expiry Date</label>
                            <Input
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Confidential */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isConfidential"
                            checked={formData.isConfidential}
                            onChange={(e) => setFormData(prev => ({ ...prev, isConfidential: e.target.checked }))}
                            className="rounded"
                        />
                        <label htmlFor="isConfidential" className="text-sm">
                            Mark as confidential (HR only access)
                        </label>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Any additional notes..."
                            className="w-full px-3 py-2 border rounded-md"
                            rows={3}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={isSubmitting || !selectedFile}>
                            {isSubmitting ? 'Uploading...' : 'Upload Document'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
