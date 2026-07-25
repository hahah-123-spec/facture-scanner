/* Scan / Capture + OCR + Entry Page */

var pageScan = {
  _el: null,
  _state: {
    photoFile: null,
    photoPreviewUrl: null,
    imageFilename: null,
    ocrLoading: false,
    saving: false
  },

  /* ======== Category keyword map for auto-classification ======== */
  _categoryKeywords: {
    plantas: ['flor', 'planta', 'maceta', 'tierra', 'semilla', 'jardin', 'vivero',
      'ornamental', 'rama', 'hoja', 'floristeria', 'floristería', 'floral',
      'bambu', 'bambú', 'rosa', 'margarita', 'ramo', 'plantel', 'cactus',
      'suculenta', 'bulbo', 'orquidea', 'crisantemo', 'clavel', 'tulipan',
      'lirio', 'geranio', 'petunia', 'lavanda', 'helecho', 'decoflor'],
    suministros: ['luz', 'agua', 'gas', 'electric', 'endesa', 'iberdrola', 'naturgy',
      'repsol', 'telecom', 'internet', 'vodafone', 'orange', 'movistar',
      'jazztel', 'telefonica', 'telefónica', 'suministro', 'energia',
      'energía', 'aigua', 'aigües', 'aguas', 'gas natural', 'sorea',
      'alcantarillado', 'electricidad', 'telefono', 'municipal'],
    transporte: ['transport', 'envio', 'envío', 'mensajer', 'paqueter', 'logistic',
      'correos', 'seur', 'mrw', 'dhl', 'fedex', 'tipsa', 'nacx', 'gls',
      'correo', 'envialia', 'transporte', 'portes', 'flete', 'paquete'],
    servicios: ['seguro', 'abogado', 'gestor', 'gestoria', 'gestoría', 'consultor',
      'limpieza', 'mantenimiento', 'reparacion', 'reparación', 'alquiler',
      'renting', 'publicidad', 'marketing', 'informatic', 'web', 'software',
      'seguridad', 'alarma', 'formacion', 'formación', 'servicio', 'asesoria',
      'asesoría', 'auditoria', 'auditoría', 'desinfeccion', 'extintor'],
    productos: ['mayorista', 'distribucion', 'distribución', 'comercial', 'alimentacion',
      'alimentación', 'bebida', 'limpieza', 'higiene', 'bazar', 'drogueria',
      'droguería', 'perfumeria', 'perfumería', 'juguete', 'papeleria',
      'papelería', 'ferreteria', 'ferretería', 'textil', 'calzado',
      'import', 'export', 'cash', 'merca', 'makro', 'suministros industriales',
      'almacen', 'venta', 'mayor', 'proveedor', 'slu', 'sl', 'sa', 'productos']
  },

  /* ======== Render ======== */

  render: function () {
    this._el = document.getElementById('page-scan');
    this._state = {
      photoFile: null,
      photoPreviewUrl: null,
      imageFilename: null,
      ocrLoading: false,
      saving: false
    };
    this._renderForm();
    this._bindEvents();
  },

  _renderForm: function () {
    var catOptions = CATEGORIES.map(function (c) {
      return '<option value="' + c.value + '">' + c.icon + ' ' + c.label + '</option>';
    }).join('');

    this._el.innerHTML =
      /* Photo area */
      '<div class="photo-area" id="photoArea">' +
        '<div class="photo-icon" id="photoIcon">&#128247;</div>' +
        '<div class="photo-hint" id="photoHint">Toca para tomar foto o seleccionar</div>' +
        '<input type="file" accept="image/*" capture="environment" id="photoInput" style="display:none">' +
      '</div>' +

      /* OCR raw text debug panel */
      '<div class="ocr-debug" id="ocrDebug" style="display:none;margin-bottom:16px">' +
        '<div class="ocr-debug-header" id="ocrDebugToggle" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--paper-texture);border-radius:8px;cursor:pointer;font-size:13px">' +
          '<span>Texto OCR <span id="ocrConfidence" style="color:var(--steel-gray);font-size:11px"></span></span>' +
          '<span id="ocrDebugArrow" style="font-size:10px">▼</span>' +
        '</div>' +
        '<pre class="ocr-debug-text" id="ocrDebugText" style="display:none;margin:8px 0 0;padding:10px;background:var(--paper-texture);border-radius:8px;font-size:11px;line-height:1.5;white-space:pre-wrap;word-break:break-all;max-height:200px;overflow-y:auto;color:var(--ink-black)"></pre>' +
      '</div>' +
      '<div class="ocr-loading" id="ocrLoading">' +
        '<div class="ocr-spinner"></div>' +
        '<span>Procesando con OCR...</span>' +
      '</div>' +

      /* Form */
      '<div class="form-group">' +
        '<label class="form-label">Proveedor *</label>' +
        '<input class="form-input" id="field-supplier_name" placeholder="Nombre del proveedor">' +
      '</div>' +

      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label class="form-label">Fecha *</label>' +
          '<input class="form-input" id="field-invoice_date" type="date">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Nº Factura</label>' +
          '<input class="form-input" id="field-invoice_number" placeholder="Numero">' +
        '</div>' +
      '</div>' +

      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label class="form-label">Base Imponible</label>' +
          '<input class="form-input" id="field-base_amount" type="number" step="0.01" placeholder="0.00">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">IVA %</label>' +
          '<input class="form-input" id="field-iva_rate" type="number" step="0.1" value="' + (parseInt(localStorage.getItem('default_iva'), 10) || 21) + '">' +
        '</div>' +
      '</div>' +

      '<div class="form-group">' +
        '<label class="form-label">Total *</label>' +
        '<input class="form-input" id="field-total_amount" type="number" step="0.01" placeholder="0.00">' +
      '</div>' +

      '<div class="form-group">' +
        '<label class="form-label">Categoria</label>' +
        '<select class="form-select" id="field-category">' + catOptions + '</select>' +
      '</div>' +

      '<div class="form-group">' +
        '<label class="form-label">Notas</label>' +
        '<textarea class="form-textarea" id="field-notes" placeholder="Notas adicionales..." rows="2"></textarea>' +
      '</div>' +

      '<button class="btn btn-primary btn-block" id="scanSaveBtn">' +
        'Guardar factura' +
      '</button>';
  },

  _bindEvents: function () {
    var self = this;

    // Photo area click
    var photoArea = document.getElementById('photoArea');
    var photoInput = document.getElementById('photoInput');
    if (photoArea && photoInput) {
      photoArea.addEventListener('click', function () {
        photoInput.click();
      });
      photoInput.addEventListener('change', function (e) {
        if (e.target.files && e.target.files[0]) {
          self._handlePhoto(e.target.files[0]);
        }
      });
    }

    // Save button
    var saveBtn = document.getElementById('scanSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        self._handleSave();
      });
    }

    // Auto-compute: Base + IVA ⇄ Total (bidirectional)
    var baseField = document.getElementById('field-base_amount');
    var ivaField = document.getElementById('field-iva_rate');
    var totalField = document.getElementById('field-total_amount');
    if (baseField && ivaField && totalField) {
      var computing = false; // prevent recursion

      var computeTotalFromBase = function () {
        if (computing) return;
        computing = true;
        var base = parseFloat(baseField.value) || 0;
        var rate = parseFloat(ivaField.value) || 0;
        if (base > 0 && rate > 0) {
          totalField.value = (base + base * rate / 100).toFixed(2);
        }
        computing = false;
      };

      var computeBaseFromTotal = function () {
        if (computing) return;
        computing = true;
        var total = parseFloat(totalField.value) || 0;
        var rate = parseFloat(ivaField.value) || 0;
        if (total > 0 && rate > 0) {
          baseField.value = (total / (1 + rate / 100)).toFixed(2);
        }
        computing = false;
      };

      // Prioritize: if user edits Total → recompute Base. If edits Base → recompute Total
      // When IVA changes: if Total is filled → update Base; else if Base is filled → update Total
      baseField.addEventListener('input', computeTotalFromBase);
      totalField.addEventListener('input', computeBaseFromTotal);
      ivaField.addEventListener('input', function () {
        var total = parseFloat(totalField.value) || 0;
        var base = parseFloat(baseField.value) || 0;
        if (total > 0) {
          computeBaseFromTotal();
        } else if (base > 0) {
          computeTotalFromBase();
        }
      });
    }
  },

  /* ---- Photo handling ---- */

  _handlePhoto: function (file) {
    var self = this;
    this._state.photoFile = file;

    // Show preview
    var reader = new FileReader();
    reader.onload = function (e) {
      var photoArea = document.getElementById('photoArea');
      var photoIcon = document.getElementById('photoIcon');
      var photoHint = document.getElementById('photoHint');
      if (photoIcon) photoIcon.style.display = 'none';
      if (photoHint) photoHint.textContent = 'Retocar';

      var oldImg = photoArea.querySelector('img');
      if (oldImg) oldImg.remove();

      var img = document.createElement('img');
      img.src = e.target.result;
      img.alt = 'Preview';
      photoArea.appendChild(img);
      photoArea.classList.add('has-image');
      self._state.photoPreviewUrl = e.target.result;

      self._startOcr(file);
    };
    reader.readAsDataURL(file);
  },

  /* ---- OCR ---- */

  _startOcr: function (file) {
    var self = this;
    this._state.ocrLoading = true;
    var ocrEl = document.getElementById('ocrLoading');
    if (ocrEl) ocrEl.classList.add('show');
    showLoading('Preparando OCR...');

    // Read file into Image for preprocessing + dual OCR
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        // Build enhanced version
        var processed = null;
        try {
          processed = OcrPreprocess.enhance(img);
          self._showProcessedPreview(processed);
        } catch (preErr) {
          console.warn('Preprocessing failed:', preErr);
        }

        // Run OCR on BOTH original and processed, pick best confidence
        self._runDualOcr(img, processed);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  /* Run OCR on two images and pick the result with better confidence */
  _runDualOcr: function (original, processed) {
    var self = this;
    var ocrEl = document.getElementById('ocrLoading');

    var updateProgress = function (status, pct) {
      var txtEl = document.getElementById('loadingText');
      if (!txtEl) return;
      var msgs = {
        'loading tesseract core': 'Descargando motor OCR...',
        'initializing tesseract': 'Inicializando motor...',
        'loading language traineddata': 'Descargando español ' + pct + '%',
        'initializing api': 'Preparando reconocimiento...',
        'recognizing text': 'Reconociendo texto... ' + pct + '%'
      };
      txtEl.textContent = msgs[status] || (status + '...');
    };

    var runOne = function (image, label) {
      return Tesseract.recognize(image, 'spa', {
        logger: function (m) {
          if (!m || !m.status) return;
          var pct = m.progress ? Math.round(m.progress * 100) : 0;
          updateProgress(m.status + ' (' + label + ')', pct);
        }
      }).then(function (result) {
        return { text: result.data.text || '', confidence: result.data.confidence || 0, label: label };
      }).catch(function (err) {
        console.warn('OCR ' + label + ' failed:', err);
        return { text: '', confidence: 0, label: label };
      });
    };

    // Always run on enhanced image first, then original as fallback
    var promises = [];
    if (processed) {
      promises.push(runOne(processed, 'mejorada'));
    }
    promises.push(runOne(original, 'original'));

    Promise.all(promises).then(function (results) {
      // Pick best by confidence
      var best = null;
      for (var i = 0; i < results.length; i++) {
        if (!best || results[i].confidence > best.confidence) {
          best = results[i];
        }
      }

      if (!best || !best.text) {
        hideLoading();
        showToast('OCR no pudo leer la imagen. Intenta con mejor luz.', 'info');
        return;
      }

      var text = best.text;

      // ---- ENHANCED NOISE FILTER ----
      var rawLines = text.split('\n');
      var filteredLines = [];
      // Skip first 3 lines (typically camera edge artifacts) and last 2 lines
      var startIdx = 3;
      var endIdx = rawLines.length - 2;
      for (var i = 0; i < rawLines.length; i++) {
        var line = rawLines[i].trim();
        if (!line || line.length < 3) continue;
        // Remove lines that are purely box-drawing / symbol garbage
        var alpha = (line.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/g) || []).length;
        // Count "useful" separators (spaces, dots, commas, slashes, hyphens)
        var useful = (line.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s\.,\/\-\€\%\(\)]/g) || []).length;
        var ratio = alpha / Math.max(line.length, 1);
        var usefulRatio = useful / Math.max(line.length, 1);
        // Keep lines that have >25% alphanumeric AND >60% useful content
        // OR lines that are very short (<20 chars) with >40% useful
        if ((ratio > 0.25 && usefulRatio > 0.6) || (line.length < 20 && usefulRatio > 0.4)) {
          filteredLines.push(line);
        }
      }
      // Also remove duplicate/consecutive lines (OCR artifact)
      var deduped = [];
      for (var di = 0; di < filteredLines.length; di++) {
        if (di === 0 || filteredLines[di] !== filteredLines[di - 1]) {
          deduped.push(filteredLines[di]);
        }
      }
      var cleanText = deduped.join('\n');

      // Show debug info
      self._showDebug(cleanText, best.confidence, best.label, text.length - cleanText.length);

      // Extract data
      var extracted = self._extractInvoiceData(cleanText);

      // Fill form
      var setVal = function (id, val) {
        var el = document.getElementById(id);
        if (el && val !== undefined && val !== null && val !== '') el.value = val;
      };
      setVal('field-supplier_name', extracted.supplier);
      if (extracted.date) setVal('field-invoice_date', extracted.date);
      setVal('field-base_amount', extracted.base || '');
      setVal('field-total_amount', extracted.total || '');
      setVal('field-iva_rate', extracted.ivaRate || '21');
      setVal('field-invoice_number', extracted.invoiceNum);
      if (extracted.category) {
        var catEl = document.getElementById('field-category');
        if (catEl) catEl.value = extracted.category;
      }

      hideLoading();

      // Toast
      var parts = [];
      if (extracted.supplier) parts.push('Proveedor: ' + extracted.supplier);
      if (extracted.date) parts.push('Fecha: ' + extracted.date);
      if (extracted.total) parts.push('Total: ' + extracted.total + '€');
      if (extracted.category) {
        var catDef = CATEGORIES.find(function (c) { return c.value === extracted.category; });
        parts.push(catDef ? catDef.icon + ' ' + catDef.label : extracted.category);
      }
      if (parts.length > 0) {
        showToast(parts.join(' | ') + ' | ' + best.confidence + '%', 'success');
      } else {
        showToast('Confianza: ' + best.confidence + '%. Completa los campos.', 'info');
      }

      // Upload original
      var filename = 'incoming/' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.jpg';
      uploadImage(self._state.photoFile, filename).then(function () {
        self._state.imageFilename = filename;
      }).catch(function (err) {
        console.error('Upload error:', err);
      });

    }).catch(function (err) {
      hideLoading();
      console.error('OCR error:', err);
      showToast('OCR fallo: ' + (err.message || 'error desconocido'), 'info');
    }).finally(function () {
      self._state.ocrLoading = false;
      if (ocrEl) ocrEl.classList.remove('show');
    });
  },

  /* Show raw OCR text + confidence in debug panel */
  _showDebug: function (text, confidence, source, removedChars) {
    var panel = document.getElementById('ocrDebug');
    var textEl = document.getElementById('ocrDebugText');
    var confEl = document.getElementById('ocrConfidence');
    var toggle = document.getElementById('ocrDebugToggle');
    var arrow = document.getElementById('ocrDebugArrow');

    if (panel) panel.style.display = 'block';
    if (textEl) textEl.textContent = text || '(sin texto)';
    if (confEl) {
      var color = confidence > 70 ? 'var(--stamp-green)' : (confidence > 40 ? 'var(--amount-orange)' : 'var(--seal-red)');
      var info = '(confianza: ' + confidence + '%, fuente: ' + source;
      if (removedChars > 0) info += ', ruido eliminado: ' + removedChars + ' car.';
      info += ')';
      confEl.textContent = info;
      confEl.style.cssText = 'color:' + color + ';font-size:11px;margin-left:6px';
    }

    if (toggle) {
      toggle.onclick = function () {
        var show = textEl.style.display === 'none';
        textEl.style.display = show ? 'block' : 'none';
        if (arrow) arrow.textContent = show ? '▲' : '▼';
      };
    }
  },

  /* Show a small thumbnail of the preprocessed image */
  _showProcessedPreview: function (canvas) {
    try {
      var container = document.getElementById('photoArea');
      if (!container) return;

      // Remove old processed preview
      var old = container.querySelector('.processed-thumb');
      if (old) old.remove();

      var thumb = document.createElement('div');
      thumb.className = 'processed-thumb';
      thumb.style.cssText = 'position:absolute;bottom:6px;right:6px;width:80px;height:60px;' +
        'border:2px solid var(--stamp-green);border-radius:6px;overflow:hidden;opacity:0.9;z-index:3';
      thumb.title = 'Imagen procesada para OCR';

      var mini = document.createElement('img');
      mini.src = canvas.toDataURL('image/png');
      mini.style.cssText = 'width:100%;height:100%;object-fit:cover';
      thumb.appendChild(mini);

      container.appendChild(thumb);
    } catch (e) { /* non-critical */ }
  },

  /* ================================================================
     _extractInvoiceData(text) — Robust extraction engine

     Extracts: supplier, date, total, base, ivaRate, invoiceNum, category
     Multi-strategy + OCR error correction (S↔5, O↔0, I↔1, accents)
     ================================================================ */
  _extractInvoiceData: function (text) {
    // Sanitize OCR output: merge split lines, fix common OCR errors
    var clean = text
      .replace(/[|]/g, '/')          // OCR often reads / as |
      .replace(/\b([A-Z])\s+(?=[a-z])/g, '$1') // un-split "P roveedor" → "Proveedor"
      .replace(/(\d)\s+([.,]\d{2})/g, '$1$2'); // fix "1 234,56" → "1234,56"

    var lines = clean.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);

    // ---- OCR error correction helper ----
    var fixOcrNumber = function (s) {
      // Fix common misreads in numbers: O→0, S→5, I→1, l→1, Z→2, B→8
      return s.replace(/[OoSs]/g, function (c) {
        if (c === 'O' || c === 'o') return '0';
        if (c === 'S' || c === 's') return '5';
        return c;
      }).replace(/[lI]/g, '1').replace(/Z/g, '2').replace(/B/g, '8');
    };

    // Helper: parse Spanish amount "1.234,56" or "1234,56" or "1,234.56" → float
    var parseAmount = function (s) {
      if (!s) return NaN;
      s = s.replace(/[€Ee]/g, '').replace(/\s/g, '');
      s = fixOcrNumber(s);
      // Spanish format: 1.234,56 → decimal comma, thousand dot
      if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(s)) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else if (/^\d{1,3}(,\d{3})*\.\d{2}$/.test(s)) {
        // English format: 1,234.56
        s = s.replace(/,/g, '');
      } else if (s.indexOf(',') !== -1 && s.indexOf('.') !== -1) {
        // Ambiguous: if last separator is comma → Spanish, else English
        var lastComma = s.lastIndexOf(',');
        var lastDot = s.lastIndexOf('.');
        if (lastComma > lastDot) {
          s = s.replace(/\./g, '').replace(',', '.');
        } else {
          s = s.replace(/,/g, '');
        }
      } else if (s.indexOf(',') !== -1 && /,\d{2}$/.test(s)) {
        s = s.replace(',', '.');
      } else {
        s = s.replace(/,/g, '');
      }
      return parseFloat(s);
    };

    // Find first amount in a string
    var findAmountInLine = function (line) {
      var m = line.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/);
      return m ? parseAmount(m[1]) : NaN;
    };

    // Find all amounts in text sorted descending
    var findAllAmounts = function (t) {
      var matches = t.match(/\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})/g) || [];
      return matches.map(parseAmount).filter(function (n) { return !isNaN(n) && n > 0; });
    };

    // ----- DATE EXTRACTION -----
    var date = '';

    // Month name mapping (Spanish → number)
    var monthNames = {
      'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
      'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
      'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };

    var makeDate = function (d, m, y) {
      var dd = parseInt(d, 10), mm = parseInt(m, 10), yy = parseInt(y, 10);
      if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yy >= 2000 && yy <= 2100) {
        return yy + '-' + String(mm).padStart(2, '0') + '-' + String(dd).padStart(2, '0');
      }
      return '';
    };

    var fixDateStr = function (s) {
      return s.replace(/[oO]/g, '0').replace(/[sS]/g, '5').replace(/[lI]/g, '1')
              .replace(/Z/g, '2').replace(/B/g, '8');
    };

    // Strategy 1: Spanish text date "15 de julio de 2026"
    var textDateMatch = clean.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?(\d{4})/i);
    if (textDateMatch) {
      var mth = monthNames[textDateMatch[2].toLowerCase()];
      date = makeDate(fixDateStr(textDateMatch[1]), mth, fixDateStr(textDateMatch[3]));
    }

    // Strategy 2: find "Fecha" keyword nearby
    if (!date) {
      for (var i = 0; i < lines.length; i++) {
        if (/fecha/i.test(lines[i])) {
          var context = lines.slice(i, i + 4).join(' ');
          var dm = context.match(/(\d{1,2})\s*[\/\-\.,\|]\s*(\d{1,2})\s*[\/\-\.,\|]\s*(\d{4})/);
          if (dm) {
            date = makeDate(fixDateStr(dm[1]), fixDateStr(dm[2]), fixDateStr(dm[3]));
            if (date) break;
          }
        }
      }
    }

    // Strategy 3: date in header area (first 10 lines) — invoice number + date pattern
    // Spanish invoice headers often have: "FRA-XXX DD/MM/YYYY" or "A-XXXXXXXX DD/MM/YYYY N"
    if (!date) {
      for (var j = 0; j < Math.min(lines.length, 12); j++) {
        // Look for a line with both an alphanumeric code AND a date
        var headerDM = lines[j].match(/(\d{1,2})\s*[\/\-\.,\|]\s*(\d{1,2})\s*[\/\-\.,\|]\s*(\d{4})/);
        if (headerDM) {
          date = makeDate(fixDateStr(headerDM[1]), fixDateStr(headerDM[2]), fixDateStr(headerDM[3]));
          if (date) break;
        }
      }
    }

    // Strategy 4: find ANY valid dd/mm/yyyy in entire text (with stricter validation)
    if (!date) {
      var allDateMatches = clean.match(/\d{1,2}\s*[\/\-\.,\|]\s*(\d{1,2})\s*[\/\-\.,\|]\s*(\d{4})/g) || [];
      for (var k = 0; k < allDateMatches.length; k++) {
        var adm = allDateMatches[k].match(/(\d{1,2})\s*[\/\-\.,\|]\s*(\d{1,2})\s*[\/\-\.,\|]\s*(\d{4})/);
        date = makeDate(fixDateStr(adm[1]), fixDateStr(adm[2]), fixDateStr(adm[3]));
        if (date) break;
      }
    }

    // ----- SUPPLIER NAME EXTRACTION -----
    var supplier = '';
    // Strategy 1: company suffix (S.L., S.A., S.L.U., S.C.P., S.COOP, C.B., etc.)
    var suffixRegex = /\b([5S]\.?[LI1]\.?(?:[Uu]\.?)?|[5S]\.?[A4]\.?(?:[Uu]\.?)?|[5S]\.?[C<]\.?[Pp]\.?|[5S]\.?COOP\.?|[C<]\.?[B8]\.?|[5S]\.?[LI1]\.?[LI1]\.?)\b/i;
    for (var k = 0; k < lines.length; k++) {
      if (suffixRegex.test(lines[k]) && lines[k].length > 6) {
        supplier = lines[k].replace(/[,\s]+$/, '');
        break;
      }
    }
    // Strategy 2: NIF/CIF line — company name often right before or after
    if (!supplier) {
      for (var l = 0; l < lines.length; l++) {
        if (/N[I1]F|C[I1]F|DN[I1]/i.test(lines[l])) {
          // Check surrounding lines for a company name
          for (var off = -2; off <= 2; off++) {
            var idx = l + off;
            if (idx >= 0 && idx < lines.length && idx !== l) {
              var candidate = lines[idx].replace(/[,\s]+$/, '');
              if (candidate.length > 5 && !/^\d/.test(candidate) && !/nif|cif|dni|fecha|factura|pag/i.test(candidate)) {
                supplier = candidate;
                break;
              }
            }
          }
          if (supplier) break;
        }
      }
    }
    // Strategy 3: line near "Proveedor" / "Razon Social" / "Empresa"
    if (!supplier) {
      for (var m = 0; m < lines.length; m++) {
        if (/proveedor|raz[oó]n\s*social|empresa|cliente/i.test(lines[m]) && m + 1 < lines.length) {
          var next = lines[m + 1];
          if (next.length > 3 && !/^\d/.test(next) && !/fecha|factura|n[ií]f|cif/i.test(next)) {
            supplier = next.replace(/[,\s]+$/, '');
            break;
          }
        }
      }
    }
    // Strategy 4: first line that looks like a company name (capitalized, 5+ chars, in first 10 lines)
    if (!supplier) {
      for (var n = 0; n < Math.min(lines.length, 12); n++) {
        var nameLine = lines[n];
        if (nameLine.length > 5 && /^[A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s,\.\-&]{4,}$/.test(nameLine) && !/\d{4}/.test(nameLine) && !/factura|fecha|cliente|nif|cif|telefono|direccion|poblacion|provincia/i.test(nameLine)) {
          supplier = nameLine;
          break;
        }
      }
    }

    // ----- TOTAL EXTRACTION -----
    var total = 0;
    var totalSource = '';
    // Strategy 1: "TOTAL" keyword (with OCR error tolerance)
    for (var o = 0; o < lines.length; o++) {
      if (/^(TOTAL|TOTA[LI1]|IMPORTE\s*TOTAL|TOTAL\s+FACTURA|TOTAL\s+[€Ee]?|T\.TOTAL|T\.\s*TOTAL|TOTAL\s+EUR)/i.test(lines[o])) {
        total = findAmountInLine(lines[o]);
        if (total) { totalSource = 'TOTAL keyword'; break; }
        if (o + 1 < lines.length) {
          total = findAmountInLine(lines[o + 1]);
          if (total) { totalSource = 'line after TOTAL'; break; }
        }
      }
    }
    // Strategy 2: Summary line with % and amounts (typical Spanish invoice footer)
    // Pattern: "% IVA_rate% IVA_amount TOTAL_AMOUNT" e.g. "10,0% 14% 0,70 65,70"
    if (!total) {
      for (var p = lines.length - 1; p >= Math.max(0, lines.length - 15); p--) {
        var line = lines[p];
        // Line contains a percentage AND at least two amounts
        if (/%/.test(line)) {
          var amountsInLine = (line.match(/\d+[.,]\d{2}/g) || []).map(function (s) {
            return parseAmount(s);
          }).filter(function (n) { return !isNaN(n) && n > 0 && n < 100000; });
          if (amountsInLine.length >= 2) {
            // Total is typically the largest amount in the summary line
            amountsInLine.sort(function (a, b) { return b - a; });
            total = amountsInLine[0];
            totalSource = 'summary line: ' + line.substring(0, 50);
            break;
          }
        }
      }
    }
    // Strategy 3: "[€Ee]" or "EUR" near end of document
    if (!total) {
      for (var q = lines.length - 1; q >= Math.max(0, lines.length - 10); q--) {
        if (/[€EeCc]|[EU]R/i.test(lines[q]) && !/NUMERO|FECHA|DIRECCION|EMAIL|TEL/i.test(lines[q])) {
          total = findAmountInLine(lines[q]);
          if (total) { totalSource = 'EUR/€ symbol'; break; }
        }
      }
    }
    // Strategy 4: largest non-date amount in last 40% of document
    if (!total) {
      var endText = lines.slice(Math.floor(lines.length * 0.55)).join(' ');
      var allAmounts = findAllAmounts(endText);
      if (allAmounts.length === 0) allAmounts = findAllAmounts(clean);
      allAmounts = allAmounts.filter(function (a) { return a < 2000 || a > 2100; });
      // Exclude very small amounts (likely IVA amounts, cent values, etc.)
      allAmounts = allAmounts.filter(function (a) { return a > 0.5; });
      if (allAmounts.length > 0) {
        allAmounts.sort(function (a, b) { return b - a; });
        total = allAmounts[0];
        totalSource = 'largest in footer';
      }
    }

    // ----- IVA RATE EXTRACTION -----
    var ivaRate = 0;
    // Strategy 1: percentage in summary/footer lines with IVA context
    // Handles "10,0%", "21%", "IVA 21%", "10,0% IVA" etc.
    // Look in last 40% of document where IVA breakdown typically appears
    var footerStart = Math.floor(lines.length * 0.55);
    var footerText = lines.slice(footerStart).join(' ');
    // Find percentages: "X%" or "X,X%" (Spanish decimal comma in percentages)
    var pctPattern = /(\d{1,2})(?:[,.]\d)?\s*%/g;
    var pctMatches = footerText.match(pctPattern);
    if (pctMatches) {
      for (var qq = 0; qq < pctMatches.length; qq++) {
        var rMatch = pctMatches[qq].match(/(\d{1,2})/);
        if (rMatch) {
          var rate = parseInt(rMatch[1], 10);
          // Valid Spanish IVA rates: 21, 10, 4 (and variations like 7, 5)
          if (rate >= 4 && rate <= 25 && [21, 10, 4, 7, 5, 14].indexOf(rate) >= 0) {
            ivaRate = rate;
            break;
          }
        }
      }
    }
    // Strategy 2: look for percentage near "IVA" anywhere
    if (!ivaRate) {
      for (var rr = 0; rr < lines.length; rr++) {
        if (/[I1]VA|[I1]\.?V\.?A\.?/i.test(lines[rr])) {
          var rateMatch = lines[rr].match(/(\d{1,2})(?:[,.]\d)?\s*%/);
          if (!rateMatch && rr + 1 < lines.length) {
            rateMatch = (lines[rr] + ' ' + lines[rr + 1]).match(/(\d{1,2})(?:[,.]\d)?\s*%/);
          }
          if (rateMatch) {
            var r2 = parseInt(rateMatch[1], 10);
            if ([21, 10, 4, 7, 5, 14].indexOf(r2) >= 0) { ivaRate = r2; break; }
          }
        }
      }
    }
    // Strategy 3: "IVA 21" or "IVA21" or "IVA: 21"
    if (!ivaRate) {
      var ivaMatch = clean.match(/[I1]VA\s*[:.]?\s*(\d{1,2})/i);
      if (ivaMatch) {
        var ir = parseInt(ivaMatch[1], 10);
        if ([21, 10, 4].indexOf(ir) >= 0) ivaRate = ir;
      }
    }

    // ----- BASE (Base Imponible) EXTRACTION -----
    var base = 0;
    // Strategy 1: "BASE IMPONIBLE" keyword
    for (var ss = 0; ss < lines.length; ss++) {
      if (/(BASE|BA[5S]E)\s*(IMPO[NM]IBLE|IMPO[NM][I1]BLE)|SUBTOTAL|IMPORTE\s*NETO/i.test(lines[ss])) {
        base = findAmountInLine(lines[ss]);
        if (!base && ss + 1 < lines.length) base = findAmountInLine(lines[ss + 1]);
        if (/IVA|[I1]VA/i.test(lines[ss])) base = 0;
        if (base) break;
      }
    }
    // Strategy 2: in the summary line, find the amount just before the IVA amount
    // Pattern: "... %Iva IVA_amount TOTAL" → the second-to-last amount is often the base
    if (!base && total && ivaRate) {
      for (var tt = lines.length - 1; tt >= footerStart; tt--) {
        var sLine = lines[tt];
        if (/%/.test(sLine)) {
          var sAmounts = (sLine.match(/\d+[.,]\d{2}/g) || []).map(function (s) {
            return parseAmount(s);
          }).filter(function (n) { return !isNaN(n) && n > 0 && n < 100000; });
          // If line has 3+ amounts, the middle one might be the base
          // Or: the last amount is total, the one before might be IVA amount → base = total - iva_amount
          if (sAmounts.length >= 3) {
            // Try: total is largest, IVA amount is smallest, base = total - IVA_amount
            var sorted = sAmounts.slice().sort(function (a, b) { return b - a; });
            var largest = sorted[0];
            var smallest = sorted[sorted.length - 1];
            if (Math.abs(largest - total) < 0.02 && smallest < total * 0.5) {
              base = Math.round((largest - smallest) * 100) / 100;
              break;
            }
          }
        }
      }
    }
    // Strategy 3: derive from total / (1 + rate/100)
    if (!base && total && ivaRate) {
      base = Math.round(total / (1 + ivaRate / 100) * 100) / 100;
    } else if (!base && total) {
      base = Math.round(total / 1.21 * 100) / 100;
    }

    // ----- INVOICE NUMBER EXTRACTION -----
    var invoiceNum = '';
    // Strategy 1: "FACTURA Nº XXXX", "Nº FACTURA XXXX", "FRA. XXXX" (OCR tolerant)
    var numPatterns = [
      /(?:FACTURA|FRA\.?|FACT\.?|F[4A]CTURA)\s*(?:N[º°o0]|NUM\.?|N[UÚ]M\.?)?\s*[:#]?\s*([A-Za-z0-9\-\/]{3,25})/i,
      /N[º°o0]\s*(?:DE\s*)?(?:FACTURA|FRA\.?)?\s*[:#]?\s*([A-Za-z0-9\-\/]{3,25})/i,
      /(?:N[UÚ]MERO|NUM\.?)\s*(?:FACTURA)?\s*[:#]?\s*([A-Za-z0-9\-\/]{3,25})/i
    ];
    for (var u = 0; u < numPatterns.length; u++) {
      var nm = clean.match(numPatterns[u]);
      if (nm && nm[1] && nm[1].length >= 3) {
        invoiceNum = nm[1].replace(/[\s,]+$/, '');
        break;
      }
    }
    // Strategy 2: standalone alphanumeric after "Nº" or "N°" or "N."
    if (!invoiceNum) {
      var nm2 = clean.match(/N[º°o0.]\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/]{2,20})/i);
      if (nm2) invoiceNum = nm2[1];
    }
    // Strategy 3: look for a line that's just a number/code in the first 10 lines
    if (!invoiceNum) {
      for (var v = 0; v < Math.min(lines.length, 10); v++) {
        var numLine = lines[v];
        var numMatch = numLine.match(/^(?:FACTURA|FRA|FACT|REF)[:\s#]*([A-Z0-9\-\/]{3,20})$/i);
        if (numMatch) { invoiceNum = numMatch[1]; break; }
      }
    }

    // ----- AUTO-CATEGORIZATION -----
    var category = this._classifyCategory(text, supplier);

    // ---- Implied IVA rate from base+total ----
    if (!ivaRate && base > 0 && total > 0 && total > base) {
      var implied = Math.round((total - base) / base * 100);
      if (implied === 21 || implied === 10 || implied === 4) {
        ivaRate = implied;
      }
    }

    return {
      supplier: supplier,
      date: date,
      base: base,
      ivaRate: ivaRate,
      total: total,
      invoiceNum: invoiceNum,
      category: category
    };
  },

  /* ---- Auto-categorize based on text + supplier name ---- */
  _classifyCategory: function (text, supplier) {
    var lower = (text + ' ' + supplier).toLowerCase();
    var best = { category: '', score: 0 };
    var cats = this._categoryKeywords;

    for (var cat in cats) {
      if (!cats.hasOwnProperty(cat)) continue;
      var keywords = cats[cat];
      var score = 0;
      for (var i = 0; i < keywords.length; i++) {
        if (lower.indexOf(keywords[i]) !== -1) {
          score += 1;
        }
      }
      if (score > best.score) {
        best = { category: cat, score: score };
      }
    }

    return best.score > 0 ? best.category : 'productos';
  },

  /* ---- Save ---- */

  _handleSave: function () {
    var self = this;

    if (this._state.saving) return;

    var getVal = function (id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    var supplier = getVal('field-supplier_name');
    var date = getVal('field-invoice_date');
    var total = getVal('field-total_amount');
    var base = getVal('field-base_amount');
    var ivaRate = getVal('field-iva_rate');
    var invoiceNum = getVal('field-invoice_number');
    var category = getVal('field-category');
    var notes = getVal('field-notes');

    // Validation
    if (!supplier || !date || !total) {
      showToast('Completa Proveedor, Fecha y Total', 'error');
      return;
    }

    this._state.saving = true;
    showLoading('Guardando...');

    // Duplicate check
    invoices.checkDuplicate(supplier, date, parseFloat(total)).then(function (dup) {
      if (dup) {
        hideLoading();
        return showConfirm(
          'Ya existe una factura similar',
          dup.supplier_name + '\n' + dup.invoice_date + '\n' + dup.total_amount + '\n\nSeguro que quieres guardarla?',
          'Guardar de todas formas',
          'Cancelar'
        );
      }
      return Promise.resolve(true);
    }).then(function (confirmed) {
      if (!confirmed) {
        self._state.saving = false;
        return Promise.reject(null);
      }
      showLoading('Guardando...');
      return invoices.create({
        supplier_name: supplier,
        invoice_date: date,
        base_amount: parseFloat(base) || 0,
        iva_rate: parseFloat(ivaRate) || 21,
        total_amount: parseFloat(total) || 0,
        invoice_number: invoiceNum,
        category: category || 'productos',
        image_url: self._state.imageFilename || '',
        notes: notes
      });
    }).then(function () {
      hideLoading();
      showToast('Factura guardada', 'success');
      self._resetForm();
    }).catch(function (err) {
      if (err === null) return;
      hideLoading();
      console.error('Save error:', err);
      var msg = 'Error al guardar';
      if (err && err.message) {
        if (err.message.indexOf('duplicate') !== -1 || err.code === '23505') {
          msg = 'Factura duplicada';
        } else if (err.message.indexOf('JWT') !== -1 || err.status === 401 || err.status === 403) {
          msg = 'Sesion expirada, vuelve a iniciar sesion';
        } else if (err.message.indexOf('network') !== -1 || err.message.indexOf('fetch') !== -1) {
          msg = 'Error de conexion, revisa tu internet';
        } else {
          msg = 'Error: ' + (err.message || JSON.stringify(err));
        }
      }
      showToast(msg, 'error');
    }).finally(function () {
      self._state.saving = false;
    });
  },

  /* ---- Reset ---- */

  _resetForm: function () {
    this._state = {
      photoFile: null,
      photoPreviewUrl: null,
      imageFilename: null,
      ocrLoading: false,
      saving: false
    };

    var photoArea = document.getElementById('photoArea');
    if (photoArea) {
      var img = photoArea.querySelector('img');
      if (img) img.remove();
      photoArea.classList.remove('has-image');
      var icon = document.getElementById('photoIcon');
      if (icon) icon.style.display = '';
      var hint = document.getElementById('photoHint');
      if (hint) hint.textContent = 'Toca para tomar foto o seleccionar';
    }

    var inputs = this._el.querySelectorAll('input, textarea, select');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].type !== 'file') {
        if (inputs[i].id === 'field-iva_rate') {
          inputs[i].value = '21';
        } else if (inputs[i].id === 'field-category') {
          inputs[i].value = 'productos';
        } else {
          inputs[i].value = '';
        }
      }
    }
  },

  /* ---- Cleanup ---- */

  destroy: function () {
    if (this._state.photoPreviewUrl && this._state.photoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this._state.photoPreviewUrl);
    }
    if (this._el) {
      this._el.innerHTML = '';
    }
  }
};
