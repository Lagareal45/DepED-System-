import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div 
            className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/bg-image.png')" }}
        >
            {/* Global backdrop blur */}
            <div className="absolute inset-0 z-0 bg-white/10 backdrop-blur-sm dark:bg-black/40"></div>

            <div className="relative z-10 w-full max-w-sm rounded-xl bg-white/70 backdrop-blur-md p-8 shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] dark:bg-black/30 dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
                                <AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground dark:text-[#A1A09A]">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
