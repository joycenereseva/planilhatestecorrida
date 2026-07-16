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

  /** Estágios de esforço (≥4) com PSE preenchida — indica que o aluno correu aquele minuto */
  function getEffortStagesWithPse(stages) {
    return (stages || []).filter(function (s) {
      return s.stage >= 4 && parseNum(s.pse) !== null;
    });
  }

  function hasHrData(stages) {
    return (stages || []).some(function (s) { return parseNum(s.hr) !== null; });
  }

  /**
   * VVO2máx = velocidade máxima sustentada no teste incremental.
   * - Estágio completo (100%): velocidade do estágio final.
   * - Parada no meio do estágio: interpolação linear entre estágio anterior e atual.
   *   VVO2máx = V_anterior + (V_atual − V_anterior) × (% concluído / 100)
   */
  function computeVvo2max(stages, meta) {
    var effortWithPse = getEffortStagesWithPse(stages);
    if (!effortWithPse.length) return null;

    var stopStage = parseNum(meta && meta.stopStage);
    var pctComplete = parseNum(meta && meta.stagePctComplete);
    if (pctComplete === null) pctComplete = 100;
    pctComplete = Math.max(0, Math.min(100, pctComplete));

    if (!stopStage) {
      stopStage = effortWithPse[effortWithPse.length - 1].stage;
    }

    var stopRow = null;
    for (var i = 0; i < stages.length; i++) {
      if (stages[i].stage === stopStage) {
        stopRow = stages[i];
        break;
      }
    }
    if (!stopRow || stopRow.stage < 4) return null;

    var vCurr = parseNum(stopRow.speed);
    if (vCurr === null) vCurr = speedForStage(stopRow.stage);

    var vPrev;
    if (stopRow.stage <= 4) {
      vPrev = speedForStage(3);
    } else {
      vPrev = speedForStage(stopRow.stage - 1);
    }

    if (pctComplete >= 100) {
      return {
        vvo2max: vCurr,
        stopStage: stopStage,
        pctComplete: 100,
        method: 'estagio_completo',
        vPrev: vPrev,
        vCurr: vCurr,
        lastCompleteSpeed: vCurr
      };
    }

    var vvo2max = vPrev + (vCurr - vPrev) * (pctComplete / 100);
    return {
      vvo2max: vvo2max,
      stopStage: stopStage,
      pctComplete: pctComplete,
      method: 'interpolado',
      vPrev: vPrev,
      vCurr: vCurr,
      lastCompleteSpeed: vPrev
    };
  }

  function buildPrescriptionZones(vvo2max) {
    if (vvo2max === null) return [];
    var defs = [
      { name: 'Recuperação / muito leve', pctMin: 50, pctMax: 60, color: '#2471A3' },
      { name: 'Aeróbico contínuo', pctMin: 70, pctMax: 80, color: '#3A7D44' },
      { name: 'Limiar / moderado forte', pctMin: 80, pctMax: 90, color: '#E09010' },
      { name: 'Intervalado (curto)', pctMin: 100, pctMax: 110, color: '#D4611A' },
      { name: 'Alta intensidade', pctMin: 110, pctMax: 120, color: '#B03020' }
    ];
    return defs.map(function (z) {
      return {
        name: z.name,
        color: z.color,
        pctMin: z.pctMin,
        pctMax: z.pctMax,
        speedMin: (z.pctMin / 100) * vvo2max,
        speedMax: (z.pctMax / 100) * vvo2max
      };
    });
  }

  function calculateResults(meta, stages) {
    meta = meta || {};
    stages = stages || generateProtocolStages();

    var allHr = stages.map(function (s) { return parseNum(s.hr); }).filter(function (v) { return v !== null; });
    var allPse = stages.map(function (s) { return parseNum(s.pse); }).filter(function (v) { return v !== null; });
    var hrAvailable = allHr.length > 0;

    var fcMax = hrAvailable ? Math.max.apply(null, allHr) : null;
    var pseMax = allPse.length ? Math.max.apply(null, allPse) : null;

    var vvo2 = computeVvo2max(stages, meta);
    var vvo2max = vvo2 ? vvo2.vvo2max : null;

    var fcRest = parseNum(meta.fcRest);
    var peso = parseNum(meta.peso);
    var fcL1 = parseNum(meta.fcL1);
    var fcL2 = parseNum(meta.fcL2);

    var indiceFC = hrAvailable && fcMax && fcRest ? fcMax / fcRest : null;
    var vo2ml = vvo2max !== null ? 2.21 * vvo2max + 2.27 : null;
    var vo2L = vo2ml !== null && peso ? (vo2ml * peso) / 1000 : null;
    var mets = vo2ml !== null ? vo2ml / 3.5 : null;
    var fcL1pct = hrAvailable && fcL1 && fcMax ? (fcL1 / fcMax) * 100 : null;
    var fcL2pct = hrAvailable && fcL2 && fcMax ? (fcL2 / fcMax) * 100 : null;

    var intensityTable = [];
    for (var pct = 30; pct <= 165; pct += 5) {
      intensityTable.push({
        pct: pct,
        kmh: vvo2max !== null ? (pct / 100) * vvo2max : null
      });
    }

    var chartPse = getEffortStagesWithPse(stages).map(function (s) {
      return {
        stage: s.stage,
        speed: parseNum(s.speed) || speedForStage(s.stage),
        pse: parseNum(s.pse)
      };
    });

    var chartHr = stages.filter(function (s) {
      return parseNum(s.hr) !== null;
    }).map(function (s) {
      return {
        stage: s.stage,
        speed: parseNum(s.speed) || speedForStage(s.stage),
        hr: parseNum(s.hr)
      };
    });

    return {
      vvo2max: vvo2max,
      vvo2Detail: vvo2,
      iVo2max: vvo2max,
      maxSpeed: vvo2 ? (vvo2.pctComplete >= 100 ? vvo2.vCurr : vvo2.lastCompleteSpeed) : null,
      fcMax: fcMax,
      pseMax: pseMax,
      fcRest: fcRest,
      indiceFC: indiceFC,
      vo2ml: vo2ml,
      vo2L: vo2L,
      mets: mets,
      fcL1: fcL1,
      fcL2: fcL2,
      fcL1pct: fcL1pct,
      fcL2pct: fcL2pct,
      hrAvailable: hrAvailable,
      intensityTable: intensityTable,
      prescriptionZones: buildPrescriptionZones(vvo2max),
      chart: {
        mode: hrAvailable && chartHr.length ? 'hr' : 'pse',
        labels: (hrAvailable && chartHr.length ? chartHr : chartPse).map(function (p) {
          return formatNum(p.speed, 1) + ' km/h';
        }),
        pse: chartPse.map(function (p) { return p.pse; }),
        hr: chartHr.map(function (p) { return p.hr; }),
        pseLabels: chartPse.map(function (p) { return formatNum(p.speed, 1) + ' km/h'; }),
        speeds: chartPse.map(function (p) { return p.speed; })
      },
      valid: vvo2max !== null
    };
  }

  function suggestStopStage(stages) {
    var effort = getEffortStagesWithPse(stages);
    return effort.length ? effort[effort.length - 1].stage : null;
  }

  function buildWhatsAppReport(meta, results) {
    var name = meta.nome || meta.studentName || 'Aluna';
    var date = meta.testDate || meta.dataAvaliacao || '';
    var msg = '🏃‍♀️ *RESULTADO — TESTE INCREMENTAL NA ESTEIRA*\n\n';
    msg += '👩‍🏫 Profª Joyce Neres\n';
    msg += '👤 ' + name + '\n';
    if (date) msg += '📅 ' + date + '\n';
    if (meta.peso) msg += '⚖️ Peso: ' + meta.peso + ' kg\n';
    msg += '\n*VVO2máx (velocidade)*\n';
    if (results.vvo2max) {
      msg += '• VVO2máx: *' + formatNum(results.vvo2max, 2) + ' km/h*\n';
      if (results.vvo2Detail) {
        msg += '• Parou no estágio ' + results.vvo2Detail.stopStage;
        if (results.vvo2Detail.pctComplete < 100) {
          msg += ' (' + formatNum(results.vvo2Detail.pctComplete, 0) + '% do estágio — interpolado)';
        }
        msg += '\n';
      }
    }
    if (results.pseMax) msg += '• PSE máxima: ' + results.pseMax + '\n';
    if (results.vo2ml) msg += '• VO2máx estimado: ' + formatNum(results.vo2ml, 2) + ' ml.kg.min\n';
    if (results.mets) msg += '• METs: ' + formatNum(results.mets, 2) + '\n';

    if (results.hrAvailable && results.fcMax) {
      msg += '\n*FC (opcional)*\n';
      msg += '• FC máxima: ' + results.fcMax + ' bpm\n';
      if (results.fcL1) msg += '• FC L1: ' + results.fcL1 + ' bpm\n';
      if (results.fcL2) msg += '• FC L2: ' + results.fcL2 + ' bpm\n';
    }

    if (results.prescriptionZones && results.prescriptionZones.length) {
      msg += '\n*PRESCRIÇÃO (% VVO2máx)*\n';
      results.prescriptionZones.forEach(function (z) {
        msg += '• ' + z.name + ': ' + formatNum(z.speedMin, 2) + '–' + formatNum(z.speedMax, 2) + ' km/h (' + z.pctMin + '–' + z.pctMax + '%)\n';
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
    suggestStopStage: suggestStopStage,
    buildWhatsAppReport: buildWhatsAppReport
  };
})(window);
