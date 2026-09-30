const FormHeaderMasterModel = require('../models/formHeaderMasterModel');

const getHeader = async (req, res) => {
  try {
    const data = await FormHeaderMasterModel.getHeader();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const saveHeader = async (req, res) => {
  try {
    const saved = await FormHeaderMasterModel.createOrUpdate(req.body);
    return res.json({ success: true, data: saved });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getHeader,
  saveHeader
};
