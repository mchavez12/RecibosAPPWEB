
const clientesList = document.querySelector('.clientes')

export const  setupClientes = (data) => {
    if (data.length) {
        let html = ''

        data.forEach(doc => {
            const cliente = doc.data()
            const li = 
            ` 
            <li class="list-group-item list-group-item-action list-group-item-dark" style="background-color:#d1f3ce" > 
            <h5> ${cliente.nombre} </h5> 
            <p> ${cliente.direccion} </p>
            </li> 
            `
            html += li
        })
        clientesList.innerHTML = html

    } else {
        clientesList.innerHTML = '<h1> No hay clientes aun </h1>'
    } 
} 
