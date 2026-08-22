const facilityService = require('../services/facilityService');

class FacilityController {
  async getEquipment(req, res) {
    try {
      const branch = req.query.branch;
      const list = await facilityService.getAllEquipment(branch);
      return res.status(200).json(list);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async updateEquipmentStatus(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await facilityService.updateEquipmentStatus(id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = new FacilityController();
