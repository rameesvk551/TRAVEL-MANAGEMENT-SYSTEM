import { Request, Response, NextFunction } from 'express';
import { AuthService, RegisterDTO, LoginDTO } from '../../application/services/AuthService.js';

/**
 * Auth controller - handles login/register HTTP requests.
 * NO business logic - only request/response handling.
 */
export class AuthController {
    constructor(private authService: AuthService) { }

    register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto = req.body as RegisterDTO;
            const result = await this.authService.register(dto);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto = req.body as LoginDTO;
            const result = await this.authService.login(dto);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // User info comes from auth middleware
            res.json({
                success: true,
                data: {
                    userId: req.context.userId,
                    tenantId: req.context.tenantId,
                    role: req.context.userRole,
                },
            });
        } catch (error) {
            next(error);
        }
    };
}
