const express = require('express');
const router = express.Router();
const HorsesController = require('../controller/Horses');

router.post('/createHorse', HorsesController.CreateHorse);
router.get('/getAllHorse', HorsesController.GetAllHorses);
router.get('/getHorseById:id', HorsesController.GetHorseById);
router.put('/updateHorse:id', HorsesController.UpdateHorse);
router.delete('deleteHorse/:id', HorsesController.DeleteHorse);

module.exports = router;
