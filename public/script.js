/**
         * ============================================
         * SPOTIFY CLONE - FUNCIONALIDAD PRINCIPAL
         * ============================================
         * 
         * Esta aplicación replica la interfaz y funcionalidad básica de Spotify
         * utilizando la API de Deezer para buscar y reproducir previews de canciones.
         * 
         * Funcionalidades principales:
         * - Búsqueda en tiempo real de canciones
         * - Reproducción de previews de audio
         * - Interfaz responsive similar a Spotify
         * - Controles de reproducción funcionales
         * 
         * API utilizada: Deezer API (https://developers.deezer.com/api)
         * Dependencias: jQuery, Font Awesome, Bootstrap (opcional)
         */

        $(document).ready(function () {
            console.log('🎵 Spotify Clone iniciado correctamente');

            // ============================================
            // VARIABLES GLOBALES
            // ============================================
            let currentTrack = null;
            let isPlaying = false;
            let searchTimeout = null;

            // Referencias a elementos del DOM
            const $searchInput = $("#search-input");
            const $songList = $("#song-list");
            const $audioPlayer = $("#audio-player")[0];
            const $playPauseBtn = $("#play-pause-btn");
            const $currentCover = $("#current-cover");
            const $currentTitle = $("#current-title");
            const $currentArtist = $("#current-artist");
            const $progressBar = $("#progress-bar");
            const $progressFill = $("#progress-fill");
            const $currentTime = $("#current-time");
            const $durationTime = $("#duration-time");
            const $welcomeScreen = $("#welcome-screen");
            const $searchResults = $("#search-results");

            // ============================================
            // FUNCIONES DE BÚSQUEDA
            // ============================================

            /**
             * Maneja la entrada de texto en el campo de búsqueda
             * Implementa debounce para evitar demasiadas llamadas a la API
             */
            $searchInput.on("input", function () {
                const query = $(this).val().trim();
                
                // Limpiar timeout anterior
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }

                if (query.length === 0) {
                    // Si no hay búsqueda, mostrar pantalla de bienvenida
                    $searchResults.addClass('hidden');
                    $welcomeScreen.removeClass('hidden');
                    return;
                }

                if (query.length > 2) {
                    // Debounce de 300ms para evitar demasiadas llamadas
                    searchTimeout = setTimeout(() => {
                        searchSongs(query);
                    }, 300);
                }
            });

            /**
             * Realiza la búsqueda de canciones usando la API de Deezer
             * @param {string} query - Término de búsqueda
             */
            function searchSongs(query) {
                console.log(`🔍 Buscando: "${query}"`);
                
                // Mostrar estado de carga
                $searchResults.addClass('loading');
                $welcomeScreen.addClass('hidden');
                $searchResults.removeClass('hidden');

                $.ajax({
                    url: `/api/search?q=${encodeURIComponent(query)}`,
                    dataType: "json",
                    timeout: 10000,
                    success: function (response) {
                        console.log('✅ Datos recibidos:', response);
                        renderSongList(response);
                        $searchResults.removeClass('loading');
                    },
                    error: function (xhr, status, error) {
                        console.error('❌ Error al obtener datos desde el backend:', error);
                        showError('Error al buscar canciones. Inténtalo de nuevo.');
                        $searchResults.removeClass('loading');
                    }
                });
            }

            /**
             * Renderiza la lista de canciones encontradas
             * @param {Object} response - Respuesta de la API de Deezer
             */
            function renderSongList(response) {
                const songs = response.data || [];
                $songList.empty();

                if (songs.length === 0) {
                    $songList.append(`
                        <div class="no-results">
                            <i class="fas fa-search" style="font-size: 48px; color: var(--spotify-text-gray); margin-bottom: 16px;"></i>
                            <p style="color: var(--spotify-text-gray);">No se encontraron resultados</p>
                        </div>
                    `);
                    return;
                }

                // Renderizar cada canción como una card
                songs.forEach((track, index) => {
                    const $songCard = $(`
                        <li class="song-card" data-track-id="${track.id}" data-index="${index}">
                            <img src="${track.album.cover_medium}" alt="${track.title}" class="song-cover" loading="lazy">
                            <div class="song-info">
                                <h4>${escapeHtml(track.title)}</h4>
                                <p>${escapeHtml(track.artist.name)}</p>
                            </div>
                            <button class="play-btn">
                                <i class="fas fa-play"></i>
                            </button>
                        </li>
                    `);

                    // Evento click en la card completa
                    $songCard.on("click", function(e) {
                        if (!$(e.target).closest('.play-btn').length) {
                            playSong(track);
                        }
                    });

                    // Evento click específico en el botón de play
                    $songCard.find('.play-btn').on("click", function(e) {
                        e.stopPropagation();
                        playSong(track);
                    });

                    $songList.append($songCard);
                });
            }

            // ============================================
            // FUNCIONES DE REPRODUCCIÓN
            // ============================================

            /**
             * Reproduce una canción específica
             * @param {Object} track - Objeto track de la API de Deezer
             */
            function playSong(track) {
                if (!track.preview) {
                    showError('Esta canción no tiene preview disponible');
                    return;
                }

                console.log('🎵 Reproduciendo:', track.title, 'por', track.artist.name);

                currentTrack = track;

                // Actualizar información de la canción actual
                $currentTitle.text(track.title);
                $currentArtist.text(track.artist.name);
                $currentCover.attr('src', track.album.cover_medium);
                
                // Configurar y reproducir audio
                $("#audio-source").attr("src", track.preview);
                $audioPlayer.load();
                
                $audioPlayer.play().then(() => {
                    isPlaying = true;
                    updatePlayButton();
                    console.log('✅ Reproducción iniciada');
                }).catch(error => {
                    console.error('❌ Error al reproducir:', error);
                    showError('Error al reproducir la canción');
                });
            }

            /**
             * Alterna entre reproducir y pausar
             */
            function togglePlayPause() {
                if (!currentTrack) return;

                if (isPlaying) {
                    $audioPlayer.pause();
                    isPlaying = false;
                } else {
                    $audioPlayer.play().then(() => {
                        isPlaying = true;
                    }).catch(error => {
                        console.error('❌ Error al reproducir:', error);
                        showError('Error al reproducir la canción');
                    });
                }
                updatePlayButton();
            }

            /**
             * Actualiza el icono del botón de play/pausa
             */
            function updatePlayButton() {
                const icon = $playPauseBtn.find('i');
                if (isPlaying) {
                    icon.removeClass('fa-play').addClass('fa-pause');
                } else {
                    icon.removeClass('fa-pause').addClass('fa-play');
                }
            }

            // ============================================
            // EVENTOS DEL REPRODUCTOR DE AUDIO
            // ============================================

            /**
             * Maneja la actualización del tiempo de reproducción
             */
            $audioPlayer.addEventListener('timeupdate', function() {
                if (!currentTrack) return;

                const currentTime = this.currentTime;
                const duration = this.duration;

                if (isFinite(duration)) {
                    const progress = (currentTime / duration) * 100;
                    $progressFill.css('width', progress + '%');
                    
                    $currentTime.text(formatTime(currentTime));
                    $durationTime.text(formatTime(duration));
                }
            });

            /**
             * Maneja el final de la reproducción
             */
            $audioPlayer.addEventListener('ended', function() {
                isPlaying = false;
                updatePlayButton();
                $progressFill.css('width', '0%');
                console.log('🔄 Canción terminada');
            });

            /**
             * Maneja errores de reproducción
             */
            $audioPlayer.addEventListener('error', function(e) {
                console.error('❌ Error de audio:', e);
                showError('Error al cargar el audio');
                isPlaying = false;
                updatePlayButton();
            });

            /**
             * Maneja cuando el audio se puede reproducir
             */
            $audioPlayer.addEventListener('canplay', function() {
                console.log('✅ Audio listo para reproducir');
            });

            // ============================================
            // EVENTOS DE CONTROLES
            // ============================================

            /**
             * Evento click del botón play/pausa principal
             */
            $playPauseBtn.on('click', togglePlayPause);

            /**
             * Evento click en la barra de progreso para saltar a una posición
             */
            $progressBar.on('click', function(e) {
                if (!currentTrack || !isFinite($audioPlayer.duration)) return;

                const rect = this.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const width = rect.width;
                const clickPercent = clickX / width;
                const newTime = clickPercent * $audioPlayer.duration;

                $audioPlayer.currentTime = newTime;
            });

            /**
             * Eventos de botones adicionales
             */
            $('.shuffle-btn').on('click', function() {
                $(this).toggleClass('active');
                showInfo($(this).hasClass('active') ? 'Reproducción aleatoria activada' : 'Reproducción aleatoria desactivada');
            });

            $('.repeat-btn').on('click', function() {
                $(this).toggleClass('active');
                showInfo($(this).hasClass('active') ? 'Repetir activado' : 'Repetir desactivado');
            });

            $('.like-btn').on('click', function() {
                const icon = $(this).find('i');
                const isLiked = icon.hasClass('fas');
                
                if (isLiked) {
                    icon.removeClass('fas').addClass('far');
                    showInfo('Eliminado de canciones que te gustan');
                } else {
                    icon.removeClass('far').addClass('fas');
                    showInfo('Agregado a canciones que te gustan');
                }
            });

            // ============================================
            // NAVEGACIÓN DEL SIDEBAR
            // ============================================

            /**
             * Maneja la navegación del sidebar
             */
            $('.nav-item').on('click', function(e) {
                e.preventDefault();
                
                // Remover clase active de todos los items
                $('.nav-item').removeClass('active');
                // Agregar clase active al item clickeado
                $(this).addClass('active');
                
                const navText = $(this).find('span').text();
                
                // Simular navegación (en una app real habría diferentes vistas)
                switch(navText) {
                    case 'Inicio':
                        showInfo('Vista de Inicio');
                        break;
                    case 'Buscar':
                        $searchInput.focus();
                        showInfo('Busca tu música favorita');
                        break;
                    case 'Tu biblioteca':
                        showInfo('Tu biblioteca personal');
                        break;
                    case 'Crear playlist':
                        showInfo('Crear nueva playlist');
                        break;
                    case 'Canciones que te gustan':
                        showInfo('Tus canciones favoritas');
                        break;
                }
            });

            // ============================================
            // FUNCIONES UTILITARIAS
            // ============================================

            /**
             * Formatea el tiempo en minutos:segundos
             * @param {number} seconds - Tiempo en segundos
             * @returns {string} Tiempo formateado (mm:ss)
             */
            function formatTime(seconds) {
                if (!isFinite(seconds)) return '0:00';
                
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = Math.floor(seconds % 60);
                return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            }

            /**
             * Escapa caracteres HTML para prevenir XSS
             * @param {string} text - Texto a escapar
             * @returns {string} Texto escapado
             */
            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            /**
             * Muestra un mensaje de error temporal
             * @param {string} message - Mensaje de error
             */
            function showError(message) {
                console.error('❌', message);
                
                // Crear notificación de error
                const $notification = $(`
                    <div class="notification error" style="
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #f44336;
                        color: white;
                        padding: 16px 20px;
                        border-radius: 8px;
                        z-index: 9999;
                        font-weight: 500;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        transform: translateX(400px);
                        transition: all 0.3s ease;
                    ">
                        <i class="fas fa-exclamation-circle" style="margin-right: 8px;"></i>
                        ${message}
                    </div>
                `);
                
                $('body').append($notification);
                
                // Animar entrada
                setTimeout(() => {
                    $notification.css('transform', 'translateX(0)');
                }, 100);
                
                // Remover después de 3 segundos
                setTimeout(() => {
                    $notification.css('transform', 'translateX(400px)');
                    setTimeout(() => $notification.remove(), 300);
                }, 3000);
            }

            /**
             * Muestra un mensaje informativo temporal
             * @param {string} message - Mensaje informativo
             */
            function showInfo(message) {
                console.log('ℹ️', message);
                
                // Crear notificación informativa
                const $notification = $(`
                    <div class="notification info" style="
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: var(--spotify-green);
                        color: white;
                        padding: 16px 20px;
                        border-radius: 8px;
                        z-index: 9999;
                        font-weight: 500;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        transform: translateX(400px);
                        transition: all 0.3s ease;
                    ">
                        <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                        ${message}
                    </div>
                `);
                
                $('body').append($notification);
                
                // Animar entrada
                setTimeout(() => {
                    $notification.css('transform', 'translateX(0)');
                }, 100);
                
                // Remover después de 2 segundos
                setTimeout(() => {
                    $notification.css('transform', 'translateX(400px)');
                    setTimeout(() => $notification.remove(), 300);
                }, 2000);
            }

            // ============================================
            // ATAJOS DE TECLADO
            // ============================================

            /**
             * Maneja atajos de teclado para mejor experiencia de usuario
             */
            $(document).on('keydown', function(e) {
                // Evitar atajos cuando se está escribiendo en inputs
                if ($(e.target).is('input, textarea')) {
                    return;
                }

                switch(e.code) {
                    case 'Space':
                        e.preventDefault();
                        togglePlayPause();
                        break;
                    case 'KeyF':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            $searchInput.focus();
                        }
                        break;
                    case 'Escape':
                        $searchInput.blur();
                        break;
                }
            });

            // ============================================
            // INICIALIZACIÓN Y EVENTOS FINALES
            // ============================================

            /**
             * Maneja el enfoque automático en dispositivos móviles
             */
            if (window.innerWidth > 768) {
                // Solo enfocar automáticamente en desktop
                setTimeout(() => {
                    $searchInput.focus();
                }, 1000);
            }

            /**
             * Maneja cambios de tamaño de ventana
             */
            $(window).on('resize', function() {
                // Ajustar layout responsive si es necesario
                const isMobile = window.innerWidth <= 768;
                
                if (isMobile) {
                    // Lógica específica para móviles
                    $('.spotify-sidebar').hide();
                } else {
                    $('.spotify-sidebar').show();
                }
            });

            /**
             * Prevenir comportamientos no deseados
             */
            
            // Prevenir drag and drop de imágenes
            $('img').on('dragstart', function(e) {
                e.preventDefault();
            });

            // Prevenir selección de texto en controles
            $('.control-btn, .play-btn, .nav-item').on('selectstart', function(e) {
                e.preventDefault();
            });

            console.log('🎵 Todas las funcionalidades inicializadas correctamente');
            console.log('💡 Consejos de uso:');
            console.log('   • Usa Ctrl+F (o Cmd+F) para enfocar la búsqueda');
            console.log('   • Presiona Espacio para reproducir/pausar');
            console.log('   • Haz clic en la barra de progreso para saltar en la canción');
        });

        // ============================================
        // COMPATIBILIDAD Y FALLBACKS
        // ============================================

        /**
         * Detecta si el navegador soporta las funcionalidades necesarias
         */
        function checkBrowserCompatibility() {
            const features = {
                audio: !!document.createElement('audio').canPlayType,
                flexbox: CSS.supports('display', 'flex'),
                grid: CSS.supports('display', 'grid'),
                fetch: typeof fetch !== 'undefined'
            };

            const unsupported = Object.keys(features).filter(feature => !features[feature]);
            
            if (unsupported.length > 0) {
                console.warn('⚠️ Funcionalidades no soportadas:', unsupported);
                
                if (!features.audio) {
                    alert('Tu navegador no soporta reproducción de audio. Algunas funcionalidades pueden no funcionar correctamente.');
                }
            }
        }

        // Ejecutar verificación de compatibilidad
        checkBrowserCompatibility();

        /**
         * ============================================
         * NOTAS DE DESARROLLO Y MEJORAS FUTURAS
         * ============================================
         * 
         * FUNCIONALIDADES IMPLEMENTADAS:
         * ✅ Búsqueda en tiempo real con debounce
         * ✅ Reproducción de audio con controles
         * ✅ Interfaz responsive similar a Spotify
         * ✅ Manejo de estados y errores
         * ✅ Notificaciones para feedback del usuario
         * ✅ Atajos de teclado
         * ✅ Animaciones y transiciones suaves
         * ✅ Documentación completa del código
         * 
         * MEJORAS FUTURAS SUGERIDAS:
         * 🔄 Implementar playlist funcionales
         * 🔄 Agregar historial de reproducción
         * 🔄 Implementar sistema de favoritos persistente
         * 🔄 Agregar ecualizador visual
         * 🔄 Implementar modo offline básico
         * 🔄 Agregar compartir canciones
         * 🔄 Implementar letras de canciones
         * 🔄 Agregar recomendaciones personalizadas
         * 
         * LIMITACIONES ACTUALES:
         * ⚠️ Solo previews de 30 segundos (limitación de Deezer API)
         * ⚠️ Sin autenticación de usuario real
         * ⚠️ Sin persistencia de datos (localStorage podría agregarse)
         * ⚠️ Funcionalidades de playlists son decorativas
         * 
         * API UTILIZADA:
         * 🎵 Deezer API - https://developers.deezer.com/api
         *    - Endpoint de búsqueda: /search
         *    - Limitación: Solo previews de canciones
         *    - Ventaja: No requiere autenticación para búsquedas básicas
         */