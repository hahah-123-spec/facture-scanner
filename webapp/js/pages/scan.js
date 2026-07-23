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

      // Remove old preview image if any
      var oldImg = photoArea.querySelector('img');
      if (oldImg) oldImg.remove();

      var img = document.createElement('img');
      img.src = e.target.result;
      img.alt = 'Preview';
      photoArea.appendChild(img);
      photoArea.classList.add('has-image');
      self._state.photoPreviewUrl = e.target.result;

      // Upload and OCR
      self._startOcr(file);
    };
    reader.readAsDataURL(file);
  },

  _startOcr: function (file) {
    var self = this;
    this._state.ocrLoading = true;
    var ocrEl = document.getElementById('ocrLoading');
    if (ocrEl) ocrEl.classList.add('show');
    showLoading('Reconociendo con OCR...');

    Tesseract.recognize(file, 'spa', {
      logger: function (m) {
        if (m.status === 'recognizing text') {
          var pct = Math.round(m.progress * 100);
          document.getElementById('loadingText').textContent = 'Reconociendo... ' + pct + '%';
        }
      }
    }).then(function (result) {
      var text = result.data.text;
      var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);

      // Extract fields using same regex as original
      var supplier = lines.find(function (l) { return /^[A-Z][A-Za-zÀ-ÿ\s]{3,}$/.test(l); }) || '';
      var dateMatch = text.match(/(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/);
      var date = dateMatch ? dateMatch[1].replace(/\./g, '/') : '';

      var amounts = text.match(/(\d+[.,]\d{2})\s*€?/g) || [];
      var parsed = amounts.map(function (a) { return parseFloat(a.replace(',', '.').replace('€', '')); }).filter(function (n) { return !isNaN(n); });

      var total = 0, base = 0;
      var totalLine = lines.find(function (l) { return /TOTAL|IMPORTE\s*TOTAL/i.test(l); });
      if (totalLine) {
        var tm = totalLine.match(/(\d+[.,]\d{2})/);
        if (tm) total = parseFloat(tm[1].replace(',', '.'));
      }
      if (!total && parsed.length > 0) total = Math.max.apply(null, parsed);

      var baseIdx = lines.findIndex(function (l) { return /IVA|21%|10%|4%/i.test(l); });
      if (baseIdx > 0) {
        var bm = lines[baseIdx - 1].match(/(\d+[.,]\d{2})/);
        if (bm) base = parseFloat(bm[1].replace(',', '.'));
      }
      if (!base && total) base = Math.round(total / 1.21 * 100) / 100;

      var numMatch = text.match(/(?:FACTURA|N[º°]|FRA\.?)\s*[:#]?\s*([A-Z0-9\-]{4,20})/i);
      var invoiceNum = numMatch ? numMatch[1] : '';

      // Fill form
      var setVal = function (id, val) {
        var el = document.getElementById(id);
        if (el && val) el.value = val;
      };
      setVal('field-supplier_name', supplier);
      if (date) setVal('field-invoice_date', date);
      setVal('field-base_amount', base || '');
      setVal('field-total_amount', total || '');
      setVal('field-invoice_number', invoiceNum);

      if (base > 0 && total > base) {
        var impliedRate = ((total - base) / base * 100).toFixed(1);
        var ivaField = document.getElementById('field-iva_rate');
        if (ivaField) ivaField.value = impliedRate;
      }

      hideLoading();
      showToast('OCR completado', 'success');

      // Upload image to storage for persistence
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
        return Promise.reject(null); // silent stop
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
      if (err === null) return; // silent stop from cancel
      hideLoading();
      console.error('Save error:', err);
      showToast('Error al guardar la factura', 'error');
    }).finally(function () {
      self._state.saving = false;
    });
  },

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

  destroy: function () {
    // Revoke object URL to prevent memory leak
    if (this._state.photoPreviewUrl && this._state.photoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this._state.photoPreviewUrl);
    }
    if (this._el) {
      this._el.innerHTML = '';
    }
  }
};
