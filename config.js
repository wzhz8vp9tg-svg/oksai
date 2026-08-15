window.OKSAI_API_URL = "https://script.google.com/macros/s/AKfycbwW4D8WAN6UTQM3xHtQgs35n_aD3m8UKvtSIp48LnDBUQsODCS2EZy4vnkNYtjQGWq2Kg/exec";

(function () {
  const COMPLETE_KEY = 'oksai_game_complete_v1';
  const COMPLETE_NAME_KEY = 'oksai_game_complete_name_v1';
  const COMPLETE_RESULT_KEY = 'oksai_game_complete_result_v1';

  const params = new URLSearchParams(location.search);
  const wantsReset = params.get('reset') === '1' || location.hash === '#reset';
  if (wantsReset) {
    localStorage.removeItem(COMPLETE_KEY);
    localStorage.removeItem(COMPLETE_NAME_KEY);
    localStorage.removeItem(COMPLETE_RESULT_KEY);
    location.replace(location.pathname + '?fresh=' + Date.now());
    return;
  }

  const cardMeta = [
    {name:'한나 아렌트', power:'판단', image:'assets/cards/hannah-arendt.svg', text:'쉽게 휩쓸리기보다 멈춰 생각하고 스스로 판단하는 힘이 강합니다.'},
    {name:'우에노 지즈코', power:'구조', image:'assets/cards/ueno-chizuko.svg', text:'개인의 문제만 보지 않고 그 뒤의 구조와 맥락을 읽어내는 힘이 강합니다.'},
    {name:'앨리슨 재거', power:'관점', image:'assets/cards/alison-jaggar.svg', text:'감정과 경험 속 신호를 읽고 익숙한 시선을 새롭게 해석하는 힘이 강합니다.'},
    {name:'치마만다 응고지 아디치에', power:'목소리', image:'assets/cards/chimamanda-adichie.svg', text:'말해지지 않은 경험을 드러내고 자기 목소리로 변화를 만드는 힘이 강합니다.'},
    {name:'소저너 트루스', power:'연대', image:'assets/cards/sojourner-truth.svg', text:'차별과 장벽을 감지하고 사람들과 함께 서는 연대의 힘이 강합니다.'},
    {name:'루스 베이더 긴즈버그', power:'제도', image:'assets/cards/ruth-bader-ginsburg.svg', text:'좋은 의도를 원칙과 절차로 남겨 지속 가능한 변화를 만드는 힘이 강합니다.'}
  ];

  const style = document.createElement('style');
  style.textContent = `
    #final .actions{display:none!important}
    #finalResultCard{max-width:760px;margin:22px auto 4px;text-align:left;border:1px solid rgba(216,181,110,.35);border-radius:24px;background:linear-gradient(145deg,rgba(216,181,110,.10),rgba(127,45,40,.10));overflow:hidden}
    #finalResultCard .resultPhoto{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#17120e}
    #finalResultCard .resultBody{padding:24px}
    #finalResultCard .resultLabel{color:#d8b56e;letter-spacing:.14em;font-size:12px;font-weight:800}
    #finalResultCard h3{font-family:serif;color:#f0d79b;font-size:clamp(28px,5vw,42px);margin:8px 0 4px}
    #finalResultCard .power{color:#d8b56e;font-weight:800;margin-bottom:13px}
    #finalResultCard .why{color:#ddd1bf;line-height:1.8;margin:0 0 20px}
    #finalResultCard .matchBox{border-top:1px solid rgba(216,181,110,.22);padding-top:18px;line-height:1.75}
    #finalResultCard .matchGood{color:#f0d79b;font-weight:800;font-size:18px}
    #finalResultCard .matchOther{color:#d7c7ac;font-weight:700;font-size:17px}
    @media(max-width:720px){#finalResultCard .resultBody{padding:19px}}
  `;
  document.head.appendChild(style);

  function renderResult(result) {
    const final = document.getElementById('final');
    if (!final || !result) return;
    let box = document.getElementById('finalResultCard');
    if (!box) {
      box = document.createElement('div');
      box.id = 'finalResultCard';
      const done = final.querySelector('.donebox');
      if (done) done.insertAdjacentElement('afterend', box); else final.appendChild(box);
    }
    const predicted = cardMeta[result.predictedIndex] || cardMeta[0];
    const self = cardMeta[result.selfIndex] || cardMeta[0];
    const matched = result.predictedIndex === result.selfIndex;
    box.innerHTML = `
      <img class="resultPhoto" src="${predicted.image}" alt="${predicted.name} 카드 이미지">
      <div class="resultBody">
        <div class="resultLabel">YOUR REPRESENTATIVE CARD</div>
        <h3>${predicted.name}</h3>
        <div class="power">핵심 힘 · ${predicted.power}</div>
        <p class="why">${predicted.text}</p>
        <div class="matchBox">
          <div><strong>내가 직접 고른 카드</strong> · ${self.name}</div>
          ${matched
            ? `<div class="matchGood">✨ 자기매칭 성공! 자신을 꽤 정확하게 읽으셨네요.</div>`
            : `<div class="matchOther">🌿 또 다른 가능성으로 ‘${self.power}’의 힘을 선택했습니다.</div>`}
        </div>
      </div>`;
  }

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
    if (final) final.querySelectorAll('button').forEach(btn => btn.remove());
    try { renderResult(JSON.parse(localStorage.getItem(COMPLETE_RESULT_KEY) || 'null')); } catch(e) {}
    window.scrollTo(0, 0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.finishGame === 'function') {
      const originalFinishGame = window.finishGame;
      window.finishGame = function (selfIndex) {
        let predIndex = 0;
        try { predIndex = predictedCard(); } catch(e) {}
        const nameEl = document.getElementById('nameInput');
        let name = '';
        try { name = (player || (nameEl && nameEl.value) || '').trim(); }
        catch(e) { name = ((nameEl && nameEl.value) || '').trim(); }
        const result = {predictedIndex: predIndex, selfIndex: selfIndex};
        originalFinishGame(selfIndex);
        localStorage.setItem(COMPLETE_KEY, '1');
        localStorage.setItem(COMPLETE_NAME_KEY, name);
        localStorage.setItem(COMPLETE_RESULT_KEY, JSON.stringify(result));
        setTimeout(function(){ renderResult(result); showCompletedScreen(); }, 0);
      };
    }
    if (localStorage.getItem(COMPLETE_KEY) === '1') showCompletedScreen();
  });
})();
