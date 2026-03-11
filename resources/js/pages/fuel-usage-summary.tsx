import { Search, Calendar, Printer, Fuel } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { gasSlipService } from '@/services/gas-slip-service';

interface ReportRow {
    day: number | null;
    date: string;
    // Odometer / distance fields (from gas slip / aggregation)
    distance_start?: string | number | null;
    distance_end?: string | number | null;
    odometer_before?: string | number | null;
    odometer_after?: string | number | null;
    // Trip ticket specific fields
    speed_at_beginning?: string | number | null;
    speed_at_end?: string | number | null;
    // Fuel / oil usage
    oil_used?: number;
    grease_used?: string | number;
    remarks?: string;
    // Vehicle info that might be present per row
    plate_no?: string;
    number_of_cylinder?: string | number;
    vehicle_type?: string;
    vehicle?: string;
    total_fuel_used?: number | string;
    total_liters?: number | string;
    from_gas_slip?: boolean;
    gas_slip_document_no?: string;
    number_of_cylinders?: string | number;
}

interface GasSlipData {
    document_no?: string;
    date?: string;
    odometer_before?: number | null;
    odometer_after?: number | null;
    vehicle_type?: string;
    vehicle?: string;
    plate_no?: string;
    liters?: number | null;
    number_of_cylinder?: string | number | null;
}

interface ReportInfo {
    vehicle_type?: string;
    plate_no?: string;
    number_of_cylinder?: string | number;
    report_date?: string;
    driver?: string;
}

export default function FuelUsageSummary() {
    const rows = Array.from({ length: 8 }, (_, i) => i + 1);
    const [search, setSearch] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [reportData, setReportData] = useState<ReportRow[]>([]);
    const [reportInfo, setReportInfo] = useState<ReportInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showReview, setShowReview] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [preparedByName, setPreparedByName] = useState('JANE ROSE S. PAYOT');
    const [preparedByPosition, setPreparedByPosition] = useState('Administrative Assistant III');
    const [verifiedBy, setVerifiedBy] = useState({ name: 'KATHLEEN ANN T. DUMAS', position: 'Administrative Officer V' });
    const [gasSlipData, setGasSlipData] = useState<GasSlipData[]>([]);

    const getCookie = (name: string) => {
        const match = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`));
        return match ? match.split('=')[1] : undefined;
    };

    const toNumberOrNull = (value: unknown): number | null => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        if (typeof value === 'string') {
            const cleaned = value.replace(/,/g, '').trim();
            if (cleaned === '') return null;
            const n = Number(cleaned);
            return Number.isFinite(n) ? n : null;
        }
        const n = Number(value as string | number);
        return Number.isFinite(n) ? n : null;
    };

    const normalizeText = (value: unknown): string => {
        if (value === null || value === undefined) return '';
        return String(value).trim().toLowerCase();
    };

    const normalizeDateKey = (value: unknown): string => {
        if (!value) return '';
        if (typeof value === 'string') {
            const trimmed = value.trim();
            const m = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
            if (m) return trimmed.slice(0, 10);
        }
        const d = new Date(value as string | number | Date);
        if (Number.isNaN(d.getTime())) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // Fetch gas slip data for selected period
    const fetchGasSlipData = async (date: string, vehicleType?: string) => {
        try {
            const selectedDate = new Date(date);
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth() + 1;

            console.log('🔥 FETCHING GAS SLIPS FOR:', {
                year,
                month,
                vehicleType,
                selectedDate: selectedDate.toISOString().split('T')[0]
            });
            console.log('🔥 API CALL: /gas-slips/monthly');

            const gasSlips = await gasSlipService.getMonthlyGasSlips(year, month, vehicleType);
            console.log('🔥 RAW GAS SLIPS RECEIVED:', gasSlips);
            console.log('🔥 GAS SLIP COUNT:', gasSlips.length);

            if (gasSlips.length === 0) {
                console.log('❌ NO GAS SLIPS FOUND - this is the problem!');
                return [];
            }

            // Debug each gas slip
            gasSlips.forEach((slip, index) => {
                console.log(`🔥 GAS SLIP ${index}:`, {
                    document_no: slip.document_no,
                    date: slip.date,
                    dateObj: new Date(slip.date),
                    dateString: new Date(slip.date).toDateString(),
                    odometer_before: slip.odometer_before,
                    odometer_after: slip.odometer_after,
                    vehicle_type: slip.vehicle_type,
                    plate_no: slip.plate_no
                });
            });

            setGasSlipData(gasSlips);
            return gasSlips;
        } catch (error) {
            console.error('❌ ERROR fetching gas slip data:', error);
            return [];
        }
    };

    // Merge trip ticket data with gas slip odometer readings
    const mergeDataWithGasSlips = (tripTicketData: ReportRow[], gasSlips: GasSlipData[]) => {
        console.log('=== 🔥 MERGE DEBUG START ===');
        console.log('🔥 TRIP TICKET ROWS:', tripTicketData.length);
        console.log('🔥 GAS SLIPS FOUND:', gasSlips.length);

        const pickBestGasSlipForRow = (row: ReportRow) => {
            const rowDateKey = normalizeDateKey(row.date);
            if (!rowDateKey) return null;

            const rowVehicle = normalizeText(row.vehicle_type || row.vehicle);
            const rowPlate = normalizeText(row.plate_no);
            const searchVehicle = normalizeText(search);

            const slipsSameDate = gasSlips.filter((slip) => normalizeDateKey(slip.date) === rowDateKey);
            if (slipsSameDate.length === 0) return null;

            const slipsPlateMatch = rowPlate
                ? slipsSameDate.filter((slip) => normalizeText(slip.plate_no) === rowPlate)
                : [];
            if (slipsPlateMatch.length === 1) return slipsPlateMatch[0];
            if (slipsPlateMatch.length > 1) return slipsPlateMatch[0];

            const slipsVehicleMatch = rowVehicle
                ? slipsSameDate.filter((slip) => normalizeText(slip.vehicle_type || slip.vehicle) === rowVehicle)
                : [];
            if (slipsVehicleMatch.length === 1) return slipsVehicleMatch[0];
            if (slipsVehicleMatch.length > 1) return slipsVehicleMatch[0];

            const slipsSearchVehicleMatch = searchVehicle
                ? slipsSameDate.filter((slip) => normalizeText(slip.vehicle_type || slip.vehicle) === searchVehicle)
                : [];
            if (slipsSearchVehicleMatch.length === 1) return slipsSearchVehicleMatch[0];
            if (slipsSearchVehicleMatch.length > 1) return slipsSearchVehicleMatch[0];

            // Last resort: if there is exactly one gas slip on that date, use it.
            if (slipsSameDate.length === 1) return slipsSameDate[0];

            return null;
        };

        return tripTicketData.map((row, rowIndex) => {
            console.log(`\n--- 🔄 Processing Row ${rowIndex} ---`);
            console.log('📋 TRIP TICKET ROW:', JSON.stringify(row, null, 2));

            const matchingGasSlip = pickBestGasSlipForRow(row);

            // If we have matching gas slip data, use its odometer readings
            if (matchingGasSlip) {
                const mergedRow = {
                    ...row,
                    // EXPLICIT MAPPING: ODOMETER Beginning gets Odometer Before from Gas Slip
                    odometer_before: matchingGasSlip.odometer_before,
                    odometer_after: matchingGasSlip.odometer_after,
                    distance_start: matchingGasSlip.odometer_before, // This is the "ODOMETER Beginning" field
                    distance_end: matchingGasSlip.odometer_after,   // This is the "Reading Ending" field
                    // Also update fuel usage if available
                    oil_used: matchingGasSlip.liters || row.oil_used,
                    number_of_cylinder: matchingGasSlip.number_of_cylinder || row.number_of_cylinder,
                    // Flag to indicate data comes from gas slip
                    from_gas_slip: true,
                    gas_slip_document_no: matchingGasSlip.document_no,
                };

                console.log('🔄 MERGED ROW:', {
                    originalStart: row.distance_start,
                    originalEnd: row.distance_end,
                    newStart: mergedRow.distance_start,
                    newEnd: mergedRow.distance_end,
                    from_gas_slip: mergedRow.from_gas_slip,
                    gas_slip_document_no: mergedRow.gas_slip_document_no
                });

                return mergedRow;
            } else {
                console.log('❌ NO MATCH FOUND - keeping original row');
                return row;
            }
        });
    };

    // Ensure gas slip data takes priority explicitly prioritizing odometer_before / odometer_after
    const getOdometerValue = (row: ReportRow, type: 'start' | 'end') => {
        // We always want to prioritize Gas Slip's "odometer_before" and "odometer_after"
        const gasSlipVal = type === 'start' ? row.odometer_before : row.odometer_after;
        const mappedGasSlipVal = toNumberOrNull(gasSlipVal);

        if (mappedGasSlipVal !== null) {
            return mappedGasSlipVal;
        }

        // Fallback to trip ticket data if Gas Slip data is missing
        const fallbackRaw = type === 'start'
            ? (row.distance_start ?? row.speed_at_beginning)
            : (row.distance_end ?? row.speed_at_end);

        return toNumberOrNull(fallbackRaw);
    };

    const handleGenerate = async () => {
        if (!selectedDate && !search) {
            setError('Please select a date or enter a vehicle type');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const xsrf = getCookie('XSRF-TOKEN');
            const xsrfDecoded = xsrf ? decodeURIComponent(xsrf) : '';

            const params = new URLSearchParams();
            if (selectedDate) params.append('date', selectedDate);
            if (search) params.append('vehicle_type', search);

            // Fetch trip ticket data
            const res = await fetch(`/trip-tickets/monthly-report?${params.toString()}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(xsrfDecoded ? { 'X-XSRF-TOKEN': xsrfDecoded } : {}),
                },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to fetch monthly report data.');
            }

            const result = await res.json();
            let data: ReportRow[] = result.data || [];

            // Fetch gas slip data and merge with trip ticket data
            if (selectedDate) {
                const gasSlips = await fetchGasSlipData(selectedDate, search);
                console.log('Before merge - Trip ticket data:', data);
                console.log('Gas slips found:', gasSlips);
                data = mergeDataWithGasSlips(data, gasSlips);
                console.log('After merge - Final data:', data);
            }

            setReportData(data);

            const firstRow = (data && data.length > 0 ? data[0] : {}) as ReportRow;

            setReportInfo({
                // Type of Vehicle (Trip Ticket "vehicle" or Gas Slip "vehicle_type")
                vehicle_type:
                    result.vehicle_type ??
                    result.vehicle ??
                    firstRow.vehicle_type ??
                    firstRow.vehicle ??
                    '',
                // Plate Number (Trip Ticket / per-row)
                plate_no: result.plate_no ?? firstRow.plate_no ?? '',
                // Number of Cylinder (Gas Slip)
                number_of_cylinder:
                    result.number_of_cylinder ??
                    firstRow.number_of_cylinder ??
                    '',
                report_date: result.report_date ?? '',
                driver: result.driver ?? '',
            });
            setShowReview(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate report.');
        } finally {
            setLoading(false);
        }
    };

    const printOrSavePDF = () => {
        setDownloading(true);
        try {
            // Build printable HTML for the formal report only
            const month = (() => {
                let m = '';
                if (selectedDate) {
                    const d = new Date(selectedDate);
                    m = d.toLocaleString('en-US', { month: 'long' });
                } else if (reportInfo?.report_date) {
                    m = reportInfo.report_date.split(' ')[0];
                }
                return m ? m.toUpperCase() : '________';
            })();
            const tableRows = reportData.map((row) => {
                const startVal = getOdometerValue(row, 'start');
                const endVal = getOdometerValue(row, 'end');
                const start = startVal !== null ? startVal : '';
                const end = endVal !== null ? endVal : '';
                const totalDistanceNumber = (start !== '' && end !== '') ? Number(end) - Number(start) : null;
                const totalDistance = totalDistanceNumber !== null ? totalDistanceNumber : '';
                const fuelUsedValue = row.total_fuel_used ?? row.total_liters ?? row.oil_used ?? 0;
                const fuelUsed = Number(fuelUsedValue);
                const normalTravelKmPerLiter = 6;
                const distancePerLiter = totalDistanceNumber !== null ? (fuelUsed > 0 ? (totalDistanceNumber / fuelUsed).toFixed(2) : '0.00') : '';
                const totalLitersWithAllowance = totalDistanceNumber !== null ? ((totalDistanceNumber / normalTravelKmPerLiter) * 1.1).toFixed(2) : '';
                const excess = totalLitersWithAllowance !== '' ? (fuelUsed - Number(totalLitersWithAllowance)).toFixed(2) : '';
                // Plate number logic matches the on-screen table
                const firstRow = reportData[0] || {};
                const plateNo = row.plate_no || (reportInfo && reportInfo.plate_no) || firstRow.plate_no || '';
                // Number of Cylinder logic matches the on-screen table
                const numberOfCylinder = row.number_of_cylinder || (reportInfo && reportInfo.number_of_cylinder) || firstRow.number_of_cylinder || '';
                return `<tr>
                    <td style="border: 1px dotted #000; padding: 8px; text-align: center;">${row.vehicle_type || row.vehicle || ''}</td>
                    <td style="border: 1px dotted #000; padding: 8px; text-align: center;">${plateNo}</td>
                    <td style="border: 1px dotted #000; padding: 8px; text-align: center;">${numberOfCylinder}</td>
                    <td style="border: 1px dotted #000; padding: 8px; text-align: center;">${start}</td>
                    <td style="border: 1px dotted #000; padding: 8px; text-align: center;">${end}</td>
                    <td style="border: 1px dotted #000; padding: 8px; text-align: center;">${totalDistance}</td>
                    <td style="border: 1px dotted #000; padding: 8px; text-align: center;">${fuelUsed}</td>
                    <td style="border: 1px dotted #000; padding: 8px; text-align: center;">${distancePerLiter}</td>
                      <td style="border: 1px dotted #000; padding: 8px; text-align: center;">${normalTravelKmPerLiter}</td>
                    <td style="border: 1px dotted #000; padding: 8px; text-align: center;">${totalLitersWithAllowance}</td>
                    <td style="border: 1px dotted #000; padding: 8px; text-align: center;">${excess}</td>
                    <td style="border: 1px dotted #000; padding: 8px; text-align: center;">${row.remarks || ''}</td>
                </tr>`;
            }).join('');
            const printableHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fuel Usage Summary</title><style>
                @media print {
                    @page { margin: 0; }
                    body { margin: 1.5cm; }
                }
                body { font-family: 'Times New Roman', serif; font-size: 10pt; margin: 12px; color: #000; }
                .header { text-align: center; margin-bottom: 8px; position: relative; }
                .header .appendix { position: absolute; right: 0; top: -12px; font-size: 10pt; font-weight: bold; }
                .header .org { font-size: 9pt; margin: 0; line-height: 1.1; }
                .header .title { font-size: 12pt; font-weight: bold; margin: 4px 0 2px; }
                table { width: 100%; border-collapse: collapse; font-size: 10pt; border: 1px solid #000; }
                th { border: 1px solid #000; text-align: center; padding: 6px; font-size: 10pt; }
                td { border: 1px dotted #000; padding: 8px; font-size: 10pt; }
                .footer { display: flex; justify-content: space-between; margin-top: 48px; font-size: 15px; }
                .footer-col { width: 45%; }
                .footer-label { font-weight: bold; margin-bottom: 8px; }
                .footer-section { margin-bottom: 16px; }
                .footer-value { text-align: center; border-bottom: 1px solid #888; padding-bottom: 4px; margin-bottom: 8px; }
            </style></head><body>
                <div class="header">
                    <div class="appendix">Appendix G</div>
                    <div class="org">Republic of the Philippines</div>
                    <div class="org">Department of Education</div>
                    <div class="org">Schools Division of Bukidnon</div>
                    <div class="title">REPORT OF FUEL CONSUMPTION FOR THE MONTH OF ${month}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th rowSpan="2" className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Type of Vehicle</th>
                            <th rowSpan="2" className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Plate Number</th>
                            <th rowSpan="2" className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Number of Cylinder</th>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">ODOMETER</th>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Reading</th>
                            <th rowSpan="2" className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Total Distance Travelled (A)</th>
                            <th rowSpan="2" className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Total Fuel Used (B)</th>
                            <th rowSpan="2" className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Distance Travelled Per Liter (C=A%B)</th>
                            <th rowSpan="2" className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Normal Travel Km. Per Liter (D)</th>
                            <th rowSpan="2" className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Total Liters Consumed Plus 10% Allowance (E=A%DX1.1)</th>
                            <th rowSpan="2" className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Excess</th>
                            <th rowSpan="2" className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Remarks</th>
                        </tr>
                        <tr>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Beginning</th>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Ending</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                <div class="footer">
                    <div class="footer-col">
                        <div class="footer-label">Prepared by:</div>
                        <div class="footer-section" style="display: flex; justify-content: center; align-items: center; gap: 12px; min-width: 240px;">
                            <div style="text-align: center;">Name:</div>
                            <div class="footer-value" style="flex: 1; text-align: center; max-width: 220px;">${preparedByName || ''}</div>
                        </div>
                        <div class="footer-section" style="display: flex; justify-content: center; align-items: center; gap: 12px; min-width: 240px;">
                            <div style="text-align: center;">Position:</div>
                            <div class="footer-value" style="flex: 1; text-align: center; max-width: 220px;">${preparedByPosition || ''}</div>
                        </div>
                    </div>
                    <div class="footer-col">
                        <div class="footer-label">Verified and Found Correct:</div>
                        <div class="footer-section" style="display: flex; justify-content: center; align-items: center; gap: 12px; min-width: 240px;">
                            <div style="text-align: center;">Name:</div>
                            <div class="footer-value" style="flex: 1; text-align: center; max-width: 220px;">${verifiedBy.name || ''}</div>
                        </div>
                        <div class="footer-section" style="display: flex; justify-content: center; align-items: center; gap: 12px; min-width: 240px;">
                            <div style="text-align: center;">Position:</div>
                            <div class="footer-value" style="flex: 1; text-align: center; max-width: 220px;">${verifiedBy.position || ''}</div>
                        </div>
                    </div>
                </div>
            </body></html>`;
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                setError('Please allow pop-ups to print or save as PDF.');
                return;
            }
            printWindow.document.write(printableHTML);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.onafterprint = () => printWindow.close();
            }, 300);
        } catch {
            setError('Failed to open print dialog.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Fuel Usage Summary', href: '/fuel-usage-summary' }]}> {/* Sidebar and layout */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
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
                            placeholder="Search by Vehicle Type"
                            className="pl-8 w-full"
                        />
                    </div>
                    <Button onClick={() => void handleGenerate()} disabled={loading}>
                        {loading ? 'Generating...' : 'Generate'}
                    </Button>
                </div>
                {error && (
                    <div className="mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                        {error}
                    </div>
                )}
                {gasSlipData.length > 0 && (
                    <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
                        <div className="flex items-center gap-2">
                            <Fuel className="w-4 h-4" />
                            <span>
                                <strong>Gas Slip Data Integrated:</strong> Odometer readings and fuel consumption data from {gasSlipData.length} gas slip(s) have been automatically merged into this report.
                            </span>
                        </div>
                    </div>
                )}
                <Card className="shadow-lg border border-border bg-background">
                    <CardContent className="pt-2">
                        <div className="text-foreground relative" style={{ textAlign: 'center', marginTop: '0px' }}>
                            <div className="absolute top-0 right-4 font-bold hidden sm:block text-sm">Appendix G</div>
                            <div className="pt-6">Republic of the Philippines</div>
                            <div>Department of Education</div>
                            <div>Schools Division of Bukidnon</div>
                            <div style={{ fontWeight: 'bold', margin: '16px 0 24px', fontSize: '18px' }}>
                                {(() => {
                                    let month = '';
                                    if (selectedDate) {
                                        const d = new Date(selectedDate);
                                        month = d.toLocaleString('en-US', { month: 'long' });
                                    } else if (reportInfo?.report_date) {
                                        // fallback to reportInfo if available
                                        month = reportInfo.report_date.split(' ')[0];
                                    }
                                    return `REPORT OF FUEL CONSUMPTION FOR THE MONTH OF ${month ? month.toUpperCase() : '________'}`;
                                })()}
                            </div>
                        </div>
                        <table className="border border-border" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginTop: '24px' }}>
                            <thead>
                                <tr>
                                    <th rowSpan={2} className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Type of Vehicle</th>
                                    <th rowSpan={2} className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Plate Number</th>
                                    <th rowSpan={2} className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Number of Cylinder</th>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>ODOMETER</th>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Reading</th>
                                    <th rowSpan={2} className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Total Distance Travelled (A)</th>
                                    <th rowSpan={2} className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Total Fuel Used (B)</th>
                                    <th rowSpan={2} className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Distance Travelled Per Liter (C=A%B)</th>
                                    <th rowSpan={2} className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Normal Travel Km. Per Liter (D)</th>
                                    <th rowSpan={2} className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Total Liters Consumed Plus 10% Allowance (E=A%DX1.1)</th>
                                    <th rowSpan={2} className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Excess</th>
                                    <th rowSpan={2} className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Remarks</th>
                                </tr>
                                <tr>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Beginning</th>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Ending</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData && reportData.length > 0 ? (
                                    reportData.map((item, idx) => {
                                        const row = item;

                                        // Debug logging for each row
                                        console.log(`Row ${idx} data:`, {
                                            from_gas_slip: row.from_gas_slip,
                                            distance_start: row.distance_start,
                                            odometer_before: row.odometer_before,
                                            distance_end: row.distance_end,
                                            odometer_after: row.odometer_after,
                                            gas_slip_document_no: row.gas_slip_document_no
                                        });

                                        const start = getOdometerValue(row, 'start');
                                        const end = getOdometerValue(row, 'end');
                                        const totalDistanceNumber =
                                            typeof start === 'number' && !Number.isNaN(start) &&
                                                typeof end === 'number' && !Number.isNaN(end)
                                                ? end - start
                                                : null;

                                        const fuelUsedSource = row.total_fuel_used ?? row.total_liters ?? row.oil_used ?? 0;
                                        const fuelUsedNumber = typeof fuelUsedSource === 'number' ? fuelUsedSource : Number(fuelUsedSource) || 0;

                                        const normalTravelKmPerLiter = 6; // D – assumed standard value

                                        const distancePerLiter = totalDistanceNumber !== null
                                            ? (fuelUsedNumber > 0 ? totalDistanceNumber / fuelUsedNumber : 0)
                                            : null;

                                        const totalLitersWithAllowance = totalDistanceNumber !== null && normalTravelKmPerLiter > 0
                                            ? (totalDistanceNumber / normalTravelKmPerLiter) * 1.1
                                            : null;

                                        const excess = totalLitersWithAllowance !== null
                                            ? fuelUsedNumber - totalLitersWithAllowance
                                            : null;

                                        const firstRow = reportData[0] || {};
                                        const plateNo =
                                            row.plate_no ||
                                            reportInfo?.plate_no ||
                                            firstRow?.plate_no ||
                                            '';
                                        const numberOfCylinder =
                                            row.number_of_cylinder ||
                                            reportInfo?.number_of_cylinder ||
                                            firstRow?.number_of_cylinder ||
                                            firstRow?.number_of_cylinders ||
                                            '';
                                        const vehicleType =
                                            row.vehicle_type ||
                                            row.vehicle ||
                                            reportInfo?.vehicle_type ||
                                            search ||
                                            '';

                                        return (
                                            <tr key={idx}>
                                                <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{vehicleType}</td>
                                                <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{plateNo}</td>
                                                <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{numberOfCylinder}</td>
                                                <td className="text-foreground relative" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>
                                                    {start ?? ''}
                                                </td>
                                                <td className="text-foreground relative" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>
                                                    {end ?? ''}
                                                </td>
                                                <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{totalDistanceNumber !== null ? totalDistanceNumber : ''}</td>
                                                <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{fuelUsedNumber}</td>
                                                <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{distancePerLiter !== null ? distancePerLiter.toFixed(2) : ''}</td>
                                                <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{normalTravelKmPerLiter}</td>
                                                <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{totalLitersWithAllowance !== null ? totalLitersWithAllowance.toFixed(2) : ''}</td>
                                                <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{excess !== null ? excess.toFixed(2) : ''}</td>
                                                <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{item.remarks || ''}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    rows.map((r) => (
                                        <tr key={r}>
                                            {Array(12).fill(0).map((_, j) => (
                                                <td key={j} className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>&nbsp;</td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', fontSize: '15px' }}>
                            <div>
                                <div>Prepared by:</div>
                                <br />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', minWidth: '240px', gap: '12px' }}>
                                    <span style={{ textAlign: 'center' }}>Name:</span>
                                    <Input
                                        value={preparedByName}
                                        onChange={(e) => setPreparedByName(e.target.value)}
                                        className="h-8 border-0 border-b border-border rounded-none bg-transparent px-0 text-center text-[14px] shadow-none focus-visible:ring-0"
                                        style={{ flex: 1, textAlign: 'center', maxWidth: '220px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '240px', gap: '12px' }}>
                                    <span style={{ textAlign: 'center' }}>Position:</span>
                                    <Input
                                        value={preparedByPosition}
                                        onChange={(e) => setPreparedByPosition(e.target.value)}
                                        className="h-8 border-0 border-b border-border rounded-none bg-transparent px-0 text-center text-[14px] shadow-none focus-visible:ring-0"
                                        style={{ flex: 1, textAlign: 'center', maxWidth: '220px' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginLeft: '48px' }}>
                                <div>Verified and Found Correct:</div>
                                <br />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', minWidth: '240px', gap: '12px' }}>
                                    <span style={{ textAlign: 'center' }}>Name:</span>
                                    <Input
                                        value={verifiedBy.name}
                                        onChange={e => setVerifiedBy({ ...verifiedBy, name: e.target.value })}
                                        className="h-8 border-0 border-b border-border rounded-none bg-transparent px-0 text-center text-[14px] shadow-none focus-visible:ring-0"
                                        style={{ flex: 1, textAlign: 'center', maxWidth: '220px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '240px', gap: '12px' }}>
                                    <span style={{ textAlign: 'center' }}>Position:</span>
                                    <Input
                                        value={verifiedBy.position}
                                        onChange={e => setVerifiedBy({ ...verifiedBy, position: e.target.value })}
                                        className="h-8 border-0 border-b border-border rounded-none bg-transparent px-0 text-center text-[14px] shadow-none focus-visible:ring-0"
                                        style={{ flex: 1, textAlign: 'center', maxWidth: '220px' }}
                                    />
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>
                {showReview && reportData.length > 0 && (
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Review Fuel Usage Summary</CardTitle>
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
