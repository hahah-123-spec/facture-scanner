/* Report / Statistics Page — Month + Year views */

var pageReport = {
  _el: null,
  _mode: 'month',   // 'month' | 'year'
  _currentMonth: '',
  _currentYear: '',
  _allData: [],     // cache year data for month view too

  render: function () {
    this._el = document.getElementById('page-report');
    var now = new Date();
    this._currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    this._currentYear = String(now.getFullYear());
    this._mode = 'month';
    this._renderLayout();
    this._loadData();
    this._bindEvents();
  },

  /* ---- Layout ---- */
  _renderLayout: function () {
    var isMonth = this._mode === 'month';
    var periodLabel = isMonth ? this._formatMonthLabel(this._currentMonth) : this._currentYear;

    this._el.innerHTML =
      /* Period toggle */
      '<div class="period-toggle">' +
        '<button class="btn btn-sm ' + (isMonth ? 'btn-primary' : 'btn-secondary') + '" id="periodMonthBtn">Mes</button>' +
        '<button class="btn btn-sm ' + (!isMonth ? 'btn-primary' : 'btn-secondary') + '" id="periodYearBtn">Año</button>' +
      '</div>' +
      /* Navigator */
      '<div class="month-nav">' +
        '<div class="month-btn" id="reportPrevBtn">&#9664;</div>' +
        '<span class="month-label" id="reportPeriodLabel">' + periodLabel + '</span>' +
        '<div class="month-btn" id="reportNextBtn">&#9654;</div>' +
      '</div>' +
      /* Summary cards */
      '<div class="summary-cards" id="summaryCards">' +
        '<div class="summary-card"><div class="summary-label">Total</div><div class="summary-value" id="summaryTotal">—</div></div>' +
        '<div class="summary-card"><div class="summary-label">Base</div><div class="summary-value" id="summaryBase">—</div></div>' +
        '<div class="summary-card"><div class="summary-label">IVA</div><div class="summary-value" id="summaryIva">—</div></div>' +
        '<div class="summary-card"><div class="summary-label">Facturas</div><div class="summary-value" id="summaryCount">—</div></div>' +
      '</div>' +
      /* Category breakdown */
      '<div class="category-breakdown" id="categoryBreakdown">' +
        '<div class="cat-title">Desglose por categoria</div>' +
        '<div id="categoryBars"></div>' +
      '</div>' +
      /* Monthly breakdown (year mode only) */
      '<div class="category-breakdown" id="monthlyBreakdown" style="display:' + (!isMonth ? '' : 'none') + '">' +
        '<div class="cat-title">Evolucion mensual</div>' +
        '<div id="monthlyBars"></div>' +
      '</div>' +
      /* Export */
      '<button class="btn btn-secondary btn-block" id="exportCsvBtn">' +
        '&#128230; Exportar CSV' +
      '</button>';
  },

  /* ---- Events ---- */
  _bindEvents: function () {
    var self = this;

    // Period toggle
    document.getElementById('periodMonthBtn').addEventListener('click', function () {
      if (self._mode !== 'month') { self._mode = 'month'; self._renderLayout(); self._loadData(); self._bindEvents(); }
    });
    document.getElementById('periodYearBtn').addEventListener('click', function () {
      if (self._mode !== 'year') { self._mode = 'year'; self._renderLayout(); self._loadData(); self._bindEvents(); }
    });

    // Navigation
    document.getElementById('reportPrevBtn').addEventListener('click', function () { self._shiftPeriod(-1); });
    document.getElementById('reportNextBtn').addEventListener('click', function () { self._shiftPeriod(1); });

    // Export
    document.getElementById('exportCsvBtn').addEventListener('click', function () { self._exportCsv(); });
  },

  _shiftPeriod: function (delta) {
    if (this._mode === 'month') {
      var parts = this._currentMonth.split('-');
      var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      d.setMonth(d.getMonth() + delta);
      this._currentMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    } else {
      this._currentYear = String(parseInt(this._currentYear, 10) + delta);
    }
    this._loadData();
  },

  /* ---- Data loading ---- */
  _loadData: function () {
    var self = this;
    var periodLabel = document.getElementById('reportPeriodLabel');
    if (periodLabel) {
      periodLabel.textContent = this._mode === 'month'
        ? this._formatMonthLabel(this._currentMonth)
        : this._currentYear;
    }

    showLoading('Cargando...');

    var promise = this._mode === 'month'
      ? invoices.list({ month: this._currentMonth })
      : invoices.list({ year: this._currentYear });

    promise.then(function (data) {
      hideLoading();
      self._allData = data;
      if (self._mode === 'month') {
        self._renderMonth(data);
      } else {
        self._renderYear(data);
      }
    }).catch(function (err) {
      hideLoading();
      console.error('Report load error:', err);
      showToast('Error al cargar datos', 'error');
    });
  },

  /* ---- Month view ---- */
  _renderMonth: function (data) {
    var total = 0, iva = 0, base = 0;
    for (var i = 0; i < data.length; i++) {
      var inv = data[i];
      total += parseFloat(inv.total_amount || 0);
      var b = parseFloat(inv.base_amount || 0);
      base += b;
      if (inv.iva_amount !== undefined && inv.iva_amount !== null) {
        iva += parseFloat(inv.iva_amount || 0);
      } else {
        iva += b * (parseFloat(inv.iva_rate || 0)) / 100;
      }
    }

    this._renderSummaryCards(total, base, iva, data.length);
    this._renderCategoryBars(data, total);
  },

  /* ---- Year view ---- */
  _renderYear: function (data) {
    // Aggregate
    var total = 0, iva = 0, base = 0;
    var monthMap = {}; // "MM" → total
    for (var i = 0; i < data.length; i++) {
      var inv = data[i];
      total += parseFloat(inv.total_amount || 0);
      var b = parseFloat(inv.base_amount || 0);
      base += b;
      if (inv.iva_amount !== undefined && inv.iva_amount !== null) {
        iva += parseFloat(inv.iva_amount || 0);
      } else {
        iva += b * (parseFloat(inv.iva_rate || 0)) / 100;
      }
      // Monthly breakdown
      if (inv.invoice_date) {
        var mm = inv.invoice_date.substring(5, 7); // "01".."12"
        monthMap[mm] = (monthMap[mm] || 0) + parseFloat(inv.total_amount || 0);
      }
    }

    this._renderSummaryCards(total, base, iva, data.length);
    this._renderCategoryBars(data, total);
    this._renderMonthlyBars(monthMap, total);
  },

  /* ---- Summary cards (shared) ---- */
  _renderSummaryCards: function (total, base, iva, count) {
    var set = function (id, val, cls) {
      var el = document.getElementById(id);
      if (el) {
        el.textContent = val.toFixed(2) + ' €';
        el.className = 'summary-value' + (cls ? ' ' + cls : '');
      }
    };
    set('summaryTotal', total, 'orange');
    set('summaryBase', base);
    set('summaryIva', iva, 'green');
    var countEl = document.getElementById('summaryCount');
    if (countEl) { countEl.textContent = String(count); countEl.className = 'summary-value'; }
  },

  /* ---- Category bars (shared) ---- */
  _renderCategoryBars: function (data, total) {
    var catMap = {};
    for (var i = 0; i < data.length; i++) {
      var cat = data[i].category || 'otros';
      catMap[cat] = (catMap[cat] || 0) + parseFloat(data[i].total_amount || 0);
    }

    var barsEl = document.getElementById('categoryBars');
    if (!barsEl) return;

    if (data.length === 0) {
      barsEl.innerHTML = '<div class="empty-state"><div class="empty-text">Sin datos</div></div>';
      return;
    }

    var html = '';
    for (var k = 0; k < CATEGORIES.length; k++) {
      var catDef = CATEGORIES[k];
      var amount = catMap[catDef.value];
      if (!amount) continue;
      var pct = total > 0 ? Math.round(amount / total * 100) : 0;
      html +=
        '<div class="category-item">' +
          '<span class="cat-label">' + catDef.icon + ' ' + catDef.label + '</span>' +
          '<div class="cat-bar-bg"><div class="cat-bar-fill" style="width:' + pct + '%"></div></div>' +
          '<span class="cat-amount">' + amount.toFixed(0) + ' €</span>' +
          '<span class="cat-pct">' + pct + '%</span>' +
        '</div>';
    }
    barsEl.innerHTML = html;
  },

  /* ---- Monthly bars (year view only) ---- */
  _renderMonthlyBars: function (monthMap, yearTotal) {
    var container = document.getElementById('monthlyBreakdown');
    var barsEl = document.getElementById('monthlyBars');
    if (!container || !barsEl) return;

    container.style.display = this._mode === 'year' ? 'block' : 'none';
    if (this._mode !== 'year') return;

    var monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    var maxAmount = 0;
    for (var mm in monthMap) {
      if (monthMap[mm] > maxAmount) maxAmount = monthMap[mm];
    }

    var html = '';
    for (var m = 1; m <= 12; m++) {
      var key = String(m).padStart(2, '0');
      var amount = monthMap[key] || 0;
      var barWidth = maxAmount > 0 ? Math.round(amount / maxAmount * 100) : 0;
      html +=
        '<div class="category-item">' +
          '<span class="cat-label">' + monthNames[m - 1] + '</span>' +
          '<div class="cat-bar-bg"><div class="cat-bar-fill" style="width:' + barWidth + '%"></div></div>' +
          '<span class="cat-amount">' + amount.toFixed(0) + ' €</span>' +
        '</div>';
    }
    barsEl.innerHTML = html;
  },

  /* ---- CSV Export ---- */
  _exportCsv: function () {
    var self = this;

    showLoading('Generando CSV...');

    var promise = this._mode === 'month'
      ? invoices.list({ month: this._currentMonth })
      : invoices.list({ year: this._currentYear });

    promise.then(function (all) {
      var csv = '﻿Fecha,Proveedor,Nº Factura,Base,IVA%,IVA,Total,Categoría\n';

      for (var i = 0; i < all.length; i++) {
        var inv = all[i];
        var base = parseFloat(inv.base_amount) || 0;
        var rate = parseFloat(inv.iva_rate) || 0;
        var ivaAmount = inv.iva_amount !== undefined && inv.iva_amount !== null
          ? parseFloat(inv.iva_amount)
          : base * rate / 100;
        csv +=
          self._escCsv(inv.invoice_date) + ',' +
          self._escCsv(inv.supplier_name) + ',' +
          self._escCsv(inv.invoice_number) + ',' +
          base.toFixed(2) + ',' + rate + ',' +
          ivaAmount.toFixed(2) + ',' +
          (parseFloat(inv.total_amount) || 0).toFixed(2) + ',' +
          self._escCsv(getLabel(inv.category)) + '\n';
      }

      var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      var encoder = new TextEncoder();
      var csvBytes = encoder.encode(csv);
      var blob = new Blob([bom, csvBytes], { type: 'text/csv;charset=utf-8;' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      var label = self._mode === 'month' ? self._currentMonth : self._currentYear;
      link.download = 'facturas_' + label + '.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      hideLoading();
      showToast('CSV descargado', 'success');
    }).catch(function (err) {
      hideLoading();
      console.error('Export error:', err);
      showToast('Error al exportar CSV', 'error');
    });
  },

  _escCsv: function (v) {
    var s = String(v || '');
    if (s.includes(',') || s.includes('"') || s.includes('\n') || /^[=+\-@]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  },

  /* ---- Helpers ---- */
  _formatMonthLabel: function (ym) {
    var parts = ym.split('-');
    var names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return names[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
  },

  destroy: function () {
    if (this._el) { this._el.innerHTML = ''; }
  }
};
