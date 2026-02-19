import { IFlowRepository } from '../repositories/IFlowRepository.js';
import { MessageService } from '../../../application/services/whatsapp/MessageService.js';
import { addFlowJob } from '../../../infrastructure/automation/BullMQFlowQueue.js';
import { IFlow } from '../../../infrastructure/database/mongo/models/Flow.js';

interface FlowNode {
    id: string;
    type: string; // 'start', 'message', 'delay', 'label'
    data: Record<string, any>;
    position: { x: number; y: number };
}

interface FlowEdge {
    id: string;
    source: string;
    target: string;
}

export class FlowEngine {
    constructor(
        private flowRepo: IFlowRepository,
        private messageService: MessageService
    ) { }

    async executeFlow(tenantId: string, flowId: string, contactIdentifier: string): Promise<void> {
        // Find the start node
        const flow = await this.flowRepo.findById(flowId);
        if (!flow || flow.tenantId !== tenantId || !flow.isActive) {
            console.warn(`Flow ${flowId} not found or inactive for tenant ${tenantId}`);
            return;
        }

        const startNode = flow.nodes.find((n: FlowNode) => n.type === 'start');
        if (!startNode) {
            console.warn(`Flow ${flowId} has no start node`);
            return;
        }

        // Current implementation assumes contactIdentifier is phone number for now.
        // In future, resolve Contact ID to Phone Number.

        await this.queueNextStep(tenantId, flowId, contactIdentifier, flow, startNode.id);
    }

    async triggerSystemFlow(tenantId: string, triggerType: string, contactIdentifier: string): Promise<void> {
        console.log(`[FlowEngine] Checking for ${triggerType} flows for tenant ${tenantId}`);
        const flows = await this.flowRepo.findAll(tenantId);
        const activeFlows = flows.filter(f => f.isActive && f.trigger && f.trigger.type === triggerType);

        for (const flow of activeFlows) {
            console.log(`[FlowEngine] Triggering flow ${flow.name} (${flow._id}) for ${contactIdentifier}`);
            await this.executeFlow(tenantId, String(flow._id), contactIdentifier);
        }
    }

    async executeStep(tenantId: string, flowId: string, contactIdentifier: string, stepId?: string): Promise<void> {
        const flow = await this.flowRepo.findById(flowId);
        if (!flow) return;

        let currentNode: FlowNode | undefined;

        if (!stepId) {
            // Start from beginning
            currentNode = flow.nodes.find((n: FlowNode) => n.type === 'start');
        } else {
            currentNode = flow.nodes.find((n: FlowNode) => n.id === stepId);
        }

        if (!currentNode) return;

        // Process Node Logic
        await this.processNode(tenantId, contactIdentifier, currentNode);

        // Queue next steps
        await this.queueNextStep(tenantId, flowId, contactIdentifier, flow, currentNode.id);
    }

    private async processNode(tenantId: string, contactIdentifier: string, node: FlowNode): Promise<void> {
        try {
            switch (node.type) {
                case 'message':
                    if (node.data.message) {
                        await this.messageService.sendText({
                            tenantId,
                            recipientPhone: contactIdentifier,
                            text: node.data.message,
                            senderUserId: 'system'
                        });
                    }
                    if (node.data.mediaUrl) {
                        // Handle media message if MessageService supports it or simply send text with link
                        await this.messageService.sendText({
                            tenantId,
                            recipientPhone: contactIdentifier,
                            text: `[Media: ${node.data.mediaUrl}] ${node.data.message || ''}`,
                            senderUserId: 'system'
                        });
                    }
                    break;
                case 'label':
                    // TODO: call CRM/Contact service to add tag
                    console.log(`Adding label ${node.data.label} to ${contactIdentifier}`);
                    break;
                case 'delay':
                    // Delay is handled in queueNextStep
                    console.log(`Processing delay node ${node.id}`);
                    break;
                case 'start':
                    console.log(`Starting flow execution for ${contactIdentifier}`);
                    break;
            }
        } catch (error) {
            console.error(`Error processing node ${node.id}:`, error);
        }
    }

    private async queueNextStep(tenantId: string, flowId: string, contactIdentifier: string, flow: IFlow, currentNodeId: string): Promise<void> {
        const outgoingEdges = flow.edges.filter((e: FlowEdge) => e.source === currentNodeId);

        for (const edge of outgoingEdges) {
            const nextNode = flow.nodes.find((n: FlowNode) => n.id === edge.target);
            if (!nextNode) continue;

            let delay = 0;
            // If the next node is a delay node, we effectively "execute" it by adding a delayed job for the node AFTER it? 
            // Or we treat the delay node as a step that just waits?

            // Approach: The Delay Node itself introduces the delay for the *subsequent* step.
            // Actually, if current node is Delay, we should have waited before processing it? 
            // If the structure is Node A -> Delay -> Node B.
            // We execute Node A. Its next is Delay.
            // Queue job for Delay node (immediate).
            // Execute Delay node. Its processNode does nothing or logs.
            // Its next is Node B.
            // Queue job for Node B with delay from Delay node config.

            // Let's refine:
            // If currentNode is 'delay', we read its config to determine delay for next step.

            // BUT, executeStep is called when the job is processed.
            // So if Node A -> Node B.
            // Exec A. Queue B (immediate).
            // Exec B.

            // Node A -> Delay -> Node B.
            // Exec A. Queue Delay (immediate).
            // Exec Delay. Get delay value. Queue Node B (with delay).

            if (currentNodeId) {
                const currentNode = flow.nodes.find((n: FlowNode) => n.id === currentNodeId);
                if (currentNode && currentNode.type === 'delay') {
                    const delayValue = currentNode.data.duration || 0;
                    const delayUnit = currentNode.data.unit || 'seconds';

                    switch (delayUnit) {
                        case 'minutes': delay = delayValue * 60 * 1000; break;
                        case 'hours': delay = delayValue * 60 * 60 * 1000; break;
                        case 'days': delay = delayValue * 24 * 60 * 60 * 1000; break;
                        default: delay = delayValue * 1000; // seconds
                    }
                }
            }

            await addFlowJob({
                tenantId,
                flowId,
                contactId: contactIdentifier,
                stepId: nextNode.id
            }, delay);
        }
    }
}
