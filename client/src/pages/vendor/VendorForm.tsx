import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useVendor, useCreateVendor, useUpdateVendor } from '@/hooks/vendor';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Textarea,
    Badge,
} from '@/components/ui';
import type { VendorType, VendorStatus, CreateVendorInput, UpdateVendorInput } from '@/types/vendor.types';

export default function VendorForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditing = !!id;

    const { data: vendorData, isLoading: vendorLoading } = useVendor(id || '');
    const createVendor = useCreateVendor();
    const updateVendor = useUpdateVendor();

    const [formData, setFormData] = useState<Partial<CreateVendorInput>>({
        name: '',
        code: '',
        type: 'transport',
        email: '',
        phone: '',
        taxId: '',
        registrationNumber: '',
        paymentTerms: 'net_30',
        currency: 'NPR',
        serviceAreas: [],
        address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Nepal',
        },
        primaryContact: {
            name: '',
            phone: '',
            email: '',
            designation: '',
        },
        bankDetails: {
            bankName: '',
            accountNumber: '',
            accountName: '',
            branch: '',
            swiftCode: '',
        },
    });

    const [serviceAreaInput, setServiceAreaInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load vendor data when editing
    useState(() => {
        if (vendorData?.data) {
            const vendor = vendorData.data;
            setFormData({
                name: vendor.name,
                code: vendor.code,
                type: vendor.type,
                email: vendor.email || '',
                phone: vendor.phone || '',
                taxId: vendor.taxId || '',
                registrationNumber: vendor.registrationNumber || '',
                paymentTerms: vendor.paymentTerms || 'net_30',
                currency: vendor.currency || 'NPR',
                serviceAreas: vendor.serviceAreas || [],
                address: vendor.address || {
                    street: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: 'Nepal',
                },
                primaryContact: vendor.primaryContact || {
                    name: '',
                    phone: '',
                    email: '',
                    designation: '',
                },
                bankDetails: vendor.bankDetails || {
                    bankName: '',
                    accountNumber: '',
                    accountName: '',
                    branch: '',
                    swiftCode: '',
                },
            });
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (isEditing) {
                await updateVendor.mutateAsync({
                    id: id!,
                    data: formData as UpdateVendorInput,
                });
                navigate(`/vendors/${id}`);
            } else {
                const result = await createVendor.mutateAsync(formData as CreateVendorInput);
                navigate(`/vendors/${result.data.id}`);
            }
        } catch (error) {
            console.error('Failed to save vendor:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addServiceArea = () => {
        if (serviceAreaInput.trim()) {
            setFormData((prev) => ({
                ...prev,
                serviceAreas: [...(prev.serviceAreas || []), serviceAreaInput.trim()],
            }));
            setServiceAreaInput('');
        }
    };

    const removeServiceArea = (area: string) => {
        setFormData((prev) => ({
            ...prev,
            serviceAreas: (prev.serviceAreas || []).filter((a) => a !== area),
        }));
    };

    if (isEditing && vendorLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">
                        {isEditing ? 'Edit Vendor' : 'Add New Vendor'}
                    </h2>
                    <p className="text-muted-foreground">
                        {isEditing
                            ? 'Update vendor information'
                            : 'Create a new vendor or supplier'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Vendor Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">Vendor Code *</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                                    }
                                    placeholder="e.g., VND-001"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="type">Vendor Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, type: value as VendorType }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="transport">Transport</SelectItem>
                                        <SelectItem value="hotel">Hotel</SelectItem>
                                        <SelectItem value="equipment">Equipment</SelectItem>
                                        <SelectItem value="guide">Guide</SelectItem>
                                        <SelectItem value="permit_agent">Permit Agent</SelectItem>
                                        <SelectItem value="restaurant">Restaurant</SelectItem>
                                        <SelectItem value="activity_provider">Activity Provider</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, phone: e.target.value }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxId">Tax ID / PAN</Label>
                                <Input
                                    id="taxId"
                                    value={formData.taxId}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, taxId: e.target.value }))
                                    }
                                />
                            </div>
                        </div>

                        {/* Service Areas */}
                        <div className="space-y-2">
                            <Label>Service Areas</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={serviceAreaInput}
                                    onChange={(e) => setServiceAreaInput(e.target.value)}
                                    placeholder="Add a service area"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addServiceArea();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" onClick={addServiceArea}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {formData.serviceAreas && formData.serviceAreas.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.serviceAreas.map((area) => (
                                        <Badge key={area} variant="secondary" className="pl-2">
                                            {area}
                                            <button
                                                type="button"
                                                onClick={() => removeServiceArea(area)}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Primary Contact */}
                <Card>
                    <CardHeader>
                        <CardTitle>Primary Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="contactName">Contact Name</Label>
                                <Input
                                    id="contactName"
                                    value={formData.primaryContact?.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            primaryContact: {
                                                ...prev.primaryContact!,
                                                name: e.target.value,
                                            },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactDesignation">Designation</Label>
                                <Input
                                    id="contactDesignation"
                                    value={formData.primaryContact?.designation}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            primaryContact: {
                                                ...prev.primaryContact!,
                                                designation: e.target.value,
                                            },
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">Contact Phone</Label>
                                <Input
                                    id="contactPhone"
                                    value={formData.primaryContact?.phone}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            primaryContact: {
                                                ...prev.primaryContact!,
                                                phone: e.target.value,
                                            },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactEmail">Contact Email</Label>
                                <Input
                                    id="contactEmail"
                                    type="email"
                                    value={formData.primaryContact?.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            primaryContact: {
                                                ...prev.primaryContact!,
                                                email: e.target.value,
                                            },
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Address */}
                <Card>
                    <CardHeader>
                        <CardTitle>Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="street">Street Address</Label>
                            <Input
                                id="street"
                                value={formData.address?.street}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        address: { ...prev.address!, street: e.target.value },
                                    }))
                                }
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={formData.address?.city}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            address: { ...prev.address!, city: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State/Province</Label>
                                <Input
                                    id="state"
                                    value={formData.address?.state}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            address: { ...prev.address!, state: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="postalCode">Postal Code</Label>
                                <Input
                                    id="postalCode"
                                    value={formData.address?.postalCode}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            address: { ...prev.address!, postalCode: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="paymentTerms">Payment Terms</Label>
                                <Select
                                    value={formData.paymentTerms}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, paymentTerms: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select terms" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="immediate">Immediate</SelectItem>
                                        <SelectItem value="net_7">Net 7</SelectItem>
                                        <SelectItem value="net_15">Net 15</SelectItem>
                                        <SelectItem value="net_30">Net 30</SelectItem>
                                        <SelectItem value="net_45">Net 45</SelectItem>
                                        <SelectItem value="net_60">Net 60</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Select
                                    value={formData.currency}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, currency: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NPR">NPR - Nepalese Rupee</SelectItem>
                                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Bank Name</Label>
                                <Input
                                    id="bankName"
                                    value={formData.bankDetails?.bankName}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            bankDetails: { ...prev.bankDetails!, bankName: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber">Account Number</Label>
                                <Input
                                    id="accountNumber"
                                    value={formData.bankDetails?.accountNumber}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            bankDetails: { ...prev.bankDetails!, accountNumber: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="accountName">Account Name</Label>
                                <Input
                                    id="accountName"
                                    value={formData.bankDetails?.accountName}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            bankDetails: { ...prev.bankDetails!, accountName: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="branch">Branch</Label>
                                <Input
                                    id="branch"
                                    value={formData.bankDetails?.branch}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            bankDetails: { ...prev.bankDetails!, branch: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : isEditing ? 'Update Vendor' : 'Create Vendor'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
