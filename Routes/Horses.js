const express = require('express');
const router = express.Router();
const HorsesController = require('../controller/Horses');
const admin = require('../middleware/Admin');
router.post('/createHorse',admin, HorsesController.CreateHorse);
router.get('/getAllHorse',admin, HorsesController.GetAllHorses);
router.get('/getHorseById/:id',admin, HorsesController.GetHorseById);
router.post('/updateHorse/:id', admin,HorsesController.UpdateHorse);
router.get('/deleteHorse/:id',admin, HorsesController.DeleteHorse);
router.post('/deleteBulkHorse',admin, HorsesController.DeleteHorse);

module.exports = router;
