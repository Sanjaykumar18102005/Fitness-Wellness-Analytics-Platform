const authService = require('../services/authService');

class AuthController {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      return res.status(201).json(result);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async getProfile(req, res) {
    try {
      const profile = await authService.getProfile(req.user.id);
      return res.status(200).json(profile);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async getAllMembers(req, res) {
    try {
      const members = await authService.getAllMembers();
      return res.status(200).json(members);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = new AuthController();
