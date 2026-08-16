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

  // 대표카드 계산 규칙
  // 1) 참가자가 자신을 설명하는 문장 4개를 1~4순위로 선택: 4·3·2·1점
  // 2) 각 인물의 방에서 첫 시도에 정답을 맞히면 해당 인물 친화도 +1점
  // 3) 한 번 이상 틀린 뒤 정답을 맞히면 퀴즈 정답으로는 인정하지만 친화도 보너스는 없음
  // 따라서 '지식 정답'과 '성향 친화도'를 분리해 기록합니다.
  const TRAIT_ITEMS = [
    {card:0, text:'중요한 결정을 앞두면 주변 분위기보다 근거와 책임을 먼저 살피는 편이다.'},
    {card:0, text:'모두가 당연하다고 여기는 방식도 필요하면 다시 질문하는 편이다.'},
    {card:1, text:'반복되는 문제를 보면 개인의 성격보다 역할·권한·환경의 구조를 먼저 살피는 편이다.'},
    {card:1, text:'누가 감정노동이나 잡무를 더 많이 떠맡는지 업무 배분의 패턴을 눈여겨보는 편이다.'},
    {card:2, text:'불편함이나 분노가 생기면 없애기보다 그것이 무엇을 알려주는지 생각해보는 편이다.'},
    {card:2, text:'같은 사건도 위치와 경험이 다르면 다르게 보일 수 있다고 생각하는 편이다.'},
    {card:3, text:'말이 적은 사람의 의견도 의사결정에 들어오게 하는 방법을 찾는 편이다.'},
    {card:3, text:'한 사람의 이야기만으로 전체를 판단하지 않으려고 여러 목소리를 듣는 편이다.'},
    {card:4, text:'모두에게 똑같은 규칙인지보다 실제로 누가 더 불리한지 먼저 살피는 편이다.'},
    {card:4, text:'누군가 혼자 문제를 감당하고 있으면 개인의 부담보다 함께 해결할 방법을 먼저 찾는 편이다.'},
    {card:5, text:'좋은 사람의 선의보다 기록·보고·이의제기 같은 절차가 중요하다고 생각하는 편이다.'},
    {card:5, text:'같은 문제가 반복되면 개인의 중재보다 기준과 프로토콜을 남겨야 한다고 생각하는 편이다.'}
  ];
  const RANK_WEIGHTS = [4,3,2,1];

  const style = document.createElement('style');
  style.textContent = `
    #final .actions{display:none!important}
    #finalResultCard{max-width:760px;margin:22px auto 4px;text-align:left;border:1px solid rgba(216,181,110,.35);border-radius:24px;background:linear-gradient(145deg,rgba(216,181,110,.10),rgba(127,45,40,.10));overflow:hidden}
    #finalResultCard .resultPhoto{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#17120e}
    #finalResultCard .resultBody{padding:24px}
    #finalResultCard .resultLabel{color:#d8b56e;letter-spacing:.14em;font-size:12px;font-weight:800}
    #finalResultCard h3{font-family:serif;color:#f0d79b;font-size:clamp(28px,5vw,42px);margin:8px 0 4px}
    #finalResultCard .power{color:#d8b56e;font-weight:800;margin-bottom:13px}
    #finalResultCard .why{color:#ddd1bf;line-height:1.8;margin:0 0 12px}
    #finalResultCard .basis{color:#b9ad9b;font-size:13px;line-height:1.65;margin:0 0 20px}
    #finalResultCard .matchBox{border-top:1px solid rgba(216,181,110,.22);padding-top:18px;line-height:1.75}
    #finalResultCard .matchGood{color:#f0d79b;font-weight:800;font-size:18px}
    #finalResultCard .matchOther{color:#d7c7ac;font-weight:700;font-size:17px}
    @media(max-width:720px){#finalResultCard .resultBody{padding:19px}}
  `;
  document.head.appendChild(style);

  function affinityScores() {
    const scores = Array(6).fill(0);

    // 자기 성향 선택: 1~4순위 = 4·3·2·1점
    if (typeof traitChoices !== 'undefined' && Array.isArray(traitChoices)) {
      traitChoices.forEach(function(itemIndex, rank){
        const item = TRAIT_ITEMS[itemIndex];
        if (item) scores[item.card] += RANK_WEIGHTS[rank] || 0;
      });
    }

    // 퀴즈 첫 시도 정답: 그 방의 인물 친화도 +1
    // stages와 cardMeta는 같은 순서(판단·구조·관점·목소리·연대·제도)입니다.
    if (typeof attempts !== 'undefined' && Array.isArray(attempts)) {
      attempts.forEach(function(count, stageIndex){
        if (count === 1 && stageIndex >= 0 && stageIndex < scores.length) {
          scores[stageIndex] += 1;
        }
      });
    }
    return scores;
  }

  function representativeIndex() {
    const scores = affinityScores();
    const max = Math.max.apply(null, scores);

    // 동점 1순위: 참가자가 성향문장에서 더 먼저 고른 카드
    if (typeof traitChoices !== 'undefined' && Array.isArray(traitChoices)) {
      for (const itemIndex of traitChoices) {
        const item = TRAIT_ITEMS[itemIndex];
        if (item && scores[item.card] === max) return item.card;
      }
    }

    // 동점 2순위: 첫 시도 정답을 더 먼저 기록한 방
    if (typeof attempts !== 'undefined' && Array.isArray(attempts)) {
      for (let i = 0; i < attempts.length; i++) {
        if (attempts[i] === 1 && scores[i] === max) return i;
      }
    }
    return scores.indexOf(max) >= 0 ? scores.indexOf(max) : 0;
  }

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
        <div class="resultLabel">GAME DISCOVERED CARD</div>
        <h3>${predicted.name}</h3>
        <div class="power">핵심 힘 · ${predicted.power}</div>
        <p class="why">${predicted.text}</p>
        <p class="basis">게임이 발견한 카드는 ‘내가 고른 성향 문장의 우선순위’와 ‘각 인물의 방에서 첫 시도에 정답을 알아본 기록’을 함께 반영해 계산했습니다. 심리검사나 성격 진단이 아니라 이 게임 안에서 드러난 친화도를 보여주는 결과입니다.</p>
        <div class="matchBox">
          <div><strong>내가 직접 고른 카드</strong> · ${self.name}</div>
          ${matched
            ? `<div class="matchGood">✨ 공명 매치! 게임이 발견한 카드와 내가 고른 카드가 같습니다.</div>`
            : `<div class="matchOther">🌿 나는 ‘${self.power}’의 힘을 선택했고, 게임에서는 ‘${predicted.power}’의 친화도가 가장 높게 나타났습니다.</div>`}
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
    const traitsSection = document.getElementById('traits');
    if (traitsSection) {
      const title = traitsSection.querySelector('.step-title');
      const sub = traitsSection.querySelector('.muted');
      if (title) title.textContent = '나를 가장 잘 설명하는 문장 4개를 순서대로 골라주세요';
      if (sub) sub.textContent = '1~4순위에는 4·3·2·1점이 주어지고, 각 인물의 방을 첫 시도에 맞힌 경우 해당 인물 친화도 +1점이 더해집니다.';
    }
    const doneMuted = document.querySelector('#final .donebox .muted');
    if (doneMuted) doneMuted.textContent = '게임이 발견한 나의 인물 카드와 내가 고른 카드를 비교해보세요.';

    window.renderTraits = function () {
      traitGrid.innerHTML = '';
      TRAIT_ITEMS.forEach(function(item, i){
        const b = document.createElement('button');
        b.className = 'trait';
        b.dataset.i = i;
        b.textContent = item.text;
        b.onclick = function(){ pickTrait(i, b); };
        traitGrid.appendChild(b);
      });
    };

    window.pickTrait = function (i, b) {
      const pos = traitChoices.indexOf(i);
      if (pos >= 0) traitChoices.splice(pos, 1);
      else {
        if (traitChoices.length >= 4) return;
        traitChoices.push(i);
      }
      document.querySelectorAll('.trait').forEach(function(x){
        const j = +x.dataset.i;
        const p = traitChoices.indexOf(j);
        x.classList.toggle('selected', p >= 0);
        const old = x.querySelector('.rank-badge');
        if (old) old.remove();
        if (p >= 0) x.insertAdjacentHTML('beforeend', `<span class="rank-badge">${p+1}순위</span>`);
      });
      traitNext.disabled = traitChoices.length !== 4;
    };

    window.predictedCard = representativeIndex;

    window.finishGame = function (selfIndex) {
      const finishAt = Date.now();
      const pred = representativeIndex();
      const scores = affinityScores();
      const firstCorrect = attempts.filter(function(a){ return a === 1; }).length;
      const selectedTraits = traitChoices.map(function(i){
        const item = TRAIT_ITEMS[i];
        return item ? cardMeta[item.card].name : '';
      });
      const payload = {
        session_id: sessionId,
        name: player,
        start_time: new Date(startAt).toISOString(),
        finish_time: new Date(finishAt).toISOString(),
        duration_ms: finishAt - startAt,
        first_choices: firstChoices,
        attempts: attempts,
        first_correct: firstCorrect,
        trait_choices: selectedTraits,
        predicted_card: cardMeta[pred].name,
        self_card: cardMeta[selfIndex].name,
        self_match: pred === selfIndex
      };
      submit(payload);
      selfpick.classList.add('hidden');
      final.classList.remove('hidden');
      doneName.textContent = player;
      progress.textContent = '완료';

      const result = {predictedIndex: pred, selfIndex: selfIndex, scores: scores};
      localStorage.setItem(COMPLETE_KEY, '1');
      localStorage.setItem(COMPLETE_NAME_KEY, player);
      localStorage.setItem(COMPLETE_RESULT_KEY, JSON.stringify(result));
      renderResult(result);
      showCompletedScreen();
    };

    if (localStorage.getItem(COMPLETE_KEY) === '1') showCompletedScreen();
  });
})();
