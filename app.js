document.addEventListener('DOMContentLoaded', () => {
    const distanceElement = document.getElementById('distance-value');
    const equationElement = document.querySelector('.equation');

    // Debug: Estado inicial
    console.log("Iniciando geolocalización...");
    distanceElement.textContent = "Calculando...";
    equationElement.textContent = "Buscando tu ubicación";

    if (!navigator.geolocation) {
        console.error("Geolocalización no soportada");
        distanceElement.textContent = "Error en navegador";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                // Debug: Coordenadas obtenidas
                console.log("Ubicación obtenida:", position.coords.latitude, position.coords.longitude);
                
                const response = await fetch('locations.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                console.log("Marcadores cargados:", data.markers.length);
                
                const nearest = calcularDistanciaMasCercana(
                    position.coords.latitude,
                    position.coords.longitude,
                    data.markers
                );
                
                console.log("Marcador más cercano:", nearest);
                actualizarInterfaz(nearest);
            } 
            catch (error) {
                console.error("Error crítico:", error);
                distanceElement.textContent = "Error de datos";
                equationElement.textContent = "(7, z + m)";
            }
        },
        (error) => {
            console.error("Error geolocalización:", error);
            equationElement.textContent = "(7, z + m)";
            distanceElement.textContent = "Activa la geolocalización";
        }
    );
});

// Función de cálculo de distancia (REVISADA)
function calcularDistanciaMasCercana(userLat, userLng, markers) {
    if (!markers || markers.length === 0) throw new Error("No hay marcadores");
    
    return markers.reduce((closest, marker) => {
        const distancia = haversine(userLat, userLng, marker.lat, marker.lng);
        return distancia < closest.distance ? { title: marker.title, distance } : closest;
    }, { distance: Infinity, title: "" });
}

// Función Haversine (REVISADA)
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); // Distancia en metros
}

// Función de actualización (REVISADA)
function actualizarInterfaz(datos) {
    console.log("Actualizando interfaz con:", datos);
    const distanciaElemento = document.getElementById('distance-value');
    
    let distanciaFormateada;
    if (datos.distance < 1000) {
        distanciaFormateada = `${Math.round(datos.distance)}m`;
    } else {
        distanciaFormateada = `${(datos.distance/1000).toFixed(2).replace('.', ',')}km`; // Formato europeo
    }

    distanciaElemento.textContent = distanciaFormateada;
    document.querySelector('.equation').textContent = datos.title || "(7, z + m)";
}
