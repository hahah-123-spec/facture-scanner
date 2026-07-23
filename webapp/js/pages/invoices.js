/* Invoices: List + Detail / Edit Page */

var pageInvoices = {
  _el: null,
  _mode: 'list',      // 'list' | 'detail' | 'edit'
  _invoice: null,      // current invoice for detail/edit
  _searchTimer: null,
  _currentMonth: '',

  render: function (params) {
    this._el = document.getElementById('page-invoices');

    if (params && params.id) {
      // Detail / Edit mode
      this._loadAndRenderDetail(params.id);
    } else {
      // List mode
      this._mode = 'list';
      var now = new Date();
      this._currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
      this._renderListLayout();
      this._loadList();
      this._bindListEvents();
    }
  },

  /* ---- LIST MODE ---- */

  _renderListLayout: function () {
    this._el.innerHTML =
      '<div class="list-toolbar">' +
        '<div class="search-box">' +
          '<span class="search-icon">&#128269;</span>' +
          '<input type="text" id="searchInput" placeholder="Buscar proveedor..." autocomplete="off">' +
        '</div>' +
      '</div>' +
      '<div class="month-nav">' +
        '<div class="month-btn" id="prevMonthBtn">&#9664;</div>' +
        '<span class="month-label" id="monthLabel"></span>' +
        '<div class="month-btn" id="nextMonthBtn">&#9654;</div>' +
      '</div>' +
      '<div id="invoiceList"></div>';
  },

  _bindListEvents: function () {
    var self = this;

    // Search with debounce
    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        clearTimeout(self._searchTimer);
        self._searchTimer = setTimeout(function () {
          self._loadList();
        }, 300);
      });
    }

    // Month navigation
    var prevBtn = document.getElementById('prevMonthBtn');
    var nextBtn = document.getElementById('nextMonthBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        self._shiftMonth(-1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        self._shiftMonth(1);
      });
    }

    // Invoice card clicks via delegation
    var listEl = document.getElementById('invoiceList');
    if (listEl) {
      listEl.addEventListener('click', function (e) {
        var card = e.target.closest('.invoice-card');
        if (card && card.dataset.id) {
          self._loadAndRenderDetail(card.dataset.id);
        }
      });
    }
  },

  _shiftMonth: function (delta) {
    var parts = this._currentMonth.split('-');
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
    d.setMonth(d.getMonth() + delta);
    this._currentMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    this._loadList();
  },

  _loadList: function () {
    var self = this;
    var monthLabel = document.getElementById('monthLabel');
    if (monthLabel) {
      var parts = this._currentMonth.split('-');
      var monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      monthLabel.textContent = monthNames[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
    }

    var searchText = '';
    var searchInput = document.getElementById('searchInput');
    if (searchInput) searchText = searchInput.value.trim();

    showLoading('Cargando...');

    invoices.list({ month: this._currentMonth, search: searchText || undefined }).then(function (data) {
      hideLoading();
      self._renderList(data || []);
    }).catch(function (err) {
      hideLoading();
      console.error('Load invoices error:', err);
      showToast('Error al cargar facturas', 'error');
    });
  },

  _renderList: function (data) {
    var self = this;
    var listEl = document.getElementById('invoiceList');
    if (!listEl) return;

    if (data.length === 0) {
      listEl.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">&#128196;</div>' +
          '<div class="empty-text">No hay facturas este mes</div>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < data.length; i++) {
      var inv = data[i];
      var cat = CATEGORIES.find(function (c) { return c.value === inv.category; });
      var catLabel = cat ? cat.icon + ' ' + cat.label : inv.category;

      html +=
        '<div class="invoice-card" data-id="' + inv.id + '">' +
          '<div class="invoice-card-header">' +
            '<span class="supplier-name">' + self._escHtml(inv.supplier_name || '') + '</span>' +
            '<span class="total-amount">' + self._fmtAmount(inv.total_amount) + '</span>' +
          '</div>' +
          '<div class="invoice-card-meta">' +
            '<span>' + self._fmtDate(inv.invoice_date) + '</span>' +
            '<span class="category-tag">' + catLabel + '</span>' +
          '</div>' +
        '</div>';
    }
    listEl.innerHTML = html;
  },

  /* ---- DETAIL / EDIT MODE ---- */

  _loadAndRenderDetail: function (id) {
    var self = this;
    showLoading('Cargando...');

    invoices.getById(id).then(function (inv) {
      hideLoading();
      if (!inv) {
        showToast('Factura no encontrada', 'error');
        Router.navigate('invoices');
        return;
      }
      self._invoice = inv;
      self._mode = 'detail';
      self._renderDetail();
      self._bindDetailEvents();
    }).catch(function (err) {
      hideLoading();
      console.error('Load detail error:', err);
      showToast('Error al cargar factura', 'error');
      Router.navigate('invoices');
    });
  },

  _renderDetail: function () {
    var self = this;
    var inv = this._invoice;
    var isEdit = this._mode === 'edit';

    var catOptions = CATEGORIES.map(function (c) {
      var selected = c.value === inv.category ? ' selected' : '';
      return '<option value="' + c.value + '"' + selected + '>' + c.icon + ' ' + c.label + '</option>';
    }).join('');

    var imageHtml = '';
    if (inv.image_url) {
      var imgUrl = getPublicUrl(inv.image_url);
      imageHtml = '<img class="detail-image" src="' + imgUrl + '" alt="Factura" onerror="this.style.display=\'none\'">';
    } else {
      imageHtml = '<div class="detail-image-placeholder">&#128196;</div>';
    }

    // Compute iva_amount for display
    var base = parseFloat(inv.base_amount) || 0;
    var rate = parseFloat(inv.iva_rate) || 0;
    var ivaAmount = base * rate / 100;

    var catLabel = getLabel(inv.category);

    var fieldsHtml = '';

    if (isEdit) {
      // Edit mode: form fields
      fieldsHtml =
        '<div class="form-group">' +
          '<label class="form-label">Proveedor</label>' +
          '<input class="form-input" id="detail-field-supplier_name" value="' + self._escHtml(inv.supplier_name || '') + '">' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label class="form-label">Fecha</label>' +
            '<input class="form-input" id="detail-field-invoice_date" type="date" value="' + (inv.invoice_date || '') + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Nº Factura</label>' +
            '<input class="form-input" id="detail-field-invoice_number" value="' + self._escHtml(inv.invoice_number || '') + '">' +
          '</div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label class="form-label">Base Imponible</label>' +
            '<input class="form-input" id="detail-field-base_amount" type="number" step="0.01" value="' + base + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">IVA %</label>' +
            '<input class="form-input" id="detail-field-iva_rate" type="number" step="0.1" value="' + rate + '">' +
          '</div>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Total</label>' +
          '<input class="form-input" id="detail-field-total_amount" type="number" step="0.01" value="' + (parseFloat(inv.total_amount) || 0) + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Categoria</label>' +
          '<select class="form-select" id="detail-field-category">' + catOptions + '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Notas</label>' +
          '<textarea class="form-textarea" id="detail-field-notes" rows="2">' + self._escHtml(inv.notes || '') + '</textarea>' +
        '</div>';
    } else {
      // View mode: display fields
      fieldsHtml =
        '<div class="detail-field">' +
          '<span class="field-label">Proveedor</span>' +
          '<span class="field-value">' + self._escHtml(inv.supplier_name || '—') + '</span>' +
        '</div>' +
        '<div class="detail-field">' +
          '<span class="field-label">Fecha</span>' +
          '<span class="field-value">' + self._fmtDate(inv.invoice_date) + '</span>' +
        '</div>' +
        '<div class="detail-field">' +
          '<span class="field-label">Nº Factura</span>' +
          '<span class="field-value">' + self._escHtml(inv.invoice_number || '—') + '</span>' +
        '</div>' +
        '<div class="detail-field">' +
          '<span class="field-label">Base Imponible</span>' +
          '<span class="field-value amount">' + self._fmtAmount(base) + '</span>' +
        '</div>' +
        '<div class="detail-field">' +
          '<span class="field-label">IVA (' + rate + '%)</span>' +
          '<span class="field-value amount">' + self._fmtAmount(ivaAmount) + '</span>' +
        '</div>' +
        '<div class="detail-field">' +
          '<span class="field-label">Total</span>' +
          '<span class="field-value amount">' + self._fmtAmount(inv.total_amount) + '</span>' +
        '</div>' +
        '<div class="detail-field">' +
          '<span class="field-label">Categoria</span>' +
          '<span class="field-value category-label">' + catLabel + '</span>' +
        '</div>' +
        (inv.notes ? '<div class="detail-field">' +
          '<span class="field-label">Notas</span>' +
          '<span class="field-value">' + self._escHtml(inv.notes) + '</span>' +
        '</div>' : '');
    }

    var actionsHtml = '';
    if (isEdit) {
      actionsHtml =
        '<button class="btn btn-primary" id="detailSaveBtn" style="flex:1">Guardar</button>' +
        '<button class="btn btn-secondary" id="detailCancelBtn" style="flex:1">Cancelar</button>' +
        '<button class="btn btn-danger" id="detailDeleteBtn">Eliminar</button>';
    } else {
      actionsHtml =
        '<button class="btn btn-primary" id="detailEditBtn" style="flex:1">Editar</button>';
    }

    var html =
      imageHtml +
      '<div class="card">' +
        fieldsHtml +
      '</div>' +
      '<div class="detail-actions">' + actionsHtml + '</div>';

    this._el.innerHTML = html;

    // Show back button in header
    var backBtn = document.getElementById('headerBackBtn');
    if (backBtn) backBtn.style.display = 'flex';

    // Update header title
    var headerTitle = document.getElementById('headerTitle');
    if (headerTitle) headerTitle.textContent = isEdit ? 'Editar factura' : 'Detalle';
  },

  _bindDetailEvents: function () {
    var self = this;

    // Back button
    var backBtn = document.getElementById('headerBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        Router.navigate('invoices');
      });
    }

    if (this._mode === 'edit') {
      // Save
      var saveBtn = document.getElementById('detailSaveBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', function () {
          self._handleEditSave();
        });
      }

      // Cancel
      var cancelBtn = document.getElementById('detailCancelBtn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
          self._mode = 'detail';
          self._renderDetail();
          self._bindDetailEvents();
        });
      }

      // Delete
      var deleteBtn = document.getElementById('detailDeleteBtn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', function () {
          self._handleDelete();
        });
      }

      // Auto-compute total on base/iva change
      var baseField = document.getElementById('detail-field-base_amount');
      var ivaField = document.getElementById('detail-field-iva_rate');
      var totalField = document.getElementById('detail-field-total_amount');
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
    } else {
      // Edit button
      var editBtn = document.getElementById('detailEditBtn');
      if (editBtn) {
        editBtn.addEventListener('click', function () {
          self._mode = 'edit';
          self._renderDetail();
          self._bindDetailEvents();
        });
      }
    }
  },

  _handleEditSave: function () {
    var self = this;
    var getVal = function (id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    var data = {
      supplier_name: getVal('detail-field-supplier_name'),
      invoice_date: getVal('detail-field-invoice_date'),
      invoice_number: getVal('detail-field-invoice_number'),
      base_amount: parseFloat(getVal('detail-field-base_amount')) || 0,
      iva_rate: parseFloat(getVal('detail-field-iva_rate')) || 21,
      total_amount: parseFloat(getVal('detail-field-total_amount')) || 0,
      category: getVal('detail-field-category') || 'productos',
      notes: getVal('detail-field-notes')
    };

    showLoading('Guardando...');

    invoices.update(this._invoice.id, data).then(function () {
      hideLoading();
      showToast('Factura actualizada', 'success');
      // Reload detail
      return invoices.getById(self._invoice.id);
    }).then(function (updated) {
      self._invoice = updated;
      self._mode = 'detail';
      self._renderDetail();
      self._bindDetailEvents();
    }).catch(function (err) {
      hideLoading();
      console.error('Update error:', err);
      showToast('Error al guardar', 'error');
    });
  },

  _handleDelete: function () {
    var self = this;
    showConfirm(
      'Eliminar factura',
      'Esta accion no se puede deshacer. Deseas continuar?',
      'Eliminar',
      'Cancelar'
    ).then(function (confirmed) {
      if (!confirmed) return;
      showLoading('Eliminando...');
      return invoices.delete(self._invoice.id);
    }).then(function () {
      hideLoading();
      showToast('Factura eliminada', 'success');
      Router.navigate('invoices');
    }).catch(function (err) {
      if (err) {
        hideLoading();
        console.error('Delete error:', err);
        showToast('Error al eliminar', 'error');
      }
    });
  },

  /* ---- Helpers ---- */

  _escHtml: function (str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  _fmtAmount: function (val) {
    var num = parseFloat(val) || 0;
    return num.toFixed(2) + ' €';
  },

  _fmtDate: function (dateStr) {
    if (!dateStr) return '—';
    var parts = dateStr.split('-');
    if (parts.length === 3) {
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    return dateStr;
  },

  destroy: function () {
    clearTimeout(this._searchTimer);
    this._searchTimer = null;
    if (this._el) {
      this._el.innerHTML = '';
    }
  }
};
