/* 自定义视频控制条：播放/暂停、可拖进度条、时间、音量、全屏（无下载入口） */
(function () {
  function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }
  function fmt(t) {
    if (!isFinite(t)) return '00:00';
    t = Math.max(0, t);
    var h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = Math.floor(t % 60);
    return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(s);
  }

  function build(video) {
    video.removeAttribute('controls');
    video.controlsList = 'nodownload noplaybackrate';
    video.disablePictureInPicture = true;

    var bar = document.createElement('div');
    bar.className = 'vc-bar';
    bar.innerHTML =
      '<button class="vc-btn vc-play" type="button" aria-label="播放/暂停">' +
        '<svg class="ic-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>' +
        '<svg class="ic-pause" viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>' +
      '</button>' +
      '<span class="vc-time vc-cur">00:00</span>' +
      '<div class="vc-timeline"><div class="vc-track"><div class="vc-buffer"></div><div class="vc-progress"></div><div class="vc-knob"></div></div></div>' +
      '<span class="vc-time vc-dur">00:00</span>' +
      '<button class="vc-btn vc-mute" type="button" aria-label="静音">' +
        '<svg class="ic-vol" viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>' +
        '<svg class="ic-mute" viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3zm14.6 2 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4-2.7-2.7z"/></svg>' +
      '</button>' +
      '<button class="vc-btn vc-fs" type="button" aria-label="全屏">' +
        '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>' +
      '</button>';

    var wrap = document.createElement('div');
    wrap.className = 'vc-wrap';
    video.parentNode.insertBefore(wrap, video);
    wrap.appendChild(video);
    wrap.appendChild(bar);

    var play = bar.querySelector('.vc-play');
    var mute = bar.querySelector('.vc-mute');
    var fs = bar.querySelector('.vc-fs');
    var cur = bar.querySelector('.vc-cur');
    var dur = bar.querySelector('.vc-dur');
    var timeline = bar.querySelector('.vc-timeline');
    var track = bar.querySelector('.vc-track');
    var buffer = bar.querySelector('.vc-buffer');
    var progress = bar.querySelector('.vc-progress');
    var knob = bar.querySelector('.vc-knob');

    function syncPlayUI() {
      var playing = !video.paused && !video.ended;
      bar.classList.toggle('playing', playing);
    }
    video.addEventListener('play', syncPlayUI);
    video.addEventListener('pause', syncPlayUI);
    video.addEventListener('ended', syncPlayUI);
    play.addEventListener('click', function () {
      if (video.paused || video.ended) video.play(); else video.pause();
    });
    video.addEventListener('click', function () {
      if (video.paused || video.ended) video.play(); else video.pause();
    });

    video.addEventListener('loadedmetadata', function () { dur.textContent = fmt(video.duration); });
    if (video.readyState >= 1) dur.textContent = fmt(video.duration);

    var dragging = false;
    function renderTime() {
      var d = video.duration || 0;
      var p = d ? video.currentTime / d : 0;
      progress.style.width = (p * 100) + '%';
      knob.style.left = (p * 100) + '%';
      cur.textContent = fmt(video.currentTime);
      if (video.buffered.length && d) {
        var end = video.buffered.end(video.buffered.length - 1);
        buffer.style.width = Math.min(100, end / d * 100) + '%';
      }
    }
    video.addEventListener('timeupdate', function () { if (!dragging) renderTime(); });
    video.addEventListener('progress', renderTime);

    function seekToClientX(clientX) {
      var r = track.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      if (video.duration) video.currentTime = p * video.duration;
      progress.style.width = (p * 100) + '%';
      knob.style.left = (p * 100) + '%';
      cur.textContent = fmt(video.currentTime);
    }
    timeline.addEventListener('pointerdown', function (e) {
      dragging = true;
      try { timeline.setPointerCapture(e.pointerId); } catch (err) {}
      seekToClientX(e.clientX);
      e.preventDefault();
    });
    timeline.addEventListener('pointermove', function (e) { if (dragging) seekToClientX(e.clientX); });
    timeline.addEventListener('pointerup', function (e) { dragging = false; });
    timeline.addEventListener('pointercancel', function () { dragging = false; });

    function syncMuteUI() { bar.classList.toggle('muted', video.muted || video.volume === 0); }
    mute.addEventListener('click', function () { video.muted = !video.muted; syncMuteUI(); });
    video.addEventListener('volumechange', syncMuteUI);

    function webFullOn() {
      wrap.classList.add('vc-webfull');
      wrap.classList.remove('vc-idle');
      document.documentElement.style.overflow = 'hidden';
    }
    function webFullOff() {
      wrap.classList.remove('vc-webfull');
      document.documentElement.style.overflow = '';
    }
    function isFull() {
      return !!(document.fullscreenElement || wrap.classList.contains('vc-webfull'));
    }
    fs.addEventListener('click', function () {
      if (isFull()) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          webFullOff();
        }
        return;
      }
      var launched = false;
      try {
        var p = wrap.requestFullscreen ? wrap.requestFullscreen()
              : (wrap.webkitRequestFullscreen ? wrap.webkitRequestFullscreen() : null);
        if (p && p.then) {
          p.then(function () { launched = true; })['catch'](function () { webFullOn(); });
          launched = true; /* 同步接受，异步失败在catch里兜底 */
        } else if (p !== undefined) {
          launched = true;
        }
      } catch (err) { launched = false; }
      /* 300ms后仍未进入原生全屏则启用网页全屏兜底 */
      setTimeout(function () {
        if (!document.fullscreenElement && !isFull()) webFullOn();
      }, 300);
    });
    document.addEventListener('fullscreenchange', function () {
      if (!document.fullscreenElement) webFullOff();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && wrap.classList.contains('vc-webfull')) webFullOff();
    });

    /* 控制条自动隐藏 */
    var hideTimer = null;
    function showBar() {
      wrap.classList.remove('vc-idle');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        if (!video.paused) wrap.classList.add('vc-idle');
      }, 2200);
    }
    wrap.addEventListener('mousemove', showBar);
    wrap.addEventListener('mouseleave', function () {
      if (!video.paused) wrap.classList.add('vc-idle');
    });
    video.addEventListener('play', showBar);
    video.addEventListener('pause', function () {
      clearTimeout(hideTimer);
      wrap.classList.remove('vc-idle');
    });

    syncPlayUI(); syncMuteUI(); renderTime();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('video.player').forEach(build);
  });
})();
