/* Login / Register Page */

var pageLogin = {
  _el: null,
  _mode: 'login', // 'login' | 'register'

  render: function () {
    var self = this;
    this._el = document.getElementById('page-login');
    this._mode = 'login';
    this._renderForm();
    this._bindEvents();
  },

  _renderForm: function () {
    var isLogin = this._mode === 'login';
    this._el.innerHTML =
      '<div class="login-logo">&#128196;</div>' +
      '<div class="login-title">Facture Scanner</div>' +
      '<div class="login-subtitle">' + (isLogin ? 'Inicia sesion para continuar' : 'Crea una cuenta nueva') + '</div>' +
      '<div class="login-form">' +
        '<div class="form-group">' +
          '<input class="form-input" type="email" id="loginEmail" placeholder="Correo electronico" autocomplete="email" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<input class="form-input" type="password" id="loginPassword" placeholder="Contrasena" autocomplete="' + (isLogin ? 'current-password' : 'new-password') + '" required>' +
        '</div>' +
        '<button class="btn btn-primary btn-block" id="loginSubmitBtn">' +
          (isLogin ? 'Iniciar sesion' : 'Crear cuenta') +
        '</button>' +
      '</div>' +
      '<div class="login-footer">' +
        (isLogin
          ? 'No tienes cuenta? <a id="loginToggleLink">Crear cuenta</a>'
          : 'Ya tienes cuenta? <a id="loginToggleLink">Iniciar sesion</a>') +
      '</div>';
  },

  _bindEvents: function () {
    var self = this;

    // Submit button
    var submitBtn = document.getElementById('loginSubmitBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        self._handleSubmit();
      });
    }

    // Enter key support
    var emailInput = document.getElementById('loginEmail');
    var passInput = document.getElementById('loginPassword');
    if (emailInput && passInput) {
      var onEnter = function (e) {
        if (e.key === 'Enter') self._handleSubmit();
      };
      emailInput.addEventListener('keydown', onEnter);
      passInput.addEventListener('keydown', onEnter);
    }

    // Toggle login/register
    var toggleLink = document.getElementById('loginToggleLink');
    if (toggleLink) {
      toggleLink.addEventListener('click', function (e) {
        e.preventDefault();
        self._mode = self._mode === 'login' ? 'register' : 'login';
        self._renderForm();
        self._bindEvents();
      });
    }
  },

  _handleSubmit: function () {
    var self = this;
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showToast('Por favor completa todos los campos', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('La contrasena debe tener al menos 6 caracteres', 'error');
      return;
    }

    showLoading(self._mode === 'login' ? 'Iniciando sesion...' : 'Creando cuenta...');

    var action = this._mode === 'login' ? auth.login(email, password) : auth.signUp(email, password);

    action.then(function (result) {
      hideLoading();
      if (self._mode === 'register') {
        showToast('Cuenta creada! Revisa tu correo para verificar.', 'success');
        self._mode = 'login';
        self._renderForm();
        self._bindEvents();
        return;
      }
      // Login success — router will redirect automatically
      showToast('Sesion iniciada', 'success');
      Router.navigate('invoices');
    }).catch(function (err) {
      hideLoading();
      var msg = err.message || 'Error de autenticacion';
      if (msg.indexOf('Invalid login credentials') !== -1) {
        msg = 'Correo o contrasena incorrectos';
      } else if (msg.indexOf('Email not confirmed') !== -1) {
        msg = 'Correo no verificado. Revisa tu bandeja de entrada.';
      } else if (msg.indexOf('already registered') !== -1) {
        msg = 'Este correo ya esta registrado';
      } else if (msg.indexOf('rate_limit') !== -1) {
        msg = 'Demasiados intentos. Intenta de nuevo mas tarde.';
      }
      showToast(msg, 'error');
    });
  },

  destroy: function () {
    // Clean up — the event listeners are on elements that get removed,
    // so no need to manually remove them
    if (this._el) {
      this._el.innerHTML = '';
    }
  }
};
