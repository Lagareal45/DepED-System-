import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X, Printer } from 'lucide-react';

interface Destination {
    id: string;
    value: string;
}

export function TripTicketForm() {
    const emptyForm = useMemo(
        () => ({
            documentNo: '',
            date: '',
            driver: '',
            vehicle: '',
            plateNo: '',
            authorizedPassengers: '',
            destinations: [{ id: '1', value: '' }] as Destination[],
            purpose: '',
            departureTime: '',
            arrivalAtPlace: '',
            departureFromPlace: '',
            arrivalBackTime: '',
            distanceTravelled: '',
            gasolineBalanceInTank: '',
            totalGasoline: '',
            gasolineIssued: '',
            gasolinePurchased: '',
            gasolineDeducted: '',
            gearOilUsed: '',
            lubricantsUsed: '',
            greasedOilUsed: '',
            speed: '',
            speedAtBeginning: '',
            speedDistanceTravelled: '',
            speedAtEnd: '',
            remarks: '',
            driverSignature: '',
            passengerSignatures: '',
            authorizedByName: 'VICTORIA V. GAZO',
            authorizedByTitle: 'Schools Division Superintendent',
            gasolineTotalLitres: '', // Added manually fillable total field
            gasolineFinalBalance: '', // Added manually fillable balance field
        }),
        [],
    );

    const [formData, setFormData] = useState(emptyForm);
    const [loadingTicketNo, setLoadingTicketNo] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showReview, setShowReview] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submittedDocumentNo, setSubmittedDocumentNo] = useState<string | null>(null);

    const addDestination = () => {
        setFormData({
            ...formData,
            destinations: [...formData.destinations, { id: Date.now().toString(), value: '' }],
        });
    };

    const removeDestination = (id: string) => {
        if (formData.destinations.length > 1) {
            setFormData({
                ...formData,
                destinations: formData.destinations.filter((dest) => dest.id !== id),
            });
        }
    };

    const updateDestination = (id: string, value: string) => {
        setFormData({
            ...formData,
            destinations: formData.destinations.map((dest) =>
                dest.id === id ? { ...dest, value } : dest
            ),
        });
    };

    const handleChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const getCookie = (name: string) => {
        const match = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`));
        return match ? match.split('=')[1] : undefined;
    };

    const fetchNextTicketNo = async () => {
        setLoadingTicketNo(true);
        try {
            const res = await fetch('/trip-tickets/next-number', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed to load next Trip Ticket No.');
            const data: { next: string } = await res.json();
            setFormData((prev) => ({ ...prev, documentNo: data.next }));
        } catch {
            setFormData((prev) => ({ ...prev, documentNo: prev.documentNo || '2026-02-19-001' }));
        } finally {
            setLoadingTicketNo(false);
        }
    };

    const calculateGasolineTotal = () => {
        const balanceInTank = parseFloat(formData.gasolineBalanceInTank) || 0;
        const issued = parseFloat(formData.gasolineIssued) || 0;
        const purchased = parseFloat(formData.gasolinePurchased) || 0;
        return balanceInTank + issued + purchased;
    };

    const calculateGasolineBalance = () => {
        const total = calculateGasolineTotal();
        const deducted = parseFloat(formData.gasolineDeducted) || 0;
        return total - deducted;
    };

    const calculateGasolineDeducted = () => {
        const a = parseFloat(formData.gasolineBalanceInTank) || 0;
        const c = parseFloat(formData.gasolinePurchased) || 0;
        const f = parseFloat(formData.gasolineFinalBalance) || 0;
        // Formula: a + c - f = e
        const e = a + c - f;
        return Math.max(0, e); // Return 0 if negative
    };

    const handleReset = async () => {
        setSubmitError(null);
        setFormData(emptyForm);
        await fetchNextTicketNo();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    useEffect(() => {
        fetchNextTicketNo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submitToServer = async () => {
        setSubmitting(true);
        setSubmitError(null);
        try {
            const xsrf = getCookie('XSRF-TOKEN');
            const xsrfDecoded = xsrf ? decodeURIComponent(xsrf) : '';

            // Using manually entered values but falling back to formulas if they are empty
            const totalGasoline = formData.gasolineTotalLitres ? Number(formData.gasolineTotalLitres) : null;
            const finalBalance = formData.gasolineFinalBalance ? Number(formData.gasolineFinalBalance) : null;

            const payload = {
                document_no: formData.documentNo || null,
                date: formData.date || null,
                driver: formData.driver || null,
                vehicle: formData.vehicle || null,
                plate_no: formData.plateNo || null,
                authorized_passengers: formData.authorizedPassengers || null,
                destinations: formData.destinations.map((d) => d.value).filter(Boolean),
                purpose: formData.purpose || null,

                departure_time: formData.departureTime || null,
                arrival_at_place: formData.arrivalAtPlace || null,
                departure_from_place: formData.departureFromPlace || null,
                arrival_back_time: formData.arrivalBackTime || null,
                distance_travelled: formData.distanceTravelled ? Number(formData.distanceTravelled) : null,

                gasoline_balance_in_tank: formData.gasolineBalanceInTank ? Number(formData.gasolineBalanceInTank) : null,
                gasoline_issued: formData.gasolineIssued ? Number(formData.gasolineIssued) : null,
                gasoline_purchased: formData.gasolinePurchased ? Number(formData.gasolinePurchased) : null,
                gasoline_deducted: calculateGasolineDeducted() > 0 ? calculateGasolineDeducted() : null,

                gear_oil_used: formData.gearOilUsed ? Number(formData.gearOilUsed) : null,
                lubricants_used: formData.lubricantsUsed ? Number(formData.lubricantsUsed) : null,
                greased_oil_used: formData.greasedOilUsed ? Number(formData.greasedOilUsed) : null,

                speed: formData.speed ? Number(formData.speed) : null,

                speed_at_beginning: formData.speedAtBeginning ? Number(formData.speedAtBeginning) : null,
                speed_distance_travelled: formData.speedDistanceTravelled ? Number(formData.speedDistanceTravelled) : null,
                speed_at_end: formData.speedAtEnd ? Number(formData.speedAtEnd) : null,

                remarks: formData.remarks || null,
                driver_signature: formData.driverSignature || null,
                passenger_signatures: formData.passengerSignatures || null,
            };

            const res = await fetch('/trip-tickets', {
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
                throw new Error(text || 'Failed to submit trip ticket.');
            }

            const responseData = await res.json();
            const documentNo = responseData.document_no;

            setShowReview(false);
            setSubmitSuccess(true);
            setSubmittedDocumentNo(documentNo);

            // Store trip ticket data in sessionStorage for gas slip pre-fill
            sessionStorage.setItem(
                'lastTripTicketData',
                JSON.stringify({
                    documentNo,
                    driver: formData.driver,
                    vehicle: formData.vehicle,
                    plateNo: formData.plateNo,
                    purpose: formData.purpose,
                    date: formData.date,
                    speedAtBeginning: formData.speedAtBeginning,
                    speedAtEnd: formData.speedAtEnd,
                })
            );

            // Redirect to gas slips page with documentNo as query param after 2 seconds
            setTimeout(() => {
                router.visit(`/gas-slips?documentNo=${encodeURIComponent(documentNo)}`);
            }, 2000);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to submit trip ticket.');
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
            // Wait for content to render before opening print dialog
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
        const destText = formData.destinations.map((d) => d.value).filter(Boolean).join(', ') || '';
        const formatTime = (t: string) => {
            if (!t) return '';
            const [h, m] = t.split(':');
            const hour = parseInt(h, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${m} ${ampm}`;
        };
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Driver's Trip Ticket ${formData.documentNo}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 10pt; margin: 12px; line-height: 1.2; color: #000; }
        .form-page { max-width: 21cm; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 8px; }
        .header .org { font-size: 9pt; margin: 0; line-height: 1.1; }
        .header .title { font-size: 12pt; font-weight: bold; margin: 4px 0 2px; letter-spacing: 0.5px; }
        .header-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; }
        .header-row .title-wrap { flex: 1; }
        .header-row .title-center { flex: 1; text-align: center; }
        .header-row .trip-no-wrap { flex: 1; text-align: right; }
        .instruction { margin-bottom: 8px; font-size: 9pt; }
        .instruction strong { display: block; margin-bottom: 2px; }
        .instruction ol { margin: 0; padding-left: 18px; }
        .instruction li { margin: 1px 0; }
        .trip-block { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
        .trip-block-top { display: flex; flex-direction: column; gap: 4px; }
        .trip-block-top .field-row { display: flex; gap: 12px; }
        .trip-block-top .field-row .field { flex: 1; }
        .trip-block-top .field-row:has(.field:only-child) { max-width: calc((100% - 12px) / 2); }
        .trip-block-bottom { display: grid; gap: 12px; position: relative; align-items: start; }
        .trip-block-bottom-left { grid-column: 1; grid-row: 1; width: 100%; }
        .trip-block-bottom-right { grid-column: 1; grid-row: 1; align-self: end; justify-self: end; width: auto; margin-top: 0; margin-right: 0; padding-top: 50px; }
        .auth-block { text-align: center; font-size: 9pt; margin-top: 0px; }
        .auth-block .label { margin-bottom: 16px; font-weight: bold; }
        .auth-block .line { border-bottom: 1px solid #000; width: 100%; height: 14px; margin-bottom: 2px; }
        .auth-block .name { font-weight: bold; font-size: 9pt; }
        .field { display: flex; align-items: baseline; margin-bottom: 4px; min-width: 0; font-size: 9pt; }
        .field .label { flex-shrink: 0; margin-right: 6px; font-weight: bold; }
        .field .value { flex: 1; min-width: 40px; border-bottom: 1px solid #000; padding: 0 2px 1px; text-align: justify; }
        .field.wide .value { min-width: 150px; }
        .multi-line-field { display: flex; margin-bottom: 4px; font-size: 9pt; }
        .multi-line-field .label { flex-shrink: 0; margin-right: 6px; font-weight: bold; align-self: flex-start; padding-top: 1px; }
        .multi-line-field .value-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .multi-line-field .value-line { border-bottom: 1px solid #000; height: 12px; }
        .driver-log { margin-top: 8px; margin-bottom: 8px; font-size: 9pt; }
        .driver-log .section-label { font-weight: bold; margin-bottom: 4px; }
        .speed-lines { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
        .speed-lines .line-item { display: flex; gap: 6px; align-items: baseline; }
        .driver-log ol { margin: 0; padding-left: 18px; list-style: decimal; }
        .driver-log li { margin: 3px 0; line-height: 1.3; }
        .driver-log .sub { list-style: lower-alpha; padding-left: 18px; margin-top: 2px; }
        .driver-log .sub li { margin: 2px 0; }
        .driver-log .inline { display: inline; }
        .driver-log .value-inline { border-bottom: 1px solid #000; padding: 0 3px 0px; margin: 0 8px; min-width: 250px; display: inline-block; text-align: center; font-size: 10pt; color: #000080; font-family: 'Times New Roman', serif; font-style: italic; }
        .pdf-input { border: none; border-bottom: 1px solid #000; padding: 0 3px; margin: 0 8px; min-width: 250px; font-size: 10pt; background: transparent; text-align: center; color: #000080; font-family: 'Times New Roman', serif; font-style: italic; outline: none; }
        .remarks-box { min-height: 15px; padding: 2px 4px; margin: 2px 0; text-align: justify; font-size: 9pt; }
        .cert { margin: 8px 0; font-size: 9pt; }
        .cert .statement { margin-bottom: 4px; }
        .cert .sig-wrap { display: inline-block; text-align: center; margin-top: 2px; }
        .cert .sig-line { border-bottom: 1px solid #000; min-width: 180px; padding: 0 4px; height: 14px; margin-bottom: 1px; white-space: nowrap; text-align: center; color: #000; }
        .cert .sig-label { font-size: 9pt; margin-top: 2px; }
        .note { font-size: 9pt; color: #333; margin-top: 6px; }
        @page { margin: 0; }
        @media print { body { margin: 10mm; } }
    </style>
</head>
<body>
    <div class="form-page">
        <div class="header">
            <p class="org">Department of Education</p>
            <p class="org">Region X</p>
            <p class="org">DIVISION OF BUKIDNON</p>
            <p class="org">Malaybalay City</p>
            <div class="header-row">
                <div class="title-wrap"></div>
                <div class="title-center"><h1 class="title">DRIVER'S TRIP TICKET</h1></div>
                <div class="trip-no-wrap"><span class="trip-no"></span></div>
            </div>
        </div>

        <div class="instruction">
            <strong>Instruction:</strong>
            <ol>
                <li>Fill in Triplicate</li>
                <li>One (1) copy - for liquidation of the Petty Cash Advance at the Cashier</li>
                <li>Two (2) copies - for the Driver upon completion of the Travel</li>
            </ol>
        </div>

        <div class="trip-block">
            <div class="trip-block-top">
                <div class="field-row">
                    <div class="field"><span class="label">Date:</span><span class="value">${formData.date || ''}</span></div>
                </div>
                <div class="field-row">
                    <div class="field"><span class="label">Driver:</span><span class="value">${formData.driver || ''}</span></div>
                </div>
                <div class="field-row">
                    <div class="field"><span class="label">Vehicle:</span><span class="value">${formData.vehicle || ''}</span></div>
                    <div class="field"><span class="label">Plate No.</span><span class="value">${formData.plateNo || ''}</span></div>
                </div>
                <div class="multi-line-field" style="width:100%;"><span class="label">Authorized Passengers:</span><div class="value-lines"><div class="value-line">${formData.authorizedPassengers || ''}</div><div class="value-line"></div></div></div>
                <div class="field" style="width:100%;"><span class="label">Destination:</span><span class="value">${destText}</span></div>
            </div>
            <div class="trip-block-bottom">
                <div class="trip-block-bottom-left">
                    <div class="multi-line-field" style="width:100%;"><span class="label">Purpose:</span><div class="value-lines"><div class="value-line">${formData.purpose || ''}</div><div class="value-line"></div></div></div>
                </div>
                <div class="trip-block-bottom-right">
                    <div class="auth-block">
                        <div class="label">Authorized by:</div>
                        <div class="line"></div>
                        <div class="name">${formData.authorizedByName || ''}</div>
                        <div style="font-size: 8pt;">${formData.authorizedByTitle || ''}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="driver-log">
            <div class="section-label">To be filled by the Driver</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10pt; line-height: 1.5; margin-left: 10px;">
                <tr>
                    <td style="width: 25px; vertical-align: bottom;">1.</td>
                    <td style="vertical-align: bottom;">Time for departure from the office/garage:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; width: 35%; vertical-align: bottom; height: 18px;">
                        <span style="color: #000080; font-family: 'Times New Roman', serif; font-style: italic;">${formatTime(formData.departureTime)}</span>
                    </td>
                    <td style="width: 80px; padding-left: 5px; vertical-align: bottom;"></td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">2.</td>
                    <td style="vertical-align: bottom;">Time of arrival at place visited:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000080; font-family: 'Times New Roman', serif; font-style: italic;">${formData.arrivalAtPlace ? formatTime(formData.arrivalAtPlace) : ''}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;"></td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">3.</td>
                    <td style="vertical-align: bottom;">Time of departure from No. 2 above:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000080; font-family: 'Times New Roman', serif; font-style: italic;">${formData.departureFromPlace ? formatTime(formData.departureFromPlace) : ''}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;"></td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">4.</td>
                    <td style="vertical-align: bottom;">Time of arrival back to office/garage:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000080; font-family: 'Times New Roman', serif; font-style: italic;">${formData.arrivalBackTime ? formatTime(formData.arrivalBackTime) : ''}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;"></td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">5.</td>
                    <td style="vertical-align: bottom;">Approximate distance travelled (to and fro):</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000080; font-family: 'Times New Roman', serif; font-style: italic;">${formData.distanceTravelled || ''}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;"></td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">6.</td>
                    <td style="vertical-align: bottom;">Gasoline issued/purchased (Liters):</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <input id="totalGasoline" value="${formData.totalGasoline || ''}" style="width: 100%; border: none; background: transparent; text-align: center; color: #000080; font-family: 'Times New Roman', serif; font-style: italic; font-size: 10pt; outline: none;" />
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;"></td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;"><span style="display:inline-block; width:15px;">a.</span>Balance in tank</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <input id="gasolineBalanceInTank" value="${formData.gasolineBalanceInTank || ''}" style="width: 100%; border: none; background: transparent; text-align: center; color: #000080; font-family: 'Times New Roman', serif; font-style: italic; font-size: 10pt; outline: none;" />
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Liters</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;"><span style="display:inline-block; width:15px;">b.</span>Issued by office/garage</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <input id="gasolineIssued" value="${formData.gasolineIssued || ''}" style="width: 100%; border: none; background: transparent; text-align: center; color: #000080; font-family: 'Times New Roman', serif; font-style: italic; font-size: 10pt; outline: none;" />
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Liters</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;"><span style="display:inline-block; width:15px;">c.</span>Add: purchased during the trip</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <input id="gasolinePurchased" value="${formData.gasolinePurchased || ''}" style="width: 100%; border: none; background: transparent; text-align: center; color: #000080; font-family: 'Times New Roman', serif; font-style: italic; font-size: 10pt; outline: none;" />
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Liters</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;"><span style="display:inline-block; width:15px;">d.</span>Total</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <input id="gasolineTotalLitres" value="${formData.gasolineTotalLitres || ''}" style="width: 100%; border: none; background: transparent; text-align: center; color: #000080; font-family: 'Times New Roman', serif; font-style: italic; font-size: 10pt; outline: none;" />
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Liters</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;"><span style="display:inline-block; width:15px;">e.</span>Deducted during trip</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <input id="gasolineDeductedCalc" value="${calculateGasolineDeducted() > 0 ? calculateGasolineDeducted().toFixed(2) : ''}" readonly style="width: 100%; border: none; background: transparent; text-align: center; color: #000080; font-family: 'Times New Roman', serif; font-style: italic; font-size: 10pt; outline: none;" />
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Liters</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;"><span style="display:inline-block; width:15px;">f.</span>Balance in tank</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <input id="gasolineFinalBalance" value="${formData.gasolineFinalBalance || ''}" style="width: 100%; border: none; background: transparent; text-align: center; color: #000080; font-family: 'Times New Roman', serif; font-style: italic; font-size: 10pt; outline: none;" />
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Liters</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">7.</td>
                    <td style="vertical-align: bottom;">Gear oil used:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000080; font-family: 'Times New Roman', serif; font-style: italic;">${formData.gearOilUsed || ''}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Liters</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">8.</td>
                    <td style="vertical-align: bottom;">Lubricants used:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000080; font-family: 'Times New Roman', serif; font-style: italic;">${formData.lubricantsUsed || ''}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Miles/Kms</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">9.</td>
                    <td style="vertical-align: bottom;">Greased oil used:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000080; font-family: 'Times New Roman', serif; font-style: italic;">${formData.greasedOilUsed || ''}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Miles/Kms</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">10.</td>
                    <td style="vertical-align: bottom;">Speed:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000080; font-family: 'Times New Roman', serif; font-style: italic;">${formData.speed || ''}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Miles/Kms</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;">at the beginning of the trip:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000080; font-family: 'Times New Roman', serif; font-style: italic;">${formData.speedAtBeginning || ''}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Miles/Kms</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;">distance travelled (per distance above 5):</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000080; font-family: 'Times New Roman', serif; font-style: italic;">${formData.speedDistanceTravelled || ''}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Miles/Kms</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;">at the end of the trip:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000080; font-family: 'Times New Roman', serif; font-style: italic;">${formData.speedAtEnd || ''}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Miles/Kms</td>
                </tr>
            </table>
        </div>

        <div><strong>REMARKS:</strong></div>
        <div class="remarks-box">${formData.remarks ? formData.remarks.replace(/\n/g, '<br>') : ''}</div>

        <div class="cert">
            <div class="statement">I HEREBY CERTIFY to the correctness of the above statement of record travel.</div>
            <div class="sig-wrap">
                <div class="sig-line">${formData.driverSignature || formData.driver || ''}</div>
                <div class="sig-label">Driver</div>
            </div>
        </div>
        <div class="cert">
            <div class="statement">I/WE HEREBY CERTIFY that I/we used this service vehicle on official travel as stated above.</div>
            <div class="sig-wrap">
                <div class="sig-line">${formData.authorizedPassengers || formData.passengerSignatures || ''}</div>
                <div class="sig-label">Passenger/s</div>
            </div>
        </div>

    </div>
    <script>
        (function(){
            function q(id){return document.getElementById(id);}
            function parseNum(v){var n=parseFloat(v); return isNaN(n)?0:n;}
            function recalc(){
                // No computation for total and balance in tank, pure user input.
            }
            ['gasolineIssued','gasolinePurchased','gasolineDeducted'].forEach(function(id){
                var el = q(id);
                if(el) el.addEventListener('input', recalc);
            });
        })();
    </script>
</body>
</html>
        `;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                        <CardTitle className="text-xl font-bold">DRIVER'S TRIP TICKET</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="documentNo" className="whitespace-nowrap">
                            Trip Ticket No.:
                        </Label>
                        <Input
                            id="documentNo"
                            value={formData.documentNo}
                            readOnly
                            placeholder={loadingTicketNo ? 'Loading…' : 'Auto-generated'}
                            className="max-w-xs"
                        />
                    </div>

                    {/* Instructions */}
                    <div className="bg-muted/50 p-4 rounded-md text-sm space-y-1">
                        <p className="font-medium">Instructions:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Fill in Triplicate</li>
                            <li>One (1) copy - for liquidation of the Petty Cash Advance at the Cashier</li>
                            <li>Two (2) copies - for the Driver upon completion of the Travel</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Initial Trip Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Initial Trip Information</CardTitle>
                    <CardDescription>To be filled by administrative staff</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleChange('date', e.target.value)}
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
                        <Label htmlFor="vehicle">Vehicle</Label>
                        <Input
                            id="vehicle"
                            value={formData.vehicle}
                            onChange={(e) => handleChange('vehicle', e.target.value)}
                            placeholder="Enter vehicle type/model"
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
                        <Label htmlFor="authorizedPassengers">Authorized Passengers</Label>
                        <Input
                            id="authorizedPassengers"
                            value={formData.authorizedPassengers}
                            onChange={(e) => handleChange('authorizedPassengers', e.target.value)}
                            placeholder="Enter passenger names"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label>Destination(s)</Label>
                        <div className="space-y-2">
                            {formData.destinations.map((destination) => (
                                <div key={destination.id} className="flex gap-2">
                                    <Input
                                        value={destination.value}
                                        onChange={(e) =>
                                            updateDestination(destination.id, e.target.value)
                                        }
                                        placeholder="Enter destination"
                                        required
                                        className="flex-1"
                                    />
                                    {formData.destinations.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => removeDestination(destination.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addDestination}
                                className="w-full"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Another Destination
                            </Button>
                        </div>

                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="purpose">Purpose</Label>
                        <Input
                            id="purpose"
                            value={formData.purpose}
                            onChange={(e) => handleChange('purpose', e.target.value)}
                            placeholder="Enter purpose of trip"
                            required
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Authorization Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Authorization</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="authorizedByName">Authorized By (Name)</Label>
                        <Input
                            id="authorizedByName"
                            value={formData.authorizedByName}
                            onChange={(e) => handleChange('authorizedByName', e.target.value)}
                            placeholder="Enter name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="authorizedByTitle">Title/Position</Label>
                        <Input
                            id="authorizedByTitle"
                            value={formData.authorizedByTitle}
                            onChange={(e) => handleChange('authorizedByTitle', e.target.value)}
                            placeholder="Enter title/position"
                        />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                        <div className="text-sm text-center">
                            <p className="font-medium">Authorized by:</p>
                            <p className="text-muted-foreground">{formData.authorizedByName || '-----------------------'}</p>
                            <p className="text-muted-foreground">{formData.authorizedByTitle || '-----------------------'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Driver's Log Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Driver's Log</CardTitle>
                    <CardDescription>To be filled by the Driver</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Time Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="departureTime">
                                1. Time for departure from the office/garage
                            </Label>
                            <Input
                                id="departureTime"
                                type="time"
                                value={formData.departureTime}
                                onChange={(e) => handleChange('departureTime', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="arrivalAtPlace">
                                2. Time of arrival at place visited
                            </Label>
                            <Input
                                id="arrivalAtPlace"
                                type="time"
                                value={formData.arrivalAtPlace}
                                onChange={(e) => handleChange('arrivalAtPlace', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="departureFromPlace">
                                3. Time of departure from No. 2 above
                            </Label>
                            <Input
                                id="departureFromPlace"
                                type="time"
                                value={formData.departureFromPlace}
                                onChange={(e) =>
                                    handleChange('departureFromPlace', e.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="arrivalBackTime">
                                4. Time of arrival back to office/garage
                            </Label>
                            <Input
                                id="arrivalBackTime"
                                type="time"
                                value={formData.arrivalBackTime}
                                onChange={(e) => handleChange('arrivalBackTime', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="distanceTravelled">
                                5. Approximate distance travelled (to and fro)
                            </Label>
                            <Input
                                id="distanceTravelled"
                                type="number"
                                step="0.01"
                                value={formData.distanceTravelled}
                                onChange={(e) =>
                                    handleChange('distanceTravelled', e.target.value)
                                }
                                placeholder="Enter distance"
                            />
                        </div>
                    </div>

                    {/* Gasoline Information */}
                    <div className="space-y-2">
                        <h3 className="font-semibold">6. Gasoline issued/purchased (Liters)</h3>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="totalGasolineText"></Label>
                            <Input
                                id="totalGasolineText"
                                value={formData.totalGasoline}
                                onChange={(e) => handleChange('totalGasoline', e.target.value)}
                                placeholder="Enter total or notes"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gasolineBalanceInTank">
                                    a. Balance in tank(Liters)
                                </Label>
                                <Input
                                    id="gasolineBalanceInTank"
                                    type="number"
                                    step="0.01"
                                    value={formData.gasolineBalanceInTank}
                                    onChange={(e) =>
                                        handleChange('gasolineBalanceInTank', e.target.value)
                                    }
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gasolineIssued">
                                    b. Issued by office/garage(Liters)
                                </Label>
                                <Input
                                    id="gasolineIssued"
                                    type="number"
                                    step="0.01"
                                    value={formData.gasolineIssued}
                                    onChange={(e) => handleChange('gasolineIssued', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gasolinePurchased">
                                    c. Add: purchased during the trip(Liters)
                                </Label>
                                <Input
                                    id="gasolinePurchased"
                                    type="number"
                                    step="0.01"
                                    value={formData.gasolinePurchased}
                                    onChange={(e) =>
                                        handleChange('gasolinePurchased', e.target.value)
                                    }
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gasolineTotalLitres">d. Total(Liters)</Label>
                                <Input
                                    id="gasolineTotalLitres"
                                    type="number"
                                    step="0.01"
                                    value={formData.gasolineTotalLitres}
                                    onChange={(e) => handleChange('gasolineTotalLitres', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>e. Deduct during trip(Liters)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={calculateGasolineDeducted().toFixed(2)}
                                    readOnly
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">Calculated as: (Balance + Purchased) - Final Balance</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gasolineFinalBalance">f. Balance in tank(Liters)</Label>
                                <Input
                                    id="gasolineFinalBalance"
                                    type="number"
                                    step="0.01"
                                    value={formData.gasolineFinalBalance}
                                    onChange={(e) => handleChange('gasolineFinalBalance', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Oil and Lubricants */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="gearOilUsed">7. Gear oil used (Liters)</Label>
                            <Input
                                id="gearOilUsed"
                                type="number"
                                step="0.01"
                                value={formData.gearOilUsed}
                                onChange={(e) => handleChange('gearOilUsed', e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lubricantsUsed">8. Lubricants used (Liters)</Label>
                            <Input
                                id="lubricantsUsed"
                                type="number"
                                step="0.01"
                                value={formData.lubricantsUsed}
                                onChange={(e) => handleChange('lubricantsUsed', e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="greasedOilUsed">9. Greased oil used (Liters)</Label>
                            <Input
                                id="greasedOilUsed"
                                type="number"
                                step="0.01"
                                value={formData.greasedOilUsed}
                                onChange={(e) => handleChange('greasedOilUsed', e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Speed Information */}
                    <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold">10. Speed (Miles/Kms)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="speed">Speed (overall)</Label>
                                <Input
                                    id="speed"
                                    type="number"
                                    step="0.01"
                                    name="speed"
                                    autoComplete="off"
                                    value={formData.speed}
                                    onChange={(e) => handleChange('speed', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="speedAtBeginning">
                                    at the beginning of the trip
                                </Label>
                                <Input
                                    id="speedAtBeginning"
                                    type="number"
                                    step="0.01"
                                    name="speedAtBeginning"
                                    autoComplete="off"
                                    value={formData.speedAtBeginning}
                                    onChange={(e) => handleChange('speedAtBeginning', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="speedDistanceTravelled">
                                    distance travelled (per distance above 5)
                                </Label>
                                <Input
                                    id="speedDistanceTravelled"
                                    type="number"
                                    step="0.01"
                                    name="speedDistanceTravelled"
                                    autoComplete="off"
                                    value={formData.speedDistanceTravelled}
                                    onChange={(e) => handleChange('speedDistanceTravelled', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="speedAtEnd">at the end of the trip</Label>
                                <Input
                                    id="speedAtEnd"
                                    type="number"
                                    step="0.01"
                                    name="speedAtEnd"
                                    autoComplete="off"
                                    value={formData.speedAtEnd}
                                    onChange={(e) => handleChange('speedAtEnd', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Remarks Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        id="remarks"
                        value={formData.remarks}
                        onChange={(e) => handleChange('remarks', e.target.value)}
                        placeholder="Enter any additional remarks or notes"
                        rows={4}
                    />
                    <p className="text-sm text-muted-foreground mb-4">
                        I HEREBY CERTIFY to the correctness of the above statement of record travel.
                    </p>
                </CardContent>
            </Card>

            {/* Certification Section */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-end">
                        <div className="text-sm text-center">
                            <p className="text-muted-foreground border-b border-muted-foreground min-w-[200px] inline-block px-4 pb-1">
                                {formData.driver || '\u00A0'}
                            </p>
                            <p className="text-muted-foreground mt-1">Driver</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        I/WE HEREBY CERTIFY that I/we used this service vehicle on official travel as stated above.
                    </p>
                    <div className="flex justify-end">
                        <div className="text-sm text-center">
                            <p className="text-muted-foreground border-b border-muted-foreground min-w-[200px] inline-block px-4 pb-1">
                                {formData.authorizedPassengers || '\u00A0'}
                            </p>
                            <p className="text-muted-foreground mt-1">Passenger/s</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={handleReset} disabled={submitting}>
                    Reset
                </Button>
                <Button type="button" onClick={() => setShowReview(true)} disabled={submitting || loadingTicketNo}>
                    Review
                </Button>
            </div>

            {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
            )}

            {submitSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Trip Ticket Submitted!</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 text-center">
                                <p className="text-sm text-foreground font-medium">
                                    Your trip ticket has been successfully submitted.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Document No: <span className="font-semibold text-foreground">{submittedDocumentNo}</span>
                                </p>
                            </div>
                            <div className="pt-2 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Redirecting to Gas Slip form in a few seconds...
                                </p>
                            </div>
                            <Button
                                type="button"
                                className="w-full"
                                onClick={() => router.visit('/gas-slips')}
                            >
                                Go to Gas Slip Form Now
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Review Modal */}
            {showReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle>Review Trip Ticket</CardTitle>
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
                            {/* Review Summary */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-semibold">Trip Ticket No.</p>
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
                                        <p className="font-semibold">Vehicle</p>
                                        <p className="text-muted-foreground">{formData.vehicle}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Plate No.</p>
                                        <p className="text-muted-foreground">{formData.plateNo}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Purpose</p>
                                        <p className="text-muted-foreground">{formData.purpose}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="font-semibold">Destinations</p>
                                        <p className="text-muted-foreground">
                                            {formData.destinations.map((d) => d.value).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
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
                                {/* Download HTML removed per request */}
                                <Button
                                    type="button"
                                    onClick={submitToServer}
                                    disabled={submitting || downloading}
                                >
                                    {submitting ? 'Proceeding…' : 'Proceed to Gas Slip'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </form>
    );
}
