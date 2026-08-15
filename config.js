window.OKSAI_API_URL = "https://script.google.com/macros/s/AKfycbwW4D8WAN6UTQM3xHtQgs35n_aD3m8UKvtSIp48LnDBUQsODCS2EZy4vnkNYtjQGWq2Kg/exec";

// 참가자 완료 화면에서는 재시작/처음 화면 버튼을 보이지 않게 합니다.
(function () {
  const COMPLETE_KEY = 'oksai_game_complete_v1';
  const COMPLETE_NAME_KEY = 'oksai_game_complete_name_v1';

  // 관리자/테스트용 강제 초기화.
  // ?reset=1 또는 #reset 으로 들어오면 완료 기록을 지운 뒤
  // 캐시를 피하기 위해 새 주소로 한 번 더 이동합니다.
  const params = new URLSearchParams(location.search);
  const wantsReset = params.get('reset') === '1' || location.hash === '#reset';
  if (wantsReset) {
    localStorage.removeItem(COMPLETE_KEY);
    localStorage.removeItem(COMPLETE_NAME_KEY);
    const freshUrl = location.pathname + '?fresh=' + Date.now();
    location.replace(freshUrl);
    return;
  }

  const style = document.createElement('style');
  style.textContent = '#final .actions{display:none!important}';
  document.head.appendChild(style);

  function showCompletedScreen() {
    const home = document.getElementById('home');
    const game = document.getElementById('game');
    const traits = document.getElementById('traits');
    const selfpick = document.getElementById('selfpick');
    const final = document.getElementById('final');
    const doneName = document.getElementById('doneName');
    const progress = document.getElementById('progress');

    [home, game, traits, selfpick].forEach(el => el && el.classList.add('hidden'));
    if (final) final.classList.remove('hidden');
    if (doneName) doneName.textContent = localStorage.getItem(COMPLETE_NAME_KEY) || '';
    if (progress) progress.textContent = '완료';

    if (final) {
      final.querySelectorAll('button').forEach(btn => btn.remove());
    }
    window.scrollTo(0, 0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.finishGame === 'function') {
      const originalFinishGame = window.finishGame;
      window.finishGame = function (selfIndex) {
        const nameEl = document.getElementById('nameInput');
        const name = (window.player || (nameEl && nameEl.value) || '').trim();
        originalFinishGame(selfIndex);
        localStorage.setItem(COMPLETE_KEY, '1');
        localStorage.setItem(COMPLETE_NAME_KEY, name);
        setTimeout(showCompletedScreen, 0);
      };
    }

    if (localStorage.getItem(COMPLETE_KEY) === '1') {
      showCompletedScreen();
    }
  });
})();
