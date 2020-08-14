/*! modernizr 3.6.0 (Custom Build) | MIT *
 * https://modernizr.com/download/?-webpalpha-setclasses !*/
!(function(n, e, o) {
  function t(n) {
    let e = u.className,
      o = Modernizr._config.classPrefix || '';
    if ((A && (e = e.baseVal), Modernizr._config.enableJSClass)) {
      const t = new RegExp('(^|\\s)' + o + 'no-js(\\s|$)');
      e = e.replace(t, '$1' + o + 'js$2');
    }
    Modernizr._config.enableClasses &&
      ((e += ' ' + o + n.join(' ' + o)),
      A ? (u.className.baseVal = e) : (u.className = e));
  }
  function s(n, e) {
    return typeof n === e;
  }
  function a() {
    let n, e, o, t, a, i, f;
    for (const c in l)
      if (l.hasOwnProperty(c)) {
        if (
          ((n = []),
          (e = l[c]),
          e.name &&
            (n.push(e.name.toLowerCase()),
            e.options && e.options.aliases && e.options.aliases.length))
        )
          for (o = 0; o < e.options.aliases.length; o++)
            n.push(e.options.aliases[o].toLowerCase());
        for (t = s(e.fn, 'function') ? e.fn() : e.fn, a = 0; a < n.length; a++)
          (i = n[a]),
            (f = i.split('.')),
            f.length === 1
              ? (Modernizr[f[0]] = t)
              : (!Modernizr[f[0]] ||
                  Modernizr[f[0]] instanceof Boolean ||
                  (Modernizr[f[0]] = new Boolean(Modernizr[f[0]])),
                (Modernizr[f[0]][f[1]] = t)),
            r.push((t ? '' : 'no-') + f.join('-'));
      }
  }
  function i(n, e) {
    if (typeof n === 'object') for (const o in n) c(n, o) && i(o, n[o]);
    else {
      n = n.toLowerCase();
      let s = n.split('.'),
        a = Modernizr[s[0]];
      if ((s.length == 2 && (a = a[s[1]]), typeof a !== 'undefined'))
        return Modernizr;
      (e = typeof e === 'function' ? e() : e),
        s.length == 1
          ? (Modernizr[s[0]] = e)
          : (!Modernizr[s[0]] ||
              Modernizr[s[0]] instanceof Boolean ||
              (Modernizr[s[0]] = new Boolean(Modernizr[s[0]])),
            (Modernizr[s[0]][s[1]] = e)),
        t([(e && e != 0 ? '' : 'no-') + s.join('-')]),
        Modernizr._trigger(n, e);
    }
    return Modernizr;
  }
  var r = [],
    l = [],
    f = {
      _version: '3.6.0',
      _config: {
        classPrefix: '',
        enableClasses: !0,
        enableJSClass: !0,
        usePrefixes: !0,
      },
      _q: [],
      on: function(n, e) {
        const o = this;
        setTimeout(function() {
          e(o[n]);
        }, 0);
      },
      addTest: function(n, e, o) {
        l.push({ name: n, fn: e, options: o });
      },
      addAsyncTest: function(n) {
        l.push({ name: null, fn: n });
      },
    },
    Modernizr = function() {};
  (Modernizr.prototype = f), (Modernizr = new Modernizr());
  var c,
    u = e.documentElement,
    A = u.nodeName.toLowerCase() === 'svg';
  !(function() {
    const n = {}.hasOwnProperty;
    c =
      s(n, 'undefined') || s(n.call, 'undefined')
        ? function(n, e) {
            return e in n && s(n.constructor.prototype[e], 'undefined');
          }
        : function(e, o) {
            return n.call(e, o);
          };
  })(),
    (f._l = {}),
    (f.on = function(n, e) {
      this._l[n] || (this._l[n] = []),
        this._l[n].push(e),
        Modernizr.hasOwnProperty(n) &&
          setTimeout(function() {
            Modernizr._trigger(n, Modernizr[n]);
          }, 0);
    }),
    (f._trigger = function(n, e) {
      if (this._l[n]) {
        const o = this._l[n];
        setTimeout(function() {
          let n, t;
          for (n = 0; n < o.length; n++) (t = o[n])(e);
        }, 0),
          delete this._l[n];
      }
    }),
    Modernizr._q.push(function() {
      f.addTest = i;
    }),
    Modernizr.addAsyncTest(function() {
      const n = new Image();
      (n.onerror = function() {
        i('webpalpha', !1, { aliases: ['webp-alpha'] });
      }),
        (n.onload = function() {
          i('webpalpha', n.width == 1, { aliases: ['webp-alpha'] });
        }),
        (n.src =
          'data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQADADQlpAADcAD++/1QAA==');
    }),
    a(),
    t(r),
    delete f.addTest,
    delete f.addAsyncTest;
  for (let p = 0; p < Modernizr._q.length; p++) Modernizr._q[p]();
  n.Modernizr = Modernizr;
})(window, document);
