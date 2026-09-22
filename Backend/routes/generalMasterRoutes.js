const express = require('express');
const router = express.Router();
const controller = require('../controllers/generalMasterController');

router.get('/categories', controller.getCategories);
router.post('/categories', controller.addCategory);
router.delete('/categories/:id', controller.deleteCategory);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
