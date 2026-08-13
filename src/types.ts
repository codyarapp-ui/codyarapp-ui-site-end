export interface ErrorCode {
  id: string;
  code?: string;
  error_code?: string;
  brand?: string;
  model?: string;
  category?: string;
  device_type?: string;
  title?: string;
  error_title?: string;
  description?: string;
  cause?: string;
  causes?: string[];
  steps?: string[];
  solutions?: string[] | string;
  solution?: string;
  precautions?: string[];
  hazardLevel?: any;
  hazard_level?: any;
  hazardDescription?: string;
  toolsNeeded?: string[];
  relatedParts?: string[];
  compatible_models?: string[];
  technician_required?: boolean;
  views?: number;
  updatedBy?: string;
  isApproved?: boolean;
  isVirtual?: boolean;
  isCommonProblem?: boolean;
  tags?: string[];
  ai_analysis?: any;
  created_at?: string;
  video_url?: string;
  [key: string]: any;
}

export interface RepairOrder {
  id: string;
  orderNumber?: string;
  customer_name?: string;
  customer_phone?: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  city?: string;
  appliance_type?: string;
  applianceType?: string;
  brand?: string;
  model?: string;
  problem_description?: string;
  description?: string;
  status: any;
  technician_id?: string;
  technician_name?: string;
  technicianId?: string;
  technicianName?: string;
  date?: string;
  timeSlot?: string;
  price?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  city?: string;
  address?: string;
  status?: string;
  rating?: number;
  specialties?: string[];
  specialty?: any;
  activeLocation?: string;
  completedOrders?: number;
  isVerified?: boolean;
  documents?: any;
  document_images?: any;
  avatarUrl?: string;
  [key: string]: any;
}

export interface SparePart {
  id: string;
  name?: string;
  title?: string;
  category?: string;
  brand?: string;
  model?: string;
  price?: number;
  stock?: number;
  image_url?: string;
  image?: string;
  description?: string;
  [key: string]: any;
}

export interface CommonProblem {
  id: string;
  title: string;
  category: string;
  brand: string;
  model?: string;
  symptoms?: string[];
  causes?: string[];
  solutions?: string[];
  relatedParts?: string[];
  severity?: string;
  [key: string]: any;
}

export interface PartPurchase {
  id: string;
  part_id?: string;
  partId?: string;
  part_name?: string;
  quantity?: number;
  total_price?: number;
  price?: number;
  customer_name?: string;
  customer_phone?: string;
  created_at?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  title?: string;
  message?: string;
  text?: string;
  type?: string;
  read?: boolean;
  created_at?: string;
  [key: string]: any;
}
