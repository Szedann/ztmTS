let traction = 'buses' // 'buses' or 'trams'

mapboxgl.accessToken = 'pk.eyJ1Ijoic3plZGFubiIsImEiOiJja214YWxtczIwbGl5MnBwZnhtaXR2bTVsIn0.HHNsdy_93e7bHl9yN2k_jg';
let map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/dark-v10', // style URL
    center: [21, 52.23], // starting position [lng, lat]
    zoom: 11 // starting zoom
});

// map.addControl(new mapboxgl.NavigationControl());

// Initialize the geolocate control.
let geolocate = new mapboxgl.GeolocateControl({
    positionOptions: {
    enableHighAccuracy: true
    },
    trackUserLocation: true
});
map.addControl(geolocate);


function placeOnMap(json, map){

    // document.getElementById('amountOfResults').innerHTML = `Liczba rezultatów: ${json.length}`

    if(map.getLayer('points')!=undefined){
        map.removeLayer('points')
        map.removeSource('points')
    }

    features = []
    for(element of json){

        features.push(
            {
                // feature for Mapbox DC
                'type': 'Feature',
                'geometry': {
                'type': 'Point',
                'coordinates': [element.Lon, element.Lat]
                },
                'properties': {
                    'title': element.Lines,
                    'description': element.VehicleNumber,
                    'icon': (traction == 'buses') ? 'bus' : 'rail-light'
                }
            }
        )
    };

    

    map.addSource('points', {
        
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': features
        }
    });



    map.addLayer({
        'id': 'points',
        'type': 'symbol',
        'source': 'points',
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


async function showBusDetails(line, details, type){

    const busInfoDiv = document.getElementById('busInfo')
    busInfoDiv.innerHTML = `
    <div>
    <span>Linia: <b>${line}</b></span>
    <span>Producent: <b>${details.maker}</b></span>
    <span>Model: <b>${details.model}</b></span>
    <span>Rok produkcj: <b>${details.year}</b></span>
    <span>Nr. rejestracyjny: <b>${details.registrationID}</b></span>
    <span>Nr. pojazdu: <b>${details.vehicleID}</b></span>
    <span>Przewoźnik: <b id="bus-detail-carrier"></b></span>
    <span>Zajezdnia: <b>${details.depot}</b></span>
    <span>Biletomat: <b>${details.ticketMachine}</b></span>
    Wyposażenie:
    <b> <ul id="bus-detail-equipment"></ul></b>
    <a onclick=showImage("/api/qr?id=${details.vehicleID}&type=${type}")>Kod QR do skanowania biletów</a>
    <a href="/geo/track/${traction}/${details.vehicleID}">zacznij śledzić pojazd</a>
    </div>
    `
    switch(details.carrier){
        case "Miejskie Zakłady Autobusowe Sp. z o.o.": {
            document.getElementById('bus-detail-carrier').innerHTML = 'MZA'
            break;
        }
        case "Arriva Bus Transport Polska Sp. z o.o.": {
            document.getElementById('bus-detail-carrier').innerHTML = 'MZA'
            break;
        }
        case "Mobilis Sp. z o.o.": {
            document.getElementById('bus-detail-carrier').innerHTML = 'Mobilis'
            break;
        }
        default: {
            document.getElementById('bus-detail-carrier').innerHTML = details.carrier
        }
    }

    for(element of details.equipment){
        document.getElementById('bus-detail-equipment').innerHTML += `<li>${element}</li>`
    }
    setTimeout(() => {
        const bounding = busInfoDiv.getBoundingClientRect()
        if(bounding.x+bounding.width > window.innerWidth){ busInfoDiv.style.left = 'initial'; busInfoDiv.style.right = '0'}
        if(bounding.y+bounding.height > window.innerHeight){ busInfoDiv.style.top = 'initial'; busInfoDiv.style.bottom = '0'}
    }, 10);

}

map.on('load', ()=>{
    getAll()
    geolocate.trigger();
})

map.on('click', 'points', async e=>{
    const line = e.features[0].properties.title
    const vehicleID = e.features[0].properties.description.split('+')[0]
    let type;
    if(traction == 'trams') type = 'tram'
    else type = 'bus';

    const point =  map.project(e.features[0].geometry.coordinates)

    const busInfoDiv = document.getElementById('busInfo')
    busInfoDiv.style.inset = 'initial'
    busInfoDiv.style.display = 'block';
    busInfoDiv.style.top = point.y+'px'
    busInfoDiv.style.left = point.x+'px'
    busInfoDiv.innerHTML = '<span>Wczytywanie...</span>'

    const details = await fetch(`/api/details?traction=${type}&id=${vehicleID}`).then(res=>res.json())

    showBusDetails(line, details, type, e.point)

})

addEventListener('keyup', (event)=>{
    if(event.key == "Enter" && document.activeElement.id == "line"){
        getLine()
    }
})

function getAll(){
    fetch(`/api/geo?traction=${traction}`).then(res=>res.json()).then(json=>placeOnMap(json, map))
}

function getLine(){
    const line = document.getElementById("line").value
    if(line.length){
        if(line.length > 2) traction = 'buses'
        else traction = 'trams'
    }
    document.getElementById('line').value = ''
    fetch(`/api/geo?traction=${traction}&line=${line}`).then(res=>res.json()).then(json=>placeOnMap(json, map))
}

map.on('move', ()=>{
    document.getElementById('busInfo').style.display = 'none'
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