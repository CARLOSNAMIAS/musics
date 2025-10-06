/**
 * ============================================
 * SPOTIFY CLONE - FUNCIONALIDAD PRINCIPAL
 * ============================================
 * 
 * Esta aplicación replica la interfaz y funcionalidad básica de Spotify
 * utilizando la API de Deezer para buscar y reproducir previews de canciones.
 * 
 * @version 2.0
 * @author carlos namias
 * @description Clon de Spotify con búsqueda, reproducción y controles completos
 * 
 * API utilizada: Deezer API (https://developers.deezer.com/api)
 * Dependencias: jQuery, Font Awesome, Bootstrap (opcional)
 */

$(document).ready(function () {
    console.log('🎵 Spotify Clone iniciado correctamente');

    // ============================================
    // MÓDULO: ESTADO GLOBAL DE LA APLICACIÓN
    // ============================================
    const AppState = {
        currentTrack: null,
        isPlaying: false,
        searchTimeout: null,
        currentVolume: 0.7, // Volumen inicial al 70%
        isMuted: false,
        previousVolume: 0.7
    };

    // ============================================
    // MÓDULO: REFERENCIAS DOM (CACHE DE ELEMENTOS)
    // ============================================
    const DOM = {
        // Búsqueda
        searchInput: $("#search-input"),
        songList: $("#song-list"),
        welcomeScreen: $("#welcome-screen"),
        searchResults: $("#search-results"),

        // Reproductor de audio
        audioPlayer: $("#audio-player")[0],
        audioSource: $("#audio-source"),

        // Controles principales
        playPauseBtn: $("#play-pause-btn"),
        shuffleBtn: $(".shuffle-btn"),
        repeatBtn: $(".repeat-btn"),
        likeBtn: $(".like-btn"),

        // Información de la canción actual
        currentCover: $("#current-cover"),
        currentTitle: $("#current-title"),
        currentArtist: $("#current-artist"),

        // Barra de progreso
        progressBar: $("#progress-bar"),
        progressFill: $("#progress-fill"),
        currentTime: $("#current-time"),
        durationTime: $("#duration-time"),

        // Controles de volumen
        volumeBtn: $("#volume-btn, .volume-btn"),
        volumeBar: $("#volume-bar, .volume-bar"),
        volumeFill: $("#volume-fill, .volume-fill"),
        volumeSlider: $("#volume-slider, .volume-slider"),

        // Navegación
        navItems: $(".nav-item")
    };

    // ============================================
    // MÓDULO: GESTIÓN DE BÚSQUEDA
    // ============================================
    const SearchManager = {
        /**
         * Inicializa los eventos de búsqueda
         */
        init() {
            DOM.searchInput.on("input", this.handleSearchInput.bind(this));
        },

        /**
         * Maneja la entrada de texto en el campo de búsqueda
         * Implementa debounce para optimizar las llamadas a la API
         */
        handleSearchInput() {
            const query = DOM.searchInput.val().trim();

            // Limpiar timeout anterior
            if (AppState.searchTimeout) {
                clearTimeout(AppState.searchTimeout);
            }

            // Mostrar pantalla de bienvenida si no hay búsqueda
            if (query.length === 0) {
                DOM.searchResults.addClass('hidden');
                DOM.welcomeScreen.removeClass('hidden');
                return;
            }

            // Buscar solo si hay más de 2 caracteres
            if (query.length > 2) {
                AppState.searchTimeout = setTimeout(() => {
                    this.searchSongs(query);
                }, 300);
            }
        },

        /**
         * Realiza la búsqueda de canciones usando la API de Deezer
         * @param {string} query - Término de búsqueda
         */
        searchSongs(query) {
            console.log(`🔍 Buscando: "${query}"`);

            DOM.searchResults.addClass('loading');
            DOM.welcomeScreen.addClass('hidden');
            DOM.searchResults.removeClass('hidden');

            $.ajax({
                url: `/api/search?q=${encodeURIComponent(query)}`,
                dataType: "json",
                timeout: 10000,
                success: (response) => {
                    console.log('✅ Datos recibidos:', response);
                    this.renderResults(response);
                    DOM.searchResults.removeClass('loading');
                },
                error: (xhr, status, error) => {
                    console.error('❌ Error al obtener datos:', error);
                    UIHelper.showError('Error al buscar canciones. Inténtalo de nuevo.');
                    DOM.searchResults.removeClass('loading');
                }
            });
        },

        /**
         * Renderiza la lista de canciones encontradas
         * @param {Object} response - Respuesta de la API de Deezer
         */
        renderResults(response) {
            const songs = response.data || [];
            DOM.songList.empty();

            if (songs.length === 0) {
                DOM.songList.append(`
                    <div class="no-results">
                        <i class="fas fa-search" style="font-size: 48px; color: var(--spotify-text-gray); margin-bottom: 16px;"></i>
                        <p style="color: var(--spotify-text-gray);">No se encontraron resultados</p>
                    </div>
                `);
                return;
            }

            songs.forEach((track, index) => {
                const $songCard = this.createSongCard(track, index);
                DOM.songList.append($songCard);
            });
        },

        /**
         * Crea una tarjeta de canción
         * @param {Object} track - Datos de la canción
         * @param {number} index - Índice de la canción
         * @returns {jQuery} Elemento jQuery de la tarjeta
         */
        createSongCard(track, index) {
            const $songCard = $(`
                <li class="song-card" data-track-id="${track.id}" data-index="${index}">
                    <img src="${track.album.cover_medium}" alt="${track.title}" class="song-cover" loading="lazy">
                    <div class="song-info">
                        <h4>${UIHelper.escapeHtml(track.title)}</h4>
                        <p>${UIHelper.escapeHtml(track.artist.name)}</p>
                    </div>
                    <button class="play-btn">
                        <i class="fas fa-play"></i>
                    </button>
                </li>
            `);

            // Evento click en la card completa
            $songCard.on("click", function (e) {
                if (!$(e.target).closest('.play-btn').length) {
                    PlayerManager.playSong(track);
                }
            });

            // Evento click específico en el botón de play
            $songCard.find('.play-btn').on("click", function (e) {
                e.stopPropagation();
                PlayerManager.playSong(track);
            });

            return $songCard;
        }
    };

    // ============================================
    // MÓDULO: GESTIÓN DEL REPRODUCTOR
    // ============================================
    const PlayerManager = {
        /**
         * Inicializa el reproductor y sus eventos
         */
        init() {
            this.setupAudioEvents();
            this.setupControls();
            this.setInitialVolume();
        },

        /**
         * Configura el volumen inicial
         */
        setInitialVolume() {
            DOM.audioPlayer.volume = AppState.currentVolume;
            VolumeManager.updateVolumeUI(AppState.currentVolume);
        },

        /**
         * Configura los eventos del elemento audio
         */
        setupAudioEvents() {
            DOM.audioPlayer.addEventListener('timeupdate', this.handleTimeUpdate.bind(this));
            DOM.audioPlayer.addEventListener('ended', this.handleTrackEnd.bind(this));
            DOM.audioPlayer.addEventListener('error', this.handleError.bind(this));
            DOM.audioPlayer.addEventListener('canplay', () => {
                console.log('✅ Audio listo para reproducir');
            });
        },

        /**
         * Configura los controles del reproductor
         */
        setupControls() {
            DOM.playPauseBtn.on('click', () => this.togglePlayPause());
            DOM.progressBar.on('click', (e) => this.handleProgressClick(e));
            DOM.shuffleBtn.on('click', () => this.handleShuffleToggle());
            DOM.repeatBtn.on('click', () => this.handleRepeatToggle());
            DOM.likeBtn.on('click', () => this.handleLikeToggle());
        },

        /**
         * Reproduce una canción específica
         * @param {Object} track - Objeto track de la API de Deezer
         */
        playSong(track) {
            if (!track.preview) {
                UIHelper.showError('Esta canción no tiene preview disponible');
                return;
            }

            console.log('🎵 Reproduciendo:', track.title, 'por', track.artist.name);

            AppState.currentTrack = track;

            // Actualizar información de la canción actual
            DOM.currentTitle.text(track.title);
            DOM.currentArtist.text(track.artist.name);
            DOM.currentCover.attr('src', track.album.cover_medium);

            // Configurar y reproducir audio
            DOM.audioSource.attr("src", track.preview);
            DOM.audioPlayer.load();

            DOM.audioPlayer.play().then(() => {
                AppState.isPlaying = true;
                this.updatePlayButton();
                console.log('✅ Reproducción iniciada');
            }).catch(error => {
                console.error('❌ Error al reproducir:', error);
                UIHelper.showError('Error al reproducir la canción');
            });
        },

        /**
         * Alterna entre reproducir y pausar
         */
        togglePlayPause() {
            if (!AppState.currentTrack) return;

            if (AppState.isPlaying) {
                DOM.audioPlayer.pause();
                AppState.isPlaying = false;
            } else {
                DOM.audioPlayer.play().then(() => {
                    AppState.isPlaying = true;
                }).catch(error => {
                    console.error('❌ Error al reproducir:', error);
                    UIHelper.showError('Error al reproducir la canción');
                });
            }
            this.updatePlayButton();
        },

        /**
         * Actualiza el icono del botón de play/pausa
         */
        updatePlayButton() {
            const icon = DOM.playPauseBtn.find('i');
            if (AppState.isPlaying) {
                icon.removeClass('fa-play').addClass('fa-pause');
            } else {
                icon.removeClass('fa-pause').addClass('fa-play');
            }
        },

        /**
         * Maneja la actualización del tiempo de reproducción
         */
        handleTimeUpdate() {
            if (!AppState.currentTrack) return;

            const currentTime = DOM.audioPlayer.currentTime;
            const duration = DOM.audioPlayer.duration;

            if (isFinite(duration)) {
                const progress = (currentTime / duration) * 100;
                DOM.progressFill.css('width', progress + '%');

                DOM.currentTime.text(UIHelper.formatTime(currentTime));
                DOM.durationTime.text(UIHelper.formatTime(duration));
            }
        },

        /**
         * Maneja el final de la reproducción
         */
        handleTrackEnd() {
            AppState.isPlaying = false;
            this.updatePlayButton();
            DOM.progressFill.css('width', '0%');
            console.log('🔄 Canción terminada');
        },

        /**
         * Maneja errores de reproducción
         */
        handleError(e) {
            console.error('❌ Error de audio:', e);
            UIHelper.showError('Error al cargar el audio');
            AppState.isPlaying = false;
            this.updatePlayButton();
        },

        /**
         * Maneja el click en la barra de progreso
         */
        handleProgressClick(e) {
            if (!AppState.currentTrack || !isFinite(DOM.audioPlayer.duration)) return;

            const rect = DOM.progressBar[0].getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const clickPercent = clickX / width;
            const newTime = clickPercent * DOM.audioPlayer.duration;

            DOM.audioPlayer.currentTime = newTime;
        },

        /**
         * Maneja el toggle del shuffle
         */
        handleShuffleToggle() {
            DOM.shuffleBtn.toggleClass('active');
            const isActive = DOM.shuffleBtn.hasClass('active');
            UIHelper.showInfo(isActive ? 'Reproducción aleatoria activada' : 'Reproducción aleatoria desactivada');
        },

        /**
         * Maneja el toggle del repeat
         */
        handleRepeatToggle() {
            DOM.repeatBtn.toggleClass('active');
            const isActive = DOM.repeatBtn.hasClass('active');
            UIHelper.showInfo(isActive ? 'Repetir activado' : 'Repetir desactivado');
        },

        /**
         * Maneja el toggle del like
         */
        handleLikeToggle() {
            const icon = DOM.likeBtn.find('i');
            const isLiked = icon.hasClass('fas');

            if (isLiked) {
                icon.removeClass('fas').addClass('far');
                UIHelper.showInfo('Eliminado de canciones que te gustan');
            } else {
                icon.removeClass('far').addClass('fas');
                UIHelper.showInfo('Agregado a canciones que te gustan');
            }
        }
    };

    // ============================================
    // MÓDULO: GESTIÓN DE VOLUMEN ✨ NUEVO
    // ============================================
    const VolumeManager = {
        /**
         * Inicializa los controles de volumen
         */
        init() {
            this.setupVolumeControls();
        },

        /**
         * Configura los eventos de los controles de volumen
         */
        setupVolumeControls() {
            // Botón de mute/unmute
            DOM.volumeBtn.on('click', () => this.toggleMute());

            // Barra de volumen - click
            DOM.volumeBar.on('click', (e) => this.handleVolumeBarClick(e));

            // Slider de volumen (si existe)
            DOM.volumeSlider.on('input change', (e) => {
                const volume = parseFloat(e.target.value);
                this.setVolume(volume);
            });

            // Drag en la barra de volumen
            let isDragging = false;
            DOM.volumeBar.on('mousedown', () => {
                isDragging = true;
            });

            $(document).on('mousemove', (e) => {
                if (isDragging) {
                    this.handleVolumeBarClick(e);
                }
            });

            $(document).on('mouseup', () => {
                isDragging = false;
            });
        },

        /**
         * Maneja el click en la barra de volumen
         * @param {Event} e - Evento del mouse
         */
        handleVolumeBarClick(e) {
            const $bar = DOM.volumeBar;
            if ($bar.length === 0) return;

            const rect = $bar[0].getBoundingClientRect();
            let clickPosition, totalSize;

            // Determinar si la barra es horizontal o vertical
            if ($bar.hasClass('vertical') || $bar.height() > $bar.width()) {
                // Barra vertical (común en Spotify)
                clickPosition = rect.bottom - e.clientY;
                totalSize = rect.height;
            } else {
                // Barra horizontal
                clickPosition = e.clientX - rect.left;
                totalSize = rect.width;
            }

            const clickPercent = Math.max(0, Math.min(1, clickPosition / totalSize));
            this.setVolume(clickPercent);
        },

        /**
         * Establece el volumen
         * @param {number} volume - Volumen entre 0 y 1
         */
        setVolume(volume) {
            volume = Math.max(0, Math.min(1, volume));
            
            AppState.currentVolume = volume;
            AppState.isMuted = volume === 0;
            
            DOM.audioPlayer.volume = volume;
            this.updateVolumeUI(volume);

            console.log('🔊 Volumen establecido:', Math.round(volume * 100) + '%');
        },

        /**
         * Actualiza la UI del volumen
         * @param {number} volume - Volumen entre 0 y 1
         */
        updateVolumeUI(volume) {
            // Actualizar fill de la barra de volumen
            DOM.volumeFill.css('height', (volume * 100) + '%');
            DOM.volumeFill.css('width', (volume * 100) + '%');

            // Actualizar slider (si existe)
            DOM.volumeSlider.val(volume);

            // Actualizar icono del botón
            this.updateVolumeIcon(volume);
        },

        /**
         * Actualiza el icono del botón de volumen
         * @param {number} volume - Volumen entre 0 y 1
         */
        updateVolumeIcon(volume) {
            const $icon = DOM.volumeBtn.find('i');
            
            $icon.removeClass('fa-volume-off fa-volume-down fa-volume-up fa-volume-mute');

            if (volume === 0 || AppState.isMuted) {
                $icon.addClass('fa-volume-mute');
            } else if (volume < 0.5) {
                $icon.addClass('fa-volume-down');
            } else {
                $icon.addClass('fa-volume-up');
            }
        },

        /**
         * Alterna entre mute y unmute
         */
        toggleMute() {
            if (AppState.isMuted) {
                // Unmute: restaurar volumen anterior
                this.setVolume(AppState.previousVolume);
                AppState.isMuted = false;
            } else {
                // Mute: guardar volumen actual y silenciar
                AppState.previousVolume = AppState.currentVolume;
                this.setVolume(0);
                AppState.isMuted = true;
            }
        }
    };

    // ============================================
    // MÓDULO: NAVEGACIÓN
    // ============================================
    const NavigationManager = {
        /**
         * Inicializa la navegación del sidebar
         */
        init() {
            DOM.navItems.on('click', (e) => this.handleNavClick(e));
        },

        /**
         * Maneja el click en items de navegación
         */
        handleNavClick(e) {
            e.preventDefault();

            const $item = $(e.currentTarget);

            // Remover clase active de todos los items
            DOM.navItems.removeClass('active');
            // Agregar clase active al item clickeado
            $item.addClass('active');

            const navText = $item.find('span').text();

            // Simular navegación
            switch (navText) {
                case 'Inicio':
                    UIHelper.showInfo('Vista de Inicio');
                    break;
                case 'Buscar':
                    DOM.searchInput.focus();
                    UIHelper.showInfo('Busca tu música favorita');
                    break;
                case 'Tu biblioteca':
                    UIHelper.showInfo('Tu biblioteca personal');
                    break;
                case 'Crear playlist':
                    UIHelper.showInfo('Crear nueva playlist');
                    break;
                case 'Canciones que te gustan':
                    UIHelper.showInfo('Tus canciones favoritas');
                    break;
            }
        }
    };

    // ============================================
    // MÓDULO: ATAJOS DE TECLADO
    // ============================================
    const KeyboardManager = {
        /**
         * Inicializa los atajos de teclado
         */
        init() {
            $(document).on('keydown', (e) => this.handleKeyPress(e));
        },

        /**
         * Maneja las pulsaciones de teclas
         */
        handleKeyPress(e) {
            // Evitar atajos cuando se está escribiendo
            if ($(e.target).is('input, textarea')) {
                return;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    PlayerManager.togglePlayPause();
                    break;
                case 'KeyF':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        DOM.searchInput.focus();
                    }
                    break;
                case 'Escape':
                    DOM.searchInput.blur();
                    break;
                case 'KeyM':
                    VolumeManager.toggleMute();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    VolumeManager.setVolume(AppState.currentVolume + 0.1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    VolumeManager.setVolume(AppState.currentVolume - 0.1);
                    break;
            }
        }
    };

    // ============================================
    // MÓDULO: UTILIDADES DE UI
    // ============================================
    const UIHelper = {
        /**
         * Formatea el tiempo en minutos:segundos
         * @param {number} seconds - Tiempo en segundos
         * @returns {string} Tiempo formateado (mm:ss)
         */
        formatTime(seconds) {
            if (!isFinite(seconds)) return '0:00';

            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        },

        /**
         * Escapa caracteres HTML para prevenir XSS
         * @param {string} text - Texto a escapar
         * @returns {string} Texto escapado
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        /**
         * Muestra un mensaje de error temporal
         * @param {string} message - Mensaje de error
         */
        showError(message) {
            console.error('❌', message);
            this.showNotification(message, 'error', '#f44336');
        },

        /**
         * Muestra un mensaje informativo temporal
         * @param {string} message - Mensaje informativo
         */
        showInfo(message) {
            console.log('ℹ️', message);
            this.showNotification(message, 'info', 'var(--spotify-green)');
        },

        /**
         * Muestra una notificación
         * @param {string} message - Mensaje a mostrar
         * @param {string} type - Tipo de notificación (error, info)
         * @param {string} color - Color de fondo
         */
        showNotification(message, type, color) {
            const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
            const duration = type === 'error' ? 3000 : 2000;

            const $notification = $(`
                <div class="notification ${type}" style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: ${color};
                    color: white;
                    padding: 16px 20px;
                    border-radius: 8px;
                    z-index: 9999;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    transform: translateX(400px);
                    transition: all 0.3s ease;
                ">
                    <i class="fas ${icon}" style="margin-right: 8px;"></i>
                    ${message}
                </div>
            `);

            $('body').append($notification);

            // Animar entrada
            setTimeout(() => {
                $notification.css('transform', 'translateX(0)');
            }, 100);

            // Remover después del tiempo especificado
            setTimeout(() => {
                $notification.css('transform', 'translateX(400px)');
                setTimeout(() => $notification.remove(), 300);
            }, duration);
        }
    };

    // ============================================
    // MÓDULO: RESPONSIVE Y ADAPTABILIDAD
    // ============================================
    const ResponsiveManager = {
        /**
         * Inicializa el manejo responsive
         */
        init() {
            this.handleResize();
            $(window).on('resize', () => this.handleResize());
            this.preventUnwantedBehaviors();
        },

        /**
         * Maneja cambios de tamaño de ventana
         */
        handleResize() {
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                $('.spotify-sidebar').hide();
            } else {
                $('.spotify-sidebar').show();
            }
        },

        /**
         * Previene comportamientos no deseados
         */
        preventUnwantedBehaviors() {
            // Prevenir drag and drop de imágenes
            $('img').on('dragstart', (e) => e.preventDefault());

            // Prevenir selección de texto en controles
            $('.control-btn, .play-btn, .nav-item').on('selectstart', (e) => e.preventDefault());
        }
    };

    // ============================================
    // INICIALIZACIÓN DE LA APLICACIÓN
    // ============================================
    function initializeApp() {
        console.log('🚀 Inicializando módulos...');

        // Inicializar todos los módulos
        SearchManager.init();
        PlayerManager.init();
        VolumeManager.init(); // ✨ Nuevo módulo de volumen
        NavigationManager.init();
        KeyboardManager.init();
        ResponsiveManager.init();

        // Auto-focus en desktop
        if (window.innerWidth > 768) {
            setTimeout(() => {
                DOM.searchInput.focus();
            }, 1000);
        }

        // Verificar compatibilidad del navegador
        checkBrowserCompatibility();

        console.log('✅ Todos los módulos inicializados correctamente');
        console.log('💡 Atajos de teclado disponibles:');
        console.log('   • Espacio: Reproducir/Pausar');
        console.log('   • Ctrl+F (Cmd+F): Enfocar búsqueda');
        console.log('   • M: Silenciar/Activar sonido');
        console.log('   • ↑/↓: Subir/Bajar volumen');
        console.log('   • Esc: Desenfocar búsqueda');
    }

    // ============================================
    // VERIFICACIÓN DE COMPATIBILIDAD
    // ============================================
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

    // Ejecutar inicialización
    initializeApp();
});
