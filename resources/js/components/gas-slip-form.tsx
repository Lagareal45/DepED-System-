import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

export function GasSlipForm() {
    const emptyForm = useMemo(
        () => ({
            documentNo: '',
            date: '',
            driver: '',
            numberOfCylinder: '',
            vehicleType: '',
            plateNo: '',
            purpose: '',
            dateOfTravelStart: '',
            dateOfTravelEnd: '',
            odometerBefore: '',
            odometerAfter: '',
            fuelType: 'Diesel',
            liters: '',
            amount: '',
            requestedByName: '',
            approvedByName: 'KATHLEEN ANN T. DUMAS',
            approvedByTitle: 'Administrative Officer V',
            acknowledgedByName: '',
        }),
        [],
    );

    const [formData, setFormData] = useState(emptyForm);
    const [loadingSlipNo, setLoadingSlipNo] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showReview, setShowReview] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const handleChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    // Helper to format date range for display
    const formatDateRange = (start: string, end: string) => {
        if (!start && !end) return '';
        if (start && !end) return new Date(start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        if (!start && end) return new Date(end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (startDate.getTime() === endDate.getTime()) {
            // Same day
            return startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        if (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth()) {
            // Same month/year: February 20 to 21, 2026
            const month = startDate.toLocaleDateString('en-US', { month: 'long' });
            const startDay = startDate.getDate();
            const endDay = endDate.getDate();
            const year = startDate.getFullYear();
            return `${month} ${startDay} to ${endDay}, ${year}`;
        }
        // Different month/year: Feb 28, 2026 to Mar 2, 2026
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} to ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    const getCookie = (name: string) => {
        const match = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`));
        return match ? match.split('=')[1] : undefined;
    };

    const fetchNextSlipNo = async () => {
        setLoadingSlipNo(true);
        try {
            const res = await fetch('/gas-slips/next-number', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed to load next Gas Slip No.');
            const data: { next: string } = await res.json();
            setFormData((prev) => ({ ...prev, documentNo: data.next }));
        } catch {
            setFormData((prev) => ({ ...prev, documentNo: prev.documentNo || '2026-02-19-001' }));
        } finally {
            setLoadingSlipNo(false);
        }
    };

    const calculateTotal = () => {
        return parseFloat(formData.amount) || 0;
    };

    const handleReset = async () => {
        setSubmitError(null);
        setFormData(emptyForm);
        await fetchNextSlipNo();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    useEffect(() => {
        const initializeForm = async () => {
            // Check for pre-filled data from trip ticket
            let docNo = '';
            let tripTicketDataStr = sessionStorage.getItem('lastTripTicketData');
            let usedTripTicketDocNo = false;
            if (tripTicketDataStr) {
                try {
                    const tripTicketData = JSON.parse(tripTicketDataStr);
                    if (tripTicketData.documentNo) {
                        docNo = tripTicketData.documentNo;
                        usedTripTicketDocNo = true;
                        setFormData((prev) => ({
                            ...prev,
                            documentNo: docNo,
                            driver: tripTicketData.driver || '',
                            plateNo: tripTicketData.plateNo || '',
                            purpose: tripTicketData.purpose || '',
                            date: tripTicketData.date || '',
                        }));
                        // Fetch the existing gas slip record to get any additional data
                        try {
                            const res = await fetch(`/gas-slips/${docNo}`, {
                                headers: { Accept: 'application/json' },
                                credentials: 'same-origin',
                            });
                            if (res.ok) {
                                const gasSlipData = await res.json();
                                setFormData((prev) => ({
                                    ...prev,
                                    documentNo: gasSlipData.document_no || prev.documentNo,
                                    driver: gasSlipData.driver || prev.driver,
                                    vehicleType: gasSlipData.vehicle_type || prev.vehicleType,
                                    plateNo: gasSlipData.plate_no || prev.plateNo,
                                    purpose: gasSlipData.purpose || prev.purpose,
                                    // removed old dateOfTravel
                                    odometerBefore: gasSlipData.odometer_before?.toString() || prev.odometerBefore,
                                    odometerAfter: gasSlipData.odometer_after?.toString() || prev.odometerAfter,
                                    fuelType: gasSlipData.fuel_type || prev.fuelType,
                                    liters: gasSlipData.liters?.toString() || prev.liters,
                                    amount: gasSlipData.amount?.toString() || prev.amount,
                                    date: gasSlipData.date || prev.date,
                                }));
                            }
                        } catch (fetchErr) {
                            // Gas slip might not exist yet, continue with pre-filled data
                        }
                    }
                    // Clear the session data so it's not reused
                    sessionStorage.removeItem('lastTripTicketData');
                } catch (e) {
                    // If parsing fails, ignore and fetch next number
                }
            }
            // If not found in sessionStorage, check query string
            if (!docNo) {
                const params = new URLSearchParams(window.location.search);
                const urlDocNo = params.get('documentNo');
                if (urlDocNo) {
                    docNo = urlDocNo;
                    usedTripTicketDocNo = true;
                    setFormData((prev) => ({ ...prev, documentNo: docNo }));
                    // Try to fetch existing gas slip data
                    try {
                        const res = await fetch(`/gas-slips/${docNo}`, {
                            headers: { Accept: 'application/json' },
                            credentials: 'same-origin',
                        });
                        if (res.ok) {
                            const gasSlipData = await res.json();
                            setFormData((prev) => ({
                                ...prev,
                                documentNo: gasSlipData.document_no || prev.documentNo,
                                driver: gasSlipData.driver || prev.driver,
                                vehicleType: gasSlipData.vehicle_type || prev.vehicleType,
                                plateNo: gasSlipData.plate_no || prev.plateNo,
                                purpose: gasSlipData.purpose || prev.purpose,
                                // removed old dateOfTravel
                                odometerBefore: gasSlipData.odometer_before?.toString() || prev.odometerBefore,
                                odometerAfter: gasSlipData.odometer_after?.toString() || prev.odometerAfter,
                                fuelType: gasSlipData.fuel_type || prev.fuelType,
                                liters: gasSlipData.liters?.toString() || prev.liters,
                                amount: gasSlipData.amount?.toString() || prev.amount,
                                date: gasSlipData.date || prev.date,
                            }));
                        }
                    } catch (fetchErr) {}
                }
            }
            // If we did not use a trip ticket document number, fetch the next slip number
            if (!usedTripTicketDocNo) {
                await fetchNextSlipNo();
            }
        };
        initializeForm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submitToServer = async () => {
        setSubmitting(true);
        setSubmitError(null);
        try {
            const xsrf = getCookie('XSRF-TOKEN');
            const xsrfDecoded = xsrf ? decodeURIComponent(xsrf) : '';

            const payload = {
                document_no: formData.documentNo || null,
                date: formData.date || null,
                driver: formData.driver || null,
                vehicle_type: formData.vehicleType || null,
                plate_no: formData.plateNo || null,
                number_of_cylinder: formData.numberOfCylinder ? Number(formData.numberOfCylinder) : null,
                purpose: formData.purpose || null,
                date_of_travel_start: formData.dateOfTravelStart || null,
                date_of_travel_end: formData.dateOfTravelEnd || null,
                odometer_before: formData.odometerBefore ? Number(formData.odometerBefore) : null,
                odometer_after: formData.odometerAfter ? Number(formData.odometerAfter) : null,
                fuel_type: formData.fuelType || null,
                liters: formData.liters ? Number(formData.liters) : null,
                amount: formData.amount ? Number(formData.amount) : null,
            };

            const res = await fetch('/gas-slips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(xsrfDecoded ? { 'X-XSRF-TOKEN': xsrfDecoded } : {}),
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Failed to submit gas slip.');
            }

            setShowReview(false);
            await handleReset();
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to submit gas slip.');
        } finally {
            setSubmitting(false);
        }
    };

    const printOrSavePDF = () => {
        setDownloading(true);
        try {
            const html = generatePDFHTML();
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                setSubmitError('Please allow pop-ups to print or save as PDF.');
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
            setSubmitError('Failed to open print dialog.');
        } finally {
            setDownloading(false);
        }
    };

    const generatePDFHTML = () => {
        const copyTemplate = (title: string) => `
            <div style="width: 48%; display: inline-block; border: 2px solid #000; padding: 12px; vertical-align: top; position: relative;">
                <div style="text-align: center; font-size: 10pt; margin-bottom: 8px;">
                    <p style="margin: 0; font-weight: bold;">Department of Education</p>
                    <p style="margin: 0;">Region X</p>
                    <p style="margin: 0; font-weight: bold;">DIVISION OF BUKIDNON</p>
                    <p style="margin: 0;">Malaybalay City</p>
                    <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 12pt;">GAS SLIP</p>
                </div>

                <div style="font-size: 9pt; line-height: 1.3;">
                    <div><strong>Office:</strong> DepEd-SDO BUKIDNON</div>
                    <div><strong>Date:</strong> ${formData.date || '_____'}</div>
                    <div><strong>Gas Slip No.:</strong> ${formData.documentNo || '_____'}</div>
                    <div><strong>Vehicle Type:</strong> ${formData.vehicleType || '_____'}</div>
                    <div><strong>Plate No.:</strong> ${formData.plateNo || '_____'}</div>
                    <div><strong>Driver:</strong> ${formData.driver || '_____'} </div>
                    <div><strong>Number of Cylinder:</strong> ${formData.numberOfCylinder || '_____'} </div>
                    <div><strong>Purpose/Destination:</strong> ${formData.purpose || '_____'}</div>
                    <div><strong>Date of Travel:</strong> ${formatDateRange(formData.dateOfTravelStart, formData.dateOfTravelEnd) || '_____'} </div>
                    <div><strong>Odometer:</strong></div>
                    <div style="margin-left: 20px;">
                        Before: ${formData.odometerBefore || '_____'}  After: ${formData.odometerAfter || '_____'}
                    </div>
                    <div>
                        <strong>Fuel:</strong>
                        <span style="margin-left: 10px;">
                            ☐ Gasoline <span style="margin-left: 20px;">☐ Diesel</span>
                        </span>
                    </div>
                    <div><strong>Liters:</strong> ${formData.liters || '_____'}</div>
                    <div><strong>Amount:</strong> ₱${formData.amount || '_____'}</div>
                </div>

                <div style="margin-top: 12px; font-size: 9pt; text-align: left;">
                    <div><strong>Requested by:</strong></div>
                    <div style="height: 20px; border-bottom: 1px solid #000; margin: 2px 0; width: 100%;"></div>
                    <div style="font-size: 8pt; text-align: center;">Signature over Printed Name</div>
                </div>

                <div style="margin-top: 8px; font-size: 9pt;">
                    <div><strong>Approved by:</strong></div>
                    <div style="height: 20px; border-bottom: 1px solid #000; margin: 2px 0;"></div>
                    <div style="font-weight: bold; text-align: center;">${formData.approvedByName || '_____'}</div>
                    <div style="text-align: center;">${formData.approvedByTitle || '_____'}</div>
                </div>

                <div style="margin-top: 8px; font-size: 9pt; text-align: center;">
                    <div><strong>Acknowledged by:</strong></div>
                    <div style="height: 20px; border-bottom: 1px solid #000; margin: 2px 0;"></div>
                    <div style="font-size: 8pt; text-align: center; font-weight: bold;">ACI-R Gasoline Station In-charge</div>
                </div>

                <div style="position: absolute; right: 8px; bottom: 1px; font-size: 7pt; font-weight: bold;">
                    ${title}
                </div>
            </div>
        `;

        return `  
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Gas Slip ${formData.documentNo}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 11pt; margin: 12px; line-height: 1.2; color: #000; }
        .container { display: flex; justify-content: space-between; gap: 12px; }
        @media print { body { margin: 8px; } }
    </style>
</head>
<body>
    <div class="container">
        ${copyTemplate('Division Copy')}
        ${copyTemplate('Gas Station Copy')}
    </div>
</body>
</html>
        `;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Banner - Pre-filled from Trip Ticket */}
            {formData.driver && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Note:</strong> This form has been pre-filled with data from your Trip Ticket ({formData.documentNo}). 
                        You can modify any field as needed.
                    </p>
                </div>
            )}

            {/* Header Section */}
            <Card>
                <CardHeader>
                    <div className="text-center space-y-2">
                        <div className="text-sm text-muted-foreground">
                            Department of Education
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Region X
                        </div>
                        <div className="text-sm text-muted-foreground">
                            DIVISION OF BUKIDNON
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Malaybalay City
                        </div>
                        <CardTitle className="text-xl font-bold">GAS SLIP</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="documentNo" className="text-sm">Gas Slip No.:</Label>
                            <Input
                                id="documentNo"
                                value={formData.documentNo}
                                readOnly
                                placeholder={loadingSlipNo ? 'Loading…' : 'Auto-generated'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-sm">Date:</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Vehicle and Travel Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Vehicle & Travel Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="vehicleType">Vehicle Type</Label>
                        <Input
                            id="vehicleType"
                            value={formData.vehicleType}
                            onChange={(e) => handleChange('vehicleType', e.target.value)}
                            placeholder="e.g., STRADA PICK-UP"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="plateNo">Plate No.</Label>
                        <Input
                            id="plateNo"
                            value={formData.plateNo}
                            onChange={(e) => handleChange('plateNo', e.target.value)}
                            placeholder="Enter plate number"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="driver">Driver</Label>
                        <Input
                            id="driver"
                            value={formData.driver}
                            onChange={(e) => handleChange('driver', e.target.value)}
                            placeholder="Enter driver name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="numberOfCylinder">Number of Cylinder</Label>
                        <Input
                            id="numberOfCylinder"
                            value={formData.numberOfCylinder}
                            onChange={(e) => handleChange('numberOfCylinder', e.target.value)}
                            placeholder="Enter number of cylinder"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Date of Travel (Range)</Label>
                        <div className="flex gap-2">
                            <Input
                                id="dateOfTravelStart"
                                type="date"
                                value={formData.dateOfTravelStart}
                                onChange={(e) => handleChange('dateOfTravelStart', e.target.value)}
                                required
                            />
                            <span className="self-center">to</span>
                            <Input
                                id="dateOfTravelEnd"
                                type="date"
                                value={formData.dateOfTravelEnd}
                                onChange={(e) => handleChange('dateOfTravelEnd', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="purpose">Purpose/Destination</Label>
                        <Input
                            id="purpose"
                            value={formData.purpose}
                            onChange={(e) => handleChange('purpose', e.target.value)}
                            placeholder="Enter purpose and destination"
                            required
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Odometer Reading */}
            <Card>
                <CardHeader>
                    <CardTitle>Odometer Reading</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="odometerBefore">Before</Label>
                        <Input
                            id="odometerBefore"
                            type="number"
                            value={formData.odometerBefore}
                            onChange={(e) => handleChange('odometerBefore', e.target.value)}
                            placeholder="Enter odometer reading"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="odometerAfter">After</Label>
                        <Input
                            id="odometerAfter"
                            type="number"
                            value={formData.odometerAfter}
                            onChange={(e) => handleChange('odometerAfter', e.target.value)}
                            placeholder="Enter odometer reading"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Fuel Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Fuel Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fuelType">Fuel Type</Label>
                        <select
                            id="fuelType"
                            value={formData.fuelType}
                            onChange={(e) => handleChange('fuelType', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-md"
                            required
                        >
                            <option value="Gasoline">Gasoline</option>
                            <option value="Diesel">Diesel</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="liters">Liters</Label>
                            <Input
                                id="liters"
                                type="number"
                                step="0.01"
                                value={formData.liters}
                                onChange={(e) => handleChange('liters', e.target.value)}
                                placeholder="Enter liters"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₱)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => handleChange('amount', e.target.value)}
                                placeholder="Enter amount"
                                required
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Approval Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Signatures</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="approvedByName">Approved By (Name)</Label>
                            <Input
                                id="approvedByName"
                                value={formData.approvedByName}
                                onChange={(e) => handleChange('approvedByName', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="approvedByTitle">Title/Position</Label>
                            <Input
                                id="approvedByTitle"
                                value={formData.approvedByTitle}
                                onChange={(e) => handleChange('approvedByTitle', e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={handleReset} disabled={submitting}>
                    Reset
                </Button>
                <Button type="button" onClick={() => setShowReview(true)} disabled={submitting || loadingSlipNo}>
                    Review
                </Button>
            </div>

            {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
            )}

            {/* Review Modal */}
            {showReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle>Review Gas Slip</CardTitle>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowReview(false)}
                                disabled={submitting || downloading}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-semibold">Gas Slip No.</p>
                                        <p className="text-muted-foreground">{formData.documentNo}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Date</p>
                                        <p className="text-muted-foreground">{formData.date}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Driver</p>
                                        <p className="text-muted-foreground">{formData.driver}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Vehicle Type</p>
                                        <p className="text-muted-foreground">{formData.vehicleType}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Fuel Type</p>
                                        <p className="text-muted-foreground">{formData.fuelType}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Amount</p>
                                        <p className="text-muted-foreground">₱{formData.amount}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-end border-t pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowReview(false)}
                                    disabled={submitting || downloading}
                                >
                                    Edit
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={printOrSavePDF}
                                    disabled={submitting || downloading}
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print / Save as PDF
                                </Button>
                                <Button
                                    type="button"
                                    onClick={submitToServer}
                                    disabled={submitting || downloading}
                                >
                                    {submitting ? 'Submitting…' : 'Submit'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </form>
    );
}
