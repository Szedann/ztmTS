import axios from "axios";
import { PassThrough } from "stream";
import QRCode from "qrcode";
import { JSDOM } from "jsdom";

interface ztmStop {
    group: string;
    pole: string;
    groupName: string;
    streetID: string;
    coords: {lat:number, lon:number};
    direction: string;
    from: Date;
}

class ztm {
    apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getVehicles(type:'buses' | 'trams', line?: string | number) {
        let dataURL = `https://api.um.warszawa.pl/api/action/busestrams_get/`;
        let params = {
            resource_id: 'f2e5503e-927d-4ad3-9500-4ab9e55deb59',
            apikey: this.apiKey,
            type: (type == 'buses') ? '1' : '2',
        }
        if(line) (params as any).line = line;
        const res = await axios.get(dataURL, {params}
        )
        if(typeof res.data.result != 'object') return ["error"];
        return res.data.result;
    }

    async getVehicleDetails(traction: 'bus' | 'tram' | 'metro' | 'kolej miejska', vehicleID: string | number) {
        const searchURL = "https://www.ztm.waw.pl/baza-danych-pojazdow"
        let ztm_traction: number;
        switch (traction){
            case 'bus': ztm_traction = 1; break;
            case 'tram': ztm_traction = 2; break;
            case 'metro': ztm_traction = 3; break;
            case 'kolej miejska': ztm_traction = 4; break;
            default: ztm_traction = 1;
        }
        const searchHTML = await axios.get(searchURL, {
            params: {
                ztm_traction,
                ztm_vehicle_number: vehicleID
            }
        })
        const searchDOM = new JSDOM(searchHTML.data)

        let dbURL: string;
        
        try {
            dbURL = (searchDOM.window.document.getElementById('ztm_vehicles_grid')?.children.item(1)?.children.item(0) as HTMLAnchorElement).href
        } catch (error) {
            return {data: "error"}
        }

        const dbHTML = await axios.get(dbURL)
        const dbDOM = new JSDOM(dbHTML.data)
        const getField = (table:number, row:number)=>{
            return dbDOM.window.document.getElementsByClassName('vehicle-details').item(0)!.children.item(table)!.children.item(row)!.children.item(1)!.innerHTML
        }

        const vehicleData = {
            maker: getField(0,0),
            model: getField(0,1),
            year: getField(0,2),
            traction_type: getField(1,0),
            registrationID: getField(1,1),
            vehicleID: getField(1,2),
            carrier: getField(2,0),
            depot: getField(2,1),
            ticketMachine: getField(3,0),
            equipment: getField(3,1).trim().split(', ')

        }

        return vehicleData
    }

    getQRCode(type: 'bus' | 'tram' | 'metro', id: string | number) {
        const typeLetter = type.slice(0,1).toUpperCase()
        const string = `WTPWarszawa_${typeLetter+id}`
        const qrStream = new PassThrough()
        return QRCode.toBuffer(string, {
            type: 'png',
            width: 800,
            margin: 2
        })
    }

    async getStops(): Promise<ztmStop[]> {
        const searchURL = 'https://api.um.warszawa.pl/api/action/dbstore_get/'
        const params = {
            id: "ab75c33d-3a26-4342-b36a-6e5fef0a3ac3",
            apikey: this.apiKey
        }
        const req = await axios(searchURL, {params})
        const data = req.data.result

        let result: ztmStop[];

        result = [];

        for (const stop of data) {
            const values = stop.values
            const stopData = {
                group: values[0].value,
                pole: values[1].value,
                groupName: values[2].value,
                streetID: values[3].value,
                coords: {lat:values[4].value-0, lon:values[5].value-0},
                direction: values[6].value,
                from: new Date(values[7].value),
            }
            result.push(stopData)
        }

        return result
    }

}

export {ztm};