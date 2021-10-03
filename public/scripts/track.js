let traction = 'buses' // 'buses' or 'trams'

mapboxgl.accessToken = 'pk.eyJ1Ijoic3plZGFubiIsImEiOiJja214YWxtczIwbGl5MnBwZnhtaXR2bTVsIn0.HHNsdy_93e7bHl9yN2k_jg';
let map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/dark-v10', // style URL
    center: [21, 52.23], // starting position [lng, lat]
    zoom: 30 // starting zoom
});


let geolocate = new mapboxgl.GeolocateControl({
    positionOptions: {
    enableHighAccuracy: true
    },
    trackUserLocation: true
});
map.addControl(geolocate);


function placeOnMap(json){

    if(map.getLayer('vehicle')!=undefined){
        return map.getSource('vehicle').setData({
            'type': 'FeatureCollection',
            'features': [{
                'type': 'Feature',
                'properties': {
                    'title': json.Lines,
                    'description': json.VehicleNumber,
                    'icon': (json.Traction == 'buses') ? 'bus' : 'rail-light'
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [json.Lon, json.Lat]
                }
            }]
        })
    }


    map.addSource('vehicle', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': [{
                'type': 'Feature',
                'properties': {
                    'title': json.Lines,
                    'description': json.VehicleNumber,
                    'icon': (json.Traction == 'buses') ? 'bus' : 'rail-light'
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [json.Lon, json.Lat]
                }
            }]
        }
    });



    map.addLayer({
        'id': 'vehicle',
        'type': 'symbol',
        'source': 'vehicle',
        'layout': {
            'text-field': ['get', 'title'], 
            'text-offset': [0, .6],
            'text-size': 13,
            'text-anchor': 'top',
            'icon-image': '{icon}',
            'icon-allow-overlap': true
            },
        'paint': {
            'text-color': '#ffffff',
            'icon-color': 'transparent'
        }
    });
}

map.on('load', ()=>{
    geolocate.trigger();
    map.dragPan.disable()
    map.keyboard.disable()
    getVehicleUpdate(vehicle).then(placeOnMap)
    setTimeout(loop, (10000 - (vehicleDataUploadTime.valueOf() - now.valueOf())) || (20000 - (vehicleDataUploadTime.valueOf() - now.valueOf())));
})


function showImage(src){
    const bg = document.createElement('div')
    bg.id = 'img-bg'
    bg.style = 'background-color: #191a1adc; backdrop-filter: blur(10px); position: fixed; width: 100vw; height: 100vh; z-index: 400; top: 0; left: 0;'
    const img = document.createElement('img')
    img.src = src
    img.style = 'position: fixed; width: 70vmin; height: 70vmin; z-index: 420; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: .4em;'
    img.id = 'img-fg'
    document.body.appendChild(bg)
    document.body.appendChild(img)
    bg.onclick = ()=>{
        document.getElementById('img-bg').remove()
        document.getElementById('img-fg').remove()
    }
}

const now = new Date()

const vehicleDataUploadTime = new Date(vehicle.Time)

const getVehicleUpdate = async (vehicle) => {
    const fetchResult = await fetch(`/api/geo?line=${vehicle.Lines}&traction=${vehicle.Traction}`).then(res=>res.json())
    vehicle = {Traction: vehicle.Traction, ...fetchResult.find(e=>e.VehicleNumber == vehicle.VehicleNumber)} || vehicle
    console.log(vehicle)
    map.easeTo({center: [vehicle.Lon, vehicle.Lat]})
    return vehicle
}

const loop = async () => {
    setTimeout(loop, 10000);

    vehicle = await getVehicleUpdate(vehicle)

    placeOnMap(vehicle)
}