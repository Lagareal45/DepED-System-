import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Search, Calendar, Printer } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Monthly Report', href: '/monthly-report' },
];

interface ReportData {
    day: number | null;
    date: string;
    distance_start: string | number;
    distance_end: string | number;
    distance_traveled: number | null;
    odometer_before: number | null;
    odometer_after: number | null;
    gasoline_consumed: number | null;
    oil_used: number;
    grease_used: string | number;
    remarks: string;
}

interface MonthlyReportResponse {
    data: ReportData[];
    driver: string;
    plate_no: string;
    report_date: string;
    error?: string;
}

export default function MonthlyReport() {
    const rows = Array.from({ length: 31 }, (_, i) => i + 1);
    const [search, setSearch] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [reportData, setReportData] = useState<ReportData[]>([]);
    const [reportInfo, setReportInfo] = useState<{ driver: string; plate_no: string; report_date: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showReview, setShowReview] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [superintendentName, setSuperintendentName] = useState('VICTORIA V. GAZO');

    const getCookie = (name: string) => {
        const match = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`));
        return match ? match.split('=')[1] : undefined;
    };

    const handleGenerate = async () => {
        if (!selectedDate && !search) {
            setError('Please select a date or enter a driver name');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const xsrf = getCookie('XSRF-TOKEN');
            const xsrfDecoded = xsrf ? decodeURIComponent(xsrf) : '';

            const params = new URLSearchParams();
            if (selectedDate) params.append('date', selectedDate);
            if (search) params.append('driver', search);

            const res = await fetch(`/trip-tickets/monthly-report?${params.toString()}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(xsrfDecoded ? { 'X-XSRF-TOKEN': xsrfDecoded } : {}),
                },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const errorText = await res.text();
                let errorMessage = 'Failed to fetch monthly report data.';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const result: MonthlyReportResponse = await res.json();

            // Check for error in response
            if (result.error) {
                throw new Error(result.error);
            }
            setReportData(result.data);
            setReportInfo({
                driver: result.driver,
                plate_no: result.plate_no,
                report_date: result.report_date,
            });
            setShowReview(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate report.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const printOrSavePDF = () => {
        setDownloading(true);
        try {
            const html = generatePDFHTML();
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                setError('Please allow pop-ups to print or save as PDF.');
                return;
            }
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.onafterprint = () => printWindow.close();
            }, 300);
        } catch (err) {
            setError('Failed to open print dialog.');
        } finally {
            setDownloading(false);
        }
    };

    const generatePDFHTML = () => {
        const tableRows = reportData.length > 0
            ? reportData.map((dayData) => `
                <tr>
                    <td style="border: 1px dotted #000; padding: 8px; text-align: left; font-size: 10pt;">${dayData.day}</td>
                    <td style="border: 1px dotted #000; padding: 8px; font-size: 10pt; text-align: center;">${formatDate(dayData.date)}</td>
                    <td style="border: 1px dotted #000; padding: 8px; font-size: 10pt; text-align: center;">${dayData.odometer_before !== null && dayData.odometer_after !== null ? (dayData.odometer_after - dayData.odometer_before).toFixed(1) : (dayData.distance_traveled !== null ? dayData.distance_traveled.toFixed(1) : '')}</td>
                    <td style="border: 1px dotted #000; padding: 8px; font-size: 10pt; text-align: center;">${dayData.gasoline_consumed !== null ? dayData.gasoline_consumed.toFixed(2) : ''}</td>
                    <td style="border: 1px dotted #000; padding: 8px; font-size: 10pt; text-align: center;">${dayData.oil_used ? dayData.oil_used.toFixed(2) : ''}</td>
                    <td style="border: 1px dotted #000; padding: 8px; font-size: 10pt; text-align: center;">${dayData.grease_used || ''}</td>
                    <td style="border: 1px dotted #000; padding: 8px; font-size: 10pt; text-align: center;">${dayData.remarks || ''}</td>
                </tr>
            `).join('')
            : '';

        const totalOil = reportData.reduce((sum, item) => sum + (item.oil_used || 0), 0);
        const totalGrease = reportData.reduce((sum, item) => sum + (Number(item.grease_used) || 0), 0);
        const totalDistance = reportData.reduce((sum, item) => sum + (item.distance_traveled || 0), 0);
        const totalGasoline = reportData.reduce((sum, item) => sum + (item.gasoline_consumed || 0), 0);

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Monthly Report of Official Travels</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 10pt; margin: 12px; line-height: 1.2; color: #000; }
        .form-page { max-width: 21cm; margin: 0 auto; position: relative; }
        .header { text-align: center; margin-bottom: 8px; position: relative; }
        .header .org { font-size: 9pt; margin: 0; line-height: 1.1; }
        .header .title { font-size: 12pt; font-weight: bold; margin: 4px 0 2px; letter-spacing: 0.5px; }
        .appendix { position: absolute; top: -12px; right: 0; font-size: 10pt; font-weight: bold; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 10pt; }
        table { width: 100%; border-collapse: collapse; font-size: 10pt; border: 1px solid #000; }
        th { border: 1px solid #000; text-align: center; padding: 6px; font-size: 10pt; }
        td { border: 1px dotted #000; padding: 8px; font-size: 10pt; }
        .totals-row td { border: 1px solid #000; font-weight: bold; }
        .cert { margin: 18px 0; font-size: 10pt; }
        .note { margin-top: 18px; font-size: 10pt; }
        @media print { 
            @page { margin: 0; }
            body { margin: 1.5cm; }
        }
    </style>
</head>
<body>
    <div class="form-page">
        <div class="header">
            <div class="appendix">Appendix F</div>
            <p class="org">Republic of the Philippines</p>
            <p class="org">Department of Education</p>
            <p class="org"></p>
            <p class="org">Schools Division of Bukidnon</p>
            <h3 class="title">MONTHLY REPORT OF OFFICIAL TRAVELS</h3>
            <p style="text-align: center; margin: 8px 0; font-size: 10pt;">(To be accomplished for each motor vehicle)</p>
        </div>

        <div class="info-row">
            <div>
                Vehicle Plate No.
                <span style="display: inline-block; min-width: 180px; border-bottom: 1px solid #000; margin-left: 4px; padding-bottom: 1px; text-align: left;">
                    ${reportInfo?.plate_no || ''}
                </span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                <div>
                    Date:
                    <span style="display: inline-block; min-width: 140px; border-bottom: 1px solid #000; margin-left: 4px; padding-bottom: 1px; text-align: left;">
                        ${reportInfo?.report_date || ''}
                    </span>
                </div>
                <div style="font-size: 10pt;">
                    Driver's Name:
                    <span style="display: inline-block; min-width: 180px; border-bottom: 1px solid #000; margin-left: 4px; padding-bottom: 1px; text-align: left;">
                        ${reportInfo?.driver || ''}
                    </span>
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 5%;"></th>
                    <th style="width: 15%;">DATE</th>
                    <th style="width: 17%;">Total Distance Travelled (A)</th>
                    <th style="width: 20%;">Gasoline Consumed (in Liters)</th>
                    <th style="width: 15%;">Oil Used (in Liters)</th>
                    <th style="width: 15%;">Grease Used</th>
                    <th>REMARKS</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
                <tr class="totals-row">
                    <td>TOTALS:</td>
                    <td></td>
                    <td style="text-align: center;">${totalDistance.toFixed(1)}</td>
                    <td style="text-align: center;">${totalGasoline.toFixed(2)}</td>
                    <td style="text-align: center;">${totalOil.toFixed(2)}</td>
                    <td style="text-align: center;">${totalGrease.toFixed(2)}</td>
                    <td></td>
                </tr>
            </tbody>
        </table>

        <div class="cert">
            <p style="font-size: 10pt; margin-bottom: 4px; text-indent: 1.5em;">I hereby certify to the correctness of the above statement and that the motor vehicle was used on strictly official business only.</p>
            <div style="height: 36px;"></div>
        </div>

        <div class="cert" style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 30px;">
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
                <div style="font-size: 10pt; margin-bottom: 4px;">APPROVED:</div>
                <div style="height: 40px; margin-bottom: 4px;"></div>
                <div style="border-bottom: 1px solid #000; width: 200px; margin-bottom: 4px; text-align: center; padding-bottom: 2px;">${superintendentName}</div>
                <div style="text-align: center; font-size: 10pt; width: 200px;">Schools Division Superintendent</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; margin-left: auto;">
                <div style="height: 40px; margin-bottom: 4px;"></div>
                <div style="border-bottom: 1px solid #000; width: 200px; margin-bottom: 4px; text-align: center; padding-bottom: 2px;">${reportInfo?.driver || ''}</div>
                <div style="text-align: center; font-size: 10pt;">Driver</div>
            </div>
        </div>

        <div class="note" style="text-align: left;">
            <strong style="font-size: 10pt;">Note:</strong>
            <div style="font-size: 10pt; margin-top: 4px; text-indent: 1.5em; text-align: justify;">This report should be accomplished in triplicate the original of which, supported by the originals of duly accomplished Driver's Record of travel (Form A) should be submitted, thru the Administrative Officer or his equivalent to the auditor concerned.</div>
        </div>
    </div>
</body>
</html>
        `;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monthly Report" />

            <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Datepicker (left), Search bar (center), Generate button (right) */}
                <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="relative flex items-center">
                        <span className="absolute left-2 text-muted-foreground">
                            <Calendar size={16} />
                        </span>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="pl-8 min-w-[180px]"
                        />
                    </div>
                    <div className="relative flex items-center flex-1 max-w-md mx-auto">
                        <span className="absolute left-2 text-muted-foreground">
                            <Search size={16} />
                        </span>
                        <Input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by Driver Name"
                            className="pl-8 w-full"
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={loading}>
                        {loading ? 'Generating...' : 'Generate'}
                    </Button>
                </div>
                {error && (
                    <div className="mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                        {error}
                    </div>
                )}
                <div className="relative min-h-0 flex-1 overflow-y-auto rounded-xl border border-sidebar-border/70 bg-background/40 p-6">
                    <Card>
                        <CardContent className="pt-2">
                            <div className="text-foreground relative" style={{ textAlign: 'center', marginTop: '0px' }}>
                                <div className="absolute top-0 right-4 font-bold hidden sm:block text-sm">Appendix F</div>
                                <p className="text-foreground pt-6" style={{ textAlign: 'center', marginBottom: '4px', fontSize: '9pt', lineHeight: 1.1, margin: 0 }}>
                                    Republic of the Philippines<br />
                                    Department of Education<br />
                                    <br />
                                    Schools Division of Bukidnon
                                </p>

                                <h3 className="text-foreground" style={{ textAlign: 'center', margin: '8px 0', fontSize: '12pt', fontWeight: 'bold', letterSpacing: '0.5px' }}>MONTHLY REPORT OF OFFICIAL TRAVELS</h3>
                                <p className="text-foreground" style={{ textAlign: 'center', margin: '8px 0', fontSize: '10pt' }}>(To be accomplished for each motor vehicle)</p>

                                <div className="text-foreground" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '10pt' }}>
                                    <div>
                                        Vehicle Plate No.
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                minWidth: '180px',
                                                borderBottom: '1px solid var(--border)',
                                                marginLeft: '4px',
                                                paddingBottom: '1px',
                                                textAlign: 'left',
                                            }}
                                        >
                                            {reportInfo?.plate_no || ''}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                        <div>
                                            Date:
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    minWidth: '140px',
                                                    borderBottom: '1px solid var(--border)',
                                                    marginLeft: '4px',
                                                    paddingBottom: '1px',
                                                    textAlign: 'left',
                                                }}
                                            >
                                                {reportInfo?.report_date || ''}
                                            </span>
                                        </div>
                                        <div>
                                            Driver's Name:
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    minWidth: '180px',
                                                    borderBottom: '1px solid var(--border)',
                                                    marginLeft: '4px',
                                                    paddingBottom: '1px',
                                                    textAlign: 'left',
                                                }}
                                            >
                                                {reportInfo?.driver || ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <table className="border border-border" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                                    <thead>
                                        <tr>
                                            <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '5%', fontSize: '10pt' }}></th>
                                            <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '15%', fontSize: '10pt' }}>DATE</th>
                                            <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '17%', fontSize: '10pt' }}>Total Distance Travelled (A)</th>
                                            <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '20%', fontSize: '10pt' }}>Gasoline Consumed (in Liters)</th>
                                            <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '15%', fontSize: '10pt' }}>Oil Used (in Liters)</th>
                                            <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '15%', fontSize: '10pt' }}>Grease Used</th>
                                            <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', fontSize: '10pt' }}>REMARKS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.length > 0 ? (
                                            <>
                                                {reportData.map((dayData, index) => (
                                                    <tr key={`${dayData.day}-${index}`}>
                                                        <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', textAlign: 'left', fontSize: '10pt' }}>{dayData.day}</td>
                                                        <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{formatDate(dayData.date)}</td>
                                                        <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{dayData.odometer_before !== null && dayData.odometer_after !== null ? (dayData.odometer_after - dayData.odometer_before).toFixed(1) : (dayData.distance_traveled !== null ? dayData.distance_traveled.toFixed(1) : '')}</td>
                                                        <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{dayData.gasoline_consumed !== null ? dayData.gasoline_consumed.toFixed(2) : ''}</td>
                                                        <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{dayData.oil_used ? dayData.oil_used.toFixed(2) : ''}</td>
                                                        <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{dayData.grease_used || ''}</td>
                                                        <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{dayData.remarks || ''}</td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td className="border border-border text-foreground font-bold" style={{ padding: '8px', fontSize: '10pt' }}>TOTALS:</td>
                                                    <td className="border border-border" style={{ padding: '8px', fontSize: '10pt' }}></td>
                                                    <td className="border border-border text-foreground font-bold" style={{ padding: '8px', fontSize: '10pt', textAlign: 'center' }}>
                                                        {reportData.reduce((sum, item) => sum + (item.distance_traveled || 0), 0).toFixed(1)}
                                                    </td>
                                                    <td className="border border-border text-foreground font-bold" style={{ padding: '8px', fontSize: '10pt', textAlign: 'center' }}>
                                                        {reportData.reduce((sum, item) => sum + (item.gasoline_consumed || 0), 0).toFixed(2)}
                                                    </td>
                                                    <td className="border border-border text-foreground font-bold" style={{ padding: '8px', fontSize: '10pt', textAlign: 'center' }}>
                                                        {reportData.reduce((sum, item) => sum + (item.oil_used || 0), 0).toFixed(2)}
                                                    </td>
                                                    <td className="border border-border text-foreground font-bold" style={{ padding: '8px', fontSize: '10pt', textAlign: 'center' }}>
                                                        {reportData.reduce((sum, item) => sum + (Number(item.grease_used) || 0), 0).toFixed(2)}
                                                    </td>
                                                    <td className="border border-border" style={{ padding: '8px', fontSize: '10pt' }}></td>
                                                </tr>
                                            </>
                                        ) : (
                                            <>
                                                {rows.map((r) => (
                                                    <tr key={r}>
                                                        <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', textAlign: 'left', fontSize: '10pt' }}>{r}</td>
                                                        <td style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt' }}></td>
                                                        <td style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt' }}></td>
                                                        <td style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt' }}></td>
                                                        <td style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt' }}></td>
                                                        <td style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt' }}></td>
                                                        <td style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt' }}></td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td className="border border-border text-foreground font-bold" style={{ padding: '8px', fontSize: '10pt' }}>TOTALS:</td>
                                                    <td className="border border-border" style={{ padding: '8px', fontSize: '10pt' }}></td>
                                                    <td className="border border-border" style={{ padding: '8px', fontSize: '10pt' }}></td>
                                                    <td className="border border-border" style={{ padding: '8px', fontSize: '10pt' }}></td>
                                                    <td className="border border-border" style={{ padding: '8px', fontSize: '10pt' }}></td>
                                                    <td className="border border-border" style={{ padding: '8px', fontSize: '10pt' }}></td>
                                                    <td className="border border-border" style={{ padding: '8px', fontSize: '10pt' }}></td>
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>

                                <div className="text-foreground" style={{ marginTop: '18px', fontSize: '10pt' }}>
                                    <p style={{ fontSize: '10pt', marginBottom: '4px', textIndent: '1.5em' }}>I hereby certify to the correctness of the above statement and that the motor vehicle was used on strictly official business only.</p>
                                    <div style={{ height: '36px' }}></div>
                                </div>

                                <div className="text-foreground" style={{ marginTop: '30px', fontSize: '10pt', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <div style={{ fontSize: '10pt', marginBottom: '4px' }}>APPROVED:</div>
                                        <div style={{ height: '40px', marginBottom: '4px' }}></div>
                                        <Input
                                            value={superintendentName}
                                            onChange={(e) => setSuperintendentName(e.target.value)}
                                            className="h-8 w-[200px] border-0 border-b border-border rounded-none bg-transparent px-0 text-center text-[10pt] shadow-none focus-visible:ring-0"
                                            placeholder="Name"
                                        />
                                        <div style={{ textAlign: 'center', fontSize: '10pt', width: '200px', marginTop: '4px' }}>Schools Division Superintendent</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 'auto' }}>
                                        <div style={{ height: '40px', marginBottom: '4px' }}></div>
                                        <div style={{ borderBottom: '1px solid var(--border)', width: '200px', marginBottom: '4px', textAlign: 'center', paddingBottom: '2px' }}>{reportInfo?.driver || ''}</div>
                                        <div style={{ textAlign: 'center', fontSize: '10pt' }}>Driver</div>
                                    </div>
                                </div>

                                <div className="text-foreground" style={{ marginTop: '18px', fontSize: '10pt', textAlign: 'left' }}>
                                    <strong style={{ fontSize: '10pt' }}>Note:</strong>
                                    <div style={{ fontSize: '10pt', marginTop: '4px', textIndent: '1.5em', textAlign: 'justify' }}>This report should be accomplished in triplicate the original of which, supported by the originals of duly accomplished Driver's Record of travel (Form A) should be submitted, thru the Administrative Officer or his equivalent to the auditor concerned.</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {showReview && reportData.length > 0 && (
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Review Monthly Report</CardTitle>
                            <CardDescription>Please review the report before printing or saving as PDF</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowReview(false)}
                                    disabled={downloading}
                                >
                                    Edit
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={printOrSavePDF}
                                    disabled={downloading}
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print / Save as PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
