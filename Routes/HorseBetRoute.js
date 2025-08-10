const express=require('express');
const { CreateHorseBet, GetHorseBets, GetHorseTotalBet, BetHistory, DecideRaceResult } = require('../controller/HorseBetController');
const authMiddleware = require('../middleware/middleware');
const router=express.Router();

router.post('/createBet',authMiddleware,CreateHorseBet)
router.get('/getBet',authMiddleware,GetHorseBets)
router.get('/getTotalBet',authMiddleware,GetHorseTotalBet)
router.get('/BetHistory',authMiddleware,BetHistory)
router.get('/raceResult',authMiddleware,DecideRaceResult)
module.exports=router;