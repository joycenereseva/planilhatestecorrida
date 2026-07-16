(function (global) {
  'use strict';

  var TOTAL_STAGES = 16;

  function parseNum(v) {
    if (v === null || v === undefined || v === '') return null;
    var n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  function formatNum(n, decimals) {
    if (n === null || n === undefined || !Number.isFinite(n)) return '—';
    return n.toFixed(decimals == null ? 2 : decimals).replace('.', ',');
  }

  /** Velocidade fixa do protocolo Excel: estágios 1–3 = 5 km/h; 4–16 = estágio + 2 */
  function speedForStage(stage) {
    if (stage <= 3) return 5;
    return stage + 2;
  }

  function phaseForStage(stage) {
    return stage <= 3 ? 'aquecimento' : 'esforco';
  }

  function phaseLabel(stage) {
    return stage <= 3 ? 'AQUECIMENTO' : 'ESFORÇO';
  }

  /** Gera as 16 linhas do protocolo Conconi (igual à planilha) */
  function generateProtocolStages() {
    var stages = [];
    for (var s = 1; s <= TOTAL_STAGES; s++) {
      stages.push({
        stage: s,
        tempo: s,
        speed: speedForStage(s),
        phase: phaseForStage(s),
        hr: '',
        pse: ''
      });
    }
    return stages;
  }

  function getFilledStages(stages) {
    return (stages || []).filter(function (s) {
      return parseNum(s.hr) !== null;
    });
  }

  function getEffortStagesWithHr(stages) {
    return (stages || []).filter(function (s) {
      return s.stage >= 4 && parseNum(s.hr) !== null;
    });
  }

  /**
   * Cálculos idênticos à planilha Excel:
   * - iVO2máx = velocidade máxima do teste (último estágio de esforço com FC)
   * - VO2máx (ml.kg.min) = 2,21 × iVO2máx + 2,27
   * - VO2máx (L.min) = (VO2máx × peso) / 1000
   * - METs = VO2máx / 3,5
   * - Índice FC = FCmáx / FC repouso
   * - FC L1/L2 % = FC limiar / FCmáx × 100
   * - Tabela %iVO2máx: km/h = (% / 100) × iVO2máx
   */
  function calculateResults(meta, stages) {
    meta = meta || {};
    stages = stages || generateProtocolStages();

    var allHr = stages.map(function (s) { return parseNum(s.hr); }).filter(function (v) { return v !== null; });
    var allPse = stages.map(function (s) { return parseNum(s.pse); }).filter(function (v) { return v !== null; });

    var fcMax = allHr.length ? Math.max.apply(null, allHr) : null;
    var pseMax = allPse.length ? Math.max.apply(null, allPse) : null;

    var effortWithHr = getEffortStagesWithHr(stages);
    var maxSpeed = null;
    if (effortWithHr.length) {
      maxSpeed = parseNum(effortWithHr[effortWithHr.length - 1].speed);
    }

    var iVo2max = maxSpeed;
    var fcRest = parseNum(meta.fcRest);
    var peso = parseNum(meta.peso);
    var fcL1 = parseNum(meta.fcL1);
    var fcL2 = parseNum(meta.fcL2);

    var indiceFC = fcMax && fcRest ? fcMax / fcRest : null;
    var vo2ml = iVo2max !== null ? 2.21 * iVo2max + 2.27 : null;
    var vo2L = vo2ml !== null && peso ? (vo2ml * peso) / 1000 : null;
    var mets = vo2ml !== null ? vo2ml / 3.5 : null;
    var fcL1pct = fcL1 && fcMax ? (fcL1 / fcMax) * 100 : null;
    var fcL2pct = fcL2 && fcMax ? (fcL2 / fcMax) * 100 : null;

    var intensityTable = [];
    for (var pct = 30; pct <= 165; pct += 5) {
      intensityTable.push({
        pct: pct,
        kmh: iVo2max !== null ? (pct / 100) * iVo2max : null
      });
    }

    var chartPoints = getFilledStages(stages).map(function (s) {
      return {
        stage: s.stage,
        speed: parseNum(s.speed),
        hr: parseNum(s.hr)
      };
    });

    return {
      fcMax: fcMax,
      maxSpeed: maxSpeed,
      pseMax: pseMax,
      iVo2max: iVo2max,
      fcRest: fcRest,
      indiceFC: indiceFC,
      vo2ml: vo2ml,
      vo2L: vo2L,
      mets: mets,
      fcL1: fcL1,
      fcL2: fcL2,
      fcL1pct: fcL1pct,
      fcL2pct: fcL2pct,
      intensityTable: intensityTable,
      chart: {
        labels: chartPoints.map(function (p) { return p.speed + ' km/h'; }),
        hr: chartPoints.map(function (p) { return p.hr; }),
        speeds: chartPoints.map(function (p) { return p.speed; })
      },
      valid: allHr.length >= 1 && iVo2max !== null
    };
  }

  function buildWhatsAppReport(meta, results) {
    var name = meta.nome || meta.studentName || 'Aluna';
    var date = meta.testDate || meta.dataAvaliacao || '';
    var msg = '🏃‍♀️ *RESULTADO — TESTE DE CONCONI NA ESTEIRA*\n\n';
    msg += '👩‍🏫 Profª Joyce Neres\n';
    msg += '👤 ' + name + '\n';
    if (date) msg += '📅 ' + date + '\n';
    if (meta.peso) msg += '⚖️ Peso: ' + meta.peso + ' kg\n';
    msg += '\n*RESULTADOS DO TESTE*\n';
    if (results.fcMax) msg += '• FC máxima: ' + results.fcMax + ' bpm\n';
    if (results.maxSpeed) msg += '• Velocidade máxima: ' + formatNum(results.maxSpeed, 0) + ' km/h\n';
    if (results.iVo2max) msg += '• iVO2máx: ' + formatNum(results.iVo2max, 0) + ' km/h\n';
    if (results.fcRest) msg += '• FC repouso: ' + results.fcRest + ' bpm\n';
    if (results.indiceFC) msg += '• Índice de FC: ' + formatNum(results.indiceFC, 2) + '\n';
    if (results.vo2ml) msg += '• VO2máx: ' + formatNum(results.vo2ml, 2) + ' ml.kg.min\n';
    if (results.vo2L) msg += '• VO2máx: ' + formatNum(results.vo2L, 3) + ' L.min\n';
    if (results.mets) msg += '• METs: ' + formatNum(results.mets, 2) + '\n';
    if (results.fcL1) {
      msg += '\n*LIMIAR 1 (L1)*\n';
      msg += '• FC L1: ' + results.fcL1 + ' bpm';
      if (results.fcL1pct) msg += ' (' + formatNum(results.fcL1pct, 2) + '% FC máx)';
      msg += '\n';
    }
    if (results.fcL2) {
      msg += '\n*LIMIAR 2 (L2)*\n';
      msg += '• FC L2: ' + results.fcL2 + ' bpm';
      if (results.fcL2pct) msg += ' (' + formatNum(results.fcL2pct, 2) + '% FC máx)';
      msg += '\n';
    }
    if (results.intensityTable && results.iVo2max) {
      msg += '\n*VELOCIDADES POR % iVO2máx*\n';
      [60, 70, 80, 90, 100, 110].forEach(function (pct) {
        var row = results.intensityTable.find(function (r) { return r.pct === pct; });
        if (row && row.kmh !== null) msg += '• ' + pct + '%: ' + formatNum(row.kmh, 2) + ' km/h\n';
      });
    }
    msg += '\nEsses dados orientam sua prescrição de treinos. Qualquer dúvida, fale comigo! 💚\n';
    msg += '#VAMOSJUNTAS @joyceneresef';
    return msg;
  }

  global.ConconiCalc = {
    TOTAL_STAGES: TOTAL_STAGES,
    parseNum: parseNum,
    formatNum: formatNum,
    speedForStage: speedForStage,
    phaseForStage: phaseForStage,
    phaseLabel: phaseLabel,
    generateProtocolStages: generateProtocolStages,
    calculateResults: calculateResults,
    buildWhatsAppReport: buildWhatsAppReport
  };
})(window);
