/**
 * Employee Form Component
 * Create/Edit employee form
 */
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCreateEmployee, useUpdateEmployee } from '@/hooks/hrms';
import { Button, Input, Card, CardHeader, CardContent } from '@/components/ui';
import type { CreateEmployeeDTO, Employee } from '@/types/hrms.types';

interface EmployeeFormProps {
    employee?: Employee;
    onSuccess?: () => void;
}

export function EmployeeForm({ employee, onSuccess }: EmployeeFormProps) {
    const navigate = useNavigate();
    const createMutation = useCreateEmployee();
    const updateMutation = useUpdateEmployee();
    const isEditing = !!employee;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<CreateEmployeeDTO>({
        defaultValues: employee ? {
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone || '',
            employeeType: employee.employeeType,
            dateOfJoining: employee.dateOfJoining.split('T')[0],
            dateOfBirth: employee.dateOfBirth?.split('T')[0] || '',
            address: employee.address || '',
            emergencyContact: employee.emergencyContact || '',
        } : undefined,
    });

    const onSubmit = async (data: CreateEmployeeDTO) => {
        try {
            if (isEditing) {
                await updateMutation.mutateAsync({ id: employee.id, data });
            } else {
                await createMutation.mutateAsync(data);
            }
            onSuccess?.();
            navigate('/hrms/employees');
        } catch (error) {
            console.error('Failed to save employee:', error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <h2 className="text-xl font-semibold">
                    {isEditing ? 'Edit Employee' : 'Add New Employee'}
                </h2>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                First Name *
                            </label>
                            <Input
                                {...register('firstName', { required: 'Required' })}
                                placeholder="First name"
                            />
                            {errors.firstName && (
                                <span className="text-red-500 text-xs">
                                    {errors.firstName.message}
                                </span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Last Name *
                            </label>
                            <Input
                                {...register('lastName', { required: 'Required' })}
                                placeholder="Last name"
                            />
                            {errors.lastName && (
                                <span className="text-red-500 text-xs">
                                    {errors.lastName.message}
                                </span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Email *
                            </label>
                            <Input
                                type="email"
                                {...register('email', { required: 'Required' })}
                                placeholder="email@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <Input {...register('phone')} placeholder="+1234567890" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Employee Type *
                            </label>
                            <select
                                {...register('employeeType', { required: 'Required' })}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="office">Office Staff</option>
                                <option value="field">Field Staff</option>
                                <option value="seasonal">Seasonal</option>
                                <option value="contract">Contract</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Date of Joining *
                            </label>
                            <Input
                                type="date"
                                {...register('dateOfJoining', { required: 'Required' })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Date of Birth
                            </label>
                            <Input type="date" {...register('dateOfBirth')} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Emergency Contact
                            </label>
                            <Input
                                {...register('emergencyContact')}
                                placeholder="Contact number"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <textarea
                            {...register('address')}
                            className="w-full border rounded px-3 py-2"
                            rows={3}
                            placeholder="Full address"
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/hrms/employees')}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
