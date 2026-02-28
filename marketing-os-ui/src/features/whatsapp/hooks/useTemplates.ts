// hooks/useTemplates.ts
// All state, queries, mutations and handlers for the Templates tab.

import { useState, useMemo } from 'react';
import { Form, Modal, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateService } from '../services/templateService';

/* ─── helpers ─── */
const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\d+)\}\}/g;
    const matches = Array.from(text.matchAll(regex));
    const vars = new Set(matches.map(m => m[1]));
    return Array.from(vars).sort((a, b) => parseInt(a) - parseInt(b));
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case 'APPROVED': return 'success';
        case 'REJECTED': return 'error';
        case 'PENDING': return 'processing';
        default: return 'default';
    }
};

export const formatWhatsAppBody = (text: string, sampleValues: Record<string, string>) => {
    if (!text) return null; // component will supply fallback JSX
    const parts = text.split(/(\{\{\d+\}\})/g);
    return parts.map((part, index) => {
        const match = part.match(/\{\{(\d+)\}\}/);
        if (match) {
            const varNum = match[1];
            return { key: index, isVar: true as const, varNum, value: sampleValues[varNum] || null, raw: part };
        }
        return { key: index, isVar: false as const, text: part };
    });
};

/* ─── hook ─── */
export function useTemplates() {
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [sampleValues, setSampleValues] = useState<Record<string, string>>({});
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // live preview values
    const headerContent = Form.useWatch('header', form);
    const bodyContent: string = Form.useWatch('body', form) || '';
    const footerContent = Form.useWatch('footer', form);
    const buttonsContent: any[] = Form.useWatch('buttons', form) || [];

    const detectedVariables = useMemo(() => extractVariables(bodyContent), [bodyContent]);

    /* queries */
    const { data: templatesData, isLoading } = useQuery({
        queryKey: ['whatsapp-templates'],
        queryFn: () => templateService.getTemplates(),
    });
    const templates: any[] = templatesData?.data || [];

    /* mutations */
    const createTemplateMutation = useMutation({
        mutationFn: templateService.createTemplate,
        onSuccess: () => {
            message.success('Template created successfully');
            setIsDrawerVisible(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
        },
        onError: () => message.error('Failed to create template'),
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: templateService.deleteTemplate,
        onSuccess: () => {
            message.success('Template deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
        },
        onError: () => message.error('Failed to delete template'),
    });

    const submitTemplateMutation = useMutation({
        mutationFn: templateService.submitTemplate,
        onSuccess: () => {
            message.success('Template submitted for approval');
            queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'Failed to submit template');
        },
    });

    const syncTemplatesMutation = useMutation({
        mutationFn: templateService.syncTemplates,
        onSuccess: (data) => {
            message.success(`Synced ${data?.data?.length || 0} templates from Meta`);
            queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'Failed to sync templates with Meta');
        },
    });

    /* handlers */
    const handleCreate = async () => {
        try {
            const values = await form.validateFields();

            const components: any[] = [];
            if (values.header) {
                components.push({ type: 'HEADER', format: 'TEXT', text: values.header });
            }
            components.push({ type: 'BODY', text: values.body });
            if (values.footer) {
                components.push({ type: 'FOOTER', text: values.footer });
            }
            if (values.buttons && values.buttons.length > 0) {
                components.push({
                    type: 'BUTTONS',
                    buttons: values.buttons.map((btn: any) => ({
                        type: btn.type,
                        text: btn.text,
                        ...(btn.type === 'URL' ? { url: btn.value } : {}),
                        ...(btn.type === 'PHONE_NUMBER' ? { phone_number: btn.value } : {}),
                    })),
                });
            }

            createTemplateMutation.mutate({
                name: values.name,
                category: values.category,
                language: values.language,
                components,
                status: 'DRAFT',
            });
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Delete Template',
            content: 'Are you sure you want to delete this template? This cannot be undone.',
            okText: 'Delete',
            okButtonProps: { danger: true },
            onOk: () => deleteTemplateMutation.mutate(id),
        });
    };

    const handleSubmit = (id: string) => {
        submitTemplateMutation.mutate(id);
    };

    const handleSync = () => {
        syncTemplatesMutation.mutate();
    };

    const closeDrawer = () => {
        setIsDrawerVisible(false);
        setSampleValues({});
    };

    return {
        // state
        form,
        isDrawerVisible,
        setIsDrawerVisible,
        sampleValues,
        setSampleValues,

        // preview
        headerContent,
        bodyContent,
        footerContent,
        buttonsContent,
        detectedVariables,

        // data
        templates,
        isLoading,

        // mutation states
        isCreating: createTemplateMutation.isPending,
        isSyncing: syncTemplatesMutation.isPending,

        // handlers
        handleCreate,
        handleDelete,
        handleSubmit,
        handleSync,
        closeDrawer,
    };
}
