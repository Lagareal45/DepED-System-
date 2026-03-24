import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ShieldAlert, Timer } from 'lucide-react';
import InputError from '@/components/input-error';

interface Props {
    onSuccess: () => void;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 60; // seconds

export function AdminPasswordPrompt({ onSuccess }: Props) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLocked && secondsLeft > 0) {
            interval = setInterval(() => {
                setSecondsLeft((prev) => prev - 1);
            }, 1000);
        } else if (secondsLeft === 0) {
            setIsLocked(false);
            setAttempts(0);
        }
        return () => clearInterval(interval);
    }, [isLocked, secondsLeft]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked) return;

        if (password === 'admin1!') {
            onSuccess();
        } else {
            const nextAttempts = attempts + 1;
            setAttempts(nextAttempts);
            setPassword('');
            
            if (nextAttempts >= MAX_ATTEMPTS) {
                setIsLocked(true);
                setSecondsLeft(LOCKOUT_DURATION);
                setError(`Too many failed attempts. Locked for ${LOCKOUT_DURATION} seconds.`);
            } else {
                setError(`Incorrect administrator password. ${MAX_ATTEMPTS - nextAttempts} attempts remaining.`);
            }
        }
    };

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-12 transition-all duration-300">
            <div className={`w-full max-w-sm space-y-6 rounded-xl border p-8 shadow-sm transition-colors ${isLocked ? 'border-destructive/50 bg-destructive/5' : 'bg-card'}`}>
                <div className="flex flex-col items-center space-y-2 text-center">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full mb-2 transition-colors ${isLocked ? 'bg-destructive/20' : 'bg-primary/10'}`}>
                        {isLocked ? (
                            <ShieldAlert className="h-6 w-6 text-destructive animate-pulse" />
                        ) : (
                            <Lock className="h-6 w-6 text-primary" />
                        )}
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {isLocked ? 'Access Locked' : 'Admin Access Required'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {isLocked 
                            ? "Too many incorrect attempts. Please wait before trying again."
                            : "Please enter the administrator password to access these settings."
                        }
                    </p>
                </div>
                
                {isLocked ? (
                    <div className="flex flex-col items-center space-y-4 py-4">
                        <div className="flex items-center space-x-2 text-2xl font-mono font-bold text-destructive">
                            <Timer className="h-6 w-6" />
                            <span>{Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Locked Out</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2 text-left">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                autoFocus
                                placeholder="Enter admin password"
                                className={error ? "border-destructive focus-visible:ring-destructive" : ""}
                                disabled={isLocked}
                            />
                            <InputError message={error} className="mt-2" />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLocked}>
                            Verify Access
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
