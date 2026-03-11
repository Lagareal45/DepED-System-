import { Head } from '@inertiajs/react';
import { TripTicketForm } from '@/components/trip-ticket-form';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Trip Tickets',
        href: '/trip-tickets',
    },
];

export default function TripTickets() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Trip Tickets" />

            <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Trip Ticket Form */}
                <div className="relative min-h-0 flex-1 overflow-y-auto rounded-xl border border-sidebar-border/70 bg-background/40 p-6 dark:border-sidebar-border">
                    <TripTicketForm />
                </div>
            </div>
        </AppLayout>
    );
}
