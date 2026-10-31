// Pure TypeScript Type Definitions for ChainTwin AI Supply Chain Digital Twin

export type DataStatus = 'Known' | 'Assumption';

export interface Setting {
  key: string;
  value: string;
  description: string;
  data_status: DataStatus;
}

export interface Supplier {
  supplier_id: string;
  name: string;
  city: string;
  state: string;
  type: 'Primary' | 'Backup';
  contact_person: string;
  contact_email: string;
  reliability_pct: number;
  reliability_basis: string;
  distance_to_tiruppur_km: number;
}

export interface Material {
  material_id: string;
  name: string;
  unit: string;
  category: 'Raw material' | 'Substitute';
  note: string;
}

export type QuoteStatus = 'Contract' | 'Confirmed quote' | 'Unconfirmed estimate' | 'Not contacted' | 'Requested';

export interface SupplierMaterial {
  supplier_id: string;
  material_id: string;
  role: 'Primary' | 'Backup';
  unit_price: number;
  price_unit: string;
  lead_time_days: number;
  weekly_capacity: number;
  capacity_unit: string;
  quote_status: QuoteStatus;
  quote_date?: string;
  data_status: DataStatus;
}

export interface Product {
  product_id: string;
  name: string;
  packed_weight_kg: number;
  selling_price_inr: number;
}

export interface BOM {
  product_id: string;
  material_id: string;
  qty_per_piece: number;
}

export type LocationType = 'Factory' | 'Distribution Centre' | 'Store';

export interface Location {
  location_id: string;
  name: string;
  type: LocationType;
  city: string;
  state: string;
  normal_capacity_pcs_per_day?: number;
  max_capacity_pcs_per_day?: number;
  customer_id?: string;
}

export interface ProductionRate {
  factory_id: string;
  product_id: string;
  daily_qty: number;
  from_date: string;
  to_date: string;
}

export interface InventoryItem {
  location_id: string;
  item_type: 'Material' | 'Product';
  item_id: string;
  quantity: number;
  unit: string;
  daily_outflow?: number;
  as_of_date: string;
  is_projection?: boolean;
}

export type CustomerPriority = 'High' | 'Medium' | 'Low';

export interface Customer {
  customer_id: string;
  name: string;
  city: string;
  priority: CustomerPriority;
  late_penalty_pct_per_day: number;
  note: string;
}

export interface Order {
  order_id: string;
  customer_id: string;
  store_id: string;
  dc_id: string;
  factory_id: string;
  product_id: string;
  quantity: number;
  unit_price_inr: number;
  order_date: string;
  promised_date: string;
}

export type StageName = 
  | 'Supplier dispatch' 
  | 'Material received' 
  | 'Production' 
  | 'At distribution centre' 
  | 'At store' 
  | 'Delivered to customer';

export type StageStatus = 'Done' | 'In progress' | 'Waiting';

export interface OrderStage {
  order_id: string;
  stage_no: number;
  stage_name: StageName;
  planned_start: string;
  planned_end: string;
  actual_end?: string;
  status_as_of_file?: StageStatus;
  current_status?: StageStatus;
  is_overdue?: boolean;
  unconfirmed?: boolean;
}

export type InboundPOStatus = 'Received' | 'In transit' | 'Ordered' | 'Planned';

export interface InboundPO {
  po_id: string;
  supplier_id: string;
  material_id: string;
  quantity: number;
  unit: string;
  to_factory: string;
  po_date: string;
  expected_arrival: string;
  status: InboundPOStatus;
  linked_order: string;
  data_status: DataStatus;
}

export interface Route {
  route_id: string;
  from_id: string;
  to_id: string;
  mode: 'Road' | 'Rail';
  distance_km: number;
  transit_days: number;
  cost_per_tonne_inr: number;
  co2_kg_per_tonne: number;
  status: 'Active' | 'Alternative';
  data_status: DataStatus;
}

export type ApprovalStatus = 'Not requested' | 'Requested' | 'Approved' | 'Rejected';

export interface Substitute {
  original_material: string;
  substitute_material: string;
  allowed_products: string;
  quality_note: string;
  needs_buyer_approval: 'Yes' | 'No';
  approval_status: ApprovalStatus;
  data_status: DataStatus;
}

// Entire Supply Chain Network Snapshot
export interface NetworkSnapshot {
  settings: Setting[];
  suppliers: Supplier[];
  materials: Material[];
  supplierMaterials: SupplierMaterial[];
  products: Product[];
  bom: BOM[];
  locations: Location[];
  productionRates: ProductionRate[];
  inventory: InventoryItem[];
  customers: Customer[];
  orders: Order[];
  orderStages: OrderStage[];
  inboundPOs: InboundPO[];
  routes: Route[];
  substitutes: Substitute[];
}

// Disruption Model
export interface Disruption {
  id?: string;
  supplier_id: string;
  start_date: string; // ISO date string YYYY-MM-DD
  duration_days: number;
  capacity_loss_pct?: number; // default 100
  reported_at?: string;
  notes?: string;
  status?: 'Active' | 'Resolved';
}

// Order Impact Assessment
export type OrderStatus = 'On track' | 'At risk' | 'Will be late' | 'Rerouted';

export interface AffectedOrder {
  order: Order;
  customer: Customer;
  product: Product;
  status: OrderStatus;
  originalPromisedDate: string;
  projectedDeliveryDate: string;
  delayDays: number;
  orderValueINR: number;
  penaltyINR: number;
  stages: OrderStage[];
  dependencyPath: string[]; // e.g. ["SUP-01", "MAT-01", "FAC-1", "DC-CHN", "ST-01", "CUS-01"]
  isMaterialSafe: boolean; // true if 'Material received' stage was already Done
}

// Impact Calculation Result
export interface DisruptionImpact {
  disruptedSupplier: Supplier | null;
  disruption: Disruption;
  affectedMaterials: Material[];
  delayedInboundPOs: Array<InboundPO & {
    originalExpected: string;
    delayedExpected: string;
    delayDays: number;
  }>;
  factoryStockProjections: Record<string, Record<string, {
    currentStock: number;
    dailyUse: number;
    daysOfCover: number;
    stockoutDate: string | null;
    unit: string;
  }>>;
  dcStockProjections: Record<string, Record<string, {
    currentStock: number;
    dailyOutflow: number;
    daysOfCover: number;
    stockoutDate: string | null;
    unit: string;
  }>>;
  affectedOrders: AffectedOrder[];
  nodeStatuses: Record<string, 'healthy' | 'atRisk' | 'disrupted'>;
  slaBreachesCount: number;
  totalOrdersCount: number;
  lateOrdersCount: number;
  protectedOrdersCount: number;
  totalPenaltyINR: number;
  totalMoneyAtRiskINR: number;
  recoveryDaysNeeded: number;
  impactStory: string;
}

// Recovery Plan Levers & Actions
export type ActionType = 
  | 'inventory_reallocation' 
  | 'production_reschedule' 
  | 'customer_prioritization' 
  | 'transport_reroute' 
  | 'backup_supplier' 
  | 'material_substitute';

export interface PlanAction {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  materialId?: string;
  productId?: string;
  orderId?: string;
  quantity?: number;
  unit?: string;
  costINR: number;
  co2Kg: number;
  isAssumption: boolean;
  status: 'Proposed' | 'Applied';
}

export interface PlanScores {
  costScore: number;          // 0 - 100
  slaScore: number;           // 0 - 100
  recoveryTimeScore: number;  // 0 - 100
  customerImpactScore: number;// 0 - 100
  riskScore: number;          // 0 - 100
  sustainabilityScore: number;// 0 - 100
  overallScore: number;       // 0 - 100 weighted
  raw: {
    extraCostINR: number;
    slaPct: number;
    recoveryDays: number;
    weightedLateScore: number;
    riskRating: number; // 0 - 100
    co2Kg: number;
  };
}

export interface BusinessImpactComparison {
  ordersProtected: number;
  lateDeliveriesAvoided: number;
  lossAvoidedINR: number;
  extraCostINR: number;
  netBenefitINR: number;
  recoveryDays: number;
}

export interface RecoveryPlan {
  id: string;
  name: string;
  tag: 'Internal' | 'Uses backup supplier';
  level: 1 | 2;
  description: string;
  actions: PlanAction[];
  scores: PlanScores;
  impact: DisruptionImpact;
  businessImpact: BusinessImpactComparison;
  assumptions: string[];
  knowns: string[];
  explanation: string;
}

// Early Warning Signal
export interface EarlyWarningAlert {
  id: string;
  type: 'overdue_po' | 'low_stock_cover' | 'overdue_stage';
  severity: 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  suggestedDisruption?: {
    supplier_id: string;
    start_date: string;
    duration_days: number;
    capacity_loss_pct: number;
    material_id?: string;
  };
  stageAction?: {
    order_id: string;
    stage_no: number;
    stage_name: StageName;
  };
}

// Audit Trail Record
export interface HistoryRecord {
  id: string;
  timestamp: string;
  action: 'import' | 'disruption_reported' | 'plan_finalised' | 'plan_undone' | 'quote_recorded' | 'stage_confirmed';
  user_id: string;
  user_email: string;
  details: string;
  previous_snapshot?: NetworkSnapshot;
}
