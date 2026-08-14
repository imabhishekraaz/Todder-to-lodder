const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const dns = require('dns');

dns.setServers([
  '8.8.8.8',
  '1.1.1.1'
]);

const app = express();
app.use(express.json()); 


// 🔗 Import Routes (Aapke naye naming convention ke hisaab se)
const orderRoute  = require('./../Backend/src/routes/order.route')
const userRoute = require('./../Backend/src/routes/user.route');
const { ConnectDB } = require('./src/config/db');
const vehicleRoute = require('./src/routes/vehicle.route');
const cors = require('cors')
const path = require('path');
const PaymentRouter = require('./src/routes/payment.route');

// middleware
app.use(cors());

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true 
}));

// 🔗 APIs ko mount karein
app.use('/api/users', userRoute);
app.use('/api/vehicles', vehicleRoute);
app.use('/api/orders', orderRoute);
app.use('/api/payments', PaymentRouter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Server aur Database connection
const PORT = process.env.PORT || 5000;

ConnectDB()

app.listen(PORT, ()=>{
    console.log('server is running...')
})