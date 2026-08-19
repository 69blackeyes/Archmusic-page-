// APNI YOUTUBE API KEY YAHAN PASTE KAREIN
const YOUTUBE_API_KEY = 'Api_key';

document.addEventListener('DOMContentLoaded', () => {
  let currentPlaylist = [];
  let currentTrackIndex = -1;
  let isPlaying = false;

  // Fallback demo list (Homepage display ke liye)
  const mockTrending = [
    { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', artwork: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
    { id: '3JZ_D3ELwOQ', title: 'Calm Down', artist: 'Rema', artwork: 'https://img.youtube.com/vi/3JZ_D3ELwOQ/hqdefault.jpg' },
    { id: 'L_LUpnjgPso', title: 'Ride', artist: 'Twenty One Pilots', artwork: 'https://img.youtube.com/vi/L_LUpnjgPso/hqdefault.jpg' },
    { id: '09R8_2nJtjg', title: 'Sugar', artist: 'Maroon 5', artwork: 'https://img.youtube.com/vi/09R8_2nJtjg/hqdefault.jpg' }
  ];

  // DOM Elements
  const playPauseBtn = document.getElementById('play-pause-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const favoriteBtn = document.getElementById('favorite-btn');
  const seekBar = document.getElementById('seek-bar');
  const volumeBar = document.getElementById('volume-bar');
  const currentTimeEl = document.getElementById('current-time');
  const totalDurationEl = document.getElementById('total-duration');
  const miniTitle = document.getElementById('mini-title');
  const miniArtist = document.getElementById('mini-artist');
  const miniArtwork = document.getElementById('mini-artwork');
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');
  const searchResultsEl = document.getElementById('search-results');
  const trendingListEl = document.getElementById('trending-list');
  const libraryContentEl = document.getElementById('library-content');
  const qualitySelector = document.getElementById('quality-selector');
  const clearStorageBtn = document.getElementById('clear-storage-btn');

  // Player Init
  PlayerModule.init({
    onReady: () => {
      renderTrending();
      renderLibrary('favorites');
      applySavedSettings();
    },
    onStateChange: (state) => {
      if (state === 1) {
        isPlaying = true;
        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
      } else if (state === 2) {
        isPlaying = false;
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      } else if (state === 0) {
        isPlaying = false;
        playNextTrack();
      }
    },
    onProgress: (currentTime, duration) => {
      if (!isNaN(duration) && duration > 0) {
        seekBar.value = (currentTime / duration) * 100;
        seekBar.setAttribute('data-duration', duration);
        currentTimeEl.textContent = formatTime(currentTime);
        totalDurationEl.textContent = formatTime(duration);
      }
    }
  });

  // Navigation Logic
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      
      btn.classList.add('active');
      const tabId = `tab-${btn.dataset.tab}`;
      document.getElementById(tabId).classList.add('active');
      
      if (btn.dataset.tab === 'library') {
        renderLibrary('favorites');
      }
    });
  });

  document.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLibrary(btn.dataset.subtab);
    });
  });

  // Real YouTube API Search Implementation
  async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    searchResultsEl.innerHTML = '<p style="color: var(--text-muted)">Searching YouTube...</p>';

    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        searchResultsEl.innerHTML = '<p style="color: var(--text-muted)">No results found.</p>';
        return;
      }

      const searchResults = data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        artwork: item.snippet.thumbnails.high.url
      }));

      renderTrackList(searchResultsEl, searchResults);

    } catch (error) {
      console.error('Search API Error:', error);
      searchResultsEl.innerHTML = '<p style="color: var(--primary)">Search failed. Please verify your API Key.</p>';
    }
  }

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  // Render Functions
  function renderTrending() {
    trendingListEl.innerHTML = '';
    mockTrending.forEach((track) => {
      const card = document.createElement('div');
      card.className = 'track-card';
      card.innerHTML = `
        <img src="${track.artwork}" alt="${track.title}">
        <div class="title truncate">${track.title}</div>
        <div class="artist truncate">${track.artist}</div>
      `;
      card.addEventListener('click', () => {
        currentPlaylist = [...mockTrending];
        playTrack(track);
      });
      trendingListEl.appendChild(card);
    });
  }

  function renderTrackList(container, tracks) {
    container.innerHTML = '';
    if (tracks.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted)">No items found.</p>';
      return;
    }
    tracks.forEach((track) => {
      const item = document.createElement('div');
      item.className = 'track-item';
      item.innerHTML = `
        <img src="${track.artwork}" alt="${track.title}">
        <div class="details">
          <span class="title truncate">${track.title}</span>
          <span class="artist truncate">${track.artist}</span>
        </div>
      `;
      item.addEventListener('click', () => {
        currentPlaylist = tracks;
        playTrack(track);
      });
      container.appendChild(item);
    });
  }

  function renderLibrary(type) {
    const data = type === 'favorites' ? StorageModule.getFavorites() : StorageModule.getHistory();
    renderTrackList(libraryContentEl, data);
  }

  // Playback Control Handlers
  function playTrack(track) {
    currentTrackIndex = currentPlaylist.findIndex(t => t.id === track.id);
    updateMiniPlayerUI(track);
    PlayerModule.loadVideo(track.id);
    StorageModule.addToHistory(track);
    updateFavoriteButtonState(track.id);
  }

  function playNextTrack() {
    if (currentPlaylist.length > 0 && currentTrackIndex < currentPlaylist.length - 1) {
      currentTrackIndex++;
      playTrack(currentPlaylist[currentTrackIndex]);
    }
  }

  function playPrevTrack() {
    if (currentPlaylist.length > 0 && currentTrackIndex > 0) {
      currentTrackIndex--;
      playTrack(currentPlaylist[currentTrackIndex]);
    }
  }

  function updateMiniPlayerUI(track) {
    miniTitle.textContent = track.title;
    miniArtist.textContent = track.artist;
    miniArtwork.src = track.artwork;
  }

  function updateFavoriteButtonState(trackId) {
    const isFav = StorageModule.isFavorite(trackId);
    favoriteBtn.innerHTML = isFav 
      ? '<i class="fa-solid fa-heart" style="color: var(--primary);"></i>' 
      : '<i class="fa-regular fa-heart"></i>';
  }

  // General Controls Event Listeners
  playPauseBtn.addEventListener('click', () => {
    if (!isPlaying) {
      PlayerModule.play();
    } else {
      PlayerModule.pause();
    }
  });

  nextBtn.addEventListener('click', playNextTrack);
  prevBtn.addEventListener('click', playPrevTrack);

  favoriteBtn.addEventListener('click', () => {
    if (currentTrackIndex !== -1 && currentPlaylist[currentTrackIndex]) {
      const track = currentPlaylist[currentTrackIndex];
      if (StorageModule.isFavorite(track.id)) {
        StorageModule.removeFavorite(track.id);
      } else {
        StorageModule.addFavorite(track);
      }
      updateFavoriteButtonState(track.id);
    }
  });

  seekBar.addEventListener('input', (e) => {
    const percent = e.target.value;
    const duration = parseFloat(seekBar.getAttribute('data-duration') || 0);
    if (duration) {
      const targetTime = (percent / 100) * duration;
      PlayerModule.seekTo(targetTime);
    }
  });

  volumeBar.addEventListener('input', (e) => {
    const val = e.target.value;
    PlayerModule.setVolume(val);
    StorageModule.saveSettings({ volume: val });
  });

  qualitySelector.addEventListener('change', (e) => {
    const quality = e.target.value;
    PlayerModule.setQuality(quality);
    StorageModule.saveSettings({ quality });
  });

  clearStorageBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear your local history and favorites?")) {
      StorageModule.clearAll();
      renderLibrary('favorites');
      alert('Local storage cleared.');
    }
  });

  function applySavedSettings() {
    const settings = StorageModule.getSettings();
    if (settings.volume !== undefined) {
      volumeBar.value = settings.volume;
    }
    if (settings.quality) {
      qualitySelector.value = settings.quality;
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
});
