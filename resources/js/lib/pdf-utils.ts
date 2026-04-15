import { toast } from 'sonner';

export const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
};

export const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export const formatDateRange = (start: string, end: string) => {
    if (!start && !end) return '';
    if (start && !end) return new Date(start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!start && end) return new Date(end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate.getTime() === endDate.getTime()) {
        return startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth()) {
        const month = startDate.toLocaleDateString('en-US', { month: 'long' });
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        const year = startDate.getFullYear();
        return `${month} ${startDay} to ${endDay}, ${year}`;
    }
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} to ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

export const generateTripTicketHTML = (data: any) => {
    // Check if destinations is an array (from backend) or string (processed)
    let destText = '';
    if (Array.isArray(data.destinations)) {
        destText = data.destinations.join(', ');
    } else if (typeof data.destinations === 'string') {
        try {
            const parsed = JSON.parse(data.destinations);
            if (Array.isArray(parsed)) {
                destText = parsed.join(', ');
            } else {
                destText = data.destinations;
            }
        } catch {
            destText = data.destinations;
        }
    }

    // Remap backend fields if necessary (snake_case to camelCase or direct mapping)
    const getVal = (snake: string, camel: string) => {
        if (data[snake] !== undefined && data[snake] !== null) return data[snake];
        if (data[camel] !== undefined && data[camel] !== null) return data[camel];
        return '';
    };

    const docNo = getVal('document_no', 'documentNo');
    const date = data.date || '';
    const driver = data.driver || '';
    const vehicle = data.vehicle || '';
    const plateNo = getVal('plate_no', 'plateNo');
    const authorizedPassengers = getVal('authorized_passengers', 'authorizedPassengers');
    const purpose = data.purpose || '';

    const departureTime = getVal('departure_time', 'departureTime');
    const arrivalAtPlace = getVal('arrival_at_place', 'arrivalAtPlace');
    const departureFromPlace = getVal('departure_from_place', 'departureFromPlace');
    const arrivalBackTime = getVal('arrival_back_time', 'arrivalBackTime');
    const distanceTravelled = getVal('distance_travelled', 'distanceTravelled');

    const gasolineBalanceInTank = getVal('gasoline_balance_in_tank', 'gasolineBalanceInTank');
    const gasolineIssued = getVal('gasoline_issued', 'gasolineIssued');
    const gasolinePurchased = getVal('gasoline_purchased', 'gasolinePurchased');
    const gasolineDeducted = getVal('gasoline_deducted', 'gasolineDeducted');
    const gasolineFinalBalance = getVal('gasoline_final_balance', 'gasolineFinalBalance');
    const gasolineTotalLitres = getVal('gasoline_total_litres', 'gasolineTotalLitres');
    const totalGasoline = getVal('total_gasoline', 'totalGasoline');

    // Ensure gasolineFinalBalance is properly formatted
    const formattedGasolineFinalBalance = gasolineFinalBalance || data.gasolineFinalBalance || '';

    const gearOilUsed = getVal('gear_oil_used', 'gearOilUsed');
    const lubricantsUsed = getVal('lubricants_used', 'lubricantsUsed');
    const greasedOilUsed = getVal('greased_oil_used', 'greasedOilUsed');

    const formatNum = (val: any) => {
        if (val === null || val === undefined || val === '') return '';
        const num = Number(val);
        return isNaN(num) ? val : String(num);
    };

    const speed = formatNum(data.speed);
    const speedAtBeginning = formatNum(getVal('speed_at_beginning', 'speedAtBeginning'));
    const speedDistanceTravelled = formatNum(getVal('speed_distance_travelled', 'speedDistanceTravelled'));
    const speedAtEnd = formatNum(getVal('speed_at_end', 'speedAtEnd'));

    const remarks = data.remarks || '';
    const authorizedByName = data.authorized_by_name || data.authorizedByName || 'VICTORIA V. GAZO';
    const authorizedByTitle = data.authorized_by_title || data.authorizedByTitle || 'Schools Division Superintendent';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Driver's Trip Ticket ${docNo}</title>
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
        .instruction ol { margin: 0; padding-left: 18px; font-style: italic; }
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
        .remarks-box { min-height: 15px; padding: 2px 4px; margin: 2px 0; text-align: justify; font-size: 9pt; }
        .cert { margin: 8px 0; font-size: 9pt; }
        .cert .statement { margin-bottom: 4px; }
        .cert .sig-wrap { display: inline-block; text-align: center; margin-top: 2px; }
        .cert .sig-line { border-bottom: 1px solid #000; min-width: 180px; padding: 0 4px; height: 14px; margin-bottom: 1px; white-space: nowrap; text-align: center; color: #000; }
        .cert .sig-label { font-size: 9pt; margin-top: 2px; }
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
                    <div class="field"><span class="label">Date:</span><span class="value">${formatDate(date)}</span></div>
                </div>
                <div class="field-row">
                    <div class="field"><span class="label">Driver:</span><span class="value">${driver}</span></div>
                </div>
                <div class="field-row">
                    <div class="field"><span class="label">Vehicle:</span><span class="value">${vehicle}</span></div>
                    <div class="field"><span class="label">Plate No.</span><span class="value">${plateNo}</span></div>
                </div>
                <div class="multi-line-field" style="width:100%;"><span class="label">Authorized Passengers:</span><div class="value-lines"><div class="value-line">${authorizedPassengers}</div><div class="value-line"></div></div></div>
                <div class="field" style="width:100%;"><span class="label">Destination:</span><span class="value">${destText}</span></div>
            </div>
            <div class="trip-block-bottom">
                <div class="trip-block-bottom-left">
                    <div class="multi-line-field" style="width:100%;"><span class="label">Purpose:</span><div class="value-lines"><div class="value-line">${purpose}</div><div class="value-line"></div></div></div>
                </div>
                <div class="trip-block-bottom-right">
                    <div class="auth-block">
                        <div class="label">Authorized by:</div>
                        <div class="line"></div>
                        <div class="name">${authorizedByName}</div>
                        <div style="font-size: 8pt;">${authorizedByTitle}</div>
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
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${formatTime(departureTime)}</span>
                    </td>
                    <td style="width: 80px; padding-left: 5px; vertical-align: bottom;"></td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">2.</td>
                    <td style="vertical-align: bottom;">Time of arrival at place visited:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${arrivalAtPlace ? formatTime(arrivalAtPlace) : ''}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;"></td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">3.</td>
                    <td style="vertical-align: bottom;">Time of departure from No. 2 above:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${departureFromPlace ? formatTime(departureFromPlace) : ''}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;"></td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">4.</td>
                    <td style="vertical-align: bottom;">Time of arrival back to office/garage:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${arrivalBackTime ? formatTime(arrivalBackTime) : ''}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;"></td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">5.</td>
                    <td style="vertical-align: bottom;">Approximate distance travelled (to and fro):</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${distanceTravelled}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;"></td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">6.</td>
                    <td style="vertical-align: bottom;">Gasoline issued/purchased (Liters):</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${totalGasoline}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;"></td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;"><span style="display:inline-block; width:15px;">a.</span>Balance in tank</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${gasolineBalanceInTank}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Liters</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;"><span style="display:inline-block; width:15px;">b.</span>Issued by office/garage</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${gasolineIssued}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Liters</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;"><span style="display:inline-block; width:15px;">c.</span>Add: purchased during the trip</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${gasolinePurchased}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Liters</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;"><span style="display:inline-block; width:15px;">d.</span>Total</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${gasolineTotalLitres}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Liters</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;"><span style="display:inline-block; width:15px;">e.</span>Deducted during trip</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${gasolineDeducted}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Liters</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;"><span style="display:inline-block; width:15px;">f.</span>Balance in tank</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${formattedGasolineFinalBalance}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Liters</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">7.</td>
                    <td style="vertical-align: bottom;">Gear oil used:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${gearOilUsed}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Liters</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">8.</td>
                    <td style="vertical-align: bottom;">Lubricants used:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${lubricantsUsed}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Miles/Kms</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">9.</td>
                    <td style="vertical-align: bottom;">Greased oil used:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${greasedOilUsed}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Miles/Kms</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;">10.</td>
                    <td style="vertical-align: bottom;">Speed:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${speed}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Miles/Kms</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;">at the beginning of the trip:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${speedAtBeginning}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Miles/Kms</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;">distance travelled (per distance above 5):</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${speedDistanceTravelled}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Miles/Kms</td>
                </tr>
                <tr>
                    <td style="vertical-align: bottom;"></td>
                    <td style="vertical-align: bottom; padding-left: 20px;">at the end of the trip:</td>
                    <td style="border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; height: 18px;">
                        <span style="color: #000000; font-family: 'Times New Roman', serif; font-style: italic;">${speedAtEnd}</span>
                    </td>
                    <td style="padding-left: 5px; vertical-align: bottom;">Miles/Kms</td>
                </tr>
            </table>
        </div>

        <div><strong>REMARKS:</strong></div>
        <div class="remarks-box">${remarks ? remarks.replace(/\n/g, '<br>') : ''}</div>

        <div class="cert">
            <div class="statement">I HEREBY CERTIFY to the correctness of the above statement of record travel.</div>
            <div class="sig-wrap">
                <div class="sig-line">${(driver || '').toUpperCase()}</div>
                <div class="sig-label">Driver</div>
            </div>
        </div>
        <div class="cert">
            <div class="statement">I/WE HEREBY CERTIFY that I/we used this service vehicle on official travel as stated above.</div>
            <div class="sig-wrap">
                <div class="sig-line">${authorizedPassengers}</div>
                <div class="sig-label">Passenger/s</div>
            </div>
        </div>

    </div>
</body>
</html>
    `;
};

export const generateGasSlipHTML = (data: any) => {
    // Remap backend fields
    const docNo = data.document_no || data.documentNo || '';
    const date = data.date || '';
    const driver = data.driver || '';
    const vehicleType = data.vehicle_type || data.vehicleType || '';
    const plateNo = data.plate_no || data.plateNo || '';
    const numberOfCylinder = data.number_of_cylinder || data.numberOfCylinder || '';
    const purpose = data.purpose || '';
    const dateOfTravelStart = data.date_of_travel_start || data.dateOfTravelStart || '';
    const dateOfTravelEnd = data.date_of_travel_end || data.dateOfTravelEnd || '';
    const odometerBefore = data.odometer_before || data.odometerBefore || '';
    const odometerAfter = data.odometer_after || data.odometerAfter || '';
    const fuelType = data.fuel_type || data.fuelType || 'Diesel';
    const liters = data.liters || '';
    const amount = data.amount || '';
    const approvedByName = data.approved_by_name || data.approvedByName || 'KATHLEEN ANN T. DUMAS';
    const approvedByTitle = data.approved_by_title || data.approvedByTitle || 'Administrative Officer V';

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
                <div><strong>Date:</strong> ${formatDate(date)}</div>
                <div><strong>Gas Slip No.:</strong> ${docNo}</div>
                <div><strong>Vehicle Type:</strong> ${vehicleType}</div>
                <div><strong>Plate No.:</strong> ${plateNo}</div>
                <div><strong>Driver:</strong> ${driver} </div>
                <div><strong>Number of Cylinder:</strong> ${numberOfCylinder} </div>
                <div><strong>Purpose/Destination:</strong> ${purpose}</div>
                <div><strong>Date of Travel:</strong> ${formatDateRange(dateOfTravelStart, dateOfTravelEnd)} </div>
                <div><strong>Odometer:</strong></div>
                <div style="margin-left: 20px;">
                    Before: ${odometerBefore}  After: ${odometerAfter}
                </div>
                <div>
                    <strong>Fuel:</strong>
                    <span style="margin-left: 10px;">
                        ${fuelType === 'Gasoline' ? '☑' : '☐'} Gasoline <span style="margin-left: 20px;">${fuelType === 'Diesel' ? '☑' : '☐'} Diesel</span>
                    </span>
                </div>
                <div><strong>Liters:</strong> ${liters}</div>
                <div><strong>Amount:</strong> ₱${amount}</div>
            </div>

            <div style="margin-top: 12px; font-size: 9pt; text-align: left;">
                <div><strong>Requested by:</strong></div>
                <div style="height: 20px; border-bottom: 1px solid #000; margin: 2px 0; width: 100%;"></div>
                <div style="font-size: 8pt; text-align: center;">Signature over Printed Name</div>
            </div>

            <div style="margin-top: 8px; font-size: 9pt;">
                <div><strong>Approved by:</strong></div>
                <div style="height: 20px; border-bottom: 1px solid #000; margin: 2px 0;"></div>
                <div style="font-weight: bold; text-align: center;">${approvedByName}</div>
                <div style="text-align: center;">${approvedByTitle}</div>
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
    <title>Gas Slip ${docNo}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 11pt; margin: 12px; line-height: 1.2; color: #000; }
        .container { display: flex; justify-content: space-between; gap: 12px; }
        @media print {
            @page { margin: 0; }
            body { margin: 8px; }
        }
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

export const printOrSavePDF = (type: 'Trip Ticket' | 'Gas Slip', data: any) => {
    try {
        const html = type === 'Trip Ticket' ? generateTripTicketHTML(data) : generateGasSlipHTML(data);
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Please allow pop-ups to print or save as PDF.');
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
        console.error('Failed to open print dialog:', err);
        toast.error('Failed to open print dialog. Please try again.');
    }
};
