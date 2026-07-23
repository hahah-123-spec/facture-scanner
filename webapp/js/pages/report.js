/* Report / Statistics Page */

var pageReport = {
  _el: null,
  _currentMonth: '',

  render: function () {
    this._el = document.getElementById('page-report');
    var now = new Date();
    this._currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    this._renderLayout();
    this._loadData();
    this._bindEvents();
  },

  _renderLayout: function () {
    this._el.innerHTML =
      '<div class="month-nav">' +
        '<div class="month-btn" id="reportPrevMonth">&#9664;</div>' +
        '<span class="month-label" id="reportMonthLabel"></span>' +
        '<div class="month-btn" id="reportNextMonth">&#9654;</div>' +
      '</div>' +
      '<div class="summary-cards" id="summaryCards">' +
        '<div class="summary-card"><div class="summary-label">Total</div><div class="summary-value" id="summaryTotal">—</div></div>' +
        '<div class="summary-card"><div class="summary-label">Base</div><div class="summary-value" id="summaryBase">—</div></div>' +
        '<div class="summary-card"><div class="summary-label">IVA</div><div class="summary-value" id="summaryIva">—</div></div>' +
        '<div class="summary-card"><div class="summary-label">Facturas</div><div class="summary-value" id="summaryCount">—</div></div>' +
      '</div>' +
      '<div class="category-breakdown" id="categoryBreakdown">' +
        '<div class="cat-title">Desglose por categoria</div>' +
        '<div id="categoryBars"></div>' +
      '</div>' +
      '<button class="btn btn-secondary btn-block" id="exportCsvBtn">' +
        '&#128230; Exportar CSV' +
      '</button>';
  },

  _bindEvents: function () {
    var self = this;

    var prevBtn = document.getElementById('reportPrevMonth');
    var nextBtn = document.getElementById('reportNextMonth');
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

    var exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        self._exportCsv();
      });
    }
  },

  _shiftMonth: function (delta) {
    var parts = this._currentMonth.split('-');
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
    d.setMonth(d.getMonth() + delta);
    this._currentMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    this._loadData();
  },

  _loadData: function () {
    var self = this;

    // Update month label
    var monthLabel = document.getElementById('reportMonthLabel');
    if (monthLabel) {
      var parts = this._currentMonth.split('-');
      var monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      monthLabel.textContent = monthNames[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
    }

    showLoading('Cargando...');

    invoices.list({ month: this._currentMonth }).then(function (all) {
      hideLoading();

      // Compute summary
      var total = 0, iva = 0, base = 0;
      for (var i = 0; i < all.length; i++) {
        var inv = all[i];
        total += parseFloat(inv.total_amount || 0);
        var b = parseFloat(inv.base_amount || 0);
        base += b;
        // If iva_amount column exists, use it; otherwise compute
        if (inv.iva_amount !== undefined && inv.iva_amount !== null) {
          iva += parseFloat(inv.iva_amount || 0);
        } else {
          iva += b * (parseFloat(inv.iva_rate || 0)) / 100;
        }
      }

      // Update summary cards
      var setSummary = function (id, val, cls) {
        var el = document.getElementById(id);
        if (el) {
          el.textContent = val.toFixed(2) + ' €';
          if (cls) el.className = 'summary-value ' + cls;
          else el.className = 'summary-value';
        }
      };
      setSummary('summaryTotal', total, 'orange');
      setSummary('summaryBase', base);
      setSummary('summaryIva', iva, 'green');
      var countEl = document.getElementById('summaryCount');
      if (countEl) {
        countEl.textContent = String(all.length);
        countEl.className = 'summary-value';
      }

      // Category breakdown
      var catMap = {};
      for (var j = 0; j < all.length; j++) {
        var inv2 = all[j];
        var cat = inv2.category || 'otros';
        catMap[cat] = (catMap[cat] || 0) + parseFloat(inv2.total_amount || 0);
      }

      var barsEl = document.getElementById('categoryBars');
      if (!barsEl) return;

      if (all.length === 0) {
        barsEl.innerHTML = '<div class="empty-state"><div class="empty-text">No hay datos este mes</div></div>';
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
            '<div class="cat-bar-bg">' +
              '<div class="cat-bar-fill" style="width:' + pct + '%"></div>' +
            '</div>' +
            '<span class="cat-amount">' + amount.toFixed(0) + ' €</span>' +
            '<span class="cat-pct">' + pct + '%</span>' +
          '</div>';
      }
      barsEl.innerHTML = html;

    }).catch(function (err) {
      hideLoading();
      console.error('Report load error:', err);
      showToast('Error al cargar datos', 'error');
    });
  },

  _exportCsv: function () {
    var self = this;

    showLoading('Generando CSV...');

    invoices.list({ month: this._currentMonth }).then(function (all) {
      // Build CSV header with BOM
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
          base.toFixed(2) + ',' +
          rate + ',' +
          ivaAmount.toFixed(2) + ',' +
          (parseFloat(inv.total_amount) || 0).toFixed(2) + ',' +
          self._escCsv(getLabel(inv.category)) + '\n';
      }

      // Download with proper UTF-8 BOM bytes for Excel
      var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      var encoder = new TextEncoder();
      var csvBytes = encoder.encode(csv);
      var blob = new Blob([bom, csvBytes], { type: 'text/csv;charset=utf-8;' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'facturas_' + self._currentMonth + '.csv';
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

  destroy: function () {
    if (this._el) {
      this._el.innerHTML = '';
    }
  }
};
