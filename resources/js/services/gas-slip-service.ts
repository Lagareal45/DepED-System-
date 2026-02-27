// Service for fetching gas slip data to connect with fuel usage summary
export interface GasSlipData {
    document_no: string;
    date: string;
    driver: string;
    vehicle_type: string;
    vehicle?: string; // Alternative vehicle field name
    plate_no: string;
    number_of_cylinder: number;
    purpose: string;
    date_of_travel_start: string;
    date_of_travel_end: string;
    odometer_before: number;
    odometer_after: number;
    fuel_type: string;
    liters: number;
    amount: number;
}

class GasSlipService {
    // Fetch gas slips for a specific date range and vehicle
    async fetchGasSlips(params: {
        date?: string;
        vehicle_type?: string;
        plate_no?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<GasSlipData[]> {
        const queryParams = new URLSearchParams();
        
        if (params.date) queryParams.append('date', params.date);
        if (params.vehicle_type) queryParams.append('vehicle_type', params.vehicle_type);
        if (params.plate_no) queryParams.append('plate_no', params.plate_no);
        if (params.start_date) queryParams.append('start_date', params.start_date);
        if (params.end_date) queryParams.append('end_date', params.end_date);

        console.log('Fetching gas slips with params:', queryParams.toString());

        try {
            const response = await fetch(`/gas-slips/search?${queryParams.toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch gas slip data');
            }

            const data = await response.json();
            console.log('Gas slips response:', data);
            const gasSlips = data.data || data || [];
            console.log('Processed gas slips:', gasSlips);
            return gasSlips;
        } catch (error) {
            console.error('Error fetching gas slips:', error);
            return [];
        }
    }

    // Get the latest odometer reading for a specific vehicle
    async getLatestOdometerReading(vehicleType?: string, plateNo?: string): Promise<number | null> {
        try {
            const response = await fetch(`/gas-slips/latest-odometer?${new URLSearchParams({
                ...(vehicleType && { vehicle_type: vehicleType }),
                ...(plateNo && { plate_no: plateNo }),
            }).toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data.odometer_after || data.odometer_before || null;
        } catch (error) {
            console.error('Error fetching latest odometer:', error);
            return null;
        }
    }

    // Get gas slips for a specific month to integrate with fuel usage summary
    async getMonthlyGasSlips(year: number, month: number, vehicleType?: string): Promise<GasSlipData[]> {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

        // Try multiple approaches to fetch gas slips
        try {
            // First try the search endpoint
            const searchResult = await this.fetchGasSlips({
                start_date: startDate,
                end_date: endDate,
                vehicle_type: vehicleType,
            });
            
            if (searchResult.length > 0) {
                console.log('Found gas slips via search endpoint:', searchResult);
                return searchResult;
            }
            
            // If search doesn't work, try direct monthly endpoint
            console.log('Trying alternative endpoint for gas slips...');
            const response = await fetch(`/gas-slips/monthly?${new URLSearchParams({
                year: year.toString(),
                month: month.toString(),
                ...(vehicleType && { vehicle_type: vehicleType }),
            }).toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                const data = await response.json();
                const gasSlips = data.data || data || [];
                console.log('Found gas slips via monthly endpoint:', gasSlips);
                return gasSlips;
            }
            
            // If neither works, try basic fetch all gas slips
            console.log('Trying to fetch all gas slips...');
            const allResponse = await fetch('/gas-slips', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            
            if (allResponse.ok) {
                const allData = await allResponse.json();
                const allGasSlips = allData.data || allData || [];
                
                // Filter by date range and vehicle type
                const filtered = allGasSlips.filter((slip: GasSlipData) => {
                    const slipDate = new Date(slip.date);
                    const slipYear = slipDate.getFullYear();
                    const slipMonth = slipDate.getMonth() + 1;
                    
                    const dateMatch = slipYear === year && slipMonth === month;
                    const vehicleMatch = !vehicleType || 
                        slip.vehicle_type === vehicleType || 
                        slip.vehicle === vehicleType;
                    
                    return dateMatch && vehicleMatch;
                });
                
                console.log('Filtered gas slips from all:', filtered);
                return filtered;
            }
            
            console.log('No gas slips found');
            return [];
            
        } catch (error) {
            console.error('Error fetching monthly gas slips:', error);
            return [];
        }
    }
}

export const gasSlipService = new GasSlipService();
