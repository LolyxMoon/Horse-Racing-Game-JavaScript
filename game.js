/*
Assignment: Javascript Assignment
Filename: game.js
@author: KITSANTAS FOTIOS (17421808)
Date: 30/04/17
Modified: Para 50 caballos en carrera lineal de 700 metros
*/

// Configuración de la carrera
const TOTAL_HORSES = 50;
const RACE_DISTANCE = 700; // metros
const TRACK_WIDTH = 200; // vw - ancho de la pista en viewport width
const PIXELS_PER_METER = TRACK_WIDTH / RACE_DISTANCE; // Escala de conversión

// Variables globales
var horses = [];
var results = [];
var funds = 100;
var bethorse = null;
var amount = 0;
var raceInProgress = false;
var raceStartTime = null;
var cameraFollowInterval = null;

// Nombres de los caballos
const horseNames = [
    "Lightning", "Thunder", "Storm", "Blaze", "Shadow",
    "Spirit", "Arrow", "Comet", "Flash", "Bolt",
    "Rocket", "Meteor", "Star", "Wind", "Fire",
    "Ice", "Dawn", "Dusk", "Moon", "Sun",
    "Galaxy", "Nova", "Nebula", "Cosmos", "Orion",
    "Phoenix", "Dragon", "Eagle", "Falcon", "Hawk",
    "Tiger", "Lion", "Panther", "Jaguar", "Cheetah",
    "Warrior", "Champion", "Victory", "Glory", "Triumph",
    "Legend", "Myth", "Dream", "Magic", "Wonder",
    "Marvel", "Mystic", "Phantom", "Ghost", "Specter"
];

// Clase Horse mejorada para carrera lineal
function Horse(id, number, y) {
    this.element = document.getElementById(id);
    this.number = number;
    this.name = horseNames[number - 1];
    
    // Posición y velocidad
    this.x = 8; // Posición inicial en vw (línea de salida)
    this.y = y; // Posición vertical fija
    this.meters = 0; // Distancia recorrida en metros
    
    // Velocidad base + variación aleatoria (metros por segundo)
    this.baseSpeed = 15 + Math.random() * 3; // Entre 15-18 m/s
    this.currentSpeed = this.baseSpeed;
    this.speedVariation = 0.2; // Variación de velocidad durante la carrera
    
    // Estado
    this.finished = false;
    this.finishTime = null;
    this.position = null;
    
    // Indicador de posición
    this.positionIndicator = this.element.querySelector('.position-indicator');
    
    // Inicializar posición
    this.element.style.left = this.x + 'vw';
    this.element.style.top = this.y + 'vh';
    
    // Método para mover el caballo
    this.move = function() {
        if (this.finished || !raceInProgress) return;
        
        var horse = this;
        
        // Actualizar velocidad con pequeñas variaciones aleatorias
        this.currentSpeed = this.baseSpeed * (1 + (Math.random() - 0.5) * this.speedVariation);
        
        // Añadir aceleración/desaceleración según la fase de la carrera
        if (this.meters < 100) {
            // Fase de aceleración inicial
            this.currentSpeed *= 0.8 + (this.meters / 100) * 0.2;
        } else if (this.meters > 600) {
            // Sprint final
            this.currentSpeed *= 1.1;
        } else if (this.meters > 400 && this.meters < 500) {
            // Pequeña fatiga a mitad de carrera
            this.currentSpeed *= 0.95;
        }
        
        // Calcular nueva posición
        var deltaTime = 0.05; // 50ms de frame rate
        var metersAdvanced = this.currentSpeed * deltaTime;
        this.meters += metersAdvanced;
        
        // Convertir metros a vw para el display
        this.x = 8 + (this.meters * PIXELS_PER_METER);
        this.element.style.left = this.x + 'vw';
        
        // Actualizar mini-mapa
        this.updateMinimap();
        
        // Verificar si llegó a la meta
        if (this.meters >= RACE_DISTANCE) {
            this.finish();
        } else {
            // Continuar moviendo
            setTimeout(function() {
                horse.move();
            }, 50); // 20 FPS
        }
    };
    
    // Actualizar posición en el mini-mapa
    this.updateMinimap = function() {
        var progress = (this.meters / RACE_DISTANCE) * 100;
        var miniHorse = document.getElementById('mini-horse-' + this.number);
        if (miniHorse) {
            miniHorse.style.left = Math.min(progress, 100) + '%';
            
            // Destacar los primeros 3
            if (this.position && this.position <= 3) {
                miniHorse.style.backgroundColor = this.position === 1 ? 'gold' : 
                                                 this.position === 2 ? 'silver' : 
                                                 'bronze';
                miniHorse.style.width = '6px';
                miniHorse.style.height = '6px';
            }
        }
    };
    
    // Método para terminar la carrera
    this.finish = function() {
        this.finished = true;
        this.meters = RACE_DISTANCE;
        this.finishTime = (Date.now() - raceStartTime) / 1000; // Tiempo en segundos
        this.position = results.length + 1;
        
        // Cambiar animación a parado
        this.element.className = 'horse standRight';
        
        // Actualizar indicador de posición
        if (this.positionIndicator) {
            this.positionIndicator.textContent = this.position;
            this.positionIndicator.style.backgroundColor = 
                this.position === 1 ? 'gold' : 
                this.position === 2 ? 'silver' : 
                this.position === 3 ? '#CD7F32' : '#FFD700';
        }
        
        // Agregar a resultados
        results.push({
            number: this.number,
            name: this.name,
            time: this.finishTime,
            position: this.position
        });
        
        // Actualizar tabla de resultados
        this.updateResults();
        
        // Verificar si ganó la apuesta
        if (this.position === 1) {
            this.checkBet();
        }
        
        // Si todos terminaron, finalizar la carrera
        if (results.length === TOTAL_HORSES) {
            this.endRace();
        }
    };
    
    // Actualizar tabla de resultados
    this.updateResults = function() {
        var tbody = document.getElementById('results-body');
        var row = document.createElement('tr');
        
        // Resaltar las primeras 3 posiciones
        if (this.position <= 3) {
            row.style.backgroundColor = 
                this.position === 1 ? 'rgba(255, 215, 0, 0.3)' : 
                this.position === 2 ? 'rgba(192, 192, 192, 0.3)' : 
                'rgba(205, 127, 50, 0.3)';
        }
        
        row.innerHTML = `
            <td class="position">${this.position}°</td>
            <td class="horse-icon horse${this.number}"></td>
            <td>${this.name} (#${this.number})</td>
            <td>${this.finishTime.toFixed(2)}s</td>
        `;
        
        tbody.appendChild(row);
    };
    
    // Verificar apuesta
    this.checkBet = function() {
        if (this.number == bethorse) {
            // Ganó la apuesta! Pago 3:1
            var winnings = amount * 3;
            funds += winnings;
            document.getElementById('bet-result').innerHTML = 
                `<span style="color: green;">¡GANASTE! +£${winnings}</span>`;
        } else if (bethorse) {
            // Perdió la apuesta
            funds -= amount;
            document.getElementById('bet-result').innerHTML = 
                `<span style="color: red;">Perdiste £${amount}. Ganó ${this.name}</span>`;
        }
        
        document.getElementById('funds').innerText = funds;
        document.getElementById('bet-result').style.display = 'block';
    };
    
    // Finalizar la carrera
    this.endRace = function() {
        raceInProgress = false;
        document.getElementById('start').disabled = false;
        
        // Detener seguimiento de cámara
        if (cameraFollowInterval) {
            clearInterval(cameraFollowInterval);
        }
        
        // Mostrar estadísticas finales
        console.log('Carrera finalizada!');
        console.log('Top 3:');
        for (let i = 0; i < Math.min(3, results.length); i++) {
            console.log(`${i+1}. ${results[i].name} - ${results[i].time.toFixed(2)}s`);
        }
    };
    
    // Iniciar carrera
    this.run = function() {
        this.element.className = 'horse runRight';
        this.finished = false;
        this.meters = 0;
        this.position = null;
        
        // Pequeño delay aleatorio para salida más realista (0-200ms)
        var startDelay = Math.random() * 200;
        var horse = this;
        
        setTimeout(function() {
            horse.move();
        }, startDelay);
    };
    
    // Reset para nueva carrera
    this.reset = function() {
        this.x = 8;
        this.meters = 0;
        this.finished = false;
        this.finishTime = null;
        this.position = null;
        this.element.style.left = this.x + 'vw';
        this.element.className = 'horse standRight';
        
        if (this.positionIndicator) {
            this.positionIndicator.textContent = this.number;
            this.positionIndicator.style.backgroundColor = 'rgba(255, 215, 0, 0.8)';
        }
        
        // Reset mini-mapa
        var miniHorse = document.getElementById('mini-horse-' + this.number);
        if (miniHorse) {
            miniHorse.style.left = '0%';
            miniHorse.style.backgroundColor = 'black';
            miniHorse.style.width = '4px';
            miniHorse.style.height = '4px';
        }
    };
}

// Función para actualizar posiciones en tiempo real
function updateRacePositions() {
    if (!raceInProgress) return;
    
    // Ordenar caballos por distancia recorrida
    var positions = horses.map(function(horse, index) {
        return {
            horse: horse,
            meters: horse.meters,
            index: index
        };
    }).sort(function(a, b) {
        return b.meters - a.meters;
    });
    
    // Actualizar posiciones actuales
    positions.forEach(function(item, pos) {
        if (!item.horse.finished) {
            item.horse.positionIndicator.textContent = pos + 1;
            
            // Destacar el líder
            if (pos === 0) {
                item.horse.element.classList.add('leader');
            } else {
                item.horse.element.classList.remove('leader');
            }
        }
    });
    
    // Actualizar contador de distancia del líder
    if (positions[0]) {
        var leaderMeters = Math.min(positions[0].meters, RACE_DISTANCE);
        updateDistanceCounter(leaderMeters);
        
        // Actualizar pantalla gigante
        updateJumbotron(positions[0].horse, positions[1] ? positions[1].horse : null, positions[2] ? positions[2].horse : null);
    }
}

// Actualizar pantalla gigante
function updateJumbotron(leader, second, third) {
    var display = document.getElementById('live-position');
    if (display) {
        var html = '<div style="color: #FFD700; font-size: 1.5vw;">🥇 ' + leader.name + ' (#' + leader.number + ')</div>';
        html += '<div style="font-size: 0.8vw; margin-top: 5px;">' + leader.meters.toFixed(0) + ' metros</div>';
        
        if (second) {
            html += '<div style="color: #C0C0C0; font-size: 1vw; margin-top: 10px;">🥈 ' + second.name + '</div>';
        }
        if (third) {
            html += '<div style="color: #CD7F32; font-size: 0.8vw;">🥉 ' + third.name + '</div>';
        }
        
        display.innerHTML = html;
    }
}

// Actualizar contador de distancia
function updateDistanceCounter(meters) {
    var counter = document.getElementById('distance-counter');
    if (!counter) {
        // Crear contador si no existe
        counter = document.createElement('div');
        counter.id = 'distance-counter';
        counter.style.cssText = 'position: fixed; top: 60px; left: 50%; transform: translateX(-50%); ' +
                               'background: rgba(0,0,0,0.8); color: white; padding: 10px 20px; ' +
                               'border-radius: 20px; font-size: 18px; z-index: 10003;';
        document.body.appendChild(counter);
    }
    
    counter.innerHTML = `<strong>${meters.toFixed(0)}m / ${RACE_DISTANCE}m</strong>`;
    
    // Cambiar color según progreso
    var progress = meters / RACE_DISTANCE;
    if (progress < 0.5) {
        counter.style.color = '#4CAF50';
    } else if (progress < 0.8) {
        counter.style.color = '#FFC107';
    } else {
        counter.style.color = '#F44336';
    }
}

// Función de seguimiento de cámara
function followRaceCamera() {
    if (!raceInProgress) return;
    
    // Encontrar el caballo líder
    var maxMeters = 0;
    var leader = null;
    
    horses.forEach(function(horse) {
        if (horse.meters > maxMeters) {
            maxMeters = horse.meters;
            leader = horse;
        }
    });
    
    if (leader && autoCameraEnabled) {
        var camera = document.querySelector('.camera-container');
        var viewportWidth = window.innerWidth;
        var horsePosition = leader.x * viewportWidth / 100; // Convertir vw a px
        
        // Mantener al líder en el centro de la pantalla
        if (horsePosition > viewportWidth * 0.3) {
            var offset = horsePosition - viewportWidth * 0.4;
            camera.style.transform = `translateX(-${offset}px) scale(0.8)`;
        }
    }
}

// Inicialización cuando se carga el documento
document.addEventListener("DOMContentLoaded", function(event) {
    
    // Crear los 50 caballos
    for (let i = 1; i <= TOTAL_HORSES; i++) {
        var yPosition = 1 + (i - 1) * 2.4; // Posición vertical
        horses.push(new Horse('horse' + i, i, yPosition));
    }
    
    // Event listener del botón Start
    document.getElementById('start').onclick = function() {
        amount = parseInt(document.getElementById('amount').value) || 0;
        bethorse = parseInt(document.getElementById('bethorse').value) || null;
        
        // Validaciones
        if (bethorse && amount > 0) {
            if (amount > funds) {
                alert('No tienes suficientes fondos. Fondos disponibles: £' + funds);
                return;
            }
            if (amount <= 0) {
                alert('Por favor ingresa una cantidad positiva para apostar.');
                return;
            }
        }
        
        // Limpiar resultados anteriores
        document.getElementById('results-body').innerHTML = '';
        document.getElementById('bet-result').style.display = 'none';
        results = [];
        
        // Resetear todos los caballos
        horses.forEach(function(horse) {
            horse.reset();
        });
        
        // Iniciar la carrera
        this.disabled = true;
        raceInProgress = true;
        raceStartTime = Date.now();
        
        // Activar cámara de seguimiento
        if (autoCameraEnabled) {
            document.querySelector('.camera-container').classList.add('camera-follow');
        }
        
        // Iniciar seguimiento de cámara horizontal
        cameraFollowInterval = setInterval(function() {
            followRaceCamera();
            updateRacePositions();
        }, 100);
        
        // Countdown para empezar
        var countdown = 3;
        var countdownDiv = document.createElement('div');
        countdownDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                                     'font-size: 100px; font-weight: bold; color: red; z-index: 10004; ' +
                                     'text-shadow: 3px 3px 6px rgba(0,0,0,0.7);';
        document.body.appendChild(countdownDiv);
        
        var countInterval = setInterval(function() {
            if (countdown > 0) {
                countdownDiv.textContent = countdown;
                countdown--;
            } else {
                countdownDiv.textContent = '¡GO!';
                
                // Iniciar todos los caballos
                horses.forEach(function(horse) {
                    horse.run();
                });
                
                // Remover countdown después de 1 segundo
                setTimeout(function() {
                    document.body.removeChild(countdownDiv);
                }, 1000);
                
                clearInterval(countInterval);
            }
        }, 1000);
    };
    
    // Agregar botón de reset
    var resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Camera';
    resetBtn.style.cssText = 'position: fixed; top: 20px; left: 20px; padding: 10px; ' +
                            'background: #ff5722; color: white; border: none; ' +
                            'border-radius: 5px; cursor: pointer; z-index: 10002;';
    resetBtn.onclick = function() {
        var camera = document.querySelector('.camera-container');
        camera.style.transform = 'scale(0.8)';
    };
    document.body.appendChild(resetBtn);
    
    // Información de la carrera
    var raceInfo = document.createElement('div');
    raceInfo.style.cssText = 'position: fixed; top: 100px; left: 20px; background: rgba(255,255,255,0.9); ' +
                            'padding: 10px; border-radius: 10px; z-index: 10002; font-size: 14px;';
    raceInfo.innerHTML = '<strong>Carrera de 700 metros</strong><br>' +
                        '50 caballos compitiendo<br>' +
                        'Apuesta paga 3:1';
    document.body.appendChild(raceInfo);
});