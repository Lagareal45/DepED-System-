import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage, router } from '@inertiajs/react';
import { Camera, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;
    const user = (auth as any).user;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
            toast.error('Photo must be less than 50MB.');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file.');
            return;
        }

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            setPhotoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload the photo
        setIsUploadingPhoto(true);
        const formData = new FormData();
        formData.append('photo', file);

        router.post('/settings/profile/photo', formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Profile photo updated successfully.');
                setPhotoPreview(null);
                setIsUploadingPhoto(false);
            },
            onError: (errors) => {
                toast.error(errors.photo || 'Failed to upload photo.');
                setPhotoPreview(null);
                setIsUploadingPhoto(false);
            },
        });
    };

    const handleDeletePhoto = () => {
        router.delete('/settings/profile/photo', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Profile photo removed.');
                setPhotoPreview(null);
            },
            onError: () => {
                toast.error('Failed to remove photo.');
            },
        });
    };

    const currentAvatar = photoPreview || user.avatar;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile Settings</h1>

            <SettingsLayout>
                {/* Profile Photo Section */}
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Profile photo"
                        description="Upload a photo to personalize your account"
                    />

                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 overflow-hidden rounded-full ring-2 ring-border ring-offset-2 ring-offset-background">
                                <AvatarImage src={currentAvatar} alt={user.name} />
                                <AvatarFallback className="rounded-full bg-neutral-200 text-xl font-semibold text-black dark:bg-neutral-700 dark:text-white">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>

                            {/* Hover overlay */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingPhoto}
                                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer disabled:cursor-wait"
                            >
                                <Camera className="h-6 w-6 text-white" />
                            </button>

                            {/* Loading spinner overlay */}
                            {isUploadingPhoto && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingPhoto}
                                >
                                    <Camera className="h-4 w-4 mr-1.5" />
                                    {currentAvatar ? 'Change photo' : 'Upload photo'}
                                </Button>

                                {user.avatar && !photoPreview && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        onClick={handleDeletePhoto}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1.5" />
                                        Remove
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                JPG, PNG or GIF. Max 50MB.
                            </p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                            onChange={handlePhotoSelect}
                        />
                    </div>
                </div>

                {/* Profile Information Section */}
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Profile information"
                        description="Update your name and email address"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to resend the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Save
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Saved
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
