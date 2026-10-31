// Sample Data Loader for ChainTwin AI
// Parses CSV files from /public/sample/csv/*.csv into a verified NetworkSnapshot

import Papa from 'papaparse';
import { NetworkSnapshot } from '@engine/types';

export const CSV_SHEET_NAMES = [
  'Settings',
  'Suppliers',
  'Materials',
  'Supplier_Materials',
  'Products',
  'BOM',
  'Locations',
  'Production_Rate',
  'Inventory',
  'Customers',
  'Orders',
  'Order_Stages',
  'Inbound_POs',
  'Routes',
  'Substitutes',
] as const;

export async function fetchAndParseCSV<T>(url: string): Promise<T[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${url}`);
  }
  const text = await response.text();
  return new Promise((resolve, reject) => {
    Papa.parse<T>(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error: any) => reject(error),
    });
  });
}

export async function loadSampleDataFromCSV(): Promise<NetworkSnapshot> {
  const basePath = '/sample/csv';

  const [
    settings,
    suppliers,
    materials,
    supplierMaterials,
    products,
    bom,
    locations,
    productionRates,
    inventory,
    customers,
    orders,
    orderStages,
    inboundPOs,
    routes,
    substitutes,
  ] = await Promise.all([
    fetchAndParseCSV<any>(`${basePath}/Settings.csv`),
    fetchAndParseCSV<any>(`${basePath}/Suppliers.csv`),
    fetchAndParseCSV<any>(`${basePath}/Materials.csv`),
    fetchAndParseCSV<any>(`${basePath}/Supplier_Materials.csv`),
    fetchAndParseCSV<any>(`${basePath}/Products.csv`),
    fetchAndParseCSV<any>(`${basePath}/BOM.csv`),
    fetchAndParseCSV<any>(`${basePath}/Locations.csv`),
    fetchAndParseCSV<any>(`${basePath}/Production_Rate.csv`),
    fetchAndParseCSV<any>(`${basePath}/Inventory.csv`),
    fetchAndParseCSV<any>(`${basePath}/Customers.csv`),
    fetchAndParseCSV<any>(`${basePath}/Orders.csv`),
    fetchAndParseCSV<any>(`${basePath}/Order_Stages.csv`),
    fetchAndParseCSV<any>(`${basePath}/Inbound_POs.csv`),
    fetchAndParseCSV<any>(`${basePath}/Routes.csv`),
    fetchAndParseCSV<any>(`${basePath}/Substitutes.csv`),
  ]);

  // Clean strings & numbers to ensure strict types
  return {
    settings: settings.map((s: any) => ({
      key: String(s.key || ''),
      value: String(s.value || ''),
      description: String(s.description || ''),
      data_status: s.data_status === 'Assumption' ? 'Assumption' : 'Known',
    })),
    suppliers: suppliers.map((s: any) => ({
      ...s,
      reliability_pct: Number(s.reliability_pct) || 90,
      distance_to_tiruppur_km: Number(s.distance_to_tiruppur_km) || 50,
    })),
    materials: materials.map((m: any) => ({
      ...m,
      material_id: String(m.material_id),
      name: String(m.name),
    })),
    supplierMaterials: supplierMaterials.map((sm: any) => ({
      ...sm,
      unit_price: Number(sm.unit_price) || 0,
      lead_time_days: Number(sm.lead_time_days) || 3,
      weekly_capacity: Number(sm.weekly_capacity) || 1000,
      data_status: sm.data_status === 'Assumption' ? 'Assumption' : 'Known',
    })),
    products: products.map((p: any) => ({
      ...p,
      packed_weight_kg: Number(p.packed_weight_kg) || 0.2,
      selling_price_inr: Number(p.selling_price_inr) || 100,
    })),
    bom: bom.map((b: any) => ({
      ...b,
      qty_per_piece: Number(b.qty_per_piece) || 1,
    })),
    locations: locations.map((l: any) => ({
      ...l,
      normal_capacity_pcs_per_day: l.normal_capacity_pcs_per_day ? Number(l.normal_capacity_pcs_per_day) : undefined,
      max_capacity_pcs_per_day: l.max_capacity_pcs_per_day ? Number(l.max_capacity_pcs_per_day) : undefined,
    })),
    productionRates: productionRates.map((pr: any) => ({
      ...pr,
      daily_qty: Number(pr.daily_qty) || 1000,
    })),
    inventory: inventory.map((i: any) => ({
      ...i,
      quantity: Number(i.quantity) || 0,
      daily_outflow: i.daily_outflow ? Number(i.daily_outflow) : undefined,
    })),
    customers: customers.map((c: any) => ({
      ...c,
      late_penalty_pct_per_day: Number(c.late_penalty_pct_per_day) || 1,
    })),
    orders: orders.map((o: any) => ({
      ...o,
      quantity: Number(o.quantity) || 1000,
      unit_price_inr: Number(o.unit_price_inr) || 100,
    })),
    orderStages: orderStages.map((st: any) => ({
      ...st,
      stage_no: Number(st.stage_no),
    })),
    inboundPOs: inboundPOs.map((po: any) => ({
      ...po,
      quantity: Number(po.quantity) || 1000,
      data_status: po.data_status === 'Assumption' ? 'Assumption' : 'Known',
    })),
    routes: routes.map((r: any) => ({
      ...r,
      distance_km: Number(r.distance_km) || 100,
      transit_days: Number(r.transit_days) || 1,
      cost_per_tonne_inr: Number(r.cost_per_tonne_inr) || 500,
      co2_kg_per_tonne: Number(r.co2_kg_per_tonne) || 10,
      data_status: r.data_status === 'Assumption' ? 'Assumption' : 'Known',
    })),
    substitutes: substitutes.map((sub: any) => ({
      ...sub,
      data_status: sub.data_status === 'Assumption' ? 'Assumption' : 'Known',
    })),
  };
}
