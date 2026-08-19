const PlayerModule = (() => {
  let ytPlayer = null;
  let isReady = false;
  let timeUpdateInterval = null;

  let callbacks = {
    onStateChange: () => {},
    onReady: () => {},
    onProgress: () => {}
  };

  function init(callbackHandlers) {
    callbacks = { ...callbacks, ...callbackHandlers };
    
    window.onYouTubeIframeAPIReady = () => {
      ytPlayer = new YT.Player('yt-player', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: (e) => console.error('YT Player Error:', e)
        }
      });
    };
  }

  function onPlayerReady(event) {
    isReady = true;
    const settings = StorageModule.getSettings();
    setVolume(settings.volume);
    callbacks.onReady();
  }

  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      startTimeTracking();
    } else {
      stopTimeTracking();
    }
    callbacks.onStateChange(event.data);
  }

  function startTimeTracking() {
    stopTimeTracking();
    timeUpdateInterval = setInterval(() => {
      if (ytPlayer && ytPlayer.getCurrentTime) {
        const currentTime = ytPlayer.getCurrentTime() || 0;
        const duration = ytPlayer.getDuration() || 0;
        callbacks.onProgress(currentTime, duration);
      }
    }, 500);
  }

  function stopTimeTracking() {
    if (timeUpdateInterval) clearInterval(timeUpdateInterval);
  }

  function loadVideo(videoId) {
    if (!isReady) return;
    ytPlayer.loadVideoById(videoId);
  }

  function play() {
    if (isReady && ytPlayer.playVideo) ytPlayer.playVideo();
  }

  function pause() {
    if (isReady && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
  }

  function seekTo(seconds) {
    if (isReady && ytPlayer.seekTo) ytPlayer.seekTo(seconds, true);
  }

  function setVolume(volumePercentage) {
    if (isReady && ytPlayer.setVolume) {
      ytPlayer.setVolume(volumePercentage);
    }
  }

  function setQuality(suggestedQuality) {
    if (isReady && ytPlayer.setPlaybackQuality) {
      ytPlayer.setPlaybackQuality(suggestedQuality);
    }
  }

  return {
    init,
    loadVideo,
    play,
    pause,
    seekTo,
    setVolume,
    setQuality
  };
})();

