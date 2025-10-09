const express=require('express');
const { CreateHorseBet, GetHorseBets, GetHorseTotalBet, BetHistory, DecideRaceResult, GetAllBets, AdminSetWinHorse } = require('../controller/HorseBetController');
const auth = require('../middleware/middleware');
const admin = require('../middleware/Admin');
const router=express.Router();
router.post('/createBet',auth,CreateHorseBet)
router.get('/getBet',auth,GetHorseBets)
router.get('/getTotalBet',auth,GetHorseTotalBet)
router.get('/BetHistory',auth,BetHistory)
router.get('/raceResult/:totalHorses',auth,DecideRaceResult)
// admin ke liye
router.get("/all-bets", admin, GetAllBets);
router.get("/current-bets", admin, GetHorseTotalBet);
router.post("/setWinHorse", admin, AdminSetWinHorse);

module.exports=router;