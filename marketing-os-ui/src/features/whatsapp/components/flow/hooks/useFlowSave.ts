import { useCallback, useState, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { message } from 'antd';
import { automationApi } from '../../../../../api/modules';

export const useFlowSave = (initialFlowId?: string | null) => {
    const { toObject, setViewport, setNodes, setEdges } = useReactFlow();
    const [flowId, setFlowId] = useState<string | null>(initialFlowId || null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (initialFlowId) {
            setFlowId(initialFlowId);
            loadFlow(initialFlowId);
        }
    }, [initialFlowId]);

    const loadFlow = async (id: string) => {
        setIsLoading(true);
        try {
            const response = await automationApi.getFlow(id);
            if (response && response.nodes) {
                setNodes(response.nodes || []);
                setEdges(response.edges || []);
                if (response.viewport) {
                    setViewport(response.viewport);
                }
                message.success('Flow loaded');
            }
        } catch (error) {
            console.error('Failed to load flow:', error);
            message.error('Failed to load flow');
        } finally {
            setIsLoading(false);
        }
    };

    const saveFlow = useCallback(async () => {
        const flow = toObject();
        const startNode = flow.nodes.find(n => n.type === 'start');
        let trigger: any = { type: 'keyword', config: { keywords: ['hello'] } };

        if (startNode) {
            const type = startNode.data.triggerType as string || 'keyword';
            if (type === 'welcome') {
                trigger = { type: 'welcome', config: {} };
            } else if (type === 'away') {
                trigger = { type: 'away', config: {} };
            } else {
                const keywords = (startNode.data.keywords as string[]) || [];
                trigger = { type: 'keyword', config: { keywords } };
            }
        }

        const flowData = {
            name: 'Untitled Flow ' + new Date().toLocaleString(), // Should be prop or state
            nodes: flow.nodes,
            edges: flow.edges,
            viewport: flow.viewport,
            trigger
        };

        try {
            if (flowId) {
                const response = await automationApi.updateFlow(flowId, flowData);
                if (response) {
                    message.success('Flow updated successfully');
                }
            } else {
                const response = await automationApi.createFlow(flowData);
                if (response) {
                    setFlowId(response._id);
                    message.success('Flow created successfully');
                }
            }
        } catch (error) {
            console.error('Failed to save flow:', error);
            message.error('Failed to save flow');
        }
    }, [toObject, flowId]);

    const restoreFlow = useCallback(async () => { return null; }, []);

    return { saveFlow, restoreFlow, isLoading };
};
