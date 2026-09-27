/* =============================================================
   FELIZ ANIVERSÁRIO — motor de cenas
   Cena 0: fachada na neve → Cômodo 01: o quarto → Cômodo 02: a sala
   ============================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     SOM NO CELULAR

     O navegador do telefone so deixa tocar audio depois de um gesto da
     pessoa, e cada modulo daqui (motor, ronco, boom bap) cria o seu proprio
     AudioContext quando precisa dele. Em vez de sair atras de cada um, o
     construtor fica marcado: toda instancia criada entra numa lista, e o
     primeiro toque na tela acorda todas de uma vez.
     --------------------------------------------------------- */
  var contextos = [];
  (function () {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    function Marcado() {
      var c = new AC();
      contextos.push(c);
      return c;               // construtor que devolve objeto: instanceof segue valendo
    }
    Marcado.prototype = AC.prototype;
    window.AudioContext = Marcado;
    if (window.webkitAudioContext) window.webkitAudioContext = Marcado;
  })();

  function acordarSom() {
    for (var i = 0; i < contextos.length; i++) {
      if (contextos[i].state === 'suspended') {
        contextos[i].resume().catch(function () {});
      }
    }
  }
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, acordarSom, { passive: true });
  });

  /* ---------------------------------------------------------
     TEXTOS — tudo editável aqui
     --------------------------------------------------------- */
  var NOME = 'Ana';

  /* Os cartoes de texto sairam: cada comodo mostra so o titulo, e clicar num
     objeto ou faz alguma coisa (abrir galeria, ligar o som, mergulhar na cena)
     ou nao e clicavel. O que sobrou de texto e so o aviso de navegacao mais
     abaixo, que nao descreve objeto nenhum. */


  /* hotspots que, em vez de abrir cartão, mergulham numa cena inteira */
  var MERGULHOS = {
    'room1:monitor': { imersao: 'titans', ox: 29.1, oy: 45.8 },
    'room2:tv':      { imersao: 'road',   ox: 46.9, oy: 50.8 },
    'room4:moto':    { imersao: 'street', ox: 51.3, oy: 73.3, portao: true },
    'room1:pirata':  { imersao: 'piratas', ox: 61.8, oy: 26.6 }
  };

  var IMERSOES = {
    titans: { sel: '#scene-titans', comodo: 0, titulo: 'além da muralha', volta: 'voltar pro quarto' },
    road:   { sel: '#scene-road',   comodo: 1, titulo: 'na estrada',      volta: 'voltar pra sala' },
    street: { sel: '#scene-street', comodo: 4, titulo: 'na rua',          volta: 'voltar pra garagem' },
    piratas:{ sel: '#scene-piratas',comodo: 0, titulo: 'alto mar',         volta: 'voltar pro quarto' }
  };

  var PROXIMO_COMODO = {
    tag: 'espere um pouco',
    title: 'A porta ainda está fechada',
    text: 'O próximo cômodo ainda está sendo arrumado. Volte já já — a casa é grande e a noite é longa.'
  };

  /* LETRA — desligada por enquanto: a faixa toca só instrumental.
     Pra religar, basta pôr uma frase por compasso aqui dentro. O resto
     (sincronia com o beat, painel e palavras saindo do som) já funciona.
     Ex.: ['primeira barra', 'segunda barra', ...] — use {NOME} pro nome. */
  var LETRA = [].map(function (l) { return l.replace('{NOME}', NOME); });

  /* ---------------------------------------------------------
     Atalhos
     --------------------------------------------------------- */
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;

  /* =========================================================
     1. NEVE (canvas de tela cheia, cena externa)
     ========================================================= */
  var canvas = $('#snow-canvas');
  var ctx = canvas.getContext('2d');
  var flakes = [];
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var snowOn = true;

  function sizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeFlakes() {
    var n = Math.round(Math.min(260, Math.max(90, W / 6)));
    flakes = [];
    for (var i = 0; i < n; i++) {
      var depth = Math.random();
      flakes.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.7 + depth * 2.6,
        vy: 0.18 + depth * 0.85,
        vx: (Math.random() - 0.5) * 0.35,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.006 + Math.random() * 0.014,
        swayAmp: 0.25 + depth * 1.1,
        alpha: 0.28 + depth * 0.6
      });
    }
  }

  function drawSnow() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.sway += f.swaySpeed;
      f.y += f.vy;
      f.x += f.vx + Math.sin(f.sway) * f.swayAmp * 0.35;
      if (f.y - f.r > H) { f.y = -f.r * 2; f.x = Math.random() * W; }
      if (f.x < -12) f.x = W + 10;
      if (f.x > W + 12) f.x = -10;
      ctx.globalAlpha = f.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (snowOn) requestAnimationFrame(drawSnow);
  }

  sizeCanvas();
  makeFlakes();
  if (!reduced) { requestAnimationFrame(drawSnow); } else { snowOn = false; drawSnow(); }

  var rsz;
  window.addEventListener('resize', function () {
    clearTimeout(rsz);
    rsz = setTimeout(function () { sizeCanvas(); makeFlakes(); }, 180);
  });

  /* =========================================================
     2. DETALHES GERADOS POR JS
     ========================================================= */

  /* 2.1 — pisca-pisca seguindo a curva do fio (quarto) */
  (function fairyLights() {
    var wire = $('.fairy path'), host = $('#fairy-bulbs');
    if (!wire || !host || !wire.getTotalLength) return;
    var total = wire.getTotalLength(), count = 26;
    /* tom quente e uniforme — luzinha de quarto, não pisca-pisca de festa */
    var cores = ['#ffd79b', '#ffe3b8', '#f7cfa6', '#ffdcbe', '#ffca94'];

    for (var i = 1; i < count; i++) {
      var p = wire.getPointAtLength((total / count) * i);
      var fio = document.createElementNS(SVGNS, 'line');
      fio.setAttribute('x1', p.x); fio.setAttribute('y1', p.y);
      fio.setAttribute('x2', p.x); fio.setAttribute('y2', p.y + 12);
      fio.setAttribute('stroke', '#5a4f70'); fio.setAttribute('stroke-width', '1.6');
      host.appendChild(fio);

      var bulb = document.createElementNS(SVGNS, 'circle');
      bulb.setAttribute('cx', p.x); bulb.setAttribute('cy', p.y + 17); bulb.setAttribute('r', 5.5);
      bulb.setAttribute('fill', cores[i % cores.length]);
      bulb.style.animationDelay = (-Math.random() * 3.6).toFixed(2) + 's';
      bulb.style.filter = 'drop-shadow(0 0 7px ' + cores[i % cores.length] + ')';
      host.appendChild(bulb);
    }
  })();

  /* 2.2 — lâmpadas em volta do espelho da penteadeira */
  (function vanityBulbs() {
    var host = $('#vanity-bulbs');
    if (!host) return;
    var cx = 1141, r = 98, topY = 361, botY = 443, n = 22;
    for (var i = 0; i < n; i++) {
      var t = (i / n) * Math.PI * 2;
      var x = cx + r * Math.sin(t);
      var y = Math.cos(t) > 0 ? topY - Math.abs(r * Math.cos(t)) : botY + Math.abs(r * Math.cos(t));
      if (Math.abs(Math.sin(t)) > 0.97) y = (topY + botY) / 2 + (y - (topY + botY) / 2) * 0.35;
      var b = document.createElementNS(SVGNS, 'circle');
      b.setAttribute('cx', x.toFixed(1)); b.setAttribute('cy', y.toFixed(1)); b.setAttribute('r', 5);
      b.setAttribute('fill', '#ffe6bd');
      b.style.filter = 'drop-shadow(0 0 8px rgba(255,214,148,.9))';
      b.style.animationDelay = (-Math.random() * 4.4).toFixed(2) + 's';
      host.appendChild(b);
    }
  })();

  /* 2.3 — neve caindo, vista pela janela do quarto */
  /* 2.4 — neve dentro do filme que passa na TV da sala */
  function semearNeve(host, x0, largura, alturaY, qtd, raioMax) {
    if (!host) return;
    for (var i = 0; i < qtd; i++) {
      var f = document.createElementNS(SVGNS, 'circle');
      f.setAttribute('cx', (x0 + Math.random() * largura).toFixed(1));
      f.setAttribute('cy', alturaY);
      f.setAttribute('r', (0.9 + Math.random() * raioMax).toFixed(2));
      f.style.animationDuration = (4.5 + Math.random() * 5).toFixed(2) + 's';
      f.style.animationDelay = (-Math.random() * 9).toFixed(2) + 's';
      host.appendChild(f);
    }
  }
  semearNeve($('#room-snow'), 64, 208, 168, 30, 1.9);
  semearNeve($('#room-snow5'), 74, 224, 146, 30, 1.9);
  semearNeve($('#room-snow6'), 70, 216, 152, 30, 1.9);

  var posterPirata = $('.poster-pirata');
  if (posterPirata) posterPirata.classList.add('is-torto');
  semearNeve($('.tvfilm__snow'), 564, 372, 340, 34, 1.3);

  /* 2.5 — barras do equalizador no visor do som */
  (function deckEq() {
    var host = $('#deck-eq');
    if (!host) return;
    for (var i = 0; i < 7; i++) {
      var r = document.createElementNS(SVGNS, 'rect');
      r.setAttribute('x', 1240 + i * 13); r.setAttribute('y', 518);
      r.setAttribute('width', 8); r.setAttribute('height', 26); r.setAttribute('rx', 2);
      r.setAttribute('fill', '#ffb15e');
      r.setAttribute('opacity', 0.9);
      r.style.animationDuration = (0.3 + Math.random() * 0.5).toFixed(2) + 's';
      r.style.animationDelay = (-Math.random() * 0.7).toFixed(2) + 's';
      host.appendChild(r);
    }
  })();

  /* =========================================================
     3. O BEAT — boom bap sintetizado na hora (Web Audio)
     ========================================================= */
  var Beat = (function () {
    var ac = null, comp = null, master = null, ruido = null, crackle = null;
    var tocando = false, timerId = null;
    var volBase = 0.5;
    var BPM = 88, spb = 60 / BPM, passoDur = spb / 4, SWING = spb * 0.055;
    var proximaNota = 0, passoAtual = 0, compasso = 0;
    var LOOKAHEAD = 0.14, INTERVALO = 25;

    var aoCompasso = null, aoBumbo = null;

    /* Am9 · Dm9 · Fmaj7 · Em7 — quatro compassos, em loop */
    var PROG = [
      { bass: 45, notas: [60, 64, 67, 71] },
      { bass: 38, notas: [60, 62, 65, 69] },
      { bass: 41, notas: [60, 64, 65, 69] },
      { bass: 40, notas: [59, 64, 67, 71] }
    ];

    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

    function iniciar() {
      if (ac) return ac;
      var AC = window.AudioContext || window.webkitAudioContext;
      ac = new AC();

      comp = ac.createDynamicsCompressor();
      comp.threshold.value = -15; comp.ratio.value = 4;
      comp.attack.value = 0.004; comp.release.value = 0.18;

      master = ac.createGain();
      master.gain.value = 0.0001;

      comp.connect(master);
      master.connect(ac.destination);

      // ruído branco reaproveitado por caixa e chimbal
      var len = Math.floor(ac.sampleRate * 0.5);
      ruido = ac.createBuffer(1, len, ac.sampleRate);
      var d = ruido.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

      return ac;
    }

    function bumbo(t, g) {
      var o = ac.createOscillator(), gn = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(132, t);
      o.frequency.exponentialRampToValueAtTime(43, t + 0.13);
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(g, t + 0.006);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.44);
      o.connect(gn); gn.connect(comp);
      o.start(t); o.stop(t + 0.46);
    }

    function caixa(t, g) {
      var src = ac.createBufferSource(); src.buffer = ruido;
      var bp = ac.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = 1750; bp.Q.value = 0.7;
      var gn = ac.createGain();
      gn.gain.setValueAtTime(g, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
      src.connect(bp); bp.connect(gn); gn.connect(comp);
      src.start(t); src.stop(t + 0.22);

      var o = ac.createOscillator(), og = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(195, t);
      o.frequency.exponentialRampToValueAtTime(118, t + 0.09);
      og.gain.setValueAtTime(g * 0.45, t);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(og); og.connect(comp);
      o.start(t); o.stop(t + 0.14);
    }

    function chimbal(t, g, aberto) {
      var src = ac.createBufferSource(); src.buffer = ruido;
      var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7600;
      var gn = ac.createGain();
      var dur = aberto ? 0.24 : 0.042;
      gn.gain.setValueAtTime(g, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(hp); hp.connect(gn); gn.connect(comp);
      src.start(t); src.stop(t + dur + 0.02);
    }

    function baixo(t, midi, dur, g) {
      var f = mtof(midi);
      var o = ac.createOscillator(), lp = ac.createBiquadFilter(), gn = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f * 1.6, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
      lp.type = 'lowpass'; lp.frequency.value = 340;
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(g, t + 0.02);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); lp.connect(gn); gn.connect(comp);
      o.start(t); o.stop(t + dur + 0.05);
    }

    /* acorde meio rhodes, meio poeira de sample */
    function acorde(t, notas, dur, g) {
      var lp = ac.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2200, t);
      lp.frequency.exponentialRampToValueAtTime(700, t + dur);
      var gn = ac.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(g, t + 0.025);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      lp.connect(gn); gn.connect(comp);

      notas.forEach(function (m, i) {
        var f = mtof(m);
        [0, 1].forEach(function (k) {
          var o = ac.createOscillator();
          o.type = k ? 'triangle' : 'sine';
          o.frequency.value = f;
          o.detune.value = (k ? 6 : -6) + (i - 1.5) * 1.5;
          var vg = ac.createGain();
          vg.gain.value = k ? 0.16 : 0.26;
          o.connect(vg); vg.connect(lp);
          o.start(t); o.stop(t + dur + 0.05);
        });
      });
    }

    /* chiado de vinil por baixo de tudo */
    function ligarCrackle() {
      if (crackle) return;
      var len = Math.floor(ac.sampleRate * 4);
      var buf = ac.createBuffer(1, len, ac.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * 0.016;
        if (Math.random() < 0.0006) d[i] = (Math.random() * 2 - 1) * 0.55;
      }
      var src = ac.createBufferSource();
      src.buffer = buf; src.loop = true;
      var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400;
      var gn = ac.createGain(); gn.gain.value = 0.5;
      src.connect(hp); hp.connect(gn); gn.connect(comp);
      src.start();
      crackle = src;
    }

    function desligarCrackle() {
      if (!crackle) return;
      try { crackle.stop(); } catch (e) {}
      crackle = null;
    }

    function visual(t, fn) {
      if (!fn) return;
      setTimeout(fn, Math.max(0, (t - ac.currentTime) * 1000));
    }

    function agendar(p, t) {
      var c = compasso % 4, h = PROG[c];
      var swing = (p % 2) ? SWING : 0;
      var tt = t + swing;

      // bumbo — 1, o "e" do 2 e o 3; com pickup nos compassos ímpares
      var temBumbo = (p === 0 || p === 6 || p === 10) || (compasso % 2 === 1 && p === 14);
      if (temBumbo) { bumbo(tt, 0.85); visual(tt, aoBumbo); }

      // caixa nos tempos 2 e 4, com fantasmas
      if (p === 4 || p === 12) caixa(tt, 0.5);
      else if (p === 7 || p === 15) caixa(tt, 0.075);

      // chimbal em colcheias, com um aberto fechando a frase
      if (p % 2 === 0) {
        var aberto = (p === 14 && compasso % 4 === 3);
        chimbal(tt, aberto ? 0.14 : (p % 4 === 0 ? 0.14 : 0.085), aberto);
      }

      // baixo e acordes
      if (p === 0)  { baixo(tt, h.bass, 0.85, 0.42); acorde(tt, h.notas, 1.5, 0.2); }
      if (p === 10) { baixo(tt, h.bass, 0.4, 0.3);   acorde(tt, h.notas, 0.6, 0.11); }

      if (p === 0) visual(tt, function () { if (aoCompasso) aoCompasso(compasso); });
    }

    function avancar() {
      proximaNota += passoDur;
      if (++passoAtual === 16) { passoAtual = 0; compasso++; }
    }

    function agendador() {
      while (proximaNota < ac.currentTime + LOOKAHEAD) {
        agendar(passoAtual, proximaNota);
        avancar();
      }
      timerId = setTimeout(agendador, INTERVALO);
    }

    return {
      get tocando() { return tocando; },
      volume: function (v) {
        volBase = Math.max(0, Math.min(1, v));
        if (ac && tocando) master.gain.setTargetAtTime(volBase, ac.currentTime, 0.05);
      },
      bpm: BPM,
      compassoDur: spb * 4,
      onCompasso: function (fn) { aoCompasso = fn; },
      onBumbo: function (fn) { aoBumbo = fn; },

      tocar: function () {
        iniciar();
        if (ac.state === 'suspended') ac.resume();
        if (tocando) return;
        tocando = true;
        proximaNota = ac.currentTime + 0.12;
        passoAtual = 0; compasso = 0;
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ac.currentTime);
        master.gain.linearRampToValueAtTime(volBase, ac.currentTime + 0.9);
        ligarCrackle();
        agendador();
      },

      pausar: function () {
        if (!tocando || !ac) return;
        tocando = false;
        clearTimeout(timerId);
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ac.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.4);
        setTimeout(desligarCrackle, 450);
      }
    };
  })();

  /* =========================================================
     3b. ROCK DE ESTRADA — composição original, sintetizada
     ========================================================= */
  var Rock = (function () {
    var ac = null, comp = null, master = null, ruido = null;
    var tocando = false, timerId = null;
    var volBase = 0.38;
    var BPM = 132, spb = 60 / BPM, passoDur = spb / 4;
    var proximaNota = 0, passoAtual = 0, compasso = 0;
    var LOOKAHEAD = 0.14, INTERVALO = 25;

    /* Am – F – C – G, em power chords (raiz + quinta + oitava) */
    var PROG = [
      { raiz: 45, acorde: [45, 52, 57] },
      { raiz: 41, acorde: [41, 48, 53] },
      { raiz: 48, acorde: [48, 55, 60] },
      { raiz: 43, acorde: [43, 50, 55] }
    ];
    /* motivo de guitarra próprio, entra nos dois últimos compassos */
    var MOTIVO = {
      2: [{ p: 0, n: 72 }, { p: 4, n: 76 }, { p: 8, n: 74 }, { p: 12, n: 72 }],
      3: [{ p: 0, n: 71 }, { p: 6, n: 74 }, { p: 10, n: 76 }, { p: 13, n: 79 }]
    };

    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

    function curvaDist(k) {
      var n = 1024, c = new Float32Array(n), deg = Math.PI / 180;
      for (var i = 0; i < n; i++) {
        var x = i * 2 / n - 1;
        c[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
      }
      return c;
    }

    function iniciar() {
      if (ac) return ac;
      var AC = window.AudioContext || window.webkitAudioContext;
      ac = new AC();
      comp = ac.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 5;
      comp.attack.value = 0.003; comp.release.value = 0.2;
      master = ac.createGain(); master.gain.value = 0.0001;
      comp.connect(master); master.connect(ac.destination);

      var len = Math.floor(ac.sampleRate * 0.5);
      ruido = ac.createBuffer(1, len, ac.sampleRate);
      var d = ruido.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return ac;
    }

    function bumbo(t, g) {
      var o = ac.createOscillator(), gn = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(48, t + 0.1);
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(g, t + 0.005);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      o.connect(gn); gn.connect(comp);
      o.start(t); o.stop(t + 0.36);
    }

    function caixa(t, g) {
      var s = ac.createBufferSource(); s.buffer = ruido;
      var bp = ac.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = 2100; bp.Q.value = 0.6;
      var gn = ac.createGain();
      gn.gain.setValueAtTime(g, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      s.connect(bp); bp.connect(gn); gn.connect(comp);
      s.start(t); s.stop(t + 0.24);
      var o = ac.createOscillator(), og = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
      og.gain.setValueAtTime(g * 0.5, t);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.connect(og); og.connect(comp);
      o.start(t); o.stop(t + 0.12);
    }

    function chimbal(t, g) {
      var s = ac.createBufferSource(); s.buffer = ruido;
      var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 8200;
      var gn = ac.createGain();
      gn.gain.setValueAtTime(g, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      s.connect(hp); hp.connect(gn); gn.connect(comp);
      s.start(t); s.stop(t + 0.07);
    }

    function prato(t, g) {
      var s = ac.createBufferSource(); s.buffer = ruido;
      var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5200;
      var gn = ac.createGain();
      gn.gain.setValueAtTime(g, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      s.connect(hp); hp.connect(gn); gn.connect(comp);
      s.start(t); s.stop(t + 1.5);
    }

    function baixo(t, midi, dur, g) {
      var o = ac.createOscillator(), lp = ac.createBiquadFilter(), gn = ac.createGain();
      o.type = 'sawtooth'; o.frequency.value = mtof(midi - 12);
      lp.type = 'lowpass'; lp.frequency.value = 420;
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(g, t + 0.01);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); lp.connect(gn); gn.connect(comp);
      o.start(t); o.stop(t + dur + 0.04);
    }

    function guitarra(t, notas, dur, g) {
      var pre = ac.createGain(); pre.gain.value = 0.42;
      var ws = ac.createWaveShaper(); ws.curve = curvaDist(42); ws.oversample = '4x';
      var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 95;
      var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2700;
      var env = ac.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(g, t + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      notas.forEach(function (m) {
        var o = ac.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = mtof(m);
        o.detune.value = (Math.random() - 0.5) * 8;
        o.connect(pre); o.start(t); o.stop(t + dur + 0.04);
      });
      pre.connect(ws); ws.connect(hp); hp.connect(lp); lp.connect(env); env.connect(comp);
    }

    function solo(t, midi, dur, g) {
      var pre = ac.createGain(); pre.gain.value = 0.3;
      var ws = ac.createWaveShaper(); ws.curve = curvaDist(28); ws.oversample = '2x';
      var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3400;
      var env = ac.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(g, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      var o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(midi);
      var vib = ac.createOscillator(); vib.frequency.value = 5.4;
      var vg = ac.createGain(); vg.gain.value = 4;
      vib.connect(vg); vg.connect(o.detune); vib.start(t); vib.stop(t + dur + 0.05);
      o.connect(pre); pre.connect(ws); ws.connect(lp); lp.connect(env); env.connect(comp);
      o.start(t); o.stop(t + dur + 0.05);
    }

    function agendar(p, t) {
      var c = compasso % 4, h = PROG[c];

      if (p === 0 || p === 7 || p === 8 || p === 14) bumbo(t, 0.9);
      if (p === 4 || p === 12) caixa(t, 0.52);
      if (p % 2 === 0) chimbal(t, p % 4 === 0 ? 0.14 : 0.085);
      if (p === 0 && c === 0) prato(t, 0.2);

      // levada de guitarra em colcheias
      if (p % 2 === 0) {
        var longa = (p === 0);
        guitarra(t, h.acorde, longa ? 0.8 : 0.2, longa ? 0.34 : 0.24);
      }
      // baixo em colcheias
      if (p % 2 === 0) baixo(t, h.raiz, 0.22, 0.5);

      // motivo
      var m = MOTIVO[c];
      if (m) {
        m.forEach(function (nota) {
          if (nota.p === p) solo(t, nota.n, 0.34, 0.26);
        });
      }
    }

    function avancar() {
      proximaNota += passoDur;
      if (++passoAtual === 16) { passoAtual = 0; compasso++; }
    }

    function agendador() {
      while (proximaNota < ac.currentTime + LOOKAHEAD) {
        agendar(passoAtual, proximaNota);
        avancar();
      }
      timerId = setTimeout(agendador, INTERVALO);
    }

    return {
      get tocando() { return tocando; },
      volume: function (v) {
        volBase = Math.max(0, Math.min(1, v));
        if (ac && tocando) master.gain.setTargetAtTime(volBase, ac.currentTime, 0.05);
      },
      tocar: function () {
        iniciar();
        if (ac.state === 'suspended') ac.resume();
        if (tocando) return;
        tocando = true;
        proximaNota = ac.currentTime + 0.12;
        passoAtual = 0; compasso = 0;
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ac.currentTime);
        master.gain.linearRampToValueAtTime(volBase, ac.currentTime + 1.1);
        agendador();
      },
      pausar: function () {
        if (!tocando || !ac) return;
        tocando = false;
        clearTimeout(timerId);
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ac.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.4);
      }
    };
  })();

  /* =========================================================
     3c. O MOTOR — quatro cilindros, 750cc, subindo as marchas
     ========================================================= */
  var Moto = (function () {
    var ac = null, comp = null, master = null, lp = null;
    var vozes = [], ruidoGain = null;
    var rpm = 1100, marcha = 1, subindo = true, ligado = false, raf = null;
    // YZF-R1: 998cc, corte em 14.500 rpm e 6 marchas. As velocidades de
    // topo de cada marcha sao as de fabrica, em km/h.
    var MIN = 1250, MAX = 14500;
    var TOPO = [110, 145, 180, 215, 255, 299];
    var kmh = 0;
    var manual = false, alvoRpm = 1100, volMax = 0.3;

    var agulha = null, velEl = null, marchaEl = null;
    var cortando = false, fimDoCorte = 0;

    /* ---------------- o motor gravado ----------------

       O audio NAO e alterado. Nada de mudar o tom, nada de filtro: cada
       pedaco toca exatamente como foi gravado, na velocidade original.

       O que existe e uma escolha. Medi por espectro onde cada altura acontece
       na gravacao -- ela varre de 205 a 480 Hz, que num quatro cilindros
       quatro tempos da de 6.000 a 14.400 rpm. Dai saem vinte e um recortes, um
       em cada altura. A cada instante toca o recorte cuja altura mais se
       aproxima do giro do momento, e a troca entre um e outro e cruzada em
       60 ms pra nao estalar.

       Como os degraus entre recortes vizinhos sao de 2 a 10%, a subida de giro
       soa continua sem que nenhuma amostra precise ser esticada. */
    var FATIA = 0.34, CRUZADA = 0.012;
    /* No fim da sexta a moto fica cravada no giro, e uma fatia de 0,34 s se
       repetindo tres vezes por segundo entrega o truque na hora. Nas duas
       fatias do topo a gravacao segura a altura por quase um segundo, entao
       la elas podem ser bem mais longas e a repeticao some. */
    var FATIA_TOPO = 0.86;
    var BANCO = [
      { t: 22.40, hz: 205 }, { t: 22.60, hz: 210 }, { t: 22.80, hz: 220 },
      { t: 23.00, hz: 245 }, { t: 23.40, hz: 270 }, { t: 24.00, hz: 285 },
      { t: 24.20, hz: 290 }, { t: 24.40, hz: 310 }, { t: 24.60, hz: 335 },
      { t: 24.80, hz: 355 }, { t: 25.00, hz: 375 }, { t: 25.20, hz: 395 },
      { t: 28.40, hz: 405 }, { t: 28.60, hz: 415 }, { t: 28.80, hz: 425 },
      { t: 29.00, hz: 430 }, { t: 29.40, hz: 440, topo: true }, { t: 29.80, hz: 450 },
      { t: 30.00, hz: 455 },
      /* As duas do topo vinham de 9,05 e 9,25 -- quase o mesmo audio, porque
         se sobrepunham em 0,6 s. Alternar entre elas nao mudava nada e o
         motor continuava soando travado. Agora vem de trechos separados da
         gravacao, e a de cima tem 1,2 s: e o pedaco mais longo que a gravacao
         segura no alto sem cair de giro. */
      { t: 5.85, hz: 452, dur: 0.72, topo: true },
      { t: 9.02, hz: 470, dur: 1.18, topo: true }
    ];
    var banco = null, ganhoMotor = null, tocando = -1, altas = [];

    /* Recorta um pedaco e costura as pontas: o fim entra por cima do comeco
       com o peso subindo, pra o loop nao estalar na volta.

       O comprimento nao e fixo -- ele e PROCURADO. A cruzada soma o trecho
       inicial com o trecho que vem logo depois do fim, entao o loop bom e
       aquele em que esses dois pedacos mais se parecem. Calcular pelo ciclo do
       motor nao serve: as alturas sao medidas aproximadas, e um erro de 1%
       vira uma volta inteira de fase ao longo de cem ciclos. */
    function recortarLoop(buf, t0, dur, cruzada) {
      var sr = buf.sampleRate;
      var comeco = Math.round(t0 * sr);
      var cruz = Math.round(cruzada * sr);
      var nMin = Math.round((dur - dur * 0.28) * sr), nMax = Math.round(dur * sr);
      if (comeco < 0 || comeco + nMax + cruz > buf.length) return null;

      var d0 = buf.getChannelData(0);
      // passo tipico do sinal ali, pra medir o degrau da emenda em unidades dele
      var tip = 0;
      for (var q = 1; q < nMax; q++) tip += Math.abs(d0[comeco + q] - d0[comeco + q - 1]);
      tip = tip / (nMax - 1) || 1e-9;

      var n = nMin, melhor = -Infinity;
      for (var t = nMin; t <= nMax; t++) {
        var num = 0, ea = 0, eb = 0;
        for (var i = 0; i < cruz; i += 2) {
          var x = d0[comeco + i], y = d0[comeco + t + i];
          num += x * y; ea += x * x; eb += y * y;
        }
        var c = num / Math.sqrt(ea * eb + 1e-12);
        /* Alem de parecido, o ponto tem que ser liso amostra a amostra: sem
           esta penalidade o melhor "parecido" caia em cima de um estouro do
           escape e o loop estalava a cada volta. */
        var degrau = Math.abs(d0[comeco + t - 1] - d0[comeco + t]) / tip;
        var nota = c - 0.04 * degrau;
        if (nota > melhor) { melhor = nota; n = t; }
      }
      var saida = ac.createBuffer(buf.numberOfChannels, n, sr);
      for (var ch = 0; ch < buf.numberOfChannels; ch++) {
        var de = buf.getChannelData(ch), para = saida.getChannelData(ch);
        for (var k = 0; k < n; k++) para[k] = de[comeco + k];
        for (var j = 0; j < cruz; j++) {
          var w = j / cruz;
          para[j] = para[j] * w + de[comeco + n + j] * (1 - w);
        }
      }
      return saida;
    }

    function montarGravado(buf) {
      ganhoMotor = ac.createGain();
      ganhoMotor.gain.value = 0.95;
      ganhoMotor.connect(comp);
      banco = [];
      for (var i = 0; i < BANCO.length; i++) {
        var b = recortarLoop(buf, BANCO[i].t, BANCO[i].dur || FATIA, CRUZADA);
        if (!b) continue;
        var g = ac.createGain(); g.gain.value = 0.0001;
        var f = ac.createBufferSource();
        f.buffer = b; f.loop = true; f.loopStart = 0; f.loopEnd = b.duration;
        // playbackRate fica em 1: o pedaco toca na velocidade em que foi gravado
        f.connect(g); g.connect(ganhoMotor);
        f.start();
        banco.push({ hz: BANCO[i].hz, topo: !!BANCO[i].topo, fonte: f, ganho: g });
      }
      if (banco.length < 2) { banco = null; return false; }
      altas = [];
      for (var q = 0; q < banco.length; q++) if (banco[q].topo) altas.push(q);
      // o compressor de antes achatava a gravacao; aqui ele so segura os picos
      comp.threshold.value = -12; comp.ratio.value = 2.5;
      return true;
    }

    function iniciar() {
      if (ac) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      ac = new AC();
      comp = ac.createDynamicsCompressor();
      comp.threshold.value = -20; comp.ratio.value = 6;
      master = ac.createGain(); master.gain.value = 0.0001;
      comp.connect(master); master.connect(ac.destination);

      agulha   = document.getElementById('tach-needle');
      velEl    = document.getElementById('speed-readout');
      marchaEl = document.getElementById('gear-readout');

      /* Tenta a gravacao; se ela nao vier, o motor sintetizado de antes
         assume, e o jogo continua com som em vez de ficar mudo. */
      fetch('media/motor.mp3')
        .then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(function (b) {
          return new Promise(function (ok, erro) { ac.decodeAudioData(b, ok, erro); });
        })
        .then(function (buf) { if (!montarGravado(buf)) montarSintetizado(); })
        .catch(function () { montarSintetizado(); });
    }

    function montarSintetizado() {
      if (lp) return;
      lp = ac.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.value = 900; lp.Q.value = 3.2;   // ressonância dá o corpo do escape
      lp.connect(comp);

      // harmônicos da explosão. Menos parciais agudos e todos em dente
      // de serra: o quadrado dava aquele zumbido de brinquedo.
      [0.5, 1, 2, 3, 4.5].forEach(function (h, i) {
        var o = ac.createOscillator();
        o.type = 'sawtooth';
        o.detune.value = (i - 2) * 6;           // desafina de leve: soa mais real
        var g = ac.createGain();
        g.gain.value = [0.30, 0.38, 0.22, 0.13, 0.07][i];
        o.connect(g); g.connect(lp);
        o.start();
        vozes.push({ o: o, h: h });
      });

      // corta o excesso de agudo que deixava o motor estridente
      var corte = ac.createBiquadFilter();
      corte.type = 'highshelf'; corte.frequency.value = 2600; corte.gain.value = -14;
      lp.disconnect(); lp.connect(corte); corte.connect(comp);

      // sopro de admissão e escape
      var len = Math.floor(ac.sampleRate * 2);
      var buf = ac.createBuffer(1, len, ac.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      var src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      var bp = ac.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = 900; bp.Q.value = 0.6;
      ruidoGain = ac.createGain(); ruidoGain.gain.value = 0.03;
      src.connect(bp); bp.connect(ruidoGain); ruidoGain.connect(comp);
      src.start();
    }

    function painel() {
      if (agulha) {
        var ang = -135 + (Math.min(rpm, MAX) / MAX) * 270;
        agulha.setAttribute('transform', 'rotate(' + ang.toFixed(1) + ',746,712)');
      }
      if (velEl) velEl.textContent = Math.round(kmh);
      if (marchaEl) marchaEl.textContent = marcha;
    }

    function passo() {
      if (!ligado) return;
      if (cortando && ac.currentTime >= fimDoCorte) cortando = false;
      if (manual) {
        rpm += (alvoRpm - rpm) * 0.09;      // o jogo dita o giro
      } else if (subindo) {
        rpm += 58 + marcha * 9;
        if (rpm >= MAX) {
          if (marcha < 6) { marcha++; rpm = MAX * 0.6; }   // troca de marcha
          else { subindo = false; }
        }
      } else {
        rpm -= 44;
        if (rpm <= MIN + 500) {
          if (marcha > 1) { marcha--; rpm = Math.min(MAX * 0.78, rpm * 1.6); }
          else { rpm = MIN; subindo = true; }
        }
      }

      if (banco) {
        var now = ac.currentTime;
        /* Quatro cilindros, quatro tempos: o motor estoura duas vezes por
           volta, entao a frequencia que se ouve e rpm/30. E por essa conta que
           se acha o recorte certo.

           Nenhum ajuste no som: so se escolhe QUAL pedaco toca. Se o giro cair
           abaixo do que a gravacao tem, fica o pedaco mais grave dela -- e o
           som mais baixo que existe no arquivo, e nao vale inventar o resto. */
        var alvoHz = rpm / 30;
        var i = 0;
        for (var j = 1; j < banco.length; j++) {
          if (Math.abs(banco[j].hz - alvoHz) < Math.abs(banco[i].hz - alvoHz)) i = j;
        }
        /* Histerese. No alto do giro as ancoras ficam a poucos hertz uma da
           outra (450, 452, 455), e a menor oscilacao fazia a escolha pular
           entre elas a cada quadro. So troca quem esta tocando se a nova for
           claramente melhor -- senao fica onde esta. */
        if (tocando >= 0 && tocando !== i) {
          var dAtual = Math.abs(banco[tocando].hz - alvoHz);
          var dNova = Math.abs(banco[i].hz - alvoHz);
          if (dNova > dAtual * 0.72) i = tocando;
        }

        /* Cravado no fim da ultima marcha o giro nao anda, e escolher "a fatia
           mais proxima" devolve sempre a mesma -- era isso que ficava em loop.
           Ali a escolha passa a ser por TEMPO, percorrendo em sequencia as tres
           fatias altas. Como elas vem de pontos separados da gravacao (29,4 s,
           5,9 s e 9,0 s), o que se ouve muda de verdade, em vez de repetir. */
        if (marcha === TOPO.length && kmh > TOPO[TOPO.length - 1] * 0.985 && altas.length > 1) {
          i = altas[Math.floor(ac.currentTime / 1.15) % altas.length];
        }
        /* Antes isto so agia quando a fatia mudava, e cancelava as rampas em
           voo pra recomecar outra. Na troca de marcha o giro despenca e cruza
           tres ou quatro fatias em poucos quadros: as rampas eram canceladas
           antes de terminar e sobravam varias fatias audiveis ao mesmo tempo,
           cada uma numa altura. Isso soma num acorde -- era a buzina.

           Agora o ganho de cada fatia so persegue o seu alvo, todo quadro, sem
           cancelar nada. Quem nao e a fatia da vez cai pra zero sozinho, e em
           nenhum momento duas ficam paradas no meio do caminho. */
        for (var k = 0; k < banco.length; k++) {
          banco[k].ganho.gain.setTargetAtTime(k === i ? 1 : 0.0001, now, 0.022);
        }
        tocando = i;
        if (ganhoMotor && !cortando) ganhoMotor.gain.setTargetAtTime(0.95, now, 0.08);
      } else if (lp) {
        var agora = ac.currentTime;
        var giro = (rpm - MIN) / (MAX - MIN);
        var f = rpm / 60 * 2;                 // 4 tempos, 4 cilindros
        vozes.forEach(function (v) {
          v.o.frequency.setTargetAtTime(f * v.h, agora, 0.02);
        });
        lp.frequency.setTargetAtTime(420 + giro * 2600, agora, 0.05);
        if (ruidoGain) ruidoGain.gain.setTargetAtTime(0.025 + giro * 0.085, agora, 0.05);
      }

      painel();
      raf = requestAnimationFrame(passo);
    }

    return {
      get ligado() { return ligado; },
      volume: function (v) {
        volMax = Math.max(0, Math.min(1, v));
        if (ac && ligado) master.gain.setTargetAtTime(volMax, ac.currentTime, 0.1);
      },
      acelerar: function (frac, marchaAtual) {
        alvoRpm = MIN + Math.max(0, Math.min(1, frac)) * (MAX - MIN);
        if (marchaAtual) marcha = marchaAtual;
      },
      /* Recebe a velocidade de verdade e deduz marcha e giro dela.
         Numa caixa real o giro e proporcional a velocidade dividida pela
         relacao da marcha: no topo de cada uma bate o corte, e na troca cai
         pra razao entre as duas velocidades de topo. Devolve a marcha, pra
         quem chamou saber quando ela mudou. */
      pilotar: function (v) {
        kmh = Math.max(0, v);
        var g = 0;
        while (g < TOPO.length - 1 && kmh > TOPO[g]) g++;
        marcha = g + 1;
        var alvo = MAX * (kmh / TOPO[g]);
        /* Cravado no fim da ultima marcha, o giro ficava parado num valor so e
           o som virava uma volta de loop sempre igual -- travado. Motor de
           verdade nao fica quieto ali: ele respira contra o limitador. Essa
           ondulacao de 2% mantem o giro andando, faz o banco de amostras
           alternar entre as duas fatias do topo, e ainda da vida ao ponteiro. */
        if (alvo > MAX * 0.94) {
          /* No limitador o giro passeia numa faixa larga o bastante pra descer
             ate a fatia de 452 Hz e voltar. Sem isso ele encostava no teto e
             ficava preso numa volta de loop so -- que e o que se ouvia. */
          var w = Date.now() / 1000;
          alvo *= 1 + 0.042 * Math.sin(w * 2.7) + 0.014 * Math.sin(w * 6.1);
        }
        alvoRpm = Math.max(MIN, Math.min(MAX, alvo));
        return marcha;
      },
      get kmh() { return kmh; },
      /* O tranco da troca. Moto grande corta a ignicao por uns milesimos pra
         engatar sem embreagem, e o que se ouve e um talho seco no meio do
         grito. Aqui e a mesma coisa: derruba o volume e a altura por 70 ms e
         volta. */
      trocar: function () {
        if (!ac || !ganhoMotor || !ligado) return;
        var now = ac.currentTime;
        cortando = true;
        fimDoCorte = now + 0.19;
        var g = ganhoMotor.gain;
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(g.value * 0.18, now + 0.02);
        g.setValueAtTime(g.value * 0.18, now + 0.07);
        g.linearRampToValueAtTime(0.95, now + 0.19);
      },
      ligar: function (modoManual) {
        iniciar();
        if (ac.state === 'suspended') ac.resume();
        manual = !!modoManual;
        if (ligado) return;
        ligado = true;
        rpm = MIN; marcha = 1; subindo = true; alvoRpm = MIN; tocando = -1;
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setValueAtTime(0.0001, ac.currentTime);
        master.gain.linearRampToValueAtTime(volMax, ac.currentTime + 0.7);
        raf = requestAnimationFrame(passo);
      },
      desligar: function () {
        if (!ligado || !ac) return;
        ligado = false;
        if (raf) cancelAnimationFrame(raf);
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ac.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.5);
      }
    };
  })();

  /* =========================================================
     3d. RONCO GRAVE — ambiente da cena do colosso
     ========================================================= */
  var Ronco = (function () {
    var ac = null, master = null, osc = null, src = null, ligado = false;
    return {
      ligar: function () {
        if (ligado) return;
        if (!ac) {
          var AC = window.AudioContext || window.webkitAudioContext;
          ac = new AC();
          master = ac.createGain(); master.gain.value = 0.0001;
          master.connect(ac.destination);

          osc = ac.createOscillator(); osc.type = 'sine'; osc.frequency.value = 38;
          var og = ac.createGain(); og.gain.value = 0.5;
          osc.connect(og); og.connect(master); osc.start();

          var len = Math.floor(ac.sampleRate * 3);
          var buf = ac.createBuffer(1, len, ac.sampleRate);
          var d = buf.getChannelData(0);
          for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
          src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
          var lpf = ac.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 260;
          var ng = ac.createGain(); ng.gain.value = 0.35;
          src.connect(lpf); lpf.connect(ng); ng.connect(master); src.start();
        }
        if (ac.state === 'suspended') ac.resume();
        ligado = true;
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ac.currentTime);
        master.gain.linearRampToValueAtTime(0.22, ac.currentTime + 1.6);
      },
      desligar: function () {
        if (!ligado || !ac) return;
        ligado = false;
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ac.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.6);
      }
    };
  })();

  /* =========================================================
     3e. EFEITOS CURTOS — rugido e miado
     ========================================================= */
  var Efeitos = (function () {
    var ac = null;
    function ctxAudio() {
      if (!ac) {
        var AC = window.AudioContext || window.webkitAudioContext;
        ac = new AC();
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    }
    return {
      rugido: function () {
        var c = ctxAudio(), t = c.currentTime;
        var o = c.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(110, t);
        o.frequency.exponentialRampToValueAtTime(48, t + 0.42);
        var lp = c.createBiquadFilter(); lp.type = 'lowpass';
        lp.frequency.setValueAtTime(1600, t);
        lp.frequency.exponentialRampToValueAtTime(300, t + 0.5);
        var g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.32, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
        o.connect(lp); lp.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.66);

        var len = Math.floor(c.sampleRate * 0.7);
        var buf = c.createBuffer(1, len, c.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        var s = c.createBufferSource(); s.buffer = buf;
        var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.6;
        var ng = c.createGain(); ng.gain.value = 0.2;
        s.connect(bp); bp.connect(ng); ng.connect(c.destination);
        s.start(t); s.stop(t + 0.7);
      },
      batida: function () {
        var c = ctxAudio(), t0 = c.currentTime;
        [0, 0.22, 0.44].forEach(function (d) {
          var t = t0 + d;
          var o = c.createOscillator(); o.type = 'triangle';
          o.frequency.setValueAtTime(190, t);
          o.frequency.exponentialRampToValueAtTime(70, t + 0.09);
          var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
          var g = c.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.3, t + 0.006);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
          o.connect(lp); lp.connect(g); g.connect(c.destination);
          o.start(t); o.stop(t + 0.18);
        });
      },
      miado: function () {
        var c = ctxAudio(), t = c.currentTime;
        var o = c.createOscillator(); o.type = 'triangle';
        o.frequency.setValueAtTime(620, t);
        o.frequency.exponentialRampToValueAtTime(900, t + 0.12);
        o.frequency.exponentialRampToValueAtTime(430, t + 0.42);
        var g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.16, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.5);
      }
    };
  })();

  /* =========================================================
     3f. MÍDIA DO USUÁRIO — arquivos soltos em media/
     Se o arquivo existir, ele manda; senão vale o som sintetizado.
     ========================================================= */
  function criarFaixa(url, volume) {
    var a = new Audio(url);
    a.loop = true; a.preload = 'auto'; a.volume = 0;
    /* fica no documento (invisível): elemento de mídia solto pode ser
       recolhido pelo coletor de lixo no meio da reprodução */
    a.hidden = true;
    a.setAttribute('data-faixa', url);
    document.body.appendChild(a);
    var pronta = false, fade = null;
    a.addEventListener('canplaythrough', function () { pronta = true; });
    a.addEventListener('error', function () { pronta = false; });

    function irPara(alvo, aoFim) {
      clearInterval(fade);
      fade = setInterval(function () {
        var d = alvo - a.volume;
        if (Math.abs(d) < 0.02) {
          a.volume = alvo; clearInterval(fade);
          if (aoFim) aoFim();
          return;
        }
        a.volume = Math.max(0, Math.min(1, a.volume + d * 0.14));
      }, 40);
    }

    return {
      get pronta() { return pronta; },
      volume: function (v) {
        volume = Math.max(0, Math.min(1, v));
        if (!a.paused) irPara(volume);
      },
      /* não espera terminar de bufferizar: o <audio> começa sozinho
         assim que tiver dados. Segurar aqui faria o som sintetizado
         entrar no lugar da faixa em quem mergulha rápido demais. */
      tocar: function () {
        a.play().catch(function () {});
        irPara(volume || 0.55);
        return true;
      },
      pausar: function () {
        irPara(0, function () { a.pause(); });
        return true;
      }
    };
  }

  /* só cria o player se o arquivo existir de fato — evita pedir em vão.
     A existência do arquivo é o que decide quem manda: se ele está lá,
     é ele que toca, mesmo que ainda esteja carregando. */
  function faixaSeExistir(url, volume, aoConfirmar) {
    var slot = { pronta: false, tocar: function () { return false; },
                 pausar: function () { return false; }, volume: function () {} };
    fetch(url, { method: 'HEAD' }).then(function (r) {
      if (!r.ok) return;
      var f = criarFaixa(url, volume);
      slot.tocar = function () { return f.tocar(); };
      slot.pausar = function () { return f.pausar(); };
      slot.volume = function (v) { f.volume(v); };
      slot.pronta = true;
      if (aoConfirmar) aoConfirmar();
    }).catch(function () {});
    return slot;
  }

  /* o poster da garagem so entra quando o arquivo existir; sem isso
     o navegador reclamaria de um 404 toda vez que a pagina abrisse */
  (function () {
    var alvo = $('#poster-arte');
    if (!alvo) return;
    var url = 'media/fotos/poster.jpg';
    fetch(url, { method: 'HEAD' }).then(function (r) {
      if (!r.ok) return;
      alvo.setAttribute('href', url);
      var vazio = $('.poster-garagem__vazio');
      if (vazio) vazio.style.display = 'none';
    }).catch(function () {});
  })();

  /* a capa do livro entra quando o arquivo existir, igual ao poster da
     garagem: sem isso o navegador acusaria 404 toda vez que a pagina abrisse */
  (function () {
    var alvo = $('#livro-capa');
    if (!alvo) return;
    var url = 'media/livro/capa.jpg';
    fetch(url, { method: 'HEAD' }).then(function (r) {
      if (!r.ok) return;
      alvo.setAttribute('href', url);
      var vazio = $('.livro__vazio');
      if (vazio) vazio.style.display = 'none';
    }).catch(function () {});
  })();

  var faixaSala    = faixaSeExistir('media/sala.mp3', 0.5, function () {
    var rot = $('#player-track');
    if (rot) rot.innerHTML = 'faixa 01 · <b>a sua</b>';
  });
  var faixaEstrada = faixaSeExistir('media/estrada.mp3', 0.55);
  // a que tocava na sala mudou de endereco: agora e a trilha do My Room
  var faixaMeu     = faixaSeExistir('media/meu.mp3', 0.45);
  var faixaRua     = faixaSeExistir('media/rua.mp3', 0.5);

  /* som da sala: usa o arquivo se houver, senão o boom bap sintetizado */
  var salaLigada = false;

  // a faixa que era do minigame agora e a do banheiro
  var banheiroLigado = false;
  function somBanheiro(ligar) {
    banheiroLigado = ligar;
    if (ligar) faixaRua.tocar(); else faixaRua.pausar();
  }
  var meuLigado = false;
  function somMeu(ligar) {
    meuLigado = ligar;
    if (ligar) faixaMeu.tocar(); else faixaMeu.pausar();
  }

  function somSala(ligar) {
    salaLigada = ligar;
    if (ligar) { if (!faixaSala.tocar()) Beat.tocar(); }
    else       { if (!faixaSala.pausar()) Beat.pausar(); }
    body.classList.toggle('is-playing', ligar);
    if (subEl) subEl.textContent = (faixaSala.pronta ? 'em loop' : '88 bpm') + (ligar ? ' · tocando' : ' · pausado');
  }

  /* som da estrada: idem, com o rock sintetizado como reserva */
  function somEstrada(ligar) {
    if (ligar) { if (!faixaEstrada.tocar()) Rock.tocar(); }
    else       { if (!faixaEstrada.pausar()) Rock.pausar(); }
  }

  /* ---------------- controles de volume ----------------
     Cada slider manda na fonte que estiver tocando de fato:
     o arquivo, se existir, ou o som sintetizado de reserva. */
  function ligarVolume(idSlider, idBotao, aplicar, padrao) {
    var slider = $(idSlider), botao = $(idBotao);
    if (!slider || !botao) return;
    var antes = padrao;

    function manda(v) { aplicar(v / 100); }

    slider.value = padrao;
    slider.addEventListener('input', function () {
      var v = +slider.value;
      manda(v);
      botao.classList.toggle('is-mudo', v === 0);
      if (v > 0) antes = v;
    });

    botao.addEventListener('click', function () {
      var mudo = +slider.value > 0;
      slider.value = mudo ? 0 : (antes || padrao);
      manda(+slider.value);
      botao.classList.toggle('is-mudo', mudo);
    });
  }

  ligarVolume('#vol-sala', '#vol-sala-btn', function (v) {
    faixaSala.volume(v);
    Beat.volume(v);
  }, 50);

  ligarVolume('#vol-estrada', '#vol-carro-btn', function (v) {
    faixaEstrada.volume(v);
    Rock.volume(v);
  }, 55);

  ligarVolume('#vol-meu-range', '#vol-meu-btn', function (v) {
    faixaMeu.volume(v);
  }, 45);
  ligarVolume('#vol-banho', '#vol-banheiro-btn', function (v) {
    faixaRua.volume(v);
  }, 50);

  /* o episódio, se estiver em media/aot.mp4 */
  var videoAot = $('#aot-video');
  var somBtn = $('#som-btn');

  /* Tenta tocar com som. Se o navegador bloquear (política de autoplay),
     toca mudo e oferece um botão pra ligar o áudio num clique. */
  function tocarVideo(doComeco) {
    if (!videoAot) return;
    if (doComeco) videoAot.currentTime = 0;   // só reinicia ao entrar de fato
    videoAot.muted = false;
    somBtn.hidden = true;

    var p = videoAot.play();
    if (p && p.catch) {
      p.catch(function () {
        videoAot.muted = true;
        videoAot.play().catch(function () {});
        somBtn.hidden = false;
      });
    }
    // a legenda sai de cena pra não tapar o vídeo
    var leg = $('.imersao-caption', $('#scene-titans'));
    if (leg) {
      leg.classList.remove('is-faded');
      clearTimeout(tocarVideo._t);
      tocarVideo._t = setTimeout(function () { leg.classList.add('is-faded'); }, 6000);
    }
  }

  if (somBtn) {
    somBtn.addEventListener('click', function () {
      if (!videoAot) return;
      videoAot.muted = false;
      videoAot.play().catch(function () {});
      somBtn.hidden = true;
    });
  }

  var videoPiratas = $('#piratas-video');
  if (videoPiratas && videoPiratas.dataset.src) {
    fetch(videoPiratas.dataset.src, { method: 'HEAD' }).then(function (r) {
      if (!r.ok) return;
      videoPiratas.addEventListener('loadeddata', function () { videoPiratas.classList.add('is-on'); });
      videoPiratas.src = videoPiratas.dataset.src;
    }).catch(function () {});
  }

  if (videoAot && videoAot.dataset.src) {
    fetch(videoAot.dataset.src, { method: 'HEAD' }).then(function (r) {
      if (!r.ok) return;
      videoAot.addEventListener('loadeddata', function () { videoAot.classList.add('is-on'); });
      videoAot.src = videoAot.dataset.src;
    }).catch(function () {});
  }

  /* =========================================================
     4. A LETRA saindo do som
     ========================================================= */
  var linhaEl = $('#player-line');
  var proximaEl = $('#player-next');
  var subEl = $('#player-sub');
  var floatHost = $('#lyric-float');

  function mostrarLinha(i) {
    if (!LETRA.length) return;              // faixa instrumental
    var idx = i % LETRA.length;
    if (linhaEl) {
      linhaEl.textContent = LETRA[idx];
      linhaEl.classList.remove('is-in');
      void linhaEl.offsetWidth;
      linhaEl.classList.add('is-in');
    }
    if (proximaEl) proximaEl.textContent = LETRA[(idx + 1) % LETRA.length];
    soltarPalavra(ultimaPalavra(LETRA[idx]));
  }

  function ultimaPalavra(linha) {
    var ps = linha.replace(/[—,:]/g, ' ').trim().split(/\s+/);
    return ps[ps.length - 1];
  }

  function soltarPalavra(txt) {
    if (!floatHost || reduced || !txt) return;
    var t = document.createElementNS(SVGNS, 'text');
    t.textContent = txt;
    t.setAttribute('x', (1230 + Math.random() * 170).toFixed(0));
    t.setAttribute('y', (392 + Math.random() * 34).toFixed(0));
    t.setAttribute('text-anchor', 'middle');
    floatHost.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3800);
  }

  Beat.onCompasso(function (c) { mostrarLinha(c); });

  Beat.onBumbo(function () {
    $$('.speaker').forEach(function (s) {
      s.classList.add('is-thump');
      setTimeout(function () { s.classList.remove('is-thump'); }, 95);
    });
  });

  /* botões de play: o do aparelho e o do painel */
  function alternarSom() {
    somSala(!salaLigada);
    if (salaLigada) mostrarLinha(0);
  }

  var playBtn = $('#play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', function (e) { e.stopPropagation(); alternarSom(); });
    playBtn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); alternarSom(); }
    });
  }
  var playToggle = $('#player-toggle');
  if (playToggle) playToggle.addEventListener('click', alternarSom);

  /* =========================================================
     5. ENTRADA: abrir a janela e mergulhar pra dentro
     ========================================================= */
  var winHit    = $('#window-hit');
  var winGroup  = $('#window-group');
  var enterBtn  = $('#enter-btn');
  var veil      = $('#veil');
  var sceneOut  = $('#scene-outside');
  var nav       = $('#nav');
  var hint      = $('#hint');
  var volBanheiro = $('#vol-banheiro');
  var volMeu      = $('#vol-meu');
  var player    = $('#player');

  var COMODOS = [
    { id: 'room1', sel: '#scene-room1', titulo: 'o quarto' },
    { id: 'room2', sel: '#scene-room2', titulo: 'a sala' },
    { id: 'room5', sel: '#scene-room5', titulo: 'a cozinha' },
    { id: 'room3', sel: '#scene-room3', titulo: 'o banheiro' },
    { id: 'room4', sel: '#scene-room4', titulo: 'a garagem' },
    { id: 'room6', sel: '#scene-room6', titulo: 'my room' },
    { id: 'hall',  sel: '#scene-hall',  titulo: 'o corredor' }
  ];
  var TOTAL_PREVISTO = COMODOS.length;
  var atual = 0, trocando = false;
  var imersaoAtual = null;
  var backBtn = $('#back-btn');

  var entrou = false;
  var dentroPronto = false;   // libera a paralaxe só depois do zoom de entrada

  /* No celular a arte vira um panorama mais largo que a tela:
     abre já centralizado, senão a pessoa começa olhando pra parede. */
  var ehCelular = function () { return window.matchMedia('(max-width: 760px)').matches; };

  function cenaAtual() { return $(COMODOS[atual].sel); }

  /* Uma cena visível por vez. Antes, quatro funções diferentes mexiam em
     is-active por conta própria; se duas se atropelassem, sobravam dois
     cômodos pintados ao mesmo tempo, com o de baixo aparecendo por cima. */
  function mostrarCena(scene) {
    if (!scene) return;
    $$('.scene').forEach(function (s) { s.classList.toggle('is-active', s === scene); });
    var arte = $('.art', scene);
    if (arte) arte.style.transform = '';
  }

  function centralizarPanorama(scene) {
    if (!ehCelular() || !scene) return;
    var stage = $('.scene__stage', scene);
    if (!stage) return;
    var sobra = stage.scrollWidth - stage.clientWidth;
    if (sobra > 0) stage.scrollLeft = sobra / 2;
  }

  function centralizarTudo() {
    centralizarPanorama(sceneOut);
    COMODOS.forEach(function (c) { centralizarPanorama($(c.sel)); });
  }

  /* As cenas de imersao sao SVG de 16:9 com "slice": a arte cobre a janela e
     o que sobra e cortado. Numa tela deitada isso e o certo. Numa tela em pe
     nao: com 9:19 de proporcao, o corte come as laterais inteiras e do guidao
     sobra so o painel no meio -- as manoplas e as maos ficam fora da tela.

     Entao em tela estreita a regra vira "meet", que encaixa a arte inteira, e
     ancorada embaixo, pra moto sentar no rodape e o resto da altura ficar pra
     estrada (que e desenhada no canvas, atras, e ocupa a janela toda). */
  function ajustarImersoes() {
    /* 1.05 e nao 1.35: o limite tem que separar tela EM PE de tela deitada,
       nao "larga" de "estreita". Com 1.35 uma janela de computador de
       1140x914 (proporcao 1,25) caia no modo estreito e o guidao aparecia
       encaixotado no meio da tela, com tarja em cima e embaixo.

       E o "meet" vale SO pro minigame. La atras do SVG existe o canvas da
       estrada, que preenche a janela inteira, entao encaixar o guidao embaixo
       deixa o resto ocupado. Nas outras imersoes nao ha nada atras: encaixar
       a arte embaixo deixava tres quartos da tela em preto. Essas continuam
       preenchendo a janela e cortando o que sobra, que e o certo. */
    var estreita = (window.innerWidth / Math.max(1, window.innerHeight)) < 1.05;
    $$('.art--imersao').forEach(function (svg) {
      var cena = svg.closest('.scene');
      var temCanvas = cena && cena.querySelector('canvas');
      svg.setAttribute('preserveAspectRatio',
        (estreita && temCanvas) ? 'xMidYMax meet' : 'xMidYMid slice');
    });
  }
  ajustarImersoes();
  window.addEventListener('orientationchange', function () {
    setTimeout(function () { ajustarImersoes(); centralizarTudo(); }, 260);
  });

  window.addEventListener('load', centralizarTudo);
  window.addEventListener('resize', function () {
    ajustarImersoes();
    clearTimeout(centralizarTudo._t);
    centralizarTudo._t = setTimeout(centralizarTudo, 220);
  });
  centralizarTudo();

  if (winHit && winGroup) {
    winHit.addEventListener('mouseenter', function () { winGroup.classList.add('is-hover'); });
    winHit.addEventListener('mouseleave', function () { winGroup.classList.remove('is-hover'); });
  }

  function entrar() {
    if (entrou) return;
    entrou = true;

    var t = reduced
      ? { dive: 10,  veil: 20,   swap: 120,  clear: 200,  ui: 260 }
      : { dive: 950, veil: 2250, swap: 2850, clear: 2960, ui: 3500 };

    body.classList.add('is-opening');
    setTimeout(function () { body.classList.add('is-diving'); }, t.dive);
    setTimeout(function () { veil.classList.add('is-on'); },    t.veil);

    setTimeout(function () {
      mostrarCena(cenaAtual());
      body.classList.add('is-inside');
      snowOn = false;                       // a neve agora é a da janela do quarto
      aoEntrarNoComodo(false);
      centralizarPanorama(cenaAtual());
    }, t.swap);

    setTimeout(function () { veil.classList.remove('is-on'); }, t.clear);

    setTimeout(function () {
      dentroPronto = true;
      hint.hidden = false;
      atualizarDica();
      requestAnimationFrame(function () {
        nav.classList.add('is-visible');
        hint.classList.add('is-visible');
      });
    }, t.ui);
  }

  if (winHit)   winHit.addEventListener('click', entrar);
  if (enterBtn) enterBtn.addEventListener('click', entrar);

  /* =========================================================
     5b. A GALERIA DA ESCRIVANINHA
         os desenhos dela, em papel, na ordem em que chegaram
     ========================================================= */
  var DESENHOS = [
    'media/desenhos/desenho-01.png', 'media/desenhos/desenho-02.png',
    'media/desenhos/desenho-03.png', 'media/desenhos/desenho-04.png',
    'media/desenhos/desenho-05.png', 'media/desenhos/desenho-06.png',
    'media/desenhos/desenho-07.webp', 'media/desenhos/desenho-08.png',
    'media/desenhos/desenho-09.png', 'media/desenhos/desenho-10.png',
    'media/desenhos/desenho-11.png', 'media/desenhos/desenho-12.png',
    'media/desenhos/desenho-13.png'
  ];

  // as fotos das duas, no album em cima da mesa da cozinha
  var ALBUM = [
    'media/album/album-01.webp', 'media/album/album-02.webp',
    'media/album/album-03.webp', 'media/album/album-04.webp',
    'media/album/album-05.webp', 'media/album/album-06.webp'
  ];

  /* Os sete que sairam da estante e viraram quadro na parede do my room.
     Aqui eles usam a mesma lupa da pasta de desenhos, mas sem passar pela
     grade: clicou, abriu o primeiro, e as setas passam um por vez. */
  var POSTERES = [
    'media/posters/yumeko.webp', 'media/posters/roblucci.webp',
    'media/posters/tomioka.webp', 'media/posters/doflamingo.webp',
    'media/posters/katakuri.webp', 'media/posters/obanai.webp',
    'media/posters/bakugou.webp'
  ];

  var galeria   = $('#galeria');
  var grade     = $('#galeria-grade');
  var lupa      = $('#lupa');
  var lupaImg   = $('#lupa-img');
  var lupaConta = $('#lupa-conta');
  var atualDes  = 0;
  var galAtual  = DESENHOS;      // colecao aberta no momento
  var gradeDe   = null;          // qual colecao a grade esta mostrando

  function montarGrade(lista) {
    if (!grade || gradeDe === lista) return;
    gradeDe = lista;
    grade.innerHTML = '';
    lista.forEach(function (url, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'desenho';
      b.setAttribute('aria-label', 'Abrir o item ' + (i + 1));
      var img = document.createElement('img');
      img.src = url;
      img.loading = 'lazy';
      img.alt = 'Item ' + (i + 1);
      var n = document.createElement('span');
      n.className = 'desenho__n';
      n.textContent = (i + 1) < 10 ? '0' + (i + 1) : String(i + 1);
      b.appendChild(img);
      b.appendChild(n);
      b.addEventListener('click', function () { abrirLupa(i); });
      grade.appendChild(b);
    });
  }

  function abrirGaleria(lista, olho, titulo) {
    if (!galeria) return;
    galAtual = lista || DESENHOS;
    montarGrade(galAtual);
    var o = $('#galeria-olho'), t = $('#galeria-titulo');
    if (o && olho) o.textContent = olho;
    if (t && titulo) t.textContent = titulo;
    galeria.hidden = false;
    if (hint) hint.classList.remove('is-visible');
  }

  function fecharGaleria() {
    if (!galeria) return;
    fecharLupa();
    galeria.hidden = true;
  }

  function abrirLupa(i) {
    if (!lupa) return;
    atualDes = (i + galAtual.length) % galAtual.length;
    lupaImg.src = galAtual[atualDes];
    lupaConta.textContent = (atualDes + 1) + ' / ' + galAtual.length;
    lupa.hidden = false;
  }
  function fecharLupa() { if (lupa) lupa.hidden = true; }

  function verPosteres() {
    galAtual = POSTERES;
    abrirLupa(0);
  }
  function passarLupa(d) { abrirLupa(atualDes + d); }

  if (galeria) {
    $('#galeria-fechar').addEventListener('click', fecharGaleria);
    // clicar no escuro em volta tambem fecha
    galeria.addEventListener('click', function (e) { if (e.target === galeria) fecharGaleria(); });
    $('#lupa-fechar').addEventListener('click', fecharLupa);
    $('#lupa-ant').addEventListener('click', function () { passarLupa(-1); });
    $('#lupa-prox').addEventListener('click', function () { passarLupa(1); });
    lupa.addEventListener('click', function (e) { if (e.target === lupa) fecharLupa(); });

    document.addEventListener('keydown', function (e) {
      if (!lupa.hidden) {
        if (e.key === 'Escape')     { e.preventDefault(); fecharLupa(); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); passarLupa(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); passarLupa(1); }
        return;
      }
      if (!galeria.hidden && e.key === 'Escape') { e.preventDefault(); fecharGaleria(); }
    });
  }

  /* =========================================================
     6. CARTÕES DA HISTÓRIA
     ========================================================= */
  var layer   = $('#card-layer');
  var cardTag = $('#card-tag');
  var cardTit = $('#card-title');
  var cardTxt = $('#card-text');
  var vistos  = {};

  function abrirCard(dados) {
    cardTag.textContent = dados.tag;
    cardTit.textContent = dados.title;
    cardTxt.textContent = dados.text;
    layer.hidden = false;
    requestAnimationFrame(function () { layer.classList.add('is-open'); });
    if (hint) hint.classList.remove('is-visible');
  }

  function fecharCard() {
    layer.classList.remove('is-open');
    setTimeout(function () { layer.hidden = true; }, 450);
  }

  $('#card-close').addEventListener('click', fecharCard);
  layer.addEventListener('click', function (e) { if (e.target === layer) fecharCard(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !layer.hidden) fecharCard();
  });

  $$('.hotspot').forEach(function (el) {
    var scene = el.closest('.scene');
    var sala = scene ? scene.getAttribute('data-scene') : null;
    var chave = el.getAttribute('data-hotspot');

    function acionar() {
      vistos[sala + ':' + chave] = true;
      atualizarProgresso();

      // o pôster torto: primeiro ela endireita, aí a cena abre
      if (chave === 'pirata' && posterPirata && posterPirata.classList.contains('is-torto')) {
        posterPirata.classList.remove('is-torto');
        var mgP = MERGULHOS['room1:pirata'];
        setTimeout(function () { mergulhar(scene, mgP.imersao, mgP.ox, mgP.oy); }, 1200);
        return;
      }
      // a TV: o primeiro clique liga, o segundo entra
      if (chave === 'tv' && !body.classList.contains('tv-ligada')) {
        body.classList.add('tv-ligada');
        return;
      }

      // a escrivaninha não abre cartão nenhum: abre a pasta de desenhos
      if (chave === 'desenhos') {
        abrirGaleria(DESENHOS, 'a gaveta da escrivaninha', 'o que ela desenhou');
        return;
      }
      // o album em cima da mesa da cozinha abre a mesma galeria, outra colecao
      if (chave === 'album') {
        abrirGaleria(ALBUM, 'o álbum em cima da mesa', 'vocês duas');
        return;
      }
      // e a estante abre o visor, que é onde a colecão aparece de perto
      if (chave === 'estante')  { abrirVitrine(); return; }
      // a parede do my room: um pôster por vez, com seta pra passar
      if (chave === 'mural')    { verPosteres(); return; }
      // o aparelho de som só liga e desliga a música
      if (chave === 'som')      { alternarSom(); return; }

      // o resto mergulha numa cena inteira
      var mg = MERGULHOS[sala + ':' + chave];
      if (mg) mergulhar(scene, mg.imersao, mg.ox, mg.oy, mg.portao);
    }
    el.addEventListener('click', acionar);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); acionar(); }
    });
  });

  /* =========================================================
     5c. O VISOR DA ESTANTE
         a mesma arte da prateleira, so que grande o bastante
         pra aparecer o que foi desenhado
     ========================================================= */
  var vitrine   = $('#vitrine');
  var vitGrade  = $('#vitrine-grade');
  var foco      = $('#foco');
  var focoPalco = $('#foco-palco');
  var focoNome  = $('#foco-nome');
  var pecas     = [];
  var pecaAtual = 0;
  var vitrineFeita = false;

  /* o getBBox devolve a caixa antes do transform do proprio grupo;
     o <use> aplica esse transform, entao a moldura tem que vir depois dele */
  function caixaDaPeca(g) {
    var b = g.getBBox();
    var lista = g.transform && g.transform.baseVal;
    var m = (lista && lista.numberOfItems) ? lista.consolidate().matrix : null;
    var ex = m ? m.a : 1, ey = m ? m.d : 1, dx = m ? m.e : 0, dy = m ? m.f : 0;
    return { x: b.x * ex + dx, y: b.y * ey + dy, w: b.width * ex, h: b.height * ey };
  }

  function svgDaPeca(g, altura) {
    var c = caixaDaPeca(g);
    var folga = Math.max(c.w, c.h) * 0.08;
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', (c.x - folga) + ' ' + (c.y - folga) + ' ' +
                              (c.w + folga * 2) + ' ' + (c.h + folga * 2));
    s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    if (altura) s.setAttribute('height', altura);
    var u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', '#' + g.id);
    s.appendChild(u);
    return s;
  }

  function montarVitrine() {
    if (vitrineFeita || !vitGrade) return;
    vitrineFeita = true;
    pecas = $$('#scene-room6 .af');
    pecas.forEach(function (g, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'peca';
      // uma vaga vazia enquanto o render nao chega, em vez do desenho antigo
      var vaga = document.createElement('div');
      vaga.className = 'peca__vaga';
      b.appendChild(vaga);
      var n = document.createElement('span');
      n.textContent = g.getAttribute('data-nome') || ('peça ' + (i + 1));
      b.appendChild(n);
      var url3d = g.getAttribute('data-modelo');
      if (url3d) {
        b.classList.add('peca--3d');
        var selo = document.createElement('i');
        selo.className = 'peca__selo';
        selo.textContent = '3D';
        b.appendChild(selo);
        miniaturaDoModelo(url3d, 300, 380).then(function (png) {
          var img = new Image();
          img.className = 'peca__mini';
          img.alt = g.getAttribute('data-nome') || '';
          img.src = png;
          b.replaceChild(img, vaga);
        }).catch(function () { b.classList.add('peca--sem3d'); });
      }
      b.addEventListener('click', function () { abrirFoco(i); });
      vitGrade.appendChild(b);
    });
  }

  /* ---- as pecas que tem STL abrem o modelo 3D de verdade ---- */
  var libs3d = null;
  function carregarTres() {
    if (!libs3d) {
      libs3d = Promise.all([
        import('three'),
        import('three/addons/loaders/STLLoader.js'),
        import('three/addons/controls/OrbitControls.js'),
        import('three/addons/loaders/GLTFLoader.js')
      ]);
    }
    return libs3d;
  }

  var palco3d = null;   // o render que esta rodando agora, pra poder parar
  var geoCache  = {};   // url -> promessa da malha, pra nao baixar duas vezes
  var rendMini  = null; // um render so, fora da tela, faz todas as miniaturas

  /* Devolve um objeto 3D pronto, ja de pe, seja STL ou GLB. Fica em cache e
     cada uso trabalha com um clone: geometria e material sao compartilhados,
     entao nada disso pode ser descartado quando uma janela fecha. */
  function carregarModelo(url) {
    if (!geoCache[url]) {
      geoCache[url] = carregarTres().then(function (mods) {
        var THREE = mods[0];
        var berco = new THREE.Group();
        berco.rotation.x = -Math.PI / 2;   // arquivo de impressao vem com Z pra cima

        if (/[.](glb|gltf)$/i.test(url)) {
          var GLTFLoader = mods[3].GLTFLoader;
          return new Promise(function (ok, erro) {
            new GLTFLoader().load(url, function (res) {
              res.scene.traverse(function (o) {
                if (o.isMesh && !o.geometry.attributes.normal) o.geometry.computeVertexNormals();
              });
              berco.add(res.scene);
              ok(berco);
            }, undefined, erro);
          });
        }

        var STLLoader = mods[1].STLLoader;
        return new Promise(function (ok, erro) {
          new STLLoader().load(url, function (geo) {
            geo.computeVertexNormals();
            berco.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
              color: 0xe6ded2, roughness: 0.52, metalness: 0.04
            })));
            ok(berco);
          }, undefined, erro);
        });
      });
    }
    return geoCache[url];
  }

  function luzesDe(THREE, cena) {
    cena.add(new THREE.HemisphereLight(0xdfe7f2, 0x241c2e, 1.0));
    var a = new THREE.DirectionalLight(0xfff1dc, 2.1); a.position.set(3, 5, 4);
    var b = new THREE.DirectionalLight(0x9fd0ff, 1.2); b.position.set(-4, 2, -3);
    var c = new THREE.DirectionalLight(0xffd9a8, 0.7); c.position.set(-2, -2, 4);
    cena.add(a, b, c);
  }

  /* enquadra pela altura E pela largura, senao a peca fica boiando no card */
  function enquadrar(THREE, cam, tam, prop, folga) {
    var meioV = Math.tan(THREE.MathUtils.degToRad(34) / 2);
    var dist = Math.max((tam.y * 0.5) / meioV,
                        (Math.max(tam.x, tam.z) * 0.5) / (meioV * prop)) * folga;
    cam.position.set(0, 0, dist);
    cam.near = dist / 200; cam.far = dist * 20;
    cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
    return dist;
  }

  /* desenha um quadro so e devolve PNG: assim da pra ter varias miniaturas
     3D sem gastar um contexto WebGL pra cada card da grade */
  function miniaturaDoModelo(url, larg, alt, giroY, cor) {
    return Promise.all([carregarTres(), carregarModelo(url)]).then(function (r) {
      var THREE = r[0][0], fonte = r[1];
      if (!rendMini) {
        rendMini = new THREE.WebGLRenderer({
          antialias: true, alpha: true, preserveDrawingBuffer: true
        });
        rendMini.setPixelRatio(1);
        rendMini.outputColorSpace = THREE.SRGBColorSpace;
      }
      rendMini.setSize(larg, alt);

      var cena = new THREE.Scene();
      luzesDe(THREE, cena);

      var alvo = new THREE.Group();
      var copia = fonte.clone();
      /* O 3mf do carro veio de uma cor so. Trocando o material da copia da pra
         tirar varios carros diferentes do mesmo arquivo, sem baixar mais nada. */
      if (cor) {
        copia.traverse(function (o) {
          if (o.isMesh) {
            o.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(cor), roughness: 0.38, metalness: 0.12
            });
          }
        });
      }
      alvo.add(copia);
      var caixa = new THREE.Box3().setFromObject(alvo);
      var tam = caixa.getSize(new THREE.Vector3());
      alvo.position.sub(caixa.getCenter(new THREE.Vector3()));

      var giro = new THREE.Group();
      giro.add(alvo);
      // tres quartos por padrao, que mostra mais volume; a moto da garagem
      // pede quase de perfil, como estava no desenho
      giro.rotation.y = (giroY === undefined) ? -0.45 : giroY;
      cena.add(giro);

      var cam = new THREE.PerspectiveCamera(34, larg / alt, 0.1, 100000);
      enquadrar(THREE, cam, tam, larg / alt, 1.06);

      rendMini.render(cena, cam);
      return rendMini.domElement.toDataURL('image/png');
    });
  }

  /* O minigame e em primeira pessoa: o que aparece e o guidao, os retrovisores
     e o tanque vistos de cima. Por isso aqui a camera nao enquadra a peca
     inteira como a da estante -- ela senta na garupa e olha pra frente. */
  function poseDePilotagem(url, larg, alt) {
    return Promise.all([carregarTres(), carregarModelo(url)]).then(function (r) {
      var THREE = r[0][0], fonte = r[1];
      if (!rendMini) {
        rendMini = new THREE.WebGLRenderer({
          antialias: true, alpha: true, preserveDrawingBuffer: true
        });
        rendMini.setPixelRatio(1);
        rendMini.outputColorSpace = THREE.SRGBColorSpace;
      }
      rendMini.setSize(larg, alt);

      var cena = new THREE.Scene();
      luzesDe(THREE, cena);

      var alvo = new THREE.Group();
      alvo.add(fonte.clone());
      var caixa = new THREE.Box3().setFromObject(alvo);
      var tam = caixa.getSize(new THREE.Vector3());
      var meio = caixa.getCenter(new THREE.Vector3());
      alvo.position.sub(meio);
      cena.add(alvo);

      /* Tudo em fracao do tamanho da peca, pra nao depender da escala do 3mf:
         a camera fica atras do meio, na altura do banco, e mira o guidao. */
      var cam = new THREE.PerspectiveCamera(52, larg / alt, 0.1, 100000);
      // olho do piloto: um pouco atras do tanque e acima dele, mirando quase na
      // horizontal. Se a camera olha pra baixo, a moto ocupa a tela toda e some
      // a pista -- o que se quer e ela so na faixa de baixo.
      cam.position.set(-tam.x * 0.22, tam.y * 0.70, 0);
      cam.lookAt(tam.x * 0.85, tam.y * 0.40, 0);
      cam.updateProjectionMatrix();

      rendMini.render(cena, cam);
      return rendMini.domElement.toDataURL('image/png');
    });
  }

  /* a mesma moto da garagem entra no minigame, agora vista de cima do banco */
  var povFeito = false;
  function motoNoJogo() {
    if (povFeito) return;
    var svg = $('#scene-street svg');
    var painel = svg && svg.querySelector('.painel-moto');
    if (!painel) return;
    povFeito = true;
    var ns = 'http://www.w3.org/2000/svg';
    poseDePilotagem('media/3d/moto.glb', 1600, 900).then(function (png) {
      var img = document.createElementNS(ns, 'image');
      img.setAttribute('href', png);
      img.setAttribute('x', 0);
      img.setAttribute('y', 0);
      img.setAttribute('width', 1600);
      img.setAttribute('height', 900);
      img.setAttribute('preserveAspectRatio', 'xMidYMax slice');
      img.setAttribute('class', 'moto-pov');
      img.setAttribute('pointer-events', 'none');
      // o desenho do guidao e dos retrovisores sai; o painel fica, porque
      // e ele que mostra a marcha, a velocidade e o conta-giros
      ['.retro-moto', '.guidao'].forEach(function (sel) {
        var g = svg.querySelector(sel);
        if (g) g.style.display = 'none';
      });
      /* Primeiro filho do cockpit: a moto fica atras das maos e do painel, e
         os tres passam a inclinar como uma peca so. */
      var conj = svg.querySelector('#cockpit') || painel.parentNode;
      conj.insertBefore(img, conj.firstChild);
    }).catch(function () {});
  }

  function pararModelo() {
    if (palco3d) { palco3d.parar(); palco3d = null; }
  }

  function montarModelo(host, url, aoPronto, aoFalhar) {
    Promise.all([carregarTres(), carregarModelo(url)]).then(function (r) {
      var THREE = r[0][0], OrbitControls = r[0][2].OrbitControls, fonte = r[1];
      var w = host.clientWidth || 600, h = host.clientHeight || 600;

      var ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      ren.setSize(w, h);
      ren.outputColorSpace = THREE.SRGBColorSpace;
      ren.domElement.style.cursor = 'grab';

      var cena = new THREE.Scene();
      luzesDe(THREE, cena);

      var alvo = new THREE.Group();
      alvo.add(fonte.clone());
      var caixa = new THREE.Box3().setFromObject(alvo);
      var tam = caixa.getSize(new THREE.Vector3());
      alvo.position.sub(caixa.getCenter(new THREE.Vector3()));
      cena.add(alvo);

      var cam = new THREE.PerspectiveCamera(34, w / h, 0.1, 100000);
      var dist = enquadrar(THREE, cam, tam, w / h, 1.08);

      var ctrl = new OrbitControls(cam, ren.domElement);
      ctrl.enablePan = false;
      ctrl.enableDamping = true; ctrl.dampingFactor = 0.08;
      ctrl.autoRotate = true; ctrl.autoRotateSpeed = 1.1;
      ctrl.minDistance = dist * 0.45; ctrl.maxDistance = dist * 2.4;
      ctrl.addEventListener('start', function () { ctrl.autoRotate = false; });

      host.appendChild(ren.domElement);
      var vivo = true;
      (function anima() {
        if (!vivo) return;
        requestAnimationFrame(anima);
        ctrl.update();
        ren.render(cena, cam);
      })();

      /* a malha fica no cache pra proxima abertura: so o render e descartado */
      palco3d = {
        parar: function () {
          vivo = false;
          ctrl.dispose(); ren.dispose();
          if (ren.domElement.parentNode) ren.domElement.parentNode.removeChild(ren.domElement);
        }
      };
      if (aoPronto) aoPronto();
    }).catch(function () { if (aoFalhar) aoFalhar(); });
  }

  /* Na propria prateleira, quem tem modelo aparece renderizado no lugar do
     desenho. O desenho nao e apagado: ele vai pro <defs>, porque o <use> da
     grade ainda precisa alcancar ele enquanto o 3D nao carrega. */
  var estante3dFeita = false;
  /* A moto da garagem: o desenho sai e entra o render do modelo. O <g> que
     recebe o clique continua o mesmo, entao o portao e o minigame seguem
     funcionando sem saber da troca. */
  var motoFeita = false;
  function motoNaGaragem() {
    if (motoFeita) return;
    var g = $('.moto-area');
    if (!g) return;
    motoFeita = true;
    var ns = 'http://www.w3.org/2000/svg';
    var c = g.getBBox();
    // o desenho sai agora, nao quando o render chegar
    var desenho = Array.prototype.slice.call(g.children);
    desenho.forEach(function (f) { f.style.display = 'none'; });
    miniaturaDoModelo('media/3d/moto.glb', 1000, 560, -0.12).then(function (png) {
      /* O render vem com folga em volta da peca, entao encaixar a imagem na
         caixa do desenho deixava a moto pairando. Aqui ela cresce um pouco e
         desce, pra a roda encostar no chao em vez de flutuar. */
      var CRESCE = 1.18, DESCE = 0.10;
      var altura = c.height * CRESCE;
      var topo = c.y + c.height - altura + c.height * DESCE;
      var largura = c.width * CRESCE;
      var esq = c.x + (c.width - largura) / 2;
      var chao = c.y + c.height + c.height * 0.035;

      // a sombra vem antes da imagem: e ela que prende a moto no piso
      var sombra = document.createElementNS(ns, 'ellipse');
      sombra.setAttribute('cx', c.x + c.width / 2);
      sombra.setAttribute('cy', chao);
      sombra.setAttribute('rx', c.width * 0.42);
      sombra.setAttribute('ry', c.height * 0.055);
      sombra.setAttribute('fill', '#0a0c0f');
      sombra.setAttribute('opacity', '0.58');
      sombra.setAttribute('class', 'moto-sombra');
      g.appendChild(sombra);

      var img = document.createElementNS(ns, 'image');
      img.setAttribute('href', png);
      img.setAttribute('x', esq);
      img.setAttribute('y', topo);
      img.setAttribute('width', largura);
      img.setAttribute('height', altura);
      img.setAttribute('preserveAspectRatio', 'xMidYMax meet');
      img.setAttribute('class', 'moto-3d');
      g.appendChild(img);
    }).catch(function () {});
  }

  /* O desenho sai da prateleira ANTES do render comecar, nao depois. Antes ele
     ficava a mostra ate o 3d chegar, e nos primeiros segundos no comodo a
     estante inteira aparecia em boneco desenhado -- exatamente o que nao se
     quer ver. Agora a vaga fica vazia e enche quando o modelo chega, custe o
     tempo que custar. A caixa e medida antes de guardar o desenho, porque
     getBBox de elemento escondido volta zero. */
  function modelosNaEstante() {
    if (estante3dFeita) return;
    estante3dFeita = true;
    var ns = 'http://www.w3.org/2000/svg';
    $$('.af[data-modelo]').forEach(function (g) {
      var c = caixaDaPeca(g);
      var svg = g.ownerSVGElement;
      if (!svg) return;
      var marca = document.createComment('vaga de ' + (g.getAttribute('data-nome') || '?'));
      g.parentNode.insertBefore(marca, g.nextSibling);

      var cofre = svg.querySelector('defs');
      if (!cofre) {
        cofre = document.createElementNS(ns, 'defs');
        svg.insertBefore(cofre, svg.firstChild);
      }
      cofre.appendChild(g);        // o desenho continua no arquivo, so nao na cena

      miniaturaDoModelo(g.getAttribute('data-modelo'), 320, 420).then(function (png) {
        var alt = c.h, larg = alt * (320 / 420);
        var img = document.createElementNS(ns, 'image');
        img.setAttribute('href', png);
        img.setAttribute('x', c.x + c.w / 2 - larg / 2);
        img.setAttribute('y', c.y + c.h - alt);
        img.setAttribute('width', larg);
        img.setAttribute('height', alt * 1.03);   // compensa a folga do render
        img.setAttribute('preserveAspectRatio', 'xMidYMax meet');
        img.setAttribute('class', 'af-3d');
        marca.parentNode.insertBefore(img, marca);
      }).catch(function () {});
    });
  }

  function abrirVitrine() {
    if (!vitrine) return;
    montarVitrine();
    vitrine.hidden = false;
    if (hint) hint.classList.remove('is-visible');
  }
  function fecharVitrine() { if (vitrine) { fecharFoco(); vitrine.hidden = true; } }

  function abrirFoco(i) {
    if (!foco || !pecas.length) return;
    pararModelo();
    pecaAtual = (i + pecas.length) % pecas.length;
    var g = pecas[pecaAtual];
    var nome = g.getAttribute('data-nome') || '';
    var modelo = g.getAttribute('data-modelo');
    focoPalco.innerHTML = '';
    focoNome.textContent = nome + '  ·  ' + (pecaAtual + 1) + ' de ' + pecas.length;
    foco.hidden = false;

    if (!modelo) { focoPalco.appendChild(svgDaPeca(g)); return; }

    /* enquanto o STL nao chega, o desenho segura o lugar */
    focoPalco.appendChild(svgDaPeca(g));
    focoPalco.classList.add('foco__palco--carregando');
    focoNome.textContent = nome + '  ·  carregando o modelo 3D…';
    var meu = pecaAtual;
    montarModelo(focoPalco, modelo, function () {
      if (meu !== pecaAtual) { pararModelo(); return; }
      var svg = focoPalco.querySelector('svg');
      if (svg) svg.remove();
      focoPalco.classList.remove('foco__palco--carregando');
      focoNome.textContent = nome + '  ·  modelo 3D · arraste pra girar';
    }, function () {
      focoPalco.classList.remove('foco__palco--carregando');
      focoNome.textContent = nome + '  ·  não consegui abrir o modelo 3D';
    });
  }
  function fecharFoco() { pararModelo(); if (foco) foco.hidden = true; }
  function passarFoco(d) { abrirFoco(pecaAtual + d); }

  if (vitrine) {
    $('#vitrine-fechar').addEventListener('click', fecharVitrine);
    vitrine.addEventListener('click', function (e) { if (e.target === vitrine) fecharVitrine(); });
    $('#foco-fechar').addEventListener('click', fecharFoco);
    $('#foco-ant').addEventListener('click', function () { passarFoco(-1); });
    $('#foco-prox').addEventListener('click', function () { passarFoco(1); });
    foco.addEventListener('click', function (e) { if (e.target === foco) fecharFoco(); });
    document.addEventListener('keydown', function (e) {
      if (!foco.hidden) {
        if (e.key === 'Escape')     { e.preventDefault(); fecharFoco(); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); passarFoco(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); passarFoco(1); }
        return;
      }
      if (!vitrine.hidden && e.key === 'Escape') { e.preventDefault(); fecharVitrine(); }
    });
  }

  /* =========================================================
     6b. DICAS — uma trilha por cômodo, revelada uma de cada vez
     ========================================================= */
  var DICAS = {
    room1: [
      'Verifique o computador.',
      'Verifique o quadro de Piratas do Caribe.',
      'Verifique a escrivaninha dos desenhos.'
    ],
    room2: [
      'Ligue a TV e depois clique nela de novo.'
    ],
    room4: [
      'Verifique a moto.'
    ],
    room5: [
      'Verifique o álbum em cima da mesa.'
    ],
    room6: [
      'Verifique a estante de action figure.',
      'Verifique os pôsteres na parede.'
    ]
  };

  var caixaDicas = $('#dicas');
  var balaoDicas = $('#dicas-balao');
  var dicaN      = $('#dicas-n');
  var dicaTxt    = $('#dicas-txt');
  var dicaMais   = $('#dicas-mais');
  var dicaBtn    = $('#dicas-btn');
  var passoDica  = 0;

  function trilhaDoComodo() {
    return DICAS[COMODOS[atual].id] || null;
  }

  function pintarDica() {
    var t = trilhaDoComodo();
    if (!t) return;
    var i = Math.min(passoDica, t.length - 1);
    dicaN.textContent = 'dica ' + (i + 1) + ' de ' + t.length;
    dicaTxt.textContent = t[i];
    dicaMais.hidden = (i >= t.length - 1);
  }

  function abrirDicas(abrir) {
    if (!caixaDicas) return;
    balaoDicas.hidden = !abrir;
    dicaBtn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    body.classList.toggle('dicas-abertas', abrir);
    if (abrir) pintarDica();
  }

  /* cada cômodo recomeça do zero, senão a pessoa volta e já está na última */
  function arrumarDicas() {
    if (!caixaDicas) return;
    var t = trilhaDoComodo();
    passoDica = 0;
    abrirDicas(false);
    caixaDicas.hidden = !t || !!imersaoAtual;
  }

  /* ---- o menu de tres barrinhas do celular ----
     Ele nao move nada de lugar: so acende ou apaga uma classe no body, e o
     CSS cuida de mostrar os controles empilhados acima dele. Assim cada
     controle continua com a sua propria logica intacta. */
  var menuToque = $('#menu-toque');
  function fecharMenu() {
    body.classList.remove('menu-aberto');
    if (menuToque) menuToque.setAttribute('aria-expanded', 'false');
  }
  if (menuToque) {
    menuToque.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var abrir = !body.classList.contains('menu-aberto');
      body.classList.toggle('menu-aberto', abrir);
      menuToque.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    });
    // tocar no cenario fecha; tocar num controle nao
    document.addEventListener('click', function (ev) {
      if (!body.classList.contains('menu-aberto')) return;
      if (ev.target.closest('.menu-toque, .dicas, .vol, .som-btn, .player')) return;
      fecharMenu();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') fecharMenu();
    });
  }

  if (caixaDicas) {
    dicaBtn.addEventListener('click', function () { abrirDicas(balaoDicas.hidden); });
    $('#dicas-fechar').addEventListener('click', function () { abrirDicas(false); });
    dicaMais.addEventListener('click', function () {
      var t = trilhaDoComodo();
      if (t && passoDica < t.length - 1) { passoDica++; pintarDica(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !balaoDicas.hidden) abrirDicas(false);
    });
  }

  /* Antes isso contava as entradas de HISTORIA. Sem os cartoes de texto, quem
     diz o que existe pra fazer num comodo sao os proprios pontos clicaveis. */
  function tudoVisto() {
    var scene = cenaAtual();
    if (!scene) return false;
    var pontos = scene.querySelectorAll('.hotspot[data-hotspot]');
    if (!pontos.length) return false;
    var sala = COMODOS[atual].id;
    return Array.prototype.every.call(pontos, function (el) {
      return vistos[sala + ':' + el.getAttribute('data-hotspot')];
    });
  }

  function atualizarDica() {
    if (!hint) return;
    var scene = cenaAtual();
    // comodo sem nada clicavel (o banheiro, por enquanto) nao manda clicar
    if (scene && !scene.querySelector('.hotspot[data-hotspot]')) {
      hint.textContent = '';
      hint.classList.remove('is-visible');
      return;
    }
    if (tudoVisto()) {
      hint.textContent = 'você viu tudo daqui — siga adiante';
    } else {
      hint.textContent = ehCelular()
        ? 'arraste pros lados · toque nos objetos'
        : 'clique nos objetos do cômodo';
    }
  }

  function atualizarProgresso() {
    if (tudoVisto() && hint) {
      atualizarDica();
      hint.classList.add('is-visible');
    }
  }

  window.addEventListener('resize', atualizarDica);

  /* =========================================================
     7. O GATO — pula de móvel em móvel e derruba coisinhas
     ========================================================= */
  var POLEIROS = {
    room6: [
      { x: 640, y: 320 },                        // topo da estante
      { x: 984, y: 560 },                        // encosto da poltrona
      { x: 1180, y: 628, bagunca: '.caneca6' },  // mesinha do abajur
      { x: 900, y: 838 },                        // tapete
      { x: 700, y: 786 }                         // base da estante
    ],
    room1: [
      { x: 150,  y: 434, bagunca: '.plant' },         // peitoril da janela
      { x: 360,  y: 524, bagunca: '.mug' },           // mesa do computador
      { x: 830,  y: 286 },                            // topo da estante
      { x: 1000, y: 778, bagunca: '.floor-stack' },   // chão, ao lado da pilha de mangá
      { x: 1235, y: 538, bagunca: '.perfume' },       // penteadeira
      { x: 1420, y: 596 },                            // cama
      { x: 700,  y: 838 }                             // tapete
    ],
    room2: [
      { x: 210,  y: 800 },                            // chão, na frente do aparador
      { x: 200,  y: 592, bagunca: '.mantel-books' },  // tampo do aparador
      { x: 860,  y: 318 },                            // em cima da TV
      { x: 560,  y: 606, bagunca: '.console-stuff' }, // móvel da TV
      { x: 700,  y: 682 },                            // encosto do sofá
      { x: 1141, y: 388 },                            // topo da caixa de som
      { x: 1090, y: 784 }                             // beira da mesinha
    ],
    room3: [
      { x: 200,  y: 544, bagunca: '.bottles' },       // borda da banheira
      { x: 560,  y: 560 },                            // bancada, ponta esquerda
      { x: 1000, y: 560 },                            // bancada, ponta direita
      { x: 1250, y: 604 },                            // carrinho da tintura
      { x: 1500, y: 654 },                            // cesto de roupa
      { x: 800,  y: 848 }                             // tapete
    ],
    room5: [
      { x: 470,  y: 540, bagunca: '.cafeteira' },   // bancada, do lado da cafeteira
      { x: 880,  y: 540, bagunca: '.chaleira' },    // bancada, perto da chaleira
      { x: 1340, y: 404, bagunca: '.louca' },       // prateleira da louça
      { x: 1440, y: 540 },                          // canto da bancada
      { x: 240,  y: 850 },                          // chão, perto da geladeira
      { x: 1250, y: 860 }                           // chão, do outro lado
    ],
    room4: [
      { x: 300,  y: 556, bagunca: '.helmet' },        // bancada, do lado do capacete
      { x: 170,  y: 700 },                            // caixa de ferramentas
      { x: 1444, y: 676 },                            // topo dos pneus
      { x: 820,  y: 584 },                            // em cima do tanque da moto
      { x: 700,  y: 800 },                            // chão
      { x: 1230, y: 806 }                             // chão, perto do portão
    ]
  };

  function criarGato(scene, poleiros) {
    var el = scene ? $('.cat', scene) : null;
    if (!el || !poleiros || poleiros.length < 2) return null;

    var i = 0, ativo = false, raf = null, timer = null;

    /* o gato é desenhado virado pra direita; scale(-1,1) espelha.
       `ang` gira o corpo em torno do tronco pra ele seguir a curva do pulo. */
    function desenhar(x, y, espelhado, ang) {
      var t = 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')' +
              ' scale(' + (espelhado ? -1 : 1) + ',1)';
      if (ang) t += ' rotate(' + ang.toFixed(1) + ',6,-38)';
      el.setAttribute('transform', t);
    }

    function derrubar(sel) {
      var alvo = $(sel, scene);
      if (!alvo) return;
      alvo.classList.remove('is-messed');
      void alvo.getBoundingClientRect();     // reinicia a animação
      alvo.classList.add('is-messed');
      setTimeout(function () { alvo.classList.remove('is-messed'); }, 5200);
    }

    function pular(de, para) {
      var dx = para.x - de.x, dy = para.y - de.y;
      var dist = Math.abs(dx);
      var dur = Math.min(1100, 540 + dist * 0.34);
      var arco = 70 + dist * 0.09;
      var espelhado = dx < 0;
      var dxLocal = Math.max(40, dist);     // evita ângulo absurdo em pulo vertical
      var ultimoT = null, decorrido = 0;

      el.classList.add('is-jumping');

      function frame(now) {
        /* tempo acumulado quadro a quadro, com o intervalo limitado:
           se a aba some ou o navegador engasga, o salto continua de onde
           parou em vez de teleportar o gato pro destino. */
        if (ultimoT === null) ultimoT = now;
        decorrido += Math.min(64, now - ultimoT);
        ultimoT = now;

        var k = Math.min(1, decorrido / dur);
        var x = de.x + dx * k;
        var y = de.y + dy * k - Math.sin(Math.PI * k) * arco;

        // inclinação = tangente da parábola: nariz pra cima subindo, pra baixo caindo
        var dydk = dy - Math.PI * Math.cos(Math.PI * k) * arco;
        var ang = Math.atan2(dydk, dxLocal * Math.PI) * 180 / Math.PI;
        ang = Math.max(-32, Math.min(32, ang));

        desenhar(x, y, espelhado, ang);

        if (k < 1) { raf = requestAnimationFrame(frame); return; }

        raf = null;
        desenhar(para.x, para.y, espelhado, 0);
        el.classList.remove('is-jumping');
        el.classList.add('is-landing');
        setTimeout(function () { el.classList.remove('is-landing'); }, 460);
        if (para.bagunca) derrubar(para.bagunca);
        agendarProximo();
      }
      raf = requestAnimationFrame(frame);
    }

    function agendarProximo() {
      if (!ativo) return;
      timer = setTimeout(function () {
        if (!ativo) return;
        var j = i;
        while (j === i) j = Math.floor(Math.random() * poleiros.length);
        var de = poleiros[i], para = poleiros[j];
        i = j;

        // antecipação: vira pro lado do salto, agacha, e só então impulsiona
        el.classList.add('is-crouch');
        desenhar(de.x, de.y, para.x < de.x, 0);
        timer = setTimeout(function () {
          if (!ativo) return;
          el.classList.remove('is-crouch');
          pular(de, para);
        }, 240);
      }, 2000 + Math.random() * 3600);
    }

    /* clicar (ou encostar) no gato: ele leva um susto e sai correndo */
    var frio = false;
    function assustar() {
      if (!ativo || frio || el.classList.contains('is-jumping')) return;
      frio = true;
      jaAssustouNesteHover = true;
      el.classList.remove('is-susto');
      void el.getBoundingClientRect();
      el.classList.add('is-susto');
      Efeitos.miado();

      clearTimeout(timer);
      setTimeout(function () { el.classList.remove('is-susto'); }, 820);
      timer = setTimeout(function () {
        if (!ativo) return;
        var j = i;
        while (j === i) j = Math.floor(Math.random() * poleiros.length);
        var de = poleiros[i], para = poleiros[j];
        i = j;
        pular(de, para);                      // foge pra outro móvel
      }, 780);
      setTimeout(function () { frio = false; }, 2200);
    }
    /* o clique sempre assusta; o hover só assusta uma vez por aproximação.
       Sem isso, o gato que aterrissa embaixo do cursor parado dispara
       pointerenter de novo e entra num ciclo de fuga sem fim. */
    var jaAssustouNesteHover = false;
    el.addEventListener('click', assustar);
    el.addEventListener('pointerenter', function () {
      if (jaAssustouNesteHover) return;
      assustar();
    });
    el.addEventListener('pointerleave', function () { jaAssustouNesteHover = false; });

    return {
      ligar: function () {
        if (ativo) return;
        ativo = true;
        desenhar(poleiros[i].x, poleiros[i].y, false);
        if (reduced) return;                 // fica só sentadinho
        agendarProximo();
      },
      desligar: function () {
        ativo = false;
        clearTimeout(timer);
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        el.classList.remove('is-jumping');
        el.classList.remove('is-landing');
        el.classList.remove('is-crouch');
      }
    };
  }

  var GATOS = {
    room1: criarGato($('#scene-room1'), POLEIROS.room1),
    room2: criarGato($('#scene-room2'), POLEIROS.room2),
    room3: criarGato($('#scene-room3'), POLEIROS.room3),
    room4: criarGato($('#scene-room4'), POLEIROS.room4),
    room5: criarGato($('#scene-room5'), POLEIROS.room5),
    room6: criarGato($('#scene-room6'), POLEIROS.room6)
  };

  function pararGatos() {
    Object.keys(GATOS).forEach(function (k) { if (GATOS[k]) GATOS[k].desligar(); });
  }

  /* clicar no dragão: ele se enfurece, bate as asas rápido e solta fogo */
  (function dragaoInterativo() {
    var dr = $('.dragon'), alvo = $('.dragon__hit');
    if (!dr || !alvo) return;
    var frio = false;
    function enfurecer() {
      if (frio) return;
      frio = true;
      dr.classList.remove('is-bravo');
      void dr.getBoundingClientRect();
      dr.classList.add('is-bravo');
      Efeitos.rugido();
      setTimeout(function () { dr.classList.remove('is-bravo'); }, 960);
      setTimeout(function () { frio = false; }, 1800);
    }
    alvo.addEventListener('click', enfurecer);
    alvo.addEventListener('pointerenter', enfurecer);
  })();

  /* =========================================================
     8. NAVEGAÇÃO ENTRE CÔMODOS
     ========================================================= */
  var dots = [];
  (function montarDots() {
    var host = $('#nav-dots');
    for (var i = 0; i < TOTAL_PREVISTO; i++) {
      var d = document.createElement('span');
      if (i === 0) d.className = 'is-on';
      host.appendChild(d);
      dots.push(d);
    }
  })();

  /* Os quadros com video paravam sozinhos. Medindo: o arquivo carrega
     inteiro (readyState 4), toca uns segundos e pausa. E o navegador
     poupando energia -- ele para video que saiu da area visivel.

     No computador isso quase nao aparece, porque o comodo inteiro cabe na
     tela. No celular o comodo e um panorama de 1444px numa janela de 375:
     basta arrastar pro lado que o quadro sai de vista e o video morre. E
     religar so na entrada do comodo nao adianta, porque a entrada ja
     aconteceu.

     Entao em vez de religar uma vez, um vigia confere de tempos em tempos:
     quem esta na cena da vez E dentro da tela toca; o resto pausa. Isso
     tambem evita gastar bateria com video tocando fora de vista. */
  /* Os videos ficavam dentro do SVG, num <foreignObject>. Em varios
     navegadores de celular isso simplesmente nao pinta: a moldura aparecia
     vazia -- foi o que apareceu nos testes de tela.

     Agora cada video e um elemento HTML comum, numa camada por cima do
     desenho. No lugar dele, dentro do SVG, ficou uma marca invisivel; o
     video so le a caixa dessa marca e se encaixa nela. Assim ele acompanha
     de graca tudo que mexe com o desenho: a escala do SVG, o arrasto do
     panorama no celular e a troca de orientacao.

     De quebra resolve o outro problema: video fora da area visivel e pausado
     pelo navegador pra poupar bateria, e aqui isso vira regra explicita --
     quem esta na cena da vez e dentro da tela toca, o resto para. */
  var camadaVideos = $('#camada-videos');
  var vagasVideo = [];

  (function montarVideos() {
    if (!camadaVideos) return;
    $$('.vaga-video').forEach(function (marca) {
      var v = document.createElement('video');
      v.className = 'foto-video';
      v.src = marca.getAttribute('data-video');
      v.loop = true;
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('muted', '');
      v.preload = 'auto';
      camadaVideos.appendChild(v);
      vagasVideo.push({ marca: marca, video: v, cena: marca.closest('.scene') });
    });
  })();

  function vigiarVideos() {
    var cena = imersaoAtual ? $(IMERSOES[imersaoAtual].sel) : cenaAtual();
    for (var i = 0; i < vagasVideo.length; i++) {
      var s = vagasVideo[i], v = s.video;
      var b = s.marca.getBoundingClientRect();
      var aparece = s.cena === cena && b.width > 2 &&
                    b.bottom > 0 && b.top < window.innerHeight &&
                    b.right > 0 && b.left < window.innerWidth;
      if (!aparece) {
        if (v.style.display !== 'none') v.style.display = 'none';
        if (!v.paused) v.pause();
        continue;
      }
      v.style.display = 'block';
      v.style.left = b.left + 'px';
      v.style.top = b.top + 'px';
      v.style.width = b.width + 'px';
      v.style.height = b.height + 'px';
      if (v.paused) v.play().catch(function () {});
    }
  }
  // captura: o panorama rola dentro do .scene__stage, nao na janela
  document.addEventListener('scroll', vigiarVideos, true);
  window.addEventListener('resize', vigiarVideos);
  setInterval(vigiarVideos, 400);

  function aoEntrarNoComodo(comTransicao) {
    var sala = COMODOS[atual];
    var scene = $(sala.sel);
    document.title = 'Feliz Aniversário — ' + sala.titulo;

    dots.forEach(function (d, i) { d.classList.toggle('is-on', i === atual); });
    $('#nav-prev').disabled = (atual === 0);

    // o gato só se mexe no cômodo que está à vista
    Object.keys(GATOS).forEach(function (k) {
      if (!GATOS[k]) return;
      if (k === sala.id) GATOS[k].ligar(); else GATOS[k].desligar();
    });

    vigiarVideos();

    if (sala.id === 'room6') modelosNaEstante();
    if (sala.id === 'room4') { motoNaGaragem(); motoNoJogo(); Jogo.prepararCenario(); }

    if (sala.id === 'room6') {
      if (!meuLigado && !reduced) somMeu(true);
      if (volMeu) volMeu.hidden = false;
    } else {
      if (meuLigado) somMeu(false);
      if (volMeu) volMeu.hidden = true;
    }

    if (sala.id === 'room3') {
      if (!banheiroLigado && !reduced) somBanheiro(true);
      if (volBanheiro) volBanheiro.hidden = false;
    } else {
      if (banheiroLigado) somBanheiro(false);
      if (volBanheiro) volBanheiro.hidden = true;
    }

    arrumarDicas();

    var naSala = (sala.id === 'room2');
    if (player) {
      if (naSala) {
        player.hidden = false;
        requestAnimationFrame(function () { player.classList.add('is-visible'); });
        // entrou na sala: o som começa sozinho (o clique de navegar já liberou o áudio)
        if (!salaLigada && !reduced) {
          setTimeout(function () {
            if (COMODOS[atual].id === 'room2' && !salaLigada) { somSala(true); mostrarLinha(0); }
          }, comTransicao ? 700 : 900);
        }
      } else {
        player.classList.remove('is-visible');
        setTimeout(function () { if (COMODOS[atual].id !== 'room2') player.hidden = true; }, 700);
        if (salaLigada) somSala(false);
      }
    }
    atualizarDica();
  }

  function irPara(i) {
    if (trocando) return;
    if (i >= COMODOS.length) { abrirCard(PROXIMO_COMODO); return; }
    if (i < 0 || i === atual) return;

    trocando = true;
    var de = cenaAtual(), para = $(COMODOS[i].sel);

    veil.classList.add('is-on');
    setTimeout(function () {
      mostrarCena(para);
      atual = i;
      aoEntrarNoComodo(true);
      centralizarPanorama(para);
      veil.classList.remove('is-on');
      setTimeout(function () { trocando = false; }, 720);
    }, 700);
  }

  /* ---------- navegação por portas ----------
     Cada cômodo tem uma porta que leva ao corredor, e o corredor
     tem uma porta para cada cômodo. Nada de ordem fixa. */
  function indiceDe(id) {
    for (var i = 0; i < COMODOS.length; i++) if (COMODOS[i].id === id) return i;
    return -1;
  }

  $$('.porta-saida').forEach(function (porta) {
    function ir() { irPara(indiceDe('hall')); }
    porta.addEventListener('click', ir);
    porta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(); }
    });
  });

  $$('.porta-hall').forEach(function (porta) {
    var destino = porta.getAttribute('data-porta');
    function ir() { irPara(indiceDe(destino)); }
    porta.addEventListener('click', ir);
    porta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(); }
    });
  });

  /* =========================================================
     8a. O MINIGAME — estrada infinita, carros pra desviar
     ========================================================= */
  var Jogo = (function () {
    var cv = $('#game-canvas');
    if (!cv) return { iniciar: function () {}, parar: function () {}, prepararCenario: function () {} };

    var ctx = cv.getContext('2d');
    var W = 0, H = 0, horizonte = 0, cx = 0;
    var dprJ = Math.min(window.devicePixelRatio || 1, 2);

    var rodando = false, raf = null, ultimo = 0;
    /* O mundo foi esticado 1.8x junto com a velocidade real. A R1 chega a
       83 m/s, quase o dobro do que este jogo usava; sem esticar a pista na
       mesma proporcao a 300 km/h vira borrao e nao da pra desviar. Como
       camera, segmento e distancia crescem juntos, a projecao nao muda:
       o que se ve continua no mesmo ritmo, mas agora em metros de verdade. */
    /* 2.25 em vez de 1.8: o mundo ficou 25% mais espacoso. A moto continua
       marcando os mesmos km/h da R1 de verdade -- o que muda e a distancia
       entre as coisas, entao da tempo de desviar sem mentir no painel. */
    var MUNDO = 2.25;
    var CAMD = 2.6 * MUNDO, SEG = 1.25 * MUNDO, NSEG = 72, Z_SPAWN = 66 * MUNDO;
    // 30 km/h saindo da garagem ate os 299 km/h de fabrica
    var VEL_INI = 8.3, VEL_MAX = 83;
    /* 0 a 100 km/h em 3,0 s e 0 a 200 em 7,0 s saem de dv/dt = A0(1-(v/vmax)^2)
       com A0 = 9.63 m/s^2 -- os numeros medidos da moto. */
    var ACEL0 = 9.63;

    /* Degraus de dificuldade: a cada marco, o mundo aperta.

       A moto continua marcando os km/h da R1 de verdade -- o painel nao mente.
       O que muda e a distancia entre as coisas: com o mundo 60% mais curto no
       ultimo degrau, os carros chegam 60% mais cedo na mesma velocidade. E o
       mesmo recurso que deixou o jogo mais leve quando voce pediu, so que
       agora andando pro outro lado conforme voce vai longe. */
    var DEGRAUS = [
      { m: 0,    ritmo: 1.00 },
      { m: 1500, ritmo: 1.12 },
      { m: 2000, ritmo: 1.24 },
      { m: 4000, ritmo: 1.40 },
      { m: 6000, ritmo: 1.60 }
    ];

    var FAIXAS = [-0.62, 0, 0.62];
    var POSTE_PASSO = 34;        // metros entre um poste e o proximo, alternando o lado
    var dist, vel, faixa, jogadorX, alvoX, carros, proxSpawn, morto, pontos, tremor, inclina;
    var enfeites, proxPoste, proxEnfeite, proxCasa, proxPredio, proxArvore, ladoPoste;
    var degrau, ritmo;
    var recorde = 0;
    try { recorde = parseInt(localStorage.getItem('siteana-recorde') || '0', 10) || 0; } catch (e) {}

    var hud     = $('#game-hud');
    var elPts   = $('#game-score');
    var elRec   = $('#game-best');
    var telaFim = $('#game-over');
    var elNivel = $('#game-nivel');

    function anunciarNivel(n) {
      if (!elNivel) return;
      elNivel.textContent = 'nível ' + (n + 1);
      elNivel.classList.remove('is-on');
      void elNivel.getBoundingClientRect();
      elNivel.classList.add('is-on');
    }
    var elFinal = $('#game-final');

    /* Tres carros na pista, os tres do mesmo modelo 3d, so que pintados
       diferente. Ficam prontos como imagem: desenhar PNG no canvas e barato,
       manter tres cenas WebGL rodando no meio do jogo nao seria. */
    var CORES = ['#c8201f', '#1f3f8f', '#d9d2c4'];
    var artesCarro = [];

    /* O fundo e uma foto de cidade a noite. Ela tambem tem estrada, mas a
       estrada aqui e desenhada -- por isso so a parte de cima da foto entra,
       cortada onde o asfalto dela comeca, e encaixada bem no horizonte. */
    /* A foto nova nao tem estrada nenhuma -- e so ceu, skyline e cidade baixa
       ate a borda de baixo. Por isso ela entra inteira: o corte de 0,655 que a
       anterior precisava nao serve mais pra nada aqui. */
    var FUNDO_CORTE = 1.0;
    var fundoPronto = false;
    var fundoCidade = new Image();
    fundoCidade.onload = function () { fundoPronto = true; };
    fundoCidade.src = 'media/jogo/cidade.webp';
    /* O PNG que sai do render vem com margem transparente em volta: o
       enquadramento sobra de proposito pra peca nao encostar na borda, e neste
       carro sobra muito, porque a camera enquadra o comprimento (490 mm) mas
       mostra a traseira (227 mm). Desenhar esse PNG inteiro com a base na
       pista era o que deixava o carro pairando -- as rodas ficam no meio da
       imagem, nao embaixo dela. Aqui se acha a caixa do que e opaco e se
       guarda so ela, recortada, pra base da arte ser a base das rodas.

       Junto vai uma escadinha de copias pela metade. O canvas reduzindo uma
       imagem de 400 px pra 15 px num passo so pula quase todos os pixels, e o
       que sobra e justamente o borrao que aparecia no fim da estrada. Caindo
       de 2 em 2 e escolhendo o degrau mais proximo do tamanho final, o carro
       longe sai nitido. */
    function recortarSprite(im) {
      var c = document.createElement('canvas');
      c.width = im.width; c.height = im.height;
      var g = c.getContext('2d');
      g.drawImage(im, 0, 0);
      var d;
      try { d = g.getImageData(0, 0, c.width, c.height).data; }
      catch (e) { return { niveis: [im], prop: im.height / im.width }; }

      var x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
      for (var y = 0; y < c.height; y++) {
        for (var x = 0; x < c.width; x++) {
          if (d[(y * c.width + x) * 4 + 3] > 14) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      }
      if (x1 < x0 || y1 < y0) return { niveis: [im], prop: im.height / im.width };

      var lg = x1 - x0 + 1, al = y1 - y0 + 1;
      var base = document.createElement('canvas');
      base.width = lg; base.height = al;
      base.getContext('2d').drawImage(im, x0, y0, lg, al, 0, 0, lg, al);

      var niveis = [base], atual = base;
      while (atual.width > 14) {
        var n = document.createElement('canvas');
        n.width = Math.max(7, Math.round(atual.width / 2));
        n.height = Math.max(5, Math.round(atual.height / 2));
        var gn = n.getContext('2d');
        gn.imageSmoothingEnabled = true;
        gn.imageSmoothingQuality = 'high';
        gn.drawImage(atual, 0, 0, n.width, n.height);
        niveis.push(n);
        atual = n;
      }
      return { niveis: niveis, prop: al / lg };
    }

    // o menor degrau que ainda e maior que o tamanho pedido
    function nivelPara(arte, larg) {
      var n = arte.niveis, i = 0;
      while (i < n.length - 1 && n[i + 1].width >= larg) i++;
      return n[i];
    }

    /* ---------------- a pista, que agora e um modelo 3d ----------------

       O 3mf da ponte virou `pista.glb`: um trecho reto de 2600 por 41,7, com o
       perfil do tabuleiro de verdade (meio chato e chanfro dos dois lados) e a
       pintura de tres faixas por cima.

       Desenhar isso com WebGL a cada quadro, junto de tudo o mais, seria caro.
       Mas a pista e reta e a camera nao se mexe: de um quadro pro outro so
       muda a FASE do tracejado, que se repete a cada `PISTA_PASSO`. Entao dez
       quadros cobrindo um passo inteiro bastam -- renderizados uma vez ao
       entrar na garagem, e depois so um drawImage por quadro.

       O unico movimento que sobra e o lateral, quando a moto troca de faixa.
       Esse sai de graca: o deslocamento do jogo e proporcional a `meia`, que
       por sua vez e proporcional a (y - horizonte). Proporcional a y e
       exatamente o que uma matriz de cisalhamento faz, entao a imagem inteira
       se inclina com um `ctx.transform` e o resultado e o certo, nao um
       arremedo. */
    var PISTA_ESC = 11 / 0.62;   // unidades do modelo por unidade do jogo
    var PISTA_PASSO = 110;       // distancia entre tracos, no modelo
    var PISTA_COMPR = 3400;
    var PISTA_QUADROS = 10;
    var PISTA_RES = 0.5;         // resolucao do render; a pista tem pouco detalhe
    var PISTA_LARG = 2;          // quantas telas de largura o render cobre
    var quadrosPista = null, pistaTam = '';

    /* ---------------- desfoque de movimento ----------------
       Em vez de somar varias copias por quadro (caro), o quadro anterior e
       guardado e volta por cima do atual, ampliado a partir do ponto de fuga.
       Como isso realimenta a cada quadro, o rastro decai sozinho e o resultado
       e um borrao radial: zero no centro da estrada, forte nas bordas, que e
       exatamente onde a vista borra de verdade em velocidade.

       O peso vai com o quadrado da velocidade, entao a 60 km/h nao aparece e a
       300 km/h domina. E a moto e o painel ficam de fora porque sao camadas
       SVG por cima do canvas -- so o mundo borra, o guidao fica firme. */
    var borrao = null, borrCtx = null;

    function prepararPista() {
      var chave = W + 'x' + H;
      if (!W || chave === pistaTam) return;
      pistaTam = chave;

      var px = dprJ * PISTA_RES;
      var rw = Math.round(W * PISTA_LARG * px);
      var rh = Math.round((H - horizonte) * 2 * px);
      var f = 0.8 * W * CAMD;                       // distancia focal, em px de CSS
      var altCam = (H - horizonte) * PISTA_ESC / (0.8 * W);
      var perto = CAMD * PISTA_ESC;                 // onde comeca o z=0 do jogo

      Promise.all([carregarTres(), carregarModelo('media/3d/pista.glb')])
        .then(function (r) {
          var THREE = r[0][0];
          if (!rendMini) {
            rendMini = new THREE.WebGLRenderer({
              antialias: true, alpha: true, preserveDrawingBuffer: true
            });
            rendMini.setPixelRatio(1);
            rendMini.outputColorSpace = THREE.SRGBColorSpace;
          }
          rendMini.setSize(rw, rh);

          var cena = new THREE.Scene();
          // a noite: pouca luz do ceu e o farol da moto puxando o asfalto perto
          cena.add(new THREE.HemisphereLight(0x2b3552, 0x04060b, 0.30));
          var lua = new THREE.DirectionalLight(0x9fb8ff, 0.30);
          lua.position.set(-0.4, 1, 0.3);
          cena.add(lua);
          var farol = new THREE.PointLight(0xffeccf, 5.2, perto * 5, 1.9);
          farol.position.set(0, altCam * 0.5, -perto * 0.85);
          cena.add(farol);
          // a pista some no escuro antes de chegar no horizonte, senao a
          // emenda com a foto da cidade aparece
          cena.fog = new THREE.Fog(0x070a14, perto + PISTA_COMPR * 0.05,
                                   perto + PISTA_COMPR * 0.80);

          var grupo = new THREE.Group();
          var malha = r[1].clone();
          /* O filamento da ponte e prata claro. Prata vira asfalto quando se
             escurece, e a tinta branca fica com um brilho proprio -- que e o
             que tinta de estrada faz mesmo, ela e retrorrefletiva. */
          malha.traverse(function (o) {
            if (!o.isMesh || !o.material || !o.material.color) return;
            o.material = o.material.clone();
            var c = o.material.color;
            if ((c.r + c.g + c.b) / 3 > 0.7) o.material.emissive = new THREE.Color(0x6b6455);
            else c.multiplyScalar(0.46);
          });
          grupo.add(malha);
          grupo.rotation.y = Math.PI / 2;           // comprimento do modelo -> profundidade
          cena.add(grupo);

          var cam = new THREE.PerspectiveCamera(
            2 * Math.atan((H - horizonte) / f) * 180 / Math.PI, rw / rh, 1, perto + PISTA_COMPR * 1.2);
          cam.position.set(0, altCam, 0);
          cam.lookAt(0, altCam, -1);

          var feitos = [];
          for (var i = 0; i < PISTA_QUADROS; i++) {
            grupo.position.z = -(perto + PISTA_COMPR / 2) + (i * PISTA_PASSO / PISTA_QUADROS);
            rendMini.render(cena, cam);
            var c = document.createElement('canvas');
            c.width = rw; c.height = rh;
            c.getContext('2d').drawImage(rendMini.domElement, 0, 0);
            feitos.push(c);
          }
          quadrosPista = feitos;
        })
        .catch(function () { quadrosPista = null; });
    }

    /* ---------------- o cenario da beira da estrada ----------------

       Os modelos viram sprite do mesmo jeito que os carros: um render 3d,
       recorte justo e escadinha de reducoes. Depois e so drawImage.

       A altura de cada um vai em METROS, e a escala sai da propria pista: 0,62
       de unidade lateral e uma faixa, e faixa de verdade tem 3,5 m. Assim o
       poste tem oito metros de verdade em relacao ao carro e a moto, em vez de
       um tamanho escolhido no olho. */
    var METRO = 0.62 / 3.5;

    var ENFEITES = [
      /* O poste foi impresso em azul vivo. Numa estrada a noite aquilo vira
         brinquedo, entao aqui ele vai em aco escuro -- e uma linha so pra
         voltar ao azul do filamento, e so tirar a cor. */
      { url: 'media/3d/poste.glb',  m: 8.2,  giro: 0,  cor: '#39414f', lampada: true },
      { url: 'media/3d/placa.glb',  m: 2.6,  giro: 0 },
      { url: 'media/3d/cone.glb',   m: 0.75, giro: -0.4 },
      { url: 'media/3d/barril.glb', m: 1.15, giro: -0.4 },
      /* Oito pedestres. Cada um com um giro diferente, senao a beira da
         estrada vira uma fila de gente olhando pro mesmo lado. */
      { url: 'media/3d/pessoa-field_watcher.glb',           m: 1.78, giro: 0.6 },
      { url: 'media/3d/pessoa-man_standing_and_hold.glb',   m: 1.76, giro: -0.5 },
      { url: 'media/3d/pessoa-profile_of_a_man.glb',        m: 1.80, giro: 1.2 },
      { url: 'media/3d/pessoa-winter_stroll.glb',           m: 1.70, giro: -1.1 },
      { url: 'media/3d/pessoa-agent_in_style.glb',          m: 1.82, giro: 0.9 },
      { url: 'media/3d/pessoa-elegant_in_white_dres.glb',   m: 1.72, giro: -0.8 },
      { url: 'media/3d/pessoa-elegant_diva.glb',            m: 1.74, giro: 1.5 },
      { url: 'media/3d/pessoa-contemplative_eleganc.glb',   m: 1.25, giro: 0.3 },

      /* Casas. Vao longe da pista, atras do guard-rail, e por isso podem ser
         altas de verdade -- e a altura em metros que faz o casario parecer
         casario e nao maquete. Renderizam num quadro mais largo que os outros
         enfeites porque casa e mais larga que alta. */
      { url: 'media/3d/casa-chale.glb', m: 5.2, giro: -0.6, rw: 760, rh: 620 },
      { url: 'media/3d/casa-01.glb',    m: 6.6, giro: -0.5, rw: 760, rh: 620 },
      { url: 'media/3d/casa-lenha.glb', m: 9.5, giro: -0.7, rw: 880, rh: 620 },
      { url: 'media/3d/casa-rosa.glb',  m: 4.5, giro: -0.9, rw: 700, rh: 640 },

      /* Os quatro predios parisienses. Sao o fundo de tras de tudo: quinze a
         dezessete metros, bem afastados, e por isso fecham o horizonte e dao a
         sensacao de rua em vez de estrada no vazio. */
      { url: 'media/3d/predio-p1.glb', m: 15.0, giro: -0.5, rw: 980, rh: 620 },
      { url: 'media/3d/predio-p2.glb', m: 16.0, giro: -0.6, rw: 800, rh: 720 },
      { url: 'media/3d/predio-p3.glb', m: 16.0, giro: -0.7, rw: 800, rh: 720 },
      { url: 'media/3d/predio-p6.glb', m: 17.0, giro: -0.4, rw: 860, rh: 700 },

      /* Arvores. Sao o enchimento principal: vem em ritmo apertado e ocupam a
         faixa entre o guard-rail e as casas. */
      { url: 'media/3d/arvore-1.glb',    m:  8.5, giro: -0.3, rw: 640, rh: 700 },
      { url: 'media/3d/arvore-koks.glb', m:  9.5, giro: -0.8, rw: 640, rh: 700 },
      { url: 'media/3d/arvore-dnd.glb',  m: 11.0, giro:  0.4, rw: 620, rh: 760 }
    ];
    var I_POSTE = 0, I_PRIMEIRA_PESSOA = 4;
    var I_PRIMEIRA_CASA = 12, I_PRIMEIRO_PREDIO = 16, I_PRIMEIRA_ARVORE = 20;
    var artesEnfeite = [];

    function prepararCenario() {
      if (artesCarro.length) return;
      CORES.forEach(function (cor, i) {
        // 900x700: depois do recorte sobram ~415 px de carro, que e o tamanho
        // que ele chega a ter colado na camera
        miniaturaDoModelo('media/3d/carro.glb', 900, 700, Math.PI / 2, cor)
          .then(function (png) {
            var im = new Image();
            im.onload = function () { artesCarro[i] = recortarSprite(im); };
            im.src = png;
          }).catch(function () {});
      });
      ENFEITES.forEach(function (e, i) {
        miniaturaDoModelo(e.url, e.rw || 420, e.rh || 780, e.giro, e.cor)
          .then(function (png) {
            var im = new Image();
            im.onload = function () { artesEnfeite[i] = recortarSprite(im); };
            im.src = png;
          }).catch(function () {});
      });
    }
    var ESTRELAS = [];
    for (var e = 0; e < 40; e++) ESTRELAS.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.4 });
    var PREDIOS = [];
    for (var b = 0; b < 26; b++) {
      PREDIOS.push({ x: Math.random(), w: 0.03 + Math.random() * 0.05, h: 0.1 + Math.random() * 0.34, luzes: Math.random() });
    }

    function medir() {
      W = cv.clientWidth || window.innerWidth;
      H = cv.clientHeight || window.innerHeight;
      cv.width = Math.round(W * dprJ);
      cv.height = Math.round(H * dprJ);
      ctx.setTransform(dprJ, 0, 0, dprJ, 0, 0);
      horizonte = H * 0.40;
      cx = W * 0.5;
      if (!borrao) {
        borrao = document.createElement('canvas');
        borrCtx = borrao.getContext('2d');
      }
      borrao.width = cv.width; borrao.height = cv.height;
    }

    function proj(z) {
      var s = CAMD / (z + CAMD);
      return { y: horizonte + (H - horizonte) * s, s: s, meia: W * 0.80 * s };
    }

    function quad(x1, y1, x2, y2, x3, y3, x4, y4) {
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4);
      ctx.closePath(); ctx.fill();
    }

    function rr(x, y, w, h, r) {
      ctx.beginPath();
      if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); }
      else { ctx.rect(x, y, w, h); }
      ctx.fill();
    }

    /* A cada subida de marcha a moto da um tranco. Como o guidao agora e um
       render, basta sacudir a imagem: e o mesmo efeito de peso jogando pra
       tras que se sente na moto de verdade. */
    /* A moto inclina pra dentro da faixa, e o cockpit inteiro vai junto: e o
       que da a impressao de guidao se mexendo sem precisar re-renderizar a
       moto em varios angulos. O giro acontece bem abaixo da tela, senao em vez
       de inclinar a moto parece que ela desliza de lado. */
    var elCockpit = null, inclinaVista = 0;
    function inclinarCockpit() {
      if (elCockpit === null) elCockpit = $('#cockpit') || false;
      if (!elCockpit) return;
      var alvo = -(inclina * 34) - (jogadorX * 3.6);
      inclinaVista += (alvo - inclinaVista) * 0.18;
      if (Math.abs(inclinaVista) < 0.02) inclinaVista = 0;
      elCockpit.setAttribute('transform',
        'rotate(' + inclinaVista.toFixed(2) + ' 800 1560)');
    }

    var marchaAnt = 1;
    function sacudirTroca() {
      Moto.trocar();
      var pov = $('.moto-pov');
      if (!pov) return;
      pov.classList.remove('is-trocando');
      void pov.getBoundingClientRect();
      pov.classList.add('is-trocando');
    }

    function reset() {
      dist = 0; vel = VEL_INI;
      faixa = 1; jogadorX = 0; alvoX = FAIXAS[1];
      carros = []; proxSpawn = 30 * MUNDO; marchaAnt = 1;
      enfeites = []; proxPoste = 20; proxEnfeite = 40; proxCasa = 55;
      proxPredio = 90; proxArvore = 16; ladoPoste = 1;
      degrau = 0; ritmo = DEGRAUS[0].ritmo;
      if (elNivel) { elNivel.textContent = ''; elNivel.classList.remove('is-on'); }
      morto = false; pontos = 0; tremor = 0; inclina = 0;
      telaFim.classList.remove('is-visible');
      telaFim.hidden = true;
      if (elRec) elRec.textContent = recorde;
    }

    function spawn() {
      var livre = Math.floor(Math.random() * 3);
      for (var i = 0; i < 3; i++) {
        if (i === livre) continue;
        if (Math.random() < 0.66) {
          carros.push({ x: FAIXAS[i], z: Z_SPAWN, arte: Math.floor(Math.random() * CORES.length) });
        }
      }
    }

    function bater() {
      if (morto) return;
      morto = true;
      tremor = 26;
      Moto.acelerar(0, 1);
      if (pontos > recorde) {
        recorde = pontos;
        try { localStorage.setItem('siteana-recorde', String(recorde)); } catch (e) {}
      }
      if (elFinal) elFinal.textContent = pontos;
      if (elRec) elRec.textContent = recorde;
      telaFim.hidden = false;
      requestAnimationFrame(function () { telaFim.classList.add('is-visible'); });
    }

    function passo(dt) {
      if (morto) { tremor *= 0.88; return; }

      var q = vel / VEL_MAX;
      vel = Math.min(VEL_MAX, vel + ACEL0 * (1 - q * q) * dt);
      /* O mundo anda por aqui. A velocidade da moto e a de fabrica; o ritmo e
         o quanto o cenario e comprimido no degrau atual. */
      var avanco = vel * ritmo * dt;
      dist += avanco;
      pontos = Math.floor(dist);

      while (degrau < DEGRAUS.length - 1 && dist >= DEGRAUS[degrau + 1].m) {
        degrau++;
        ritmo = DEGRAUS[degrau].ritmo;
        anunciarNivel(degrau);
      }

      var antes = jogadorX;
      jogadorX += (alvoX - jogadorX) * Math.min(1, dt * 9.5);
      inclina += (((jogadorX - antes) / Math.max(dt, 0.001)) * 0.05 - inclina) * 0.2;

      proxSpawn -= avanco;
      if (proxSpawn <= 0) {
        spawn();
        proxSpawn = (Math.max(17, 34 - dist * 0.0022) + Math.random() * 14) * MUNDO;
      }

      /* Poste de luz vem em ritmo certo, alternando de lado, que e como
         estrada de verdade e -- e o ritmo constante deles e o que mais da
         sensacao de velocidade. O resto do cenario vem sorteado. */
      proxPoste -= avanco;
      if (proxPoste <= 0) {
        ladoPoste = -ladoPoste;
        enfeites.push({ i: I_POSTE, x: ladoPoste * 1.62, z: Z_SPAWN, esp: ladoPoste > 0 });
        proxPoste = POSTE_PASSO;
      }
      proxEnfeite -= avanco;
      if (proxEnfeite <= 0) {
        var lado = Math.random() < 0.5 ? -1 : 1;
        var qual = Math.random();
        var i, x;
        if (qual < 0.52) {                    // gente: agora mais da metade
          i = I_PRIMEIRA_PESSOA + Math.floor(Math.random() * (I_PRIMEIRA_CASA - I_PRIMEIRA_PESSOA));
          x = lado * (1.5 + Math.random() * 1.05);
        } else if (qual < 0.66) {             // placa
          i = 1; x = lado * (1.36 + Math.random() * 0.25);
        } else if (qual < 0.86) {             // cone, quase no acostamento
          i = 2; x = lado * (1.14 + Math.random() * 0.14);
        } else {                              // barril
          i = 3; x = lado * (1.18 + Math.random() * 0.2);
        }
        enfeites.push({ i: i, x: x, z: Z_SPAWN, esp: Math.random() < 0.5 });
        proxEnfeite = 6 + Math.random() * 15;
      }
      /* Tres ritmos diferentes, cada um na sua faixa de afastamento: arvore
         perto e apertada, casa no meio, predio la atras e esparso. E isso que
         monta profundidade -- se tudo viesse no mesmo ritmo e na mesma
         distancia, viraria um paredao. */
      proxArvore -= avanco;
      if (proxArvore <= 0) {
        var ladoA = Math.random() < 0.5 ? -1 : 1;
        enfeites.push({
          i: I_PRIMEIRA_ARVORE + Math.floor(Math.random() * (ENFEITES.length - I_PRIMEIRA_ARVORE)),
          x: ladoA * (2.3 + Math.random() * 5.2),
          z: Z_SPAWN, esp: Math.random() < 0.5
        });
        proxArvore = 9 + Math.random() * 17;
      }

      proxCasa -= avanco;
      if (proxCasa <= 0) {
        var ladoC = Math.random() < 0.5 ? -1 : 1;
        enfeites.push({
          i: I_PRIMEIRA_CASA + Math.floor(Math.random() * (I_PRIMEIRO_PREDIO - I_PRIMEIRA_CASA)),
          x: ladoC * (3.1 + Math.random() * 3.3),
          z: Z_SPAWN, esp: Math.random() < 0.5
        });
        proxCasa = 38 + Math.random() * 74;
      }

      proxPredio -= avanco;
      if (proxPredio <= 0) {
        var ladoB = Math.random() < 0.5 ? -1 : 1;
        enfeites.push({
          i: I_PRIMEIRO_PREDIO + Math.floor(Math.random() * (I_PRIMEIRA_ARVORE - I_PRIMEIRO_PREDIO)),
          x: ladoB * (6.2 + Math.random() * 4.4),
          z: Z_SPAWN, esp: Math.random() < 0.5
        });
        proxPredio = 62 + Math.random() * 120;
      }

      for (var e = enfeites.length - 1; e >= 0; e--) {
        enfeites[e].z -= avanco;
        if (enfeites[e].z < -8) enfeites.splice(e, 1);
      }

      for (var i = carros.length - 1; i >= 0; i--) {
        var c = carros[i];
        c.z -= avanco;
        if (c.z < -5) { carros.splice(i, 1); continue; }
        if (c.z < 1.5 * MUNDO && c.z > -0.8 * MUNDO && Math.abs(c.x - jogadorX) < 0.31) bater();
      }

      var marchaNova = Moto.pilotar(vel * 3.6);
      if (marchaNova > marchaAnt) sacudirTroca();
      marchaAnt = marchaNova;
    }

    /* O guard-rail das duas margens. Nao e modelo nem sprite: e a propria
       projecao da pista desenhada como uma fita continua um pouco acima do
       chao, com montante de tempo em tempo. Custa quase nada e e o que mais
       enche a periferia -- sem ele a estrada fica boiando no escuro.

       Vai de tras pra frente junto com os segmentos, senao o pedaco de perto
       fica por baixo do de longe. */
    var GC_X = 1.27, GC_ALTO = 0.95, GC_BAIXO = 0.30;   // em metros

    function desenharGuardaCorpo() {
      for (var k = NSEG; k >= 1; k--) {
        var zA = k * SEG - (dist % SEG);
        var zB = zA - SEG;
        if (zB <= 0.4 || zA > Z_SPAWN) continue;
        var a = proj(zA), b = proj(zB);
        if (b.meia < 2) continue;
        var caA = cx - jogadorX * a.meia, caB = cx - jogadorX * b.meia;
        var idx = Math.floor(dist / SEG) + k;
        var nit = Math.min(1, (Z_SPAWN - zA) / (Z_SPAWN * 0.35));
        if (nit <= 0.02) continue;
        ctx.globalAlpha = nit;

        for (var lado = -1; lado <= 1; lado += 2) {
          var xA = caA + lado * GC_X * a.meia, xB = caB + lado * GC_X * b.meia;
          var topoA = a.y - GC_ALTO * METRO * a.meia, topoB = b.y - GC_ALTO * METRO * b.meia;
          var baseA = a.y - GC_BAIXO * METRO * a.meia, baseB = b.y - GC_BAIXO * METRO * b.meia;
          // a fita, com o claro em cima pegando a luz dos postes
          ctx.fillStyle = (idx % 2) ? '#4a5058' : '#434951';
          quad(xA, topoA, xB, topoB, xB, baseB, xA, baseA);
          ctx.fillStyle = 'rgba(226,232,240,0.30)';
          var fitaA = topoA + (baseA - topoA) * 0.26, fitaB = topoB + (baseB - topoB) * 0.26;
          quad(xA, topoA, xB, topoB, xB, fitaB, xA, fitaA);
          // montante a cada quatro segmentos
          if (idx % 4 === 0 && a.meia > 6) {
            var lg = Math.max(1, a.meia * 0.018);
            ctx.fillStyle = '#2b3037';
            quad(xA - lg, baseA, xA + lg, baseA, xA + lg, a.y, xA - lg, a.y);
          }
        }
        ctx.globalAlpha = 1;
      }
    }

    /* Os enfeites vao do mais longe pro mais perto, e cada um encosta a base
       da arte na linha do chao naquele z -- a mesma regra dos carros. */
    function desenharEnfeites() {
      var lista = enfeites.slice().sort(function (m, n) { return n.z - m.z; });
      for (var i = 0; i < lista.length; i++) {
        var e = lista[i], def = ENFEITES[e.i], arte = artesEnfeite[e.i];
        if (!arte || e.z <= 0.25 || e.z > Z_SPAWN + 2) continue;
        var pj = proj(e.z);
        var x = cx - jogadorX * pj.meia + e.x * pj.meia;
        var y = pj.y;
        var al = def.m * METRO * pj.meia;     // altura vinda dos metros de verdade
        var lg = al / arte.prop;
        if (al < 2.5) continue;

        var nit = Math.min(1, (Z_SPAWN - e.z) / (Z_SPAWN * 0.30));
        if (nit <= 0.02) continue;
        ctx.globalAlpha = nit;

        if (lg > 5) {
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(1, 0.18);
          var sb = ctx.createRadialGradient(0, 0, 0, 0, 0, lg * 0.55);
          sb.addColorStop(0, 'rgba(0,0,0,0.50)');
          sb.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = sb;
          ctx.beginPath(); ctx.arc(0, 0, lg * 0.55, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }

        var nv = nivelPara(arte, lg);
        ctx.imageSmoothingQuality = 'high';
        if (e.esp) {
          // espelhado: e assim que o braco do poste aponta pra pista dos dois lados
          ctx.save();
          ctx.translate(x, 0); ctx.scale(-1, 1);
          ctx.drawImage(nv, -lg / 2, y - al, lg, al);
          ctx.restore();
        } else {
          ctx.drawImage(nv, x - lg / 2, y - al, lg, al);
        }

        if (def.lampada && al > 18) {
          var lx = x + (e.esp ? -1 : 1) * lg * 0.36;
          var ly = y - al * 0.94;
          var raio = al * 0.17;
          var gl = ctx.createRadialGradient(lx, ly, 0, lx, ly, raio);
          gl.addColorStop(0, 'rgba(255,238,198,0.95)');
          gl.addColorStop(0.32, 'rgba(255,214,140,0.32)');
          gl.addColorStop(1, 'rgba(255,200,120,0)');
          ctx.fillStyle = gl;
          ctx.beginPath(); ctx.arc(lx, ly, raio, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }

    /* Escolhe o quadro pela fase do tracejado e inclina a imagem conforme a
       moto anda pro lado. O cisalhamento e exato: o deslocamento do jogo e
       proporcional a (y - horizonte), que e o que a matriz faz. */
    function desenharPista() {
      var passo = PISTA_PASSO / PISTA_ESC;                 // um passo, em unidades do jogo
      var fase = ((dist % passo) + passo) % passo;
      var q = quadrosPista[Math.floor(fase / passo * PISTA_QUADROS) % PISTA_QUADROS];
      var incl = -jogadorX * 0.8 * W / (H - horizonte);
      ctx.save();
      ctx.beginPath();
      ctx.rect(-60, horizonte, W + 120, H - horizonte + 60);
      ctx.clip();
      ctx.transform(1, 0, incl, 1, -incl * horizonte, 0);
      ctx.drawImage(q, 0, q.height / 2, q.width, q.height / 2,
                    -W * (PISTA_LARG - 1) / 2, horizonte, W * PISTA_LARG, H - horizonte);
      ctx.restore();
    }

    function desenhar() {
      /* Limpar o quadro inteiro, ANTES de tudo.

         Sem isto sobrava uma tira de uns 15 px logo abaixo do horizonte que
         ninguem pintava: o ceu termina exatamente no horizonte, e as faixas do
         chao so comecam no segmento mais distante, que ja cai uns 15 px abaixo
         dele. A pista 3d nao cobre porque ali ela ja virou um ponto.

         Tudo o que passava por essa tira ficava gravado pra sempre, camada
         sobre camada. Era esse o rastro fantasma no horizonte -- nao era
         borrao do objeto que vinha, era o quadro anterior que nunca era
         apagado. */
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, W, H);

      var sx = morto ? (Math.random() - 0.5) * tremor : 0;
      var sy = morto ? (Math.random() - 0.5) * tremor : 0;
      ctx.save();
      ctx.translate(sx, sy);

      // fundo: a foto da cidade, com um leve deslocamento lateral que
      // acompanha a moto e da sensacao de parallax
      var desl = -jogadorX * W * 0.05;
      if (fundoPronto) {
        var fh = fundoCidade.height * FUNDO_CORTE;
        var esc = Math.max((W + 120) / fundoCidade.width, horizonte / fh);
        var dw = fundoCidade.width * esc, dh = fh * esc;
        ctx.drawImage(fundoCidade, 0, 0, fundoCidade.width, fh,
                      (W - dw) / 2 + desl, horizonte - dh, dw, dh);
        /* a foto termina numa borda reta; este esmaecido apaga a emenda e
           deixa a cidade morrer dentro do escuro antes da pista comecar */
        var emenda = ctx.createLinearGradient(0, horizonte - horizonte * 0.16, 0, horizonte);
        emenda.addColorStop(0, 'rgba(6,8,16,0)');
        emenda.addColorStop(1, 'rgba(6,8,16,0.92)');
        ctx.fillStyle = emenda;
        ctx.fillRect(0, horizonte - horizonte * 0.16, W, horizonte * 0.16 + 2);
      } else {
        // enquanto a foto nao chega, o ceu de antes segura o lugar
        var g = ctx.createLinearGradient(0, 0, 0, horizonte);
        g.addColorStop(0, '#080a16'); g.addColorStop(0.6, '#1a1c33'); g.addColorStop(1, '#4a3550');
        ctx.fillStyle = g;
        ctx.fillRect(-40, -40, W + 80, horizonte + 42);
        ctx.fillStyle = '#e8eeff';
        for (var i = 0; i < ESTRELAS.length; i++) {
          var st = ESTRELAS[i];
          ctx.globalAlpha = 0.35 + st.r * 0.3;
          ctx.fillRect(st.x * W, st.y * horizonte * 0.8, st.r, st.r);
        }
        ctx.globalAlpha = 1;
        for (var p = 0; p < PREDIOS.length; p++) {
          var pr = PREDIOS[p];
          var px = pr.x * W + desl, pw = pr.w * W, ph = pr.h * H;
          ctx.fillStyle = '#10121e';
          ctx.fillRect(px, horizonte - ph, pw, ph);
        }
      }

      // o chao inteiro de uma vez, pra nao depender das faixas cobrirem tudo
      ctx.fillStyle = '#111520';
      ctx.fillRect(-60, horizonte, W + 120, H - horizonte + 60);

      // e por cima, as faixas alternadas: e delas que vem o senso de
      // velocidade na periferia da tela, fora da pista
      for (var k = NSEG; k >= 1; k--) {
        var zA = k * SEG - (dist % SEG);
        var zB = zA - SEG;
        if (zB <= 0.04) continue;
        var a = proj(zA), bq = proj(zB);
        var idx = Math.floor(dist / SEG) + k;
        var claro = (idx % 2) === 0;
        ctx.fillStyle = claro ? '#141a26' : '#111520';
        quad(-40, a.y, W + 40, a.y, W + 40, bq.y, -40, bq.y);
      }

      if (quadrosPista) {
        desenharPista();
      } else
      // a pista desenhada, que segura o lugar ate o render 3d ficar pronto
      for (var k = NSEG; k >= 1; k--) {
        var zA = k * SEG - (dist % SEG);
        var zB = zA - SEG;
        if (zB <= 0.04) continue;
        var a = proj(zA), bq = proj(zB);
        var idx = Math.floor(dist / SEG) + k;
        var claro = (idx % 2) === 0;

        var caA = cx - jogadorX * a.meia, caB = cx - jogadorX * bq.meia;

        ctx.fillStyle = claro ? '#272b34' : '#21252d';
        quad(caA - a.meia, a.y, caA + a.meia, a.y, caB + bq.meia, bq.y, caB - bq.meia, bq.y);

        var eA = a.meia * 0.05 + 1, eB = bq.meia * 0.05 + 1;
        ctx.fillStyle = claro ? '#cfc6ae' : '#8d8878';
        quad(caA - a.meia, a.y, caA - a.meia + eA, a.y, caB - bq.meia + eB, bq.y, caB - bq.meia, bq.y);
        quad(caA + a.meia - eA, a.y, caA + a.meia, a.y, caB + bq.meia, bq.y, caB + bq.meia - eB, bq.y);

        if (idx % 3 === 0) {
          var fA = a.meia * 0.02 + 0.6, fB = bq.meia * 0.02 + 0.6;
          ctx.fillStyle = '#efe8d2';
          quad(caA - a.meia * 0.21 - fA, a.y, caA - a.meia * 0.21 + fA, a.y,
               caB - bq.meia * 0.21 + fB, bq.y, caB - bq.meia * 0.21 - fB, bq.y);
          quad(caA + a.meia * 0.21 - fA, a.y, caA + a.meia * 0.21 + fA, a.y,
               caB + bq.meia * 0.21 + fB, bq.y, caB + bq.meia * 0.21 - fB, bq.y);
        }
      }

      desenharGuardaCorpo();
      desenharEnfeites();

      // carros, do mais longe pro mais perto
      var ordem = carros.slice().sort(function (m, n) { return n.z - m.z; });
      for (var q = 0; q < ordem.length; q++) {
        var c = ordem[q];
        if (c.z <= 0.06 || c.z > Z_SPAWN + 2) continue;
        var pj = proj(c.z);
        var ca = cx - jogadorX * pj.meia;
        var x = ca + c.x * pj.meia;
        var y = pj.y;                // a linha da pista exatamente naquele z
        var lg = pj.meia * 0.50;     // largura do carro: ~80% da faixa
        if (lg < 1.2) continue;

        /* Carro que nasce la no fundo nao aparece de uma vez: ele emerge do
           escuro do horizonte. Sem isso os poucos pixels que ele ocupa longe
           ficavam piscando na linha do horizonte antes de o carro chegar. */
        var nitidez = Math.min(1, (Z_SPAWN - c.z) / (Z_SPAWN * 0.34));
        if (nitidez <= 0.02) continue;
        ctx.globalAlpha = nitidez;

        var arte = artesCarro[c.arte];
        var al = lg * (arte ? arte.prop : 0.78);

        // sombra achatada no chao, centrada na linha de contato das rodas
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, 0.20);
        var sb = ctx.createRadialGradient(0, 0, 0, 0, 0, lg * 0.60);
        sb.addColorStop(0, 'rgba(0,0,0,0.60)');
        sb.addColorStop(0.62, 'rgba(0,0,0,0.30)');
        sb.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sb;
        ctx.beginPath(); ctx.arc(0, 0, lg * 0.60, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        if (arte) {
          // a base da arte e a base das rodas: encostando ela em y o carro
          // fica na pista em vez de flutuar acima dela
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(nivelPara(arte, lg), x - lg / 2, y - al, lg, al);
        } else {
          // enquanto o render nao fica pronto, o carro antigo segura o lugar
          ctx.fillStyle = CORES[c.arte];
          rr(x - lg / 2, y - al * 0.72, lg, al * 0.72, Math.max(2, lg * 0.1));
          ctx.fillStyle = '#10131a';
          rr(x - lg * 0.34, y - al, lg * 0.68, al * 0.44, Math.max(2, lg * 0.07));
        }

        // lanternas so quando ja da pra enxerga-las: menor que isso viram dois
        // pontos vermelhos soltos, que era metade do fantasma la no fundo
        if (lg > 18) {
          var lw = lg * 0.15, lh = al * 0.12, ly = y - al * 0.50;
          ctx.fillStyle = 'rgba(255,77,61,.16)';
          rr(x - lg * 0.46 - lw * 0.35, ly - lh * 0.6, lw * 1.7, lh * 2.2, lh);
          rr(x + lg * 0.31 - lw * 0.35, ly - lh * 0.6, lw * 1.7, lh * 2.2, lh);
          ctx.fillStyle = '#ff5240';
          rr(x - lg * 0.46, ly, lw, lh, Math.max(1, lh * 0.45));
          rr(x + lg * 0.31, ly, lw, lh, Math.max(1, lh * 0.45));
        }
        ctx.globalAlpha = 1;
      }

      if (borrao && !morto) {
        var vq = Math.max(0, (vel - VEL_INI) / (VEL_MAX - VEL_INI));
        var forca = vq * vq * 0.58;
        if (forca > 0.01) {
          var cresce = 1 + 0.045 * vq;
          ctx.save();
          ctx.globalAlpha = forca;
          ctx.translate(cx, horizonte);
          ctx.scale(cresce, cresce);
          ctx.translate(-cx, -horizonte);
          ctx.drawImage(borrao, 0, 0, W, H);
          ctx.restore();
        }
      }

      ctx.restore();

      if (borrCtx) {
        borrCtx.setTransform(1, 0, 0, 1, 0, 0);
        borrCtx.clearRect(0, 0, borrao.width, borrao.height);
        borrCtx.drawImage(cv, 0, 0);
      }
    }

    function laco(t) {
      if (!rodando) return;
      var dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0.016;
      ultimo = t;
      passo(dt);
      desenhar();
      inclinarCockpit();
      if (elPts) elPts.textContent = pontos;
      raf = requestAnimationFrame(laco);
    }

    function irFaixa(d) {
      if (morto) return;
      faixa = Math.max(0, Math.min(2, faixa + d));
      alvoX = FAIXAS[faixa];
    }

    function tecla(ev) {
      if (!rodando) return;
      if (ev.key === 'ArrowLeft' || ev.key === 'a' || ev.key === 'A') { irFaixa(-1); ev.preventDefault(); }
      if (ev.key === 'ArrowRight' || ev.key === 'd' || ev.key === 'D') { irFaixa(1); ev.preventDefault(); }
      if (morto && (ev.key === ' ' || ev.key === 'Enter')) { ev.preventDefault(); reset(); }
    }

    function apontar(ev) {
      if (!rodando || morto) return;
      var r = cv.getBoundingClientRect();
      var rel = (ev.clientX - r.left) / r.width;
      faixa = rel < 0.36 ? 0 : (rel > 0.64 ? 2 : 1);
      alvoX = FAIXAS[faixa];
    }

    window.addEventListener('resize', function () { if (rodando) { medir(); prepararPista(); } });

    var btnRe = $('#game-restart');
    if (btnRe) btnRe.addEventListener('click', function (ev) { ev.stopPropagation(); reset(); });

    return {
      // chamado ao entrar na garagem, pra os carros ja estarem prontos quando
      // o portao subir -- render WebGL no meio da corrida engasgaria o jogo
      prepararCenario: prepararCenario,
      iniciar: function () {
        if (rodando) return;
        rodando = true;
        medir();
        prepararPista();
        reset();
        hud.hidden = false;
        requestAnimationFrame(function () { hud.classList.add('is-visible'); });
        document.addEventListener('keydown', tecla);
        cv.addEventListener('pointerdown', apontar);
        cv.addEventListener('pointermove', function (ev) { if (ev.buttons) apontar(ev); });
        ultimo = 0;
        raf = requestAnimationFrame(laco);
      },
      parar: function () {
        if (!rodando) return;
        rodando = false;
        if (raf) cancelAnimationFrame(raf);
        document.removeEventListener('keydown', tecla);
        cv.removeEventListener('pointerdown', apontar);
        hud.classList.remove('is-visible');
        setTimeout(function () { if (!rodando) hud.hidden = true; }, 600);
        telaFim.classList.remove('is-visible');
        telaFim.hidden = true;
      }
    };
  })();

  /* =========================================================
     8b. MERGULHO — entrar numa tela e virar cenário
     ========================================================= */
  function somDaImersao(chave, ligar) {
    if (chave === 'road') {
      somEstrada(ligar);
      var vc = $('#vol-carro');
      if (vc) vc.hidden = !ligar;
    }
    if (chave === 'piratas') {
      if (videoPiratas && videoPiratas.classList.contains('is-on')) {
        if (ligar) { videoPiratas.muted = false; videoPiratas.play().catch(function () {}); }
        else videoPiratas.pause();
      }
    }
    if (chave === 'street') {
      // sem música aqui: o minigame ficou só com o motor
      if (ligar) { Moto.ligar(true); Jogo.iniciar(); Moto.volume(0.3); }
      else       { Moto.desligar(); Jogo.parar(); }
    }
    if (chave === 'titans') {
      if (videoAot && videoAot.classList.contains('is-on')) {
        if (ligar) tocarVideo(!pausadoPelaAba);   // voltar da aba retoma de onde parou
        else { videoAot.pause(); somBtn.hidden = true; }
      } else {
        ligar ? Ronco.ligar() : Ronco.desligar();
      }
    }
  }

  function esconderUiDeComodo() {
    nav.classList.remove('is-visible');
    hint.classList.remove('is-visible');
    if (player) player.classList.remove('is-visible');
    if (salaLigada) somSala(false);
    if (banheiroLigado) somBanheiro(false);
    if (volBanheiro) volBanheiro.hidden = true;
    if (meuLigado) somMeu(false);
    if (volMeu) volMeu.hidden = true;
    if (caixaDicas) { abrirDicas(false); caixaDicas.hidden = true; }
  }

  function mostrarUiDeComodo() {
    nav.classList.add('is-visible');
    hint.classList.add('is-visible');
    // voltando do mergulho a UI do comodo volta junto
    if (volBanheiro) volBanheiro.hidden = (COMODOS[atual].id !== 'room3');
    arrumarDicas();
  }

  function mergulhar(deScene, chave, ox, oy, abrirPortao) {
    if (trocando || imersaoAtual) return;
    var im = IMERSOES[chave];
    if (!im) return;
    trocando = true;

    var para = $(im.sel);
    var arte = $('.art', deScene);
    var atraso = 0;

    if (abrirPortao) {                       // a moto: o portão sobe antes
      body.classList.add('is-abrindo-portao');
      atraso = 1300;
    }

    setTimeout(function () {
      arte.style.transition = 'transform 1.6s cubic-bezier(.62,.02,.38,1), opacity 1.1s ease-in .55s, filter 1.6s ease';
      arte.style.transformOrigin = ox + '% ' + oy + '%';
      requestAnimationFrame(function () {
        arte.style.transform = 'scale(9)';
        arte.style.opacity = '0';
        arte.style.filter = 'blur(3px) brightness(1.3)';
      });
    }, atraso);

    setTimeout(function () { veil.classList.add('is-on'); }, atraso + 1250);

    setTimeout(function () {
      arte.style.transition = ''; arte.style.transform = '';
      arte.style.opacity = ''; arte.style.filter = ''; arte.style.transformOrigin = '';
      body.classList.remove('is-abrindo-portao');

      mostrarCena(para);
      body.classList.add('is-imersao');
      imersaoAtual = chave;

      pararGatos();
      esconderUiDeComodo();
      somDaImersao(chave, true);
      centralizarPanorama(para);
      document.title = 'Feliz Aniversário — ' + im.titulo;
    }, atraso + 1850);

    setTimeout(function () { veil.classList.remove('is-on'); }, atraso + 1970);

    setTimeout(function () {
      backBtn.hidden = false;
      $('#back-label').textContent = im.volta;
      requestAnimationFrame(function () { backBtn.classList.add('is-visible'); });
      trocando = false;
    }, atraso + 2400);
  }

  function voltarDaImersao() {
    if (!imersaoAtual || trocando) return;
    trocando = true;

    var im = IMERSOES[imersaoAtual];
    var de = $(im.sel);
    somDaImersao(imersaoAtual, false);
    backBtn.classList.remove('is-visible');
    veil.classList.add('is-on');

    setTimeout(function () {
      backBtn.hidden = true;
      body.classList.remove('is-imersao');
      imersaoAtual = null;

      atual = im.comodo;
      var para = cenaAtual();
      mostrarCena(para);

      aoEntrarNoComodo(true);
      centralizarPanorama(para);
      mostrarUiDeComodo();
      veil.classList.remove('is-on');
      setTimeout(function () { trocando = false; }, 720);
    }, 700);
  }

  backBtn.addEventListener('click', voltarDaImersao);

  document.addEventListener('keydown', function (e) {
    if (!entrou || !layer.hidden) return;
    if (imersaoAtual) {
      // na rua as setas são o controle do jogo; só o Esc sai
      if (e.key === 'Escape') voltarDaImersao();
      else if (e.key === 'ArrowLeft' && imersaoAtual !== 'street') voltarDaImersao();
      return;
    }
    if (e.key === 'ArrowRight') irPara((atual + 1) % COMODOS.length);
    if (e.key === 'ArrowLeft')  irPara((atual - 1 + COMODOS.length) % COMODOS.length);
  });

  /* =========================================================
     8. PARALAXE LEVE DO MOUSE
     ========================================================= */
  if (!reduced && window.matchMedia('(min-width: 761px)').matches) {
    var alvoX = 0, alvoY = 0, curX = 0, curY = 0, rodando = false;

    window.addEventListener('mousemove', function (e) {
      alvoX = (e.clientX / window.innerWidth  - 0.5) * 2;
      alvoY = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!rodando) { rodando = true; requestAnimationFrame(passo); }
    });

    function passo() {
      curX += (alvoX - curX) * 0.06;
      curY += (alvoY - curY) * 0.06;

      if (dentroPronto && !trocando && !imersaoAtual) {
        var arte = $('.art', cenaAtual());
        if (arte) {
          arte.style.transform =
            'scale(1.03) translate(' + (curX * -11).toFixed(2) + 'px,' + (curY * -7).toFixed(2) + 'px)';
        }
      }

      if (Math.abs(alvoX - curX) > 0.001 || Math.abs(alvoY - curY) > 0.001) {
        requestAnimationFrame(passo);
      } else { rodando = false; }
    }
  }

  /* pausa a música se a aba sair de foco */
  /* troca de aba pausa; voltar pra aba retoma de onde parou */
  var pausadoPelaAba = null;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (imersaoAtual) { somDaImersao(imersaoAtual, false); pausadoPelaAba = 'imersao'; }
      else if (salaLigada) { somSala(false); pausadoPelaAba = 'sala'; }
      else if (banheiroLigado) { somBanheiro(false); pausadoPelaAba = 'banheiro'; }
      else if (meuLigado) { somMeu(false); pausadoPelaAba = 'meu'; }
    } else {
      if (pausadoPelaAba === 'imersao' && imersaoAtual) somDaImersao(imersaoAtual, true);
      else if (pausadoPelaAba === 'sala' && !imersaoAtual && COMODOS[atual].id === 'room2') somSala(true);
      else if (pausadoPelaAba === 'banheiro' && !imersaoAtual && COMODOS[atual].id === 'room3') somBanheiro(true);
      else if (pausadoPelaAba === 'meu' && !imersaoAtual && COMODOS[atual].id === 'room6') somMeu(true);
      pausadoPelaAba = null;
    }
  });

  /* entrada da fachada */
  sceneOut.classList.add('scene--enter');
})();
