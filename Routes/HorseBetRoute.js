const express=require('express');
const { CreateHorseBet, GetHorseBets, GetHorseTotalBet, BetHistory, DecideRaceResult, GetAllBets } = require('../controller/HorseBetController');
const auth = require('../middleware/middleware');
const admin = require('../middleware/admin');
const router=express.Router();
router.post('/createBet',auth,CreateHorseBet)
router.get('/getBet',auth,GetHorseBets)
router.get('/getTotalBet',auth,GetHorseTotalBet)
router.get('/BetHistory',auth,BetHistory)
router.get('/raceResult',auth,DecideRaceResult)
// admin ke liye
router.get("/all-bets", auth, admin, GetAllBets);
router.get("/current-bets", auth, admin, GetHorseTotalBet);
module.exports=router;