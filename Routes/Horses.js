const express = require('express');
const router = express.Router();
const HorsesController = require('../controller/Horses');
const admin = require('../middleware/Admin');
const auth = require('../middleware/middleware');
router.post('/createHorse',admin, HorsesController.CreateHorse);
router.get('/getAllHorse',admin, HorsesController.GetAllHorses);
router.get("/horses/:limit", HorsesController.GetLimitedHorses);
router.get('/getHorseById/:id',admin, HorsesController.GetHorseById);
router.post('/updateHorse/:id', admin,HorsesController.UpdateHorse);
router.get('/deleteHorse/:id',admin, HorsesController.DeleteHorse);
router.post('/deleteBulkHorse',admin, HorsesController.DeleteHorse);
router.post("/set-horse-activation", admin,HorsesController.SetHorseActivation);

module.exports = router;
