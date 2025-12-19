import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '@/hooks';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui';
import { useAuthStore } from '@/store';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { tenantSlug, setTenant } = useAuthStore();

    const login = useLogin();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login.mutate({ email, password });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-primary">TravelOps</CardTitle>
                    <p className="text-muted-foreground">Sign in to your account</p>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tenant</label>
                            <Input
                                value={tenantSlug}
                                onChange={(e) => setTenant(e.target.value)}
                                placeholder="tenant-slug"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {login.error && (
                            <p className="text-sm text-destructive">
                                {(login.error as Error).message || 'Login failed'}
                            </p>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={login.isPending}>
                            {login.isPending ? 'Signing in...' : 'Sign In'}
                        </Button>

                        <p className="text-sm text-muted-foreground text-center">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary hover:underline">
                                Register
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
