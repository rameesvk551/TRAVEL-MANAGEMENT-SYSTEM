// hooks/useBroadcast.ts
// All state, queries, mutations and handlers for the Broadcast tab.

import { useState } from 'react';
import { Form, message } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { templateService } from '../services/templateService';
import { broadcastService } from '../services/broadcastService';

export function useBroadcast() {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [recipientCount, setRecipientCount] = useState(0);
    const [recipientsText, setRecipientsText] = useState('');

    /* queries */
    const { data: templatesData } = useQuery({
        queryKey: ['whatsapp-templates', 'approved'],
        queryFn: () => templateService.getTemplates({ status: 'APPROVED' }),
    });
    const templates: any[] = templatesData?.data || [];

    /* mutations */
    const broadcastMutation = useMutation({
        mutationFn: broadcastService.broadcast,
        onSuccess: () => {
            message.success('Broadcast scheduled successfully!');
            setCurrentStep(0);
            form.resetFields();
            setSelectedTemplate(null);
            setRecipientCount(0);
            setRecipientsText('');
        },
        onError: (error: any) => {
            const msg = error?.response?.data?.error || error?.message || 'Failed to schedule broadcast';
            message.error(msg);
        },
    });

    /* handlers */
    const handleTemplateChange = (templateId: string) => {
        const template = templates.find((t: any) => t.id === templateId);
        setSelectedTemplate(template);
    };

    const onRecipientsChange = (e: any) => {
        const text = e.target.value;
        setRecipientsText(text);
        const count = text.split('\n').filter((line: string) => line.trim().length > 0).length;
        setRecipientCount(count);
    };

    const next = async () => {
        try {
            await form.validateFields();
            setCurrentStep(s => s + 1);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const prev = () => setCurrentStep(s => s - 1);

    const handleSend = () => {
        if (!recipientsText.trim()) {
            message.error('No recipients found. Please go back and add recipients.');
            return;
        }

        const recipients = recipientsText
            .split('\n')
            .filter((line: string) => line.trim().length > 0)
            .map((phone: string) => ({ phone: phone.trim() }));

        broadcastMutation.mutate({
            templateName: selectedTemplate.template_name || selectedTemplate.name,
            language: selectedTemplate.language,
            recipients,
        });
    };

    return {
        // state
        form,
        currentStep,
        selectedTemplate,
        recipientCount,
        templates,

        // mutation state
        isSending: broadcastMutation.isPending,

        // handlers
        handleTemplateChange,
        onRecipientsChange,
        next,
        prev,
        handleSend,
    };
}
