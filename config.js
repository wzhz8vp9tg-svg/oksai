window.OKSAI_API_URL = "https://script.google.com/macros/s/AKfycbwW4D8WAN6UTQM3xHtQgs35n_aD3m8UKvtSIp48LnDBUQsODCS2EZy4vnkNYtjQGWq2Kg/exec";

// 참가자 완료 화면에서는 재시작/처음 화면 버튼을 아예 보이지 않게 합니다.
(function () {
  const style = document.createElement('style');
  style.textContent = '#final .actions{display:none!important}';
  document.head.appendChild(style);

  const COMPLETE_KEY = 'oksai_game_complete_v1';
  const COMPLETE_NAME_KEY = 'oksai_game_complete_name_v1';

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
    const params = new URLSearchParams(location.search);
    if (params.get('reset') === '1') {
      localStorage.removeItem(COMPLETE_KEY);
      localStorage.removeItem(COMPLETE_NAME_KEY);
      history.replaceState({}, '', location.pathname);
    }

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
