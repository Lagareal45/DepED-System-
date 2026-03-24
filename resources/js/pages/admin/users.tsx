import { Head, router } from '@inertiajs/react';
import { ShieldCheck, CheckCircle, XCircle, Eye, EyeOff, Edit, Trash2, Users } from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
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
    password?: string;
    is_approved: boolean;
    created_at: string;
}

export default function AdminUsers({ pendingUsers, allUsers }: { pendingUsers: User[], allUsers: User[] }) {
    const [processingId, setProcessingId] = useState<number | null>(null);
    
    // Modals state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Edit form state
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        is_approved: true,
        password: '',
        password_confirmation: ''
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setEditForm({
            name: user.name,
            email: user.email,
            is_approved: user.is_approved,
            password: '',
            password_confirmation: ''
        });
        setFormErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        setIsEditModalOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setFormErrors({});
        router.patch(`/admin/users/${selectedUser.id}`, editForm, {
            onSuccess: () => {
                toast.success('User updated successfully.');
                setIsEditModalOpen(false);
            },
            onError: (errors) => {
                setFormErrors(errors as Record<string, string>);
                toast.error('Failed to save changes. Please check the form for errors.');
            }
        });
    };

    const deleteUser = (id: number) => {
        if (!confirm('Are you sure you want to permanently delete this account?')) return;
        
        router.delete(`/admin/users/${id}`, {
            onSuccess: () => toast.success('User deleted successfully.'),
            onError: () => toast.error('Failed to delete user.')
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-8 rounded-xl p-4">
                {/* Pending Approvals Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-yellow-500" />
                            Pending User Approvals
                        </CardTitle>
                        <CardDescription>
                            Review and manage user accounts waiting for administrator approval.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
                                <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
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
                                        {pendingUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        className="text-green-600 border-green-200 hover:bg-green-50"
                                                        onClick={() => approveUser(user.id)}
                                                        disabled={processingId === user.id}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
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

                {/* User Management Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            User Management
                        </CardTitle>
                        <CardDescription>
                            View, edit, and delete all registered user accounts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                {user.is_approved ? (
                                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                                                        Approved
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Pending
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    title="Edit User"
                                                    onClick={() => openEditModal(user)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    title="Delete User"
                                                    onClick={() => deleteUser(user.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit User Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User Account</DialogTitle>
                        <DialogDescription>Modify user details, email, or reset their password.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input 
                                id="name" 
                                value={editForm.name} 
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                                required 
                            />
                            <InputError message={formErrors.name} className="mt-1" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                                id="email" 
                                type="email"
                                value={editForm.email} 
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} 
                                required 
                            />
                            <InputError message={formErrors.email} className="mt-1" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password (leave blank to keep current)</Label>
                            <div className="relative">
                                <Input 
                                    id="password" 
                                    type={showPassword ? "text" : "password"}
                                    value={editForm.password} 
                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} 
                                    placeholder="Enter new password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <InputError message={formErrors.password} className="mt-1" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Confirm New Password</Label>
                            <div className="relative">
                                <Input 
                                    id="password_confirmation" 
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={editForm.password_confirmation} 
                                    onChange={(e) => setEditForm({ ...editForm, password_confirmation: e.target.value })} 
                                    placeholder="Confirm new password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <InputError message={formErrors.password_confirmation} className="mt-1" />
                        </div>
                        <div className="flex items-center gap-2 py-2">
                            <Label htmlFor="approved">Approval Status</Label>
                            <select 
                                id="approved"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                                value={editForm.is_approved ? 'true' : 'false'}
                                onChange={(e) => setEditForm({ ...editForm, is_approved: e.target.value === 'true' })}
                            >
                                <option value="true">Approved</option>
                                <option value="false">Pending</option>
                            </select>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

