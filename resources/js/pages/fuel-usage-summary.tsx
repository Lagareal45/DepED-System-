import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Printer, Fuel } from 'lucide-react';
import { gasSlipService } from '@/services/gas-slip-service';

interface ReportRow {
    day: number | null;
    date: string;
    // Odometer / distance fields (from gas slip / aggregation)
    distance_start?: string | number;
    distance_end?: string | number;
    odometer_before?: string | number;
    odometer_after?: string | number;
    // Trip ticket specific fields
    speed_at_beginning?: string | number;
    speed_at_end?: string | number;
    // Fuel / oil usage
    oil_used?: number;
    grease_used?: string | number;
    remarks?: string;
    // Vehicle info that might be present per row
    plate_no?: string;
    number_of_cylinder?: string | number;
    vehicle_type?: string;
    vehicle?: string;
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
    const [preparedByName, setPreparedByName] = useState('Jane Rose S. Payot');
    const [preparedByPosition, setPreparedByPosition] = useState('Administrative Assistant III');
    const [preparedBy, setPreparedBy] = useState({ name: 'Jane Rose S. Payot', position: 'Administrative Assistant III' });
    const [verifiedBy, setVerifiedBy] = useState({ name: 'KATHLEEN ANN T. DUMAS', position: 'Administrative Officer V' });
    const [gasSlipData, setGasSlipData] = useState<any[]>([]);

    const getCookie = (name: string) => {
        const match = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`));
        return match ? match.split('=')[1] : undefined;
    };

    // Fetch gas slip data for selected period
    const fetchGasSlipData = async (date: string, vehicleType?: string) => {
        try {
            const selectedDate = new Date(date);
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth() + 1;
            
            console.log('Fetching gas slips for:', { year, month, vehicleType });
            const gasSlips = await gasSlipService.getMonthlyGasSlips(year, month, vehicleType);
            console.log('Received gas slips:', gasSlips);
            
            // Test: Check if any gas slip has odometer_before = 1400
            const test1400 = gasSlips.find(slip => slip.odometer_before === 1400);
            console.log('🔍 TEST: Found gas slip with odometer_before = 1400?', test1400);
            
            // Test: Check all odometer_before values
            const allOdometerValues = gasSlips.map(slip => ({
                document_no: slip.document_no,
                date: slip.date,
                vehicle_type: slip.vehicle_type,
                odometer_before: slip.odometer_before
            }));
            console.log('🔍 TEST: All odometer_before values:', allOdometerValues);
            
            setGasSlipData(gasSlips);
            return gasSlips;
        } catch (error) {
            console.error('Error fetching gas slip data:', error);
            return [];
        }
    };

    // Merge trip ticket data with gas slip odometer readings
    const mergeDataWithGasSlips = (tripTicketData: ReportRow[], gasSlips: any[]) => {
        console.log('=== MERGE DEBUG START ===');
        console.log('Trip ticket data:', JSON.stringify(tripTicketData, null, 2));
        console.log('Gas slips found:', JSON.stringify(gasSlips, null, 2));
        console.log('Merging data:', { tripTicketData: tripTicketData.length, gasSlips: gasSlips.length });
        
        return tripTicketData.map((row, rowIndex) => {
            console.log(`\n--- Processing Row ${rowIndex} ---`);
            console.log('Row data:', JSON.stringify(row, null, 2));
            
            // Find matching gas slip by vehicle type and date
            const matchingGasSlip = gasSlips.find(gasSlip => {
                const gasSlipDate = new Date(gasSlip.date).toDateString();
                const rowDate = new Date(row.date).toDateString();
                const matches = gasSlipDate === rowDate && 
                       (gasSlip.vehicle_type === row.vehicle_type || 
                        gasSlip.vehicle_type === row.vehicle ||
                        gasSlip.plate_no === row.plate_no);
                
                console.log('Matching check:', {
                    gasSlipDate,
                    rowDate,
                    dateMatch: gasSlipDate === rowDate,
                    gasSlipVehicle: gasSlip.vehicle_type,
                    rowVehicle: row.vehicle_type,
                    gasSlipPlate: gasSlip.plate_no,
                    rowPlate: row.plate_no,
                    vehicleMatch: gasSlip.vehicle_type === row.vehicle_type || gasSlip.vehicle_type === row.vehicle,
                    plateMatch: gasSlip.plate_no === row.plate_no,
                    finalMatch: matches
                });
                
                if (matches) {
                    console.log('✅ FOUND MATCHING GAS SLIP:', {
                        document_no: gasSlip.document_no,
                        odometer_before: gasSlip.odometer_before,
                        odometer_after: gasSlip.odometer_after,
                        date: gasSlip.date
                    });
                }
                
                return matches;
            });

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

    // Direct override function to ensure gas slip data takes priority
    const getOdometerValue = (row: any, type: 'start' | 'end') => {
        // If row has gas slip data, use it - this directly maps Gas Slip "Odometer Before" to "ODOMETER Beginning"
        if (row.from_gas_slip) {
            console.log(`🔥 USING GAS SLIP DATA for ${type}:`, {
                from_gas_slip: row.from_gas_slip,
                distance_start: row.distance_start, // This comes from gas_slip.odometer_before
                distance_end: row.distance_end,     // This comes from gas_slip.odometer_after
                gas_slip_document_no: row.gas_slip_document_no,
                message: `Gas Slip "Odometer Before" (${row.distance_start}) -> "ODOMETER Beginning"`
            });
            return type === 'start' ? row.distance_start : row.distance_end;
        }
        
        // Otherwise, use trip ticket data - check all possible field names
        const fallback = type === 'start' 
            ? (row.distance_start ?? row.odometer_before ?? row.speed_at_beginning)
            : (row.distance_end ?? row.odometer_after ?? row.speed_at_end);
            
        console.log(`📋 USING TRIP TICKET DATA for ${type}:`, {
            from_gas_slip: row.from_gas_slip,
            distance_start: row.distance_start,
            odometer_before: row.odometer_before,
            speed_at_beginning: row.speed_at_beginning,
            fallback,
            allFields: {
                distance_start: row.distance_start,
                odometer_before: row.odometer_before,
                speed_at_beginning: row.speed_at_beginning,
                distance_end: row.distance_end,
                odometer_after: row.odometer_after,
                speed_at_end: row.speed_at_end
            }
        });
        
        return fallback;
    };

    // Check if a row's odometer data comes from gas slip
    const isFromGasSlip = (row: any) => {
        return row.from_gas_slip || 
               gasSlipData.some(gasSlip => {
                   const gasSlipDate = new Date(gasSlip.date).toDateString();
                   const rowDate = new Date(row.date).toDateString();
                   return gasSlipDate === rowDate && 
                          (gasSlip.vehicle_type === row.vehicle_type || 
                           gasSlip.vehicle_type === row.vehicle ||
                           gasSlip.plate_no === row.plate_no);
               });
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
            const tableRows = reportData.map((row, idx) => {
                const startRaw = row.distance_start ?? row.odometer_before;
                const endRaw = row.distance_end ?? row.odometer_after;
                const start = startRaw !== null && startRaw !== undefined ? Number(startRaw) : '';
                const end = endRaw !== null && endRaw !== undefined ? Number(endRaw) : '';
                const totalDistance = (typeof start === 'number' && typeof end === 'number') ? start - end : '';
                const fuelUsed = row.oil_used ?? '';
                const normalTravelKmPerLiter = 12;
                const distancePerLiter = (totalDistance && fuelUsed) ? (Number(totalDistance) / Number(fuelUsed)).toFixed(2) : '';
                const totalLitersWithAllowance = (totalDistance && normalTravelKmPerLiter) ? ((Number(totalDistance) / normalTravelKmPerLiter) * 1.1).toFixed(2) : '';
                const excess = (fuelUsed && totalLitersWithAllowance) ? (Number(fuelUsed) - Number(totalLitersWithAllowance)).toFixed(2) : '';
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
                body { font-family: 'Times New Roman', serif; font-size: 10pt; margin: 12px; color: #000; }
                .header { text-align: center; margin-bottom: 8px; }
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
                    <div class="org">Republic of the Philippines</div>
                    <div class="org">Department of Education</div>
                    <div class="org">Schools Division of Bukidnon</div>
                    <div class="title">REPORT OF FUEL CONSUMPTION FOR THE MONTH OF ${month}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Type of Vehicle</th>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Plate Number</th>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Number of Cylinder</th>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">ODOMETER Beginning</th>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Reading Ending</th>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Total Distance Travelled (A)</th>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Total Fuel Used (B)</th>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Distance Travelled Per Liter (C=A%B)</th>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Normal Travel Km. Per Liter (D)</th>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Total Liters Consumed Plus 10% Allowance (E=A%DX1.1)</th>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Excess</th>
                            <th className="border border-border text-foreground" style="text-align: center; padding: 6px; width: 10%; font-size: 10pt;">Remarks</th>
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
        } catch (err) {
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
                                <Fuel className="w-3 h-3 inline ml-1" /> icons indicate data sourced from gas slips.
                            </span>
                        </div>
                    </div>
                )}
                <Card className="shadow-lg border border-border bg-background">
                    <CardHeader>
                        <CardTitle>Appendix G - Fuel Usage Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-foreground" style={{ textAlign: 'center', marginTop: '8px' }}>
                            <div>Republic of the Philippines</div>
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
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Type of Vehicle</th>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Plate Number</th>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Number of Cylinder</th>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>ODOMETER Beginning</th>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Reading Ending</th>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Total Distance Travelled (A)</th>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Total Fuel Used (B)</th>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Distance Travelled Per Liter (C=A%B)</th>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Normal Travel Km. Per Liter (D)</th>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Total Liters Consumed Plus 10% Allowance (E=A%DX1.1)</th>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Excess</th>
                                    <th className="border border-border text-foreground" style={{ textAlign: 'center', padding: '6px', width: '10%', fontSize: '10pt' }}>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData && reportData.length > 0 ? (
                                    reportData.map((item, idx) => {
                                        const row = item as any;
                                        
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
                                                ? start - end
                                                : null;

                                        const fuelUsedSource = row.total_fuel_used ?? row.total_liters ?? row.oil_used;
                                        const fuelUsedNumber =
                                            typeof fuelUsedSource === 'number'
                                                ? fuelUsedSource
                                                : Number(fuelUsedSource);

                                        const hasFuelUsed = !Number.isNaN(fuelUsedNumber) && fuelUsedNumber > 0;
                                        const normalTravelKmPerLiter = 12; // D – assumed standard value

                                        const distancePerLiter =
                                            totalDistanceNumber !== null && hasFuelUsed && fuelUsedNumber !== 0
                                                ? totalDistanceNumber / fuelUsedNumber
                                                : null;

                                        const totalLitersWithAllowance =
                                            totalDistanceNumber !== null && normalTravelKmPerLiter > 0
                                                ? (totalDistanceNumber / normalTravelKmPerLiter) * 1.1
                                                : null;

                                        const excess =
                                            hasFuelUsed && totalLitersWithAllowance !== null
                                                ? fuelUsedNumber - totalLitersWithAllowance
                                                : null;

                                        const firstRow = reportData[0] as any;
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
                                                    {isFromGasSlip(row) && (
                                                        <div className="absolute top-1 right-1" title={`ODOMETER Beginning from Gas Slip #${row.gas_slip_document_no || 'N/A'} (Odometer Before field)`}>
                                                            <Fuel className="w-3 h-3 text-blue-500" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="text-foreground relative" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>
                                                    {end ?? ''}
                                                    {isFromGasSlip(row) && (
                                                        <div className="absolute top-1 right-1" title={`Reading Ending from Gas Slip #${row.gas_slip_document_no || 'N/A'} (Odometer After field)`}>
                                                            <Fuel className="w-3 h-3 text-blue-500" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{totalDistanceNumber !== null ? totalDistanceNumber : ''}</td>
                                                <td className="text-foreground" style={{ border: '1px dotted', borderColor: 'var(--border)', padding: '8px', fontSize: '10pt', textAlign: 'center' }}>{hasFuelUsed ? fuelUsedNumber.toFixed(2) : ''}</td>
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
