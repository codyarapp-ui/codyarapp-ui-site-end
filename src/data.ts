/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ErrorCode, SparePart, Technician, RepairOrder } from './types';

export const INITIAL_SPARE_PARTS: SparePart[] = [];

export const INITIAL_AFFILIATE_PRODUCTS: any[] = [];

export const INITIAL_ERROR_CODES: ErrorCode[] = [];

export const INITIAL_TECHNICIANS: Technician[] = [];

export const INITIAL_REPAIR_ORDERS: RepairOrder[] = [];

// شهرها و استان‌های کشور (پوشش کامل ۳۱ استان به همراه شهرهای مهم)
export const IRAN_CITIES: { name: string; regions: string[] }[] = [];

// دسته بندی دستگاه‌ها
export const APPLIANCE_CATEGORIES: string[] = [];

// برندها
export const APPLIANCE_BRANDS: string[] = [];

import { CommonProblem } from './types';

export const INITIAL_COMMON_PROBLEMS: CommonProblem[] = [];
