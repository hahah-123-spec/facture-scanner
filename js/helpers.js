/* Global Helper Functions: Toast, Loading, Modal, Shared Data */

/* ---- Shared constants ---- */
var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
var MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
var CAT_COLORS = { productos: '#2D5A9E', plantas: '#1F7D53', suministros: '#D4793A', servicios: '#6B7280', transporte: '#C2413E', otros: '#9CA3AF' };

function formatMonthLabel(ym) {
  var parts = ym.split('-');
  return MESES[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
}

/* ---- Toast ---- */
function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toastContainer');
  if (!container) return;

  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  container.appendChild(toast);

  // Auto remove after animation
  setTimeout(function () {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

/* ---- Loading Overlay ---- */
function showLoading(text) {
  text = text || 'Cargando...';
  var overlay = document.getElementById('loadingOverlay');
  var textEl = document.getElementById('loadingText');
  if (overlay) overlay.classList.add('show');
  if (textEl) textEl.textContent = text;
}

function hideLoading() {
  var overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('show');
}

/* ---- Confirm Modal ---- */
var _modalResolver = null;

// Single persistent overlay click handler
(function () {
  var overlay = document.getElementById('modalOverlay');
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay && _modalResolver) {
        _modalResolver(false);
        _modalResolver = null;
        overlay.classList.remove('show');
      }
    });
  }
})();

function showConfirm(title, body, confirmText, cancelText) {
  return new Promise(function (resolve) {
    var overlay = document.getElementById('modalOverlay');
    var titleEl = document.getElementById('modalTitle');
    var bodyEl = document.getElementById('modalBody');
    var actionsEl = document.getElementById('modalActions');

    if (!overlay || !titleEl || !bodyEl || !actionsEl) {
      resolve(false);
      return;
    }

    titleEl.textContent = title || 'Confirmar';
    bodyEl.textContent = body || '';
    actionsEl.innerHTML =
      '<button class="btn btn-secondary" id="modalCancelBtn">' + (cancelText || 'Cancelar') + '</button>' +
      '<button class="btn btn-primary" id="modalConfirmBtn">' + (confirmText || 'Aceptar') + '</button>';

    overlay.classList.add('show');

    _modalResolver = resolve;

    var cleanup = function (result) {
      overlay.classList.remove('show');
      actionsEl.innerHTML = '';
      _modalResolver = null;
      resolve(result);
    };

    var confirmBtn = document.getElementById('modalConfirmBtn');
    var cancelBtn = document.getElementById('modalCancelBtn');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () { cleanup(true); });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () { cleanup(false); });
    }
  });
}
