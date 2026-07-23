/* Profile / Settings Page */

var pageProfile = {
  _el: null,

  render: function () {
    this._el = document.getElementById('page-profile');
    this._render();
    this._bindEvents();
  },

  _render: function () {
    var self = this;
    var defaultIva = parseInt(localStorage.getItem('default_iva') || '21', 10);

    this._el.innerHTML =
      '<div class="profile-section">' +
        '<div class="section-title">Tienda</div>' +
        '<div class="card">' +
          '<div class="profile-row">' +
            '<span class="row-label">Codigo de tienda</span>' +
            '<span class="row-value highlight" id="profileInviteCode">' + (WS.code || '—') + '</span>' +
          '</div>' +
          '<div class="profile-row">' +
            '<span class="row-label" style="font-size:12px;color:var(--steel-gray)">Comparte este codigo con tus compañeros</span>' +
          '</div>' +
          '<div class="profile-row">' +
            '<button class="btn btn-danger btn-sm" id="profileLeaveBtn">Salir de la tienda</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      /* Members */
      '<div class="profile-section">' +
        '<div class="section-title">Miembros <span style="font-weight:400;font-size:11px">(cargando...)</span></div>' +
        '<div class="card" id="profileMemberList">' +
          '<div class="profile-row"><span class="row-value" style="color:var(--steel-gray)">Cargando...</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="profile-section">' +
        '<div class="section-title">Unirse a tienda</div>' +
        '<div class="card">' +
          '<div style="display:flex;gap:8px">' +
            '<input class="form-input" type="text" id="profileJoinCode" placeholder="Codigo de tienda" maxlength="6" style="flex:1;text-transform:uppercase">' +
            '<button class="btn btn-primary btn-sm" id="profileJoinBtn">Unirse</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
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

    // Load members async
    if (WS.id) {
      auth.getMembers().then(function (members) {
        self._renderMembers(members);
      }).catch(function () {
        var el = document.getElementById('profileMemberList');
        if (el) el.innerHTML = '<div class="profile-row"><span class="row-value" style="color:var(--steel-gray)">Error al cargar</span></div>';
      });
    }
  },

  _bindEvents: function () {
    var self = this;

    // Leave workspace button
    var leaveBtn = document.getElementById('profileLeaveBtn');
    if (leaveBtn) {
      leaveBtn.addEventListener('click', function () {
        showConfirm(
          'Salir de la tienda',
          'Dejaras de ver las facturas compartidas y tendras tu propia tienda. Continuar?',
          'Salir', 'Cancelar'
        ).then(function (ok) {
          if (!ok) return;
          showLoading('Saliendo...');
          return auth.leaveWorkspace();
        }).then(function () {
          hideLoading();
          var codeDisp = document.getElementById('profileInviteCode');
          if (codeDisp) codeDisp.textContent = WS.code || '—';
          showToast('Has salido de la tienda', 'success');
        }).catch(function (err) {
          hideLoading();
          showToast('Error al salir', 'error');
        });
      });
    }

    // Join workspace button
    var joinBtn = document.getElementById('profileJoinBtn');
    if (joinBtn) {
      joinBtn.addEventListener('click', function () {
        var codeEl = document.getElementById('profileJoinCode');
        var code = codeEl ? codeEl.value.trim().toUpperCase() : '';
        if (!code) { showToast('Introduce el codigo de tienda', 'error'); return; }
        showLoading('Uniendo...');
        auth.joinWorkspace(code).then(function () {
          hideLoading();
          var codeDisp = document.getElementById('profileInviteCode');
          if (codeDisp) codeDisp.textContent = WS.code || '—';
          showToast('Unido a la tienda!', 'success');
        }).catch(function (err) {
          hideLoading();
          showToast('Codigo no valido o tienda no encontrada', 'error');
        });
      });
    }

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

  _renderMembers: function (members) {
    var el = document.getElementById('profileMemberList');
    if (!el) return;
    if (!members || members.length === 0) {
      el.innerHTML = '<div class="profile-row"><span class="row-value" style="color:var(--steel-gray)">Sin miembros</span></div>';
      return;
    }
    var self = this;
    var html = '';
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      var isAdmin = m.member_role === 'admin';
      html +=
        '<div class="profile-row">' +
          '<span class="row-label">' + m.member_email + (isAdmin ? ' 👑' : '') + '</span>' +
          (isAdmin ? '<span class="row-value" style="font-size:12px;color:var(--stamp-green)">Admin</span>' : '') +
          (!isAdmin ? '<button class="btn btn-sm" style="background:transparent;color:var(--seal-red);padding:4px 8px;min-height:28px" data-remove="' + m.member_id + '">Quitar</button>' : '') +
        '</div>';
    }
    el.innerHTML = html;

    // Bind remove buttons
    var btns = el.querySelectorAll('[data-remove]');
    for (var j = 0; j < btns.length; j++) {
      btns[j].addEventListener('click', function (e) {
        var userId = this.getAttribute('data-remove');
        showConfirm('Quitar miembro', 'El miembro sera movido a su propia tienda. Continuar?', 'Quitar', 'Cancelar').then(function (ok) {
          if (!ok) return;
          showLoading('Quitando...');
          return auth.removeMember(userId);
        }).then(function () {
          hideLoading(); showToast('Miembro quitado', 'success');
          auth.getMembers().then(function (m) { self._renderMembers(m); });
        }).catch(function () {
          hideLoading(); showToast('Error al quitar miembro', 'error');
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
