import { RequestContext } from '../shared/types/index.js';

declare global {
    namespace Express {
        interface Request {
            context: RequestContext;
        }
    }
}

export { };
