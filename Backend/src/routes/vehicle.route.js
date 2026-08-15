const express = require('express');
const vehicleRouter = express.Router();
const { registerVehicle, getMyVehicles, toggleAvailability, findNearbyLoaders, } = require('../controllers/vehicle.controller');
const multer = require('multer');
const vehicleController = require('./../controllers/vehicle.controller');
const { updateLoaderLocation } = require('../controllers/loader.controller');
const authenticate = require('../utils/auth.util')

const upload = multer({ dest: 'uploads/' });


// fpr the shop owner - he can see the vahicle that are available
vehicleRouter.get('/nearby', authenticate.authenticateUser, vehicleController.findNearbyLoaders);
vehicleRouter.get('/my-vehicles', authenticate.authenticateUser, getMyVehicles);
vehicleRouter.post('/register', upload.single('vehicle_photo'), authenticate.authenticateUser, registerVehicle);
vehicleRouter.patch('/:id/toggle-status', authenticate.authenticateUser, toggleAvailability);
vehicleRouter.put('/loader/location', authenticate.authenticateUser, updateLoaderLocation);


// vehicleRouter.get('/nearby/loader', authenticate.authenticateUser, vehicleController.getNearbyVehicles);
vehicleRouter.get('/nearby/loader', authenticate.authenticateUser, vehicleController.getNearbyVehiclesForShop)

module.exports = vehicleRouter;