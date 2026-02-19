import { Queue, Worker, Job } from 'bullmq';
import { QueueFactory } from '../queue/QueueFactory.js';
import { FlowEngine } from '../../domain/automation/services/FlowEngine.js';

export const FLOW_EXECUTION_QUEUE_NAME = 'flow-execution-queue';

export interface FlowJobPayload {
    flowId: string;
    contactId: string;
    tenantId: string;
    stepId?: string; // If undefined, start from beginning
}

let flowQueue: Queue | null = null;
let flowWorker: Worker | null = null;

export const getFlowQueue = (): Queue => {
    if (!flowQueue) {
        flowQueue = QueueFactory.createQueue(FLOW_EXECUTION_QUEUE_NAME);
    }
    return flowQueue;
};

export const addFlowJob = async (payload: FlowJobPayload, delayMs?: number) => {
    const queue = getFlowQueue();
    return queue.add('execute-flow-step', payload, {
        delay: delayMs || 0,
        removeOnComplete: true,
        removeOnFail: false // Keep failed jobs for inspection
    });
};

export const initFlowWorker = (flowEngine: FlowEngine) => {
    if (flowWorker) return;

    flowWorker = QueueFactory.createWorker(FLOW_EXECUTION_QUEUE_NAME, async (job: Job<FlowJobPayload>) => {
        const { flowId, contactId, tenantId, stepId } = job.data;

        try {
            await flowEngine.executeStep(tenantId, flowId, contactId, stepId);
        } catch (error) {
            console.error(`Flow execution failed for job ${job.id}:`, error);
            throw error;
        }
    }, {
        concurrency: 5
    } as any);

    flowWorker.on('completed', (job) => {
        console.log(`Flow execution job ${job.id} completed`);
    });

    flowWorker.on('failed', (job, err) => {
        console.error(`Flow execution job ${job?.id} failed: ${err.message}`);
    });
};
