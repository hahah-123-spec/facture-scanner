/* Hash-based SPA Router */

var Router = {
  currentPage: null,
  currentRoute: '',
  currentParams: {},
  _initialCheckDone: false,

  /* ---- Public API ---- */

  init: function () {
    var self = this;

    window.addEventListener('hashchange', function () {
      self._onHashChange();
    });

    // Initial route — called after DOM ready
    this._onHashChange();
  },

  navigate: function (route, params) {
    params = params || {};
    var hash = route;
    var keys = Object.keys(params);
    if (keys.length > 0) {
      var qs = keys.map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }).join('&');
      hash += '?' + qs;
    }
    window.location.hash = hash;
  },

  back: function () {
    window.history.back();
  },

  replace: function (route, params) {
    params = params || {};
    var hash = '#' + route;
    var keys = Object.keys(params);
    if (keys.length > 0) {
      var qs = keys.map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }).join('&');
      hash += '?' + qs;
    }
    window.location.replace(hash);
  },

  getParams: function () {
    return this.currentParams;
  },

  getRoute: function () {
    return this.currentRoute;
  },

  /* ---- Internal ---- */

  _onHashChange: function () {
    var self = this;
    var hash = window.location.hash.slice(1) || 'invoices';
    var parts = hash.split('?');
    var routePart = parts[0];
    var params = {};
    if (parts.length > 1) {
      parts[1].split('&').forEach(function (pair) {
        var kv = pair.split('=');
        if (kv.length === 2) {
          params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
        }
      });
    }

    // Auth guard — check user state before rendering
    auth.getCurrentUser().then(function (user) {
      if (!user && routePart !== 'login') {
        window.location.hash = 'login';
        return;
      }
      if (user && routePart === 'login') {
        window.location.hash = 'invoices';
        return;
      }
      self._render(routePart, params);
    }).catch(function () {
      // On error (e.g. network), try to render login
      if (routePart !== 'login') {
        window.location.hash = 'login';
      } else {
        self._render('login', {});
      }
    });
  },

  _render: function (route, params) {
    // Destroy current page
    if (this.currentPage && typeof this.currentPage.destroy === 'function') {
      this.currentPage.destroy();
    }

    // Hide all pages
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
      pages[i].classList.remove('active');
    }

    // Show/hide tab bar
    var tabBar = document.getElementById('tab-bar');
    if (tabBar) {
      if (route === 'login') {
        tabBar.classList.remove('show');
      } else {
        tabBar.classList.add('show');
      }
    }

    // Show/hide header
    var header = document.getElementById('app-header');
    if (header) {
      if (route === 'login') {
        header.classList.remove('show');
      } else {
        header.classList.add('show');
      }
    }

    // Update header title
    var titleMap = {
      invoices: 'Facturas',
      scan: 'Escanear',
      report: 'Informes',
      profile: 'Perfil'
    };
    var headerTitle = document.getElementById('headerTitle');
    if (headerTitle && titleMap[route]) {
      headerTitle.textContent = titleMap[route];
    }

    // Show back button only on invoice detail / edit
    var backBtn = document.getElementById('headerBackBtn');
    if (backBtn) {
      if (route === 'invoices' && params.id) {
        backBtn.style.display = 'flex';
      } else {
        backBtn.style.display = 'none';
      }
    }

    // Store current state
    this.currentRoute = route;
    this.currentParams = params;

    // Show the target page
    var pageId = 'page-' + route;
    var pageEl = document.getElementById(pageId);
    if (pageEl) {
      pageEl.classList.add('active');
    } else {
      // Fallback to invoices
      var fallback = document.getElementById('page-invoices');
      if (fallback) fallback.classList.add('active');
    }

    // Call page render & set current page ref
    switch (route) {
      case 'login':
        pageLogin.render();
        this.currentPage = pageLogin;
        break;
      case 'invoices':
        pageInvoices.render(params);
        this.currentPage = pageInvoices;
        break;
      case 'scan':
        pageScan.render();
        this.currentPage = pageScan;
        break;
      case 'report':
        pageReport.render();
        this.currentPage = pageReport;
        break;
      case 'profile':
        pageProfile.render();
        this.currentPage = pageProfile;
        break;
    }

    // Update tab bar active state
    var tabs = document.querySelectorAll('.tab-item');
    for (var j = 0; j < tabs.length; j++) {
      var tabRoute = tabs[j].getAttribute('data-route');
      if (tabRoute === route) {
        tabs[j].classList.add('active');
      } else {
        tabs[j].classList.remove('active');
      }
    }
  }
};

/* ---- Tab bar click handling ---- */
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('tab-bar').addEventListener('click', function (e) {
    var tab = e.target.closest('.tab-item');
    if (!tab) return;
    var route = tab.getAttribute('data-route');
    if (route) {
      // Always navigate to clear params (e.g. detail -> list)
      Router.navigate(route);
    }
  });

  // Header back button
  document.getElementById('headerBackBtn').addEventListener('click', function () {
    Router.navigate('invoices');
  });
});
