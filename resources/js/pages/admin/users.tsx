import { Head, router } from '@inertiajs/react';
import { ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/users',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

export default function AdminUsers({ users }: { users: User[] }) {
    const [processingId, setProcessingId] = useState<number | null>(null);

    const approveUser = (id: number) => {
        setProcessingId(id);
        router.post(`/admin/users/${id}/approve`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('User has been approved successfully.');
                setProcessingId(null);
            },
            onError: () => {
                toast.error('Failed to approve user.');
                setProcessingId(null);
            }
        });
    };

    const rejectUser = (id: number) => {
        if (!confirm('Are you sure you want to reject and remove this user?')) return;
        
        setProcessingId(id);
        router.delete(`/admin/users/${id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('User has been rejected and removed.');
                setProcessingId(null);
            },
            onError: () => {
                toast.error('Failed to reject user.');
                setProcessingId(null);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pending Users Approvals" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            Pending User Approvals
                        </CardTitle>
                        <CardDescription>
                            Review and manage user accounts waiting for administrator approval.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
                                <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium">All caught up!</h3>
                                <p className="text-sm text-muted-foreground mt-1">There are no pending user registrations to approve.</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Registered</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 data-[state=open]:bg-green-50"
                                                        onClick={() => approveUser(user.id)}
                                                        disabled={processingId === user.id}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 data-[state=open]:bg-red-50"
                                                        onClick={() => rejectUser(user.id)}
                                                        disabled={processingId === user.id}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
