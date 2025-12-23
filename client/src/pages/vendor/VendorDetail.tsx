import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Building2, Phone, Mail, MapPin, Star, FileText, Clock } from 'lucide-react';
import { useVendorDetails, useVendorAssignmentsByVendor, useVendorPayablesByVendor } from '@/hooks/vendor';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Badge,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/utils';
import type { VendorType, VendorStatus } from '@/types/vendor.types';

const vendorTypeColors: Record<VendorType, 'default' | 'secondary' | 'success' | 'warning'> = {
    transport: 'default',
    hotel: 'secondary',
    equipment: 'success',
    guide: 'warning',
    permit_agent: 'default',
    restaurant: 'secondary',
    activity_provider: 'success',
    other: 'default',
};

const statusColors: Record<VendorStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    active: 'success',
    inactive: 'secondary',
    suspended: 'destructive',
    pending_verification: 'warning',
    blacklisted: 'destructive',
};

export default function VendorDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: vendorData, isLoading: vendorLoading } = useVendorDetails(id!);
    const { data: assignmentsData } = useVendorAssignmentsByVendor(id!);
    const { data: payablesData } = useVendorPayablesByVendor(id!);

    if (vendorLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const vendor = vendorData?.data;
    const assignments = assignmentsData?.data || [];
    const payables = payablesData?.data || [];

    if (!vendor) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => navigate('/vendors/list')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Vendors
                </Button>
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">Vendor not found</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/vendors/list')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold">{vendor.name}</h2>
                            <Badge variant={vendorTypeColors[vendor.type]}>{vendor.type}</Badge>
                            <Badge variant={statusColors[vendor.status]}>{vendor.status}</Badge>
                        </div>
                        <p className="text-muted-foreground">{vendor.code}</p>
                    </div>
                </div>
                <Button onClick={() => navigate(`/vendors/${id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Vendor
                </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            <span className="text-2xl font-bold">
                                {vendor.performanceScore?.toFixed(1) || 'N/A'}
                            </span>
                            <span className="text-muted-foreground">/5.0</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {vendor.contracts?.filter((c: any) => c.status === 'active').length || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payables</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(
                                payables
                                    .filter((p: any) => p.status !== 'settled')
                                    .reduce((sum: number, p: any) => sum + p.netAmount, 0)
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assignments.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="contracts">Contracts</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    <TabsTrigger value="payables">Payables</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Contact Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {vendor.primaryContact && (
                                    <div className="flex items-start gap-3">
                                        <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium">{vendor.primaryContact.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {vendor.primaryContact.designation}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {vendor.phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-muted-foreground" />
                                        <span>{vendor.phone}</span>
                                    </div>
                                )}
                                {vendor.email && (
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-muted-foreground" />
                                        <span>{vendor.email}</span>
                                    </div>
                                )}
                                {vendor.address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p>{vendor.address.street}</p>
                                            <p>{vendor.address.city}, {vendor.address.state} {vendor.address.postalCode}</p>
                                            <p>{vendor.address.country}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Business Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Business Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {vendor.taxId && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tax ID</p>
                                        <p className="font-medium">{vendor.taxId}</p>
                                    </div>
                                )}
                                {vendor.registrationNumber && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Registration Number</p>
                                        <p className="font-medium">{vendor.registrationNumber}</p>
                                    </div>
                                )}
                                {vendor.serviceAreas && vendor.serviceAreas.length > 0 && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Service Areas</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {vendor.serviceAreas.map((area: string) => (
                                                <Badge key={area} variant="secondary">{area}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {vendor.paymentTerms && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payment Terms</p>
                                        <p className="font-medium">{vendor.paymentTerms}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="contracts" className="space-y-4">
                    {vendor.contracts && vendor.contracts.length > 0 ? (
                        <div className="space-y-4">
                            {vendor.contracts.map((contract: any) => (
                                <Card key={contract.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{contract.name}</CardTitle>
                                            <Badge variant={contract.status === 'active' ? 'success' : 'secondary'}>
                                                {contract.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>
                                                    {formatDate(contract.validFrom)} - {formatDate(contract.validTo)}
                                                </span>
                                            </div>
                                            {contract.contractValue && (
                                                <p>Contract Value: {formatCurrency(contract.contractValue)}</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No contracts found</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="assignments" className="space-y-4">
                    {assignments.length > 0 ? (
                        <div className="space-y-4">
                            {assignments.map((assignment: any) => (
                                <Card key={assignment.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">
                                                Booking #{assignment.bookingId?.slice(0, 8)}
                                            </CardTitle>
                                            <Badge>{assignment.status}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-2 text-sm">
                                            <p>{assignment.serviceType} - {assignment.serviceDescription}</p>
                                            <p>
                                                {formatDate(assignment.serviceDate)} 
                                                {assignment.serviceEndDate && ` - ${formatDate(assignment.serviceEndDate)}`}
                                            </p>
                                            <p>Agreed Cost: {formatCurrency(assignment.agreedCost)}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground">No assignments found</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="payables" className="space-y-4">
                    {payables.length > 0 ? (
                        <div className="space-y-4">
                            {payables.map((payable: any) => (
                                <Card key={payable.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">
                                                {payable.invoiceNumber || `Payable #${payable.id.slice(0, 8)}`}
                                            </CardTitle>
                                            <Badge>{payable.status}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Gross Amount:</span>
                                                <span>{formatCurrency(payable.grossAmount)}</span>
                                            </div>
                                            {payable.deductions > 0 && (
                                                <div className="flex justify-between text-destructive">
                                                    <span>Deductions:</span>
                                                    <span>-{formatCurrency(payable.deductions)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-semibold">
                                                <span>Net Amount:</span>
                                                <span>{formatCurrency(payable.netAmount)}</span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                Due: {formatDate(payable.dueDate)}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground">No payables found</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
