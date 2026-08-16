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

  const POWER_INDEX = {판단:0, 구조:1, 관점:2, 목소리:3, 연대:4, 제도:5};
  const POWER_NAMES = ['판단','구조','관점','목소리','연대','제도'];

  // 각 선택지는 모두 나름의 합리적인 관점을 대표합니다.
  // 정답은 그 상황에서 '가장 먼저/우선' 적용할 관점일 뿐, 다른 선택이 무가치하다는 뜻은 아닙니다.
  // firstLens는 참가자의 최초 반응만 기록합니다.
  const STAGE_PATCHES = [
    {
      choices:[
        '왜 이 관행이 계속 유지됐는지 역할·권한·업무 구조부터 살펴본다.',
        '지금 상황의 사실, 책임, 위험을 다시 검토해 이번 결정이 타당한지 판단한다.',
        '비슷한 문제가 반복되지 않도록 향후 적용할 기준과 절차를 문서화한다.'
      ],
      lenses:['구조','판단','제도'], correct:1,
      explain:'관행은 그 자체로 판단의 근거가 되지 않습니다. 이 상황에서는 먼저 현재의 사실·책임·위험을 독립적으로 판단한 뒤 구조나 제도 개선으로 이어가는 것이 핵심입니다.'
    },
    {
      choices:[
        '누구에게 어떤 일이 반복해서 몰리는지 업무 배분·권한·책임 구조를 확인한다.',
        '당사자가 그 부담을 어떻게 경험하고 있는지 충분히 듣고 의미를 파악한다.',
        '앞으로 같은 편중이 생기지 않도록 업무분장과 보고 기준을 명문화한다.'
      ],
      lenses:['구조','관점','제도'], correct:0,
      explain:'반복되는 부담은 개인의 성격보다 배분 구조에서 생길 수 있습니다. 이 상황에서는 먼저 패턴과 권한 구조를 확인하는 것이 우선입니다.'
    },
    {
      choices:[
        '감정과 사실을 구분해 어떤 근거가 확인되는지 차분히 점검한다.',
        '그 상담자가 충분히 말할 수 있도록 경험과 문제의식을 더 구체적으로 듣는다.',
        '그 불편함과 분노가 어떤 위험·불균형·가치를 감지한 신호인지 함께 검토한다.'
      ],
      lenses:['판단','목소리','관점'], correct:2,
      explain:'감정은 판단을 대신하지 않지만 중요한 인식 자료가 될 수 있습니다. 이 상황에서는 감정이 무엇을 감지했는지 탐색하는 관점이 핵심입니다.'
    },
    {
      choices:[
        '발언 순서·익명 의견·사전 수렴 등 다양한 목소리가 실제 의사결정에 들어오는 장치를 만든다.',
        '말하기 어려운 구성원끼리 서로 지지하고 함께 의견을 낼 수 있는 방법을 마련한다.',
        '회의 전 쟁점과 근거를 문서로 받아 발언의 크기보다 내용의 타당성을 비교한다.'
      ],
      lenses:['목소리','연대','판단'], correct:0,
      explain:'여러 사람이 존재한다고 해서 여러 목소리가 자동으로 반영되지는 않습니다. 이 상황에서는 말해지지 않은 관점이 의사결정에 들어오도록 통로를 만드는 것이 우선입니다.'
    },
    {
      choices:[
        '어떤 직급·돌봄 조건·장애 여부에서 이용 장벽이 커지는지 패턴을 먼저 분석한다.',
        '누구나 실제로 이용할 수 있도록 신청·보호·예외 기준을 제도로 보완한다.',
        '실제로 이용하기 어려운 사람들의 경험을 듣고 필요한 지원을 함께 설계한다.'
      ],
      lenses:['구조','제도','연대'], correct:2,
      explain:'형식적으로 같은 규칙보다 실제 접근 가능성이 중요합니다. 이 상황에서는 불리함을 겪는 사람들과 함께 필요한 지원을 설계하는 연대의 관점이 우선입니다.'
    },
    {
      choices:[
        '반복된 갈등 사례를 검토해 어떤 판단이 일관되게 필요한지 기준을 정리한다.',
        '보고·기록·이의제기·보호 절차를 명문화하고 담당자가 바뀌어도 동일하게 적용한다.',
        '특정 관리자에게 권한이 몰리지 않도록 역할과 책임의 구조를 다시 배분한다.'
      ],
      lenses:['판단','제도','구조'], correct:1,
      explain:'지속 가능한 권리는 개인의 선의보다 예측 가능한 절차로 보호되어야 합니다. 이 상황에서는 반복 가능한 제도를 만드는 것이 핵심입니다.'
    }
  ];

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
  const FIRST_CHOICE_POINTS = 2;
  const FIRST_CORRECT_BONUS = 1;

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
    #finalResultCard .basis{color:#b9ad9b;font-size:13px;line-height:1.65;margin:0 0 16px}
    #finalResultCard .scoreLine{color:#d7c7ac;font-size:13px;line-height:1.8;margin:0 0 20px;padding:12px 14px;border:1px solid rgba(216,181,110,.18);border-radius:12px;background:rgba(0,0,0,.12)}
    #finalResultCard .matchBox{border-top:1px solid rgba(216,181,110,.22);padding-top:18px;line-height:1.75}
    #finalResultCard .matchGood{color:#f0d79b;font-weight:800;font-size:18px}
    #finalResultCard .matchOther{color:#d7c7ac;font-weight:700;font-size:17px}
    @media(max-width:720px){#finalResultCard .resultBody{padding:19px}}
  `;
  document.head.appendChild(style);

  function firstChoiceLens(stageIndex) {
    if (typeof firstChoices === 'undefined' || !Array.isArray(firstChoices)) return '';
    const letter = firstChoices[stageIndex] || '';
    const choiceIndex = letter ? letter.charCodeAt(0) - 65 : -1;
    const patch = STAGE_PATCHES[stageIndex];
    return patch && choiceIndex >= 0 ? (patch.lenses[choiceIndex] || '') : '';
  }

  function affinityScores() {
    const scores = Array(6).fill(0);

    // 1) 실제 게임에서 처음 고른 관점: 해당 렌즈 +2
    for (let i = 0; i < STAGE_PATCHES.length; i++) {
      const lens = firstChoiceLens(i);
      if (lens && POWER_INDEX[lens] != null) scores[POWER_INDEX[lens]] += FIRST_CHOICE_POINTS;
    }

    // 2) 최초 선택이 그 방의 최적 정답이었다면 핵심 렌즈 +1 보너스
    if (typeof attempts !== 'undefined' && Array.isArray(attempts)) {
      attempts.forEach(function(count, stageIndex){
        if (count === 1 && stageIndex >= 0 && stageIndex < scores.length) {
          scores[stageIndex] += FIRST_CORRECT_BONUS;
        }
      });
    }

    // 3) 최종 자기보고 성향 문장: 1~4순위 = 4·3·2·1점
    if (typeof traitChoices !== 'undefined' && Array.isArray(traitChoices)) {
      traitChoices.forEach(function(itemIndex, rank){
        const item = TRAIT_ITEMS[itemIndex];
        if (item) scores[item.card] += RANK_WEIGHTS[rank] || 0;
      });
    }

    return scores;
  }

  function representativeIndex() {
    const scores = affinityScores();
    const max = Math.max.apply(null, scores);
    const tied = scores.map(function(v,i){return v===max?i:-1;}).filter(function(i){return i>=0;});
    if (tied.length === 1) return tied[0];

    // 동점이면 실제 게임의 최초 선택에서 더 자주 나온 렌즈 우선
    const firstCounts = Array(6).fill(0);
    for (let i=0;i<STAGE_PATCHES.length;i++) {
      const lens = firstChoiceLens(i);
      if (lens && POWER_INDEX[lens] != null) firstCounts[POWER_INDEX[lens]]++;
    }
    let best = tied[0];
    tied.forEach(function(i){ if (firstCounts[i] > firstCounts[best]) best = i; });
    if (firstCounts[best] > 0) return best;

    // 그래도 같으면 자기보고 성향에서 더 먼저 선택된 힘 우선
    if (typeof traitChoices !== 'undefined' && Array.isArray(traitChoices)) {
      for (const itemIndex of traitChoices) {
        const item = TRAIT_ITEMS[itemIndex];
        if (item && tied.includes(item.card)) return item.card;
      }
    }
    return best;
  }

  function scoreSummary(scores) {
    return scores.map(function(v,i){return POWER_NAMES[i]+' '+v;}).join(' · ');
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
    const scores = result.scores || [];
    box.innerHTML = `
      <img class="resultPhoto" src="${predicted.image}" alt="${predicted.name} 카드 이미지">
      <div class="resultBody">
        <div class="resultLabel">GAME DISCOVERED CARD</div>
        <h3>${predicted.name}</h3>
        <div class="power">주된 사고 렌즈 · ${predicted.power}</div>
        <p class="why">${predicted.text}</p>
        <p class="basis">이 결과는 정답률만으로 정하지 않습니다. 각 문제에서 처음 선택한 A·B·C가 어떤 사고 렌즈를 나타냈는지, 첫 선택이 그 상황의 최적 답이었는지, 마지막 성향 문장에서 무엇을 우선순위로 골랐는지를 함께 계산합니다. 다른 선택지는 ‘나쁜 답’이 아니라 서로 다른 관점을 뜻합니다.</p>
        ${scores.length ? `<div class="scoreLine"><strong>나의 렌즈 점수</strong><br>${scoreSummary(scores)}</div>` : ''}
        <div class="matchBox">
          <div><strong>내가 직접 고른 카드</strong> · ${self.name}</div>
          ${matched
            ? `<div class="matchGood">✨ 공명 매치! 게임에서 드러난 주된 렌즈와 내가 고른 카드가 같습니다.</div>`
            : `<div class="matchOther">🌿 나는 ‘${self.power}’의 힘을 선택했고, 게임에서는 ‘${predicted.power}’ 렌즈가 가장 높게 나타났습니다.</div>`}
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
    // 기존 6문항을 '서로 다른 합리적 관점 3개 + 상황상 최적 답 1개' 구조로 교체
    if (typeof stages !== 'undefined' && Array.isArray(stages)) {
      STAGE_PATCHES.forEach(function(patch, i){
        if (!stages[i]) return;
        stages[i].choices = patch.choices.slice();
        stages[i].correct = patch.correct;
        stages[i].explain = patch.explain;
        stages[i].lenses = patch.lenses.slice();
      });
    }

    const homeDesc = document.querySelector('#home .desc');
    if (homeDesc) homeDesc.textContent = '여섯 개의 방을 통과해 단서를 모으세요. 각 선택지는 서로 다른 사고 관점을 담고 있습니다. 상황에 가장 적절한 답을 찾는 과정과 내가 처음 고른 관점이 함께 기록됩니다.';

    const traitsSection = document.getElementById('traits');
    if (traitsSection) {
      const title = traitsSection.querySelector('.step-title');
      const sub = traitsSection.querySelector('.muted');
      if (title) title.textContent = '나를 가장 잘 설명하는 문장 4개를 순서대로 골라주세요';
      if (sub) sub.textContent = '게임에서 처음 고른 관점과 함께 계산됩니다. 1~4순위 문장에는 4·3·2·1점이 주어집니다.';
    }
    const doneMuted = document.querySelector('#final .donebox .muted');
    if (doneMuted) doneMuted.textContent = '게임에서 드러난 사고 렌즈와 내가 직접 고른 카드를 비교해보세요.';

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
      const firstChoiceLenses = STAGE_PATCHES.map(function(_,i){ return firstChoiceLens(i); });
      const payload = {
        session_id: sessionId,
        name: player,
        start_time: new Date(startAt).toISOString(),
        finish_time: new Date(finishAt).toISOString(),
        duration_ms: finishAt - startAt,
        first_choices: firstChoices,
        first_choice_lenses: firstChoiceLenses,
        attempts: attempts,
        first_correct: firstCorrect,
        trait_choices: selectedTraits,
        lens_scores: scores,
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