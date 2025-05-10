let lastUpdate = 0;
const UPDATE_INTERVAL = 1000;

document.addEventListener('DOMContentLoaded', () => {
    const distanceElement = document.getElementById('distance-value');
    distanceElement.textContent = "0m";

    if (!navigator.geolocation) {
        distanceElement.textContent = "Error navegador";
        return;
    }

    // Activar geolocalización automáticamente
    navigator.geolocation.watchPosition(
        async (position) => {
            const now = Date.now();
            if (now - lastUpdate > UPDATE_INTERVAL) {
                lastUpdate = now;
                
                try {
                    const response = await fetch('https://raw.githubusercontent.com/Yago-Avella/Gincana/main/locations.json?t=' + Date.now());                    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                    const data = await response.json();
                    
                    const nearest = calcularDistanciaMasCercana(
                        position.coords.latitude,
                        position.coords.longitude,
                        data.markers
                    );
                    
                    actualizarInterfaz(nearest);
                } 
                catch (error) {
                    console.error("Error:", error);
                    distanceElement.textContent = "Error";
                }
            }
        },
        (error) => {
            console.error("Error geolocalización:", error);
            distanceElement.textContent = "Activa la geolocalización";
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
    const distanciaElemento = document.getElementById('distance-value');
    const nombreElemento = document.getElementById('nombre-marcador');
    
    // Actualizar distancia
    let distanciaFormateada;
    if (datos.distance < 1000) {
        distanciaFormateada = `${Math.round(datos.distance)}m`;
    } else {
        distanciaFormateada = `${(datos.distance/1000).toFixed(2).replace('.', ',')}km`;
    }
    distanciaElemento.textContent = distanciaFormateada;

    // Actualizar nombre del marcador
    nombreElemento.textContent = datos.title || "Marcador cercano"; 
    console.log("Nombre del marcador:", datos.title, "Coordenadas:", datos.lat, datos.lng);

    if (datos.distance < 10 && datos.quiz && !quizActivo && datos.id !== marcadorActual) {
        mostrarQuiz(datos);
        marcadorActual = datos.id;
    }
}

function mostrarQuiz(marcador) {
    quizActivo = true;
    
    // Crear elementos del quiz
    const quizHTML = `
        <div class="quiz-modal">
            <div class="quiz-contenido">
                <h3>${marcador.quiz.question}</h3>
                ${Object.entries(marcador.quiz.options).map(([opcion, texto]) => `
                    <button class="opcion" data-opcion="${opcion}">${texto}</button>
                `).join('')}
                <div id="resultado-quiz"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', quizHTML);
    
    // Manejar respuestas
    document.querySelectorAll('.opcion').forEach(boton => {
        boton.addEventListener('click', (e) => {
            const opcion = e.target.dataset.opcion;
            const resultado = document.getElementById('resultado-quiz');
            
            if (opcion === marcador.quiz.options.correct) {
                resultado.textContent = "✅ ¡Correcto!";
                resultado.style.color = "green";
            } else {
                resultado.textContent = "❌ Incorrecto. Intenta de nuevo";
                resultado.style.color = "red";
            }
            
            setTimeout(() => {
                document.querySelector('.quiz-modal').remove();
                quizActivo = false;
            }, 3000);
        });
    });
}

console.log(haversine(
    38.78914399386474, 0.18198788166046145, // Playa IES La Mar
    38.78914399386474, 0.18198788166046145  // Mismas coordenadas
));

// Distancia Madrid-Barcelona (debería dar ~483,000m)
console.log(haversine(
    38.7409, -0.0123,  // Iglesia Xaló (corregida)
    38.7409, -0.0123   // Misma ubicación
  ));
