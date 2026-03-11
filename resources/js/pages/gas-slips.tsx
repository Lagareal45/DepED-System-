import { Head } from '@inertiajs/react';
import { GasSlipForm } from '@/components/gas-slip-form';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Gas Slips',
        href: '/gas-slips',
    },
];

export default function GasSlips() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gas Slips" />

            <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Gas Slip Form */}
                <div className="relative min-h-0 flex-1 overflow-y-auto rounded-xl border border-sidebar-border/70 bg-background/40 p-6 dark:border-sidebar-border">
                    <GasSlipForm />
                </div>
            </div>
        </AppLayout>
    );
}
