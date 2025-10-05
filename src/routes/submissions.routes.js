const express = require('express');
const controller = require('../controllers/submissions.controller');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.post('/:id/approve', controller.approve);
router.delete('/:id', controller.remove);

module.exports = router;


