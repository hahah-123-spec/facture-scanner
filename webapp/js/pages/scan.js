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

      /* OCR loading */
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
          '<input class="form-input" id="field-iva_rate" type="number" step="0.1" value="21">' +
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

    // Auto-compute total when base or iva changes
    var baseField = document.getElementById('field-base_amount');
    var ivaField = document.getElementById('field-iva_rate');
    var totalField = document.getElementById('field-total_amount');
    if (baseField && ivaField && totalField) {
      var computeTotal = function () {
        var base = parseFloat(baseField.value) || 0;
        var rate = parseFloat(ivaField.value) || 0;
        if (base > 0 && rate > 0) {
          totalField.value = (base + base * rate / 100).toFixed(2);
        }
      };
      baseField.addEventListener('input', computeTotal);
      ivaField.addEventListener('input', computeTotal);
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

    var updateProgress = function (status, pct) {
      var txtEl = document.getElementById('loadingText');
      if (!txtEl) return;
      var msgs = {
        'loading tesseract core': 'Descargando motor OCR...',
        'initializing tesseract': 'Inicializando motor...',
        'loading language traineddata': 'Descargando espanol ' + pct + '%',
        'initializing api': 'Preparando reconocimiento...',
        'recognizing text': 'Reconociendo texto... ' + pct + '%'
      };
      txtEl.textContent = msgs[status] || (status + '...');
    };

    Tesseract.recognize(file, 'spa', {
      logger: function (m) {
        if (!m || !m.status) return;
        var pct = m.progress ? Math.round(m.progress * 100) : 0;
        updateProgress(m.status, pct);
      }
    }).then(function (result) {
      var text = result.data.text;
      var extracted = self._extractInvoiceData(text);

      // Fill form with extracted values
      var setVal = function (id, val) {
        var el = document.getElementById(id);
        if (el && val) el.value = val;
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

      // Build result toast
      var parts = [];
      if (extracted.supplier) parts.push('Proveedor: ' + extracted.supplier);
      if (extracted.date) parts.push('Fecha: ' + extracted.date);
      if (extracted.total) parts.push('Total: ' + extracted.total + '€');
      if (extracted.ivaRate) parts.push('IVA: ' + extracted.ivaRate + '%');
      if (extracted.category) {
        var catDef = CATEGORIES.find(function (c) { return c.value === extracted.category; });
        var catLabel = catDef ? catDef.label : extracted.category;
        parts.push(catDef ? catDef.icon + ' ' + catLabel : catLabel);
      }
      showToast(parts.join(' | '), 'success');

      // Upload image to storage
      var filename = 'incoming/' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.jpg';
      uploadImage(file, filename).then(function () {
        self._state.imageFilename = filename;
      }).catch(function (err) {
        console.error('Upload error (non-critical):', err);
      });

    }).catch(function (err) {
      hideLoading();
      console.error('OCR error:', err);
      showToast('OCR fallo, completa los campos manualmente', 'info');
    }).finally(function () {
      self._state.ocrLoading = false;
      if (ocrEl) ocrEl.classList.remove('show');
    });
  },

  /* ================================================================
     _extractInvoiceData(text) — Smart extraction engine

     Extracts: supplier, date, total, base, ivaRate, invoiceNum, category
     Using multi-strategy approach: keyword proximity + pattern matching
     ================================================================ */
  _extractInvoiceData: function (text) {
    var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);

    // Helper: parse Spanish amount "1.234,56" or "1234,56" or "1,234.56" → float
    var parseAmount = function (s) {
      if (!s) return NaN;
      s = s.replace(/€/g, '').replace(/\s/g, '');
      // Spanish format: 1.234,56 → decimal comma, thousand dot
      if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(s)) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else if (/^\d{1,3}(,\d{3})*\.\d{2}$/.test(s)) {
        // English format: 1,234.56
        s = s.replace(/,/g, '');
      } else {
        // Ambiguous: try comma as decimal
        s = s.replace(/\./g, '').replace(',', '.');
      }
      return parseFloat(s);
    };

    // Find first amount in a string
    var findAmountInLine = function (line) {
      // Match patterns like "1.234,56", "1234,56", "1,234.56", "1234.56"
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
    // Strategy 1: find "Fecha" keyword nearby
    for (var i = 0; i < lines.length; i++) {
      if (/fecha/i.test(lines[i])) {
        // Look in this line and next 2 lines for dd/mm/yyyy
        var context = lines.slice(i, i + 3).join(' ');
        var dm = context.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
        if (dm) {
          var dd = parseInt(dm[1], 10);
          var mm = parseInt(dm[2], 10);
          var yy = parseInt(dm[3], 10);
          // Validate: dd 1-31, mm 1-12, yy 2000-2099
          if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yy >= 2000) {
            date = dm[3] + '-' + dm[2] + '-' + dm[1];
            break;
          }
        }
      }
    }
    // Strategy 2: find any valid Spanish date in entire text
    if (!date) {
      var allDateMatches = text.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/g) || [];
      for (var j = 0; j < allDateMatches.length; j++) {
        var adm = allDateMatches[j].match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
        var dd2 = parseInt(adm[1], 10);
        var mm2 = parseInt(adm[2], 10);
        var yy2 = parseInt(adm[3], 10);
        if (dd2 >= 1 && dd2 <= 31 && mm2 >= 1 && mm2 <= 12 && yy2 >= 2000) {
          date = adm[3] + '-' + adm[2] + '-' + adm[1];
          break;
        }
      }
    }

    // ----- SUPPLIER NAME EXTRACTION -----
    var supplier = '';
    // Strategy 1: company suffix (S.L., S.A., S.L.U., S.C.P., S.COOP, C.B., etc.)
    for (var k = 0; k < lines.length; k++) {
      if (/\b(S\.?L\.?(U\.?)?|S\.?A\.?(U\.?)?|S\.?C\.?P\.?|S\.?COOP\.?|C\.?B\.?|S\.?L\.?L\.?)\b/i.test(lines[k]) && lines[k].length > 6) {
        supplier = lines[k].replace(/[,\s]+$/, '');
        break;
      }
    }
    // Strategy 2: line near "Proveedor" / "Razon Social" / "Empresa"
    if (!supplier) {
      for (var l = 0; l < lines.length; l++) {
        if (/proveedor|raz[oó]n\s*social|empresa|cliente/i.test(lines[l]) && l + 1 < lines.length) {
          var next = lines[l + 1];
          if (next.length > 3 && !/^\d/.test(next) && !/fecha|factura|n[ií]f|cif/i.test(next)) {
            supplier = next.replace(/[,\s]+$/, '');
            break;
          }
        }
      }
    }
    // Strategy 3: first line that looks like a company name (uppercase, 5+ chars, in first 10 lines)
    if (!supplier) {
      for (var m = 0; m < Math.min(lines.length, 10); m++) {
        var line = lines[m];
        if (line.length > 5 && /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s,\.\-&]{4,}$/.test(line) && !/\d{4}/.test(line) && !/factura/i.test(line)) {
          supplier = line;
          break;
        }
      }
    }

    // ----- TOTAL EXTRACTION -----
    var total = 0;
    // Strategy 1: "TOTAL" keyword
    for (var n = 0; n < lines.length; n++) {
      if (/^(TOTAL|IMPORTE\s*TOTAL|TOTAL\s+FACTURA|TOTAL\s+€?|T\.TOTAL|T\.\s*TOTAL)/i.test(lines[n])) {
        total = findAmountInLine(lines[n]);
        if (total) break;
        // Also check next line
        if (n + 1 < lines.length) {
          total = findAmountInLine(lines[n + 1]);
          if (total) break;
        }
      }
    }
    // Strategy 2: "€" / "EUR" near end of document
    if (!total) {
      for (var o = lines.length - 1; o >= Math.max(0, lines.length - 8); o--) {
        if (/€|EUR/i.test(lines[o])) {
          total = findAmountInLine(lines[o]);
          if (total) break;
        }
      }
    }
    // Strategy 3: largest non-date amount
    if (!total) {
      var allAmounts = findAllAmounts(text);
      // Exclude amounts that look like dates (e.g., 2024, 2025, 2026)
      allAmounts = allAmounts.filter(function (a) { return a < 2000 || a > 2100; });
      if (allAmounts.length > 0) {
        allAmounts.sort(function (a, b) { return b - a; });
        total = allAmounts[0];
      }
    }

    // ----- IVA RATE EXTRACTION -----
    var ivaRate = 0;
    // Strategy 1: explicit percentage near "IVA"
    for (var p = 0; p < lines.length; p++) {
      if (/IVA/i.test(lines[p])) {
        // Look for 21%, 10%, 4% patterns
        var rateMatch = lines[p].match(/(\d{1,2})\s*%/);
        if (rateMatch) {
          var rate = parseInt(rateMatch[1], 10);
          if (rate === 21 || rate === 10 || rate === 4 || rate === 5 || rate === 7) {
            ivaRate = rate;
            break;
          }
        }
        // Check surrounding lines too
        var context2 = lines.slice(Math.max(0, p - 1), p + 2).join(' ');
        var rateMatch2 = context2.match(/(\d{1,2})\s*%/);
        if (rateMatch2 && !ivaRate) {
          var rate2 = parseInt(rateMatch2[1], 10);
          if (rate2 === 21 || rate2 === 10 || rate2 === 4) {
            ivaRate = rate2;
          }
        }
      }
    }
    // Strategy 2: find "21%" anywhere
    if (!ivaRate) {
      var pctMatch = text.match(/(21|10|4)\s*%/);
      if (pctMatch) ivaRate = parseInt(pctMatch[1], 10);
    }
    // Strategy 3: find "IVA 21" or "IVA21"
    if (!ivaRate) {
      var ivaMatch = text.match(/IVA\s*(\d{1,2})/i);
      if (ivaMatch) {
        var ir = parseInt(ivaMatch[1], 10);
        if (ir === 21 || ir === 10 || ir === 4) ivaRate = ir;
      }
    }

    // ----- BASE (Base Imponible) EXTRACTION -----
    var base = 0;
    // Strategy 1: "BASE IMPONIBLE" keyword
    for (var q = 0; q < lines.length; q++) {
      if (/BASE\s*IMPONIBLE|BASE|SUBTOTAL|IMPORTE\s*NETO/i.test(lines[q]) && !/IVA/i.test(lines[q])) {
        base = findAmountInLine(lines[q]);
        if (!base && q + 1 < lines.length) base = findAmountInLine(lines[q + 1]);
        // If this line also contains IVA keywords, skip it
        if (/IVA/i.test(lines[q])) base = 0;
        if (base) break;
      }
    }
    // Strategy 2: amount right before the IVA line
    if (!base) {
      var ivaLineIdx = -1;
      for (var r = 0; r < lines.length; r++) {
        if (/^IVA\b|^I\.?V\.?A\.?\b|^\d{1,2}\s*%\s*IVA/i.test(lines[r])) {
          ivaLineIdx = r;
          break;
        }
      }
      if (ivaLineIdx > 0) {
        // Check 1-2 lines before IVA
        for (var s = ivaLineIdx - 1; s >= Math.max(0, ivaLineIdx - 2); s--) {
          base = findAmountInLine(lines[s]);
          if (base) break;
        }
      }
    }
    // Strategy 3: derive from total / (1 + rate/100)
    if (!base && total && ivaRate) {
      base = Math.round(total / (1 + ivaRate / 100) * 100) / 100;
    } else if (!base && total) {
      // Guess 21% as default
      base = Math.round(total / 1.21 * 100) / 100;
    }

    // ----- INVOICE NUMBER EXTRACTION -----
    var invoiceNum = '';
    // Strategy 1: "FACTURA Nº XXXX", "Nº FACTURA XXXX", "FRA. XXXX"
    var numPatterns = [
      /(?:FACTURA|FRA\.?|FACT\.?)\s*(?:N[º°]|NUM\.?|NÚM\.?)?\s*[:#]?\s*([A-Za-z0-9\-\/]{3,25})/i,
      /N[º°]\s*(?:DE\s*)?(?:FACTURA|FRA\.?)?\s*[:#]?\s*([A-Za-z0-9\-\/]{3,25})/i,
      /(?:N[ÚU]MERO|NUM\.?)\s*(?:FACTURA)?\s*[:#]?\s*([A-Za-z0-9\-\/]{3,25})/i
    ];
    for (var t = 0; t < numPatterns.length; t++) {
      var nm = text.match(numPatterns[t]);
      if (nm && nm[1] && nm[1].length >= 3) {
        invoiceNum = nm[1].replace(/[\s,]+$/, '');
        break;
      }
    }
    // Strategy 2: standalone alphanumeric after "Nº" or "N°"
    if (!invoiceNum) {
      var nm2 = text.match(/N[º°]\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/]{2,20})/i);
      if (nm2) invoiceNum = nm2[1];
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
      showToast('Error al guardar la factura', 'error');
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
