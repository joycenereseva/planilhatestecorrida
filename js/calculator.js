(function (global) {
  'use strict';

  function parseNum(v) {
    if (v === null || v === undefined || v === '') return null;
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  function speedToPace(speedKmh) {
    if (!speedKmh || speedKmh <= 0) return '';
    const totalSec = Math.round(3600 / speedKmh);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min + ':' + String(sec).padStart(2, '0');
  }

  function paceToSpeed(paceStr) {
    if (!paceStr) return null;
    const parts = String(paceStr).trim().split(':');
    if (parts.length !== 2) return null;
    const min = parseInt(parts[0], 10);
    const sec = parseInt(parts[1], 10);
    if (!Number.isFinite(min) || !Number.isFinite(sec) || min < 0 || sec < 0) return null;
    const totalSec = min * 60 + sec;
    if (totalSec <= 0) return null;
    return 3600 / totalSec;
  }

  function perpendicularDistance(point, lineStart, lineEnd) {
    const x0 = point.speed;
    const y0 = point.hr;
    const x1 = lineStart.speed;
    const y1 = lineStart.hr;
    const x2 = lineEnd.speed;
    const y2 = lineEnd.hr;
    const num = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
    const den = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
    return den === 0 ? 0 : num / den;
  }

  function interpolateSpeedAtHr(points, targetHr) {
    const valid = points.filter(function (p) { return p.hr > 0 && p.speed > 0; })
      .sort(function (a, b) { return a.hr - b.hr; });
    if (!valid.length) return null;
    if (targetHr <= valid[0].hr) return valid[0].speed;
    if (targetHr >= valid[valid.length - 1].hr) return valid[valid.length - 1].speed;
    for (let i = 0; i < valid.length - 1; i++) {
      const a = valid[i];
      const b = valid[i + 1];
      if (targetHr >= a.hr && targetHr <= b.hr) {
        const ratio = (targetHr - a.hr) / (b.hr - a.hr);
        return a.speed + ratio * (b.speed - a.speed);
      }
    }
    return null;
  }

  function detectThresholdDmax(points) {
    let valid = points.filter(function (p) { return p.hr > 0 && p.speed > 0; })
      .sort(function (a, b) { return a.speed - b.speed; });
    if (valid.length < 4) return null;

    const filtered = valid.filter(function (p) { return p.hr >= 140; });
    if (filtered.length >= 4) valid = filtered;

    const first = valid[0];
    const last = valid[valid.length - 1];
    let maxDist = -1;
    let best = null;

    for (let i = 1; i < valid.length - 1; i++) {
      const dist = perpendicularDistance(valid[i], first, last);
      if (dist > maxDist) {
        maxDist = dist;
        best = valid[i];
      }
    }
    return best ? { method: 'Dmax', point: best, confidence: maxDist } : null;
  }

  function buildZones(fcMax, points) {
    const defs = [
      { id: 'z1', name: 'Zona 1 — Recuperação', pctMin: 50, pctMax: 60, color: '#2471A3' },
      { id: 'z2', name: 'Zona 2 — Aeróbico leve', pctMin: 60, pctMax: 70, color: '#3A7D44' },
      { id: 'z3', name: 'Zona 3 — Aeróbico moderado', pctMin: 70, pctMax: 80, color: '#E09010' },
      { id: 'z4', name: 'Zona 4 — Limiar', pctMin: 80, pctMax: 90, color: '#D4611A' },
      { id: 'z5', name: 'Zona 5 — Alta intensidade', pctMin: 90, pctMax: 100, color: '#B03020' }
    ];

    return defs.map(function (z) {
      const fcMin = Math.round(fcMax * z.pctMin / 100);
      const fcMaxZ = Math.round(fcMax * z.pctMax / 100);
      const speedMax = interpolateSpeedAtHr(points, fcMin);
      const speedMin = interpolateSpeedAtHr(points, fcMaxZ);
      return {
        id: z.id,
        name: z.name,
        color: z.color,
        pctMin: z.pctMin,
        pctMax: z.pctMax,
        fcMin: fcMin,
        fcMax: fcMaxZ,
        paceMin: speedMax ? speedToPace(speedMax) : '—',
        paceMax: speedMin ? speedToPace(speedMin) : '—',
        speedMin: speedMin ? speedMin.toFixed(1) : '—',
        speedMax: speedMax ? speedMax.toFixed(1) : '—'
      };
    });
  }

  function generateProtocolStages(config) {
    const startSpeed = parseNum(config.startSpeed) || 7;
    const increment = parseNum(config.increment) || 1;
    const intervalMin = config.noIncline ? 2 : 1;
    const stages = [];
    let minute = 0;

    stages.push({ minute: minute, speed: 5, phase: 'aquecimento', borg: '', hr: '' });
    minute += 2;
    stages.push({ minute: minute, speed: 6, phase: 'aquecimento', borg: '', hr: '' });
    minute += 2;

    let speed = startSpeed;
    let stageNum = 1;
    while (stageNum <= (config.maxStages || 15)) {
      stages.push({
        minute: minute,
        speed: speed,
        phase: 'teste',
        borg: '',
        hr: '',
        stage: stageNum
      });
      minute += intervalMin;
      speed += increment;
      stageNum++;
    }
    return stages;
  }

  function enrichStages(stages) {
    let prevHr = null;
    return stages.map(function (s, idx) {
      const speed = parseNum(s.speed);
      const hr = parseNum(s.hr);
      const pace = speed ? speedToPace(speed) : '';
      let delta = '';
      if (hr !== null && prevHr !== null) delta = hr - prevHr;
      if (hr !== null) prevHr = hr;
      return Object.assign({}, s, {
        index: idx,
        pace: pace,
        deltaHr: delta === '' ? '' : delta
      });
    });
  }

  function calculateResults(meta, stages, options) {
    options = options || {};
    const enriched = enrichStages(stages);
    const testPoints = enriched
      .filter(function (s) { return s.phase === 'teste'; })
      .map(function (s) {
        return {
          stage: s.stage,
          minute: s.minute,
          speed: parseNum(s.speed),
          hr: parseNum(s.hr),
          borg: parseNum(s.borg)
        };
      })
      .filter(function (p) { return p.speed && p.hr; });

    const allHr = testPoints.map(function (p) { return p.hr; });
    const fcMax = allHr.length ? Math.max.apply(null, allHr) : null;
    const fcRest = parseNum(meta.fcRest);

    let threshold = null;
    if (options.manualStage != null && options.manualStage !== '') {
      const manual = testPoints.find(function (p) { return p.stage === options.manualStage; });
      if (manual) threshold = { method: 'Manual', point: manual };
    }
    if (!threshold) threshold = detectThresholdDmax(testPoints);

    const thresholdPoint = threshold ? threshold.point : null;
    const zones = fcMax ? buildZones(fcMax, testPoints) : [];

    const thresholdBorg = thresholdPoint
      ? (testPoints.find(function (p) { return p.stage === thresholdPoint.stage; }) || {}).borg
      : null;

    return {
      enriched: enriched,
      testPoints: testPoints,
      fcMax: fcMax,
      fcRest: fcRest,
      threshold: thresholdPoint ? {
        method: threshold.method,
        stage: thresholdPoint.stage,
        speed: thresholdPoint.speed,
        hr: thresholdPoint.hr,
        borg: thresholdBorg,
        pace: speedToPace(thresholdPoint.speed)
      } : null,
      zones: zones,
      chart: {
        labels: testPoints.map(function (p) { return p.speed.toFixed(1) + ' km/h'; }),
        hr: testPoints.map(function (p) { return p.hr; }),
        speeds: testPoints.map(function (p) { return p.speed; })
      },
      valid: testPoints.length >= 3
    };
  }

  function buildWhatsAppReport(meta, results) {
    const name = meta.studentName || 'Aluna';
    const date = meta.testDate || '';
    let msg = '🏃‍♀️ *RESULTADO — TESTE DE CONCONI NA ESTEIRA*\n\n';
    msg += '👩‍🏫 Profª Joyce Neres\n';
    msg += '👤 ' + name + '\n';
    if (date) msg += '📅 ' + date + '\n';
    msg += '\n';

    if (results.fcMax) msg += '*FC Máxima:* ' + results.fcMax + ' bpm\n';
    if (meta.fcRest) msg += '*FC Repouso:* ' + meta.fcRest + ' bpm\n';

    if (results.threshold) {
      msg += '\n*LIMIAR ANAERÓBICO* (' + results.threshold.method + ')\n';
      msg += '• FC: ' + results.threshold.hr + ' bpm\n';
      msg += '• Velocidade: ' + results.threshold.speed.toFixed(1) + ' km/h\n';
      msg += '• Ritmo: ' + results.threshold.pace + ' min/km\n';
      if (results.threshold.borg) msg += '• Borg: ' + results.threshold.borg + '\n';
    }

    if (results.zones.length) {
      msg += '\n*ZONAS DE TREINO* (% FC máx)\n';
      results.zones.forEach(function (z) {
        msg += '• ' + z.name + ': ' + z.fcMin + '–' + z.fcMax + ' bpm';
        if (z.paceMax !== '—') msg += ' | ritmo ' + z.paceMin + '–' + z.paceMax;
        msg += '\n';
      });
    }

    msg += '\nEsses dados orientam sua prescrição de treinos. Qualquer dúvida, fale comigo! 💚\n';
    msg += '#VAMOSJUNTAS @joyceneresef';
    return msg;
  }

  global.ConconiCalc = {
    parseNum: parseNum,
    speedToPace: speedToPace,
    paceToSpeed: paceToSpeed,
    generateProtocolStages: generateProtocolStages,
    enrichStages: enrichStages,
    calculateResults: calculateResults,
    buildWhatsAppReport: buildWhatsAppReport,
    detectThresholdDmax: detectThresholdDmax
  };
})(window);
