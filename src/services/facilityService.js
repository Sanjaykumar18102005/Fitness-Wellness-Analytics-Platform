const { query, memoryDb } = require('../config/db');

class FacilityService {
  constructor() {
    this.initialEquipment = [
      { id: 1, name: 'Treadmill Commercial Pro X', branch: 'Downtown Central', category: 'Cardio', total_units: 12, in_use_units: 9, status: 'Available', last_serviced: '2026-08-01' },
      { id: 2, name: 'Squat Rack HD Power Station', branch: 'Metro East Hub', category: 'Strength', total_units: 8, in_use_units: 7, status: 'Busy', last_serviced: '2026-07-20' },
      { id: 3, name: 'Reformer Pilates Studio Bed', branch: 'Northside Performance', category: 'Pilates', total_units: 6, in_use_units: 2, status: 'Available', last_serviced: '2026-08-10' },
      { id: 4, name: 'Infrared Detox Sauna Pods', branch: 'Westside Wellness', category: 'Recovery', total_units: 4, in_use_units: 4, status: 'Full Capacity', last_serviced: '2026-08-15' },
      { id: 5, name: 'Peloton Connected Spin Bikes', branch: 'Downtown Central', category: 'Cardio', total_units: 15, in_use_units: 10, status: 'Available', last_serviced: '2026-08-05' },
      { id: 6, name: 'Functional Cable Crossover', branch: 'Metro East Hub', category: 'Strength', total_units: 6, in_use_units: 4, status: 'Available', last_serviced: '2026-07-28' },
      { id: 7, name: 'Cryotherapy Chamber', branch: 'Northside Performance', category: 'Recovery', total_units: 2, in_use_units: 1, status: 'Available', last_serviced: '2026-08-12' },
      { id: 8, name: 'Olympic Bumper Plate Station', branch: 'Westside Wellness', category: 'Strength', total_units: 10, in_use_units: 8, status: 'Busy', last_serviced: '2026-08-02' }
    ];
  }

  async getAllEquipment(branchFilter = null) {
    if (memoryDb.tables.equipment && memoryDb.tables.equipment.length > 0) {
      let list = memoryDb.tables.equipment;
      if (branchFilter && branchFilter !== 'All') {
        list = list.filter(e => e.branch === branchFilter);
      }
      return list;
    }

    try {
      let q = `SELECT * FROM equipment ORDER BY id ASC`;
      let params = [];
      if (branchFilter && branchFilter !== 'All') {
        q = `SELECT * FROM equipment WHERE branch = $1 ORDER BY id ASC`;
        params = [branchFilter];
      }
      const res = await query(q, params);
      if (res.rows && res.rows.length > 0) return res.rows;
    } catch (e) {
      // Fallback
    }

    // Return in-memory initial list
    let list = this.initialEquipment;
    if (branchFilter && branchFilter !== 'All') {
      list = list.filter(e => e.branch === branchFilter);
    }
    return list;
  }

  async updateEquipmentStatus(id, { in_use_units, status, maintenance_note }) {
    if (!memoryDb.tables.equipment) memoryDb.tables.equipment = [...this.initialEquipment];
    
    const item = memoryDb.tables.equipment.find(e => e.id == id);
    if (item) {
      if (in_use_units !== undefined) item.in_use_units = Math.min(item.total_units, Math.max(0, parseInt(in_use_units, 10)));
      if (status) item.status = status;
      if (maintenance_note) item.maintenance_note = maintenance_note;
      return item;
    }

    const fallback = this.initialEquipment.find(e => e.id == id);
    if (fallback) {
      if (in_use_units !== undefined) fallback.in_use_units = parseInt(in_use_units, 10);
      if (status) fallback.status = status;
      return fallback;
    }

    const err = new Error('Equipment item not found');
    err.status = 404;
    throw err;
  }
}

module.exports = new FacilityService();
