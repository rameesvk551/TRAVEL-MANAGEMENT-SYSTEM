import { useState, useMemo, useCallback } from 'react';
import type { Deal, DealStage } from '../data/deals';
import { deals as seedDeals, DEAL_STAGES } from '../data/deals';

export function useDeals() {
    const [deals, setDeals] = useState<Deal[]>(seedDeals);

    const moveDeal = useCallback((dealId: string, newStage: DealStage) => {
        setDeals((prev) =>
            prev.map((d) =>
                d.id === dealId
                    ? { ...d, stage: newStage, probability: newStage === 'Closed Won' ? 100 : newStage === 'Closed Lost' ? 0 : d.probability }
                    : d,
            ),
        );
    }, []);

    const byStage = useMemo(() => {
        const map: Record<DealStage, Deal[]> = {} as Record<DealStage, Deal[]>;
        for (const s of DEAL_STAGES) map[s] = [];
        for (const d of deals) map[d.stage].push(d);
        return map;
    }, [deals]);

    const totals = useMemo(() => {
        const result: Record<DealStage, number> = {} as Record<DealStage, number>;
        for (const s of DEAL_STAGES) result[s] = 0;
        for (const d of deals) result[d.stage] += d.value;
        return result;
    }, [deals]);

    const weighted = useMemo(() => {
        return deals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
    }, [deals]);

    return { deals, byStage, totals, weighted, moveDeal, stages: DEAL_STAGES };
}
