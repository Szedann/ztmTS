import express, { NextFunction, Request, Response } from 'express';
import {ztm} from './um'
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: __dirname+'/../.env'})
const um = new ztm(process.env.API_KEY as string)

const port = 80;

const app = express()

app.set('view engine', 'ejs')
app.use(express.static('public'))

const setHeaders = (req: Request, res: Response, next: NextFunction)=>{
    res.set('x-powered-by')
    next()
}

app.use(setHeaders)

const setCache = function (req: Request, res: Response, next: NextFunction) {
    // here you can define period in second, this one is 5 minutes
    const period = 60 * 5 
  
    // you only want to cache for GET requests
    if (req.method == 'GET' && !req.path.startsWith('/api')) {
      res.set('Cache-Control', `public, max-age=${period}`)
    } else {
      // for the other requests set strict no caching parameters
      res.set('Cache-Control', `no-store`)
    }
  
    // remember to call next() to pass on the request
    next()
  }
  
  // now call the new middleware function in your app
  
  app.use(setCache)

/////////////////
//user requests//
/////////////////

app.get('/', (req, res)=>{
    res.render('index')
})

app.get('/geo', (req, res)=>{
    res.render('geo')
})

app.get('/qr', (req, res)=>{
    res.render('qr')
})

app.get('/geo/track/:traction/:id', async (req, res)=>{
    const id = req.params.id
    const traction = req.params.traction

    if(traction != 'buses' && traction != 'trams') return res.status(400).render('error', {code: 400})

    if(id.length > 4) return res.status(404).render('error', {code: 404})

    const vehicles = await um.getVehicles(traction)

    const vehicle = vehicles.find((e: { VehicleNumber: string; })=>e.VehicleNumber == id)

    if(!vehicle) return res.status(404).render('error', {code: 404})

    const vehicleDetails = await um.getVehicleDetails((traction == 'buses') ? 'bus' : 'tram', vehicle.VehicleNumber)

    vehicle.Traction = traction
    
    res.render('track', {vehicle, vehicleDetails})
})


////////////////
//api requests//
////////////////

app.get('/api/geo', async (req, res)=>{
    const line = req.query.line
    const traction = req.query.traction
    if(traction != 'trams' && traction != 'buses') return res.status(400).send({"Error":"Bad Request"})
    if(!line){
        const data = await um.getVehicles(traction)
        return res.json(data)
    }
    const data = await um.getVehicles(traction, line.toString())
    return res.json(data)
    
})

app.get('/api/details', async (req, res)=>{

    const traction = req.query.traction
    const id = req.query.id

    switch (traction ){
        case "bus": break;
        case "tram": break;
        case "metro": break;
        case "kolej miejska": break;
        default: return res.status(400).send({"Error":"Bad Request"});
    }

    if(typeof id != 'string' && typeof id != 'number') return res.status(400).send({"Error":"Bad Request"});


    const details = await um.getVehicleDetails(traction, id)

    res.send(details)
})

app.get('/api/qr', async (req, res)=>{
    const id = req.query.id
    const type = req.query.type
    if(type != 'bus' && type != 'tram' && type != 'metro') return res.status(400).send({"Error":"Bad Request"})
    if(typeof id != 'string' && typeof id != 'number') return res.status(400).send({"Error":"Bad Request"})
    const qr = await um.getQRCode(type, id)
    res.type('png').send(qr)
})



app.listen(port, ()=>{
    console.log(`started on port ${port}`)
})

um.getStops().then(data=>{
    for (const stop of data) {
        
    }
})
