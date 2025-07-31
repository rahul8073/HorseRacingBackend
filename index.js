require('dotenv').config();
const express=require('express');
const cors=require('cors');
const http=require('http');
const mongoose=require('mongoose');
const Authrouter = require('./Routes/authRoute');
const app=express();

app.use(express.json());
app.use(cors())
//routes
app.use('/',Authrouter)
const server=http.createServer(app);


//connect to mongodb
mongoose.connect(process.env.mongodb_url)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err)); 

server.listen(process.env.port,()=>{
    console.log(`Server is running on port ${process.env.port}`);
}   );