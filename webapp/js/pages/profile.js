/* Profile / Settings Page */

var pageProfile = {
  _el: null,

  render: function () {
    this._el = document.getElementById('page-profile');
    this._render();
    this._bindEvents();
  },

  _render: function () {
    var defaultIva = parseInt(localStorage.getItem('default_iva') || '21', 10);

    this._el.innerHTML =
      '<div class="profile-section">' +
        '<div class="section-title">Configuracion</div>' +
        '<div class="card">' +
          '<div class="profile-row">' +
            '<span class="row-label">IVA por defecto (%)</span>' +
            '<input class="form-input" type="number" id="profileDefaultIva" value="' + defaultIva + '" step="0.1" min="0" max="100" style="width:80px;text-align:center;padding:8px 10px;">' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="profile-section">' +
        '<div class="section-title">Acerca de</div>' +
        '<div class="card">' +
          '<div class="profile-row">' +
            '<span class="row-label">Version</span>' +
            '<span class="row-value">v1.0.0</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="profile-actions">' +
        '<button class="btn btn-danger btn-block" id="logoutBtn">Cerrar sesion</button>' +
      '</div>';
  },

  _bindEvents: function () {
    var self = this;

    // Default IVA save on change
    var ivaInput = document.getElementById('profileDefaultIva');
    if (ivaInput) {
      ivaInput.addEventListener('change', function () {
        var val = parseInt(ivaInput.value, 10) || 21;
        localStorage.setItem('default_iva', String(val));
        showToast('IVA por defecto actualizado', 'success');
      });
    }

    // Logout
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        showConfirm(
          'Cerrar sesion',
          'Seguro que quieres cerrar sesion?',
          'Cerrar sesion',
          'Cancelar'
        ).then(function (confirmed) {
          if (!confirmed) return;
          showLoading('Cerrando sesion...');
          return auth.logout();
        }).then(function () {
          hideLoading();
          Router.navigate('login');
        }).catch(function (err) {
          if (err) {
            hideLoading();
            showToast('Error al cerrar sesion', 'error');
          }
        });
      });
    }
  },

  destroy: function () {
    if (this._el) {
      this._el.innerHTML = '';
    }
  }
};
