export interface Farmer {
  userId: string;
  name: string;
  phone: string;
  hamlet: string;
  shgName: string;
  role: string;
  birdUpdates: any[];
  vaccinations: any[];
  dewormings: any[];
  serviceDemands: any[];
  diseaseReports: any[];
}

export interface HamletSummary {
  hamlet: string;
  totalFarmers: number;
  totalBirds: number;
  vaccinatedPct: number;
  dewormedPct: number;
  pendingDemands: number;
}

export interface Buyer {
  id: string;
  name: string;
  phone: string;
  type: "Individual" | "Broker" | "Retailer" | "Hotel industry";
}

export interface CrpServiceDemand {
  id: string;
  userId: string;
  farmerName: string;
  hamlet: string;
  type: string;
  quantity: number;
  amount?: number;
  notes?: string;
  status: "Pending" | "Completed";
  createdAt: string;
}

// No longer used — farmers come from real API
export function getMockFarmers(): Farmer[] { return []; }
export function getHamletSummaries(): HamletSummary[] { return []; }
export function getPendingUpdateFarmers(): Farmer[] { return []; }
export function getAllServiceDemands(): CrpServiceDemand[] { return []; }
export function getAggregatedStock() { return { chicks: 0, growers: 0, layers: 0, broilers: 0, total: 0 }; }

// Buyers
const BUYERS_KEY = "crp_buyers";
export function getBuyers(): Buyer[] {
  const data = localStorage.getItem(BUYERS_KEY);
  return data ? JSON.parse(data) : [
    { id: "b1", name: "Rajan Traders", phone: "6381679573", type: "Broker" },
    { id: "b2", name: "Meena Hotel",   phone: "9876543211", type: "Hotel industry" },
    { id: "b3", name: "Kumar",         phone: "9876543212", type: "Individual" },
  ];
}

export function addBuyer(buyer: Omit<Buyer, "id">) {
  const buyers = getBuyers();
  buyers.push({ ...buyer, id: crypto.randomUUID() });
  localStorage.setItem(BUYERS_KEY, JSON.stringify(buyers));
}

export function exportToCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function getLatestMarketPrice(): string { return ""; }
export function getCrpPhone(): string { return ""; }
