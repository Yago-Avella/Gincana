let lastUpdate = 0;
const UPDATE_INTERVAL = 1000;

document.addEventListener('DOMContentLoaded', () => {
    const distanceElement = document.getElementById('distance-value');
    const equationElement = document.querySelector('.equation');
    
    // Estado inicial más claro
    distanceElement.textContent = "0m";
    equationElement.textContent = "(7, z + m)";

    if (!navigator.geolocation) {
        equationElement.textContent = "Error: Geolocalización no soportada";
        return;
    }

    const watchId = navigator.geolocation.watchPosition( // Usar watchPosition
        async (position) => {
            const now = Date.now();
            if (now - lastUpdate > UPDATE_INTERVAL) {
                lastUpdate = now;
                
                try {
                    // 1. Cargar marcadores
                    const response = await fetch('https://github.com/Yago-Avella/Gincana/blob/main/locations.json');
                    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                    const data = await response.json();

                    
                    
                    // 2. Calcular distancia
                    const nearest = calcularDistanciaMasCercana(
                        position.coords.latitude,
                        position.coords.longitude,
                        data.markers
                    );
                    
                    // 3. Actualizar interfaz
                    actualizarInterfaz(nearest);
                } 
                catch (error) {
                    console.error("Error en el proceso:", error);
                    distanceElement.textContent = "Error";
                    equationElement.textContent = "(7, z + m)";
                }
            }
        },
        (error) => {
            console.error("Error de geolocalización:", error);
            equationElement.textContent = "Activa la geolocalización";
            distanceElement.textContent = "Error";
        },
        {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 5000
        }
    );
});

// Función de cálculo de distancia (corregida)
function calcularDistanciaMasCercana(userLat, userLng, markers) {
    if (!markers || markers.length === 0) throw new Error("No hay marcadores");
    
    return markers.reduce((closest, marker) => {
        const distancia = haversine(userLat, userLng, marker.lat, marker.lng);
        return distancia < closest.distance ? 
            { ...marker, distance: distancia } : // Retorna todo el marcador + distancia
            closest;
    }, { distance: Infinity }); // Inicializa con distancia infinita
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
}
console.log(haversine(
    38.78914399386474, 0.18198788166046145, // Playa IES La Mar
    38.78914399386474, 0.18198788166046145  // Mismas coordenadas
));

// Distancia Madrid-Barcelona (debería dar ~483,000m)
console.log(haversine(40.4168, -3.7038, 41.3851, 2.1734));