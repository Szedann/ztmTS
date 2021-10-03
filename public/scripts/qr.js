function generateQR(){
    const traction = document.getElementById('traction').value
    const id = document.getElementById('id').value
    document.getElementById('qr').src = `/api/qr?id=${id}&type=${traction}`
}

addEventListener('keyup', (event)=>{
    if(event.key == "Enter" && document.activeElement.id == "id"){
        generateQR()
    }
})