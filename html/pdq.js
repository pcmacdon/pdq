// Pdq.js: Plugins with Vue/Vuex/Bootstrap-Vue.
"use strict";

(function() {
  Vue.use(Vuex);
  Vue.component("prism-editor", VuePrismEditor);
  Vue.use(VueMarkdownPdq);
  
  function dputs() {}
  //var dputs = console.log.bind(null);
  
  var Pdq = {
    Plugins:{},
    plugConf:{}, // TODO: merge with pluginConf?
    Login:{username:'', password:'', frompath:'', LoginFill:0,},
    Mmenuisopen:true,
    Mmenushowbut:true,
    isBusy:false,
    inOptsLoad:false,
    noBreak:false,
    addBreak:true,
    showToc:true,
    epoch:0,
    incLst:[],
    toid: { StartWebSock:0 }, // setTimeout ids.
    Log:Log,
    compCur:null,
    wsonline:false,
    subcomps:{},
    pdqRoutes:[],
    pdqRouteList:[],
  };
  
  Pdq.pluginConfDef = {
    status:{project:''},
    confattrs:{histmode:false, home:'/admin', noBreak:false }, plugins:[],
    builtins:[{"name":"admin", enabled:true}]
  };
  Pdq.pluginConf = JSON.parse(JSON.stringify(Pdq.pluginConfDef));
  
  // Define a plugin.
  Pdq.plugin =
  Pdq.Plugin = function(mod, opts) {
    if (!mod) throw "missing Mod";
    opts.Mod = mod;
    if (!opts.popts) opts.popts = {};
    if (!opts.messages) opts.messages = {};
    $matchObj(opts, '{Mod:string, popts:object, messages:object, route:object, store:object}', true, true, mod+': ')();
    $matchObj(opts.popts, '{css:string,include:array}', true, true, mod+': ')();
    plRegs--;
    if (opts.route) {
      if (!opts.route.path)
        opts.route.path = '/'+mod;
      //if (!opts.route.component)
      //  opts.route.component = null;
    }
    opts.comps = {};
    Plugins[mod] = opts;
    if (plRegs == 0)
      onload();
  };
  
  window.Pdq = Pdq;
  
  Pdq.Plugins.pdq = Pdq;
  Pdq.Plugins.pdq.popts = Pdq;
  var popts = {}, Mod = 'pdq';
  
  var Session = {id:''};
  var pdqStores = {};
  var router, store;
  var metaInsertNames = [ "bottom", "left", "left2", "right", "sidebar", "top", "topmenu" ];
  var ChkArgs = {};
  
  var Store = {
    strict:true,
    namespaced:true,
    storeOpts: {
      saves: ['v_t_rowsPerPage'],
    },
    state: {
      s_t_wsClosed:false,
      s_t_appDir:'',
      v_t_project:'',
      s_t_isAdmin:false,
      s_t_isLocalhost:false,
      s_t_username:'',
      s_t_verInfo:{},
      s_t_isInit:false,
      v_t_home:'',
      s_t_route:{from:'', to:''},
      v_t_rowsPerPage:20,
      s_t_rowsPerPageList:[5, 10, 12, 15, 20, 30, 50, 100, 200, 1000],
      
    },
   /*  mutations: {
       update_s_t_appDir(state, val)    { state.s_t_appDir = val; },
    },*/
    modules: {
      pdq: {
        state: {
          s_toastMsg:null,
        },
        mutations: {
          update_s_toastMsg: function(state, val)    { state.s_toastMsg = val; },
        },
      }
    },
  };
  
  function isArray(s) {
    return (typeof(s) == 'object' && s.constructor === [].constructor);
  }
  
  // Make save-on-change the mutations for "saves" in Store.
  function StoreSaves(plugin, s, chkns, sfx) {
  
    function optSave(plugin, opt, state, val) { //TODO: avoid save if unchanged.
      dputs("SET ", plugin,'.', opt, ' ', val);
      val = JSON.stringify({val:val});
      if (val !== '{}')
        WsSend('optChange', {plugin:plugin, opt:opt, val:val}, {});
    }
  
    function optSet(nam, f, plugin) {
      return (function(s,v) {
        var oldv = s[nam];
        (f)(s,v);
        if (!Pdq.inOptsLoad && oldv !== v)
          optSave(plugin, nam, s, v);
      });
    }
    
    function optInit(nam, plugin, sfx, ms) {//TODO: avoid set if unchanged.
      return (function(s,v) {
        var keypre = nam.substr(0,2);
        if (keypre !== 'u_' && !ms.notypecheck && s[nam] !== null) { // Typecheck before assign.
          var tom, emsg, ov = s[nam], to = $jsi.gettype(ov), tn = $jsi.gettype(v), pnk = plugin+sfx+'.'+nam;
          /*if ((to === null && tn === 'object') || (tn === null && to === 'object')) {
          } */
          if (to !== tn)
            emsg ='Type mismatch for ' + pnk + ': "'+v+'" is a '+tn+ ' not a ' + to;
          else if (to === 'object' && (keypre === 't_' || keypre === 'v_' || keypre === 'r_')) {
            if (to !== tn)
              throw('Object ' + emsg);
            var ko = Object.keys(ov).sort().join(','), kn = Object.keys(v).sort().join(',');
            if (ko != kn)
              throw('Object key mismatch in '+pnk+': expected '+ko+', got '+kn);
            if (!ms.matchObj) ms.matchObj = {};
            else tom = ms.matchObj[pnk];
            if (!tom)
              tom = ms.matchObj[pnk] = $jsi.matchObj(ov);
            $matchObj(v, tom, false, false, ' in '+pnk+': ')();
          }
          if (emsg)
            if (ms.stricttype) throw(emsg); else console.warn(emsg);
  
        }
        s[nam] = v;
      });
    }
  
    if (!sfx) sfx = '';
    if (!s) throw('missing store for: '+plugin);
    var ms = s.storeOpts, m = s.mutations, saves, saveall, noauto;
    if (s.namespaced === undefined)
      s.namespaced = true;
    if (s.state === undefined)
      s.state = {};
    var nam, t = s.state;
    if (!m) m = (s.mutations = {});
    if (!s.state && !s.modules) throw('Store: must have state or modules');
    if (ms) {
      var mk = ['saves', 'saveall', 'noauto', 'notypecheck', 'stricttype'];
      for (var km in ms) {
        var mki = mk.indexOf(km);
        if (mki<0) console.warn('ignored unknown storeOpts option "'+km+'" not in:', mk.join(', '));
        else if (mki > 0 && typeof(ms[km]) != 'boolean')
          throw('storeOpts: expected boolean for '+km);
      }
      if (ms.saveall) {
        if (ms.saves)
          throw('storeOpts: used both "saveall" and "saves"');
        if (!ms.state)
          throw('storeOpts: "saveall" requires "state"');
        ms.saves = Object.keys(ms.state);
      }
    } else {
      ms = s.storeOpts = {};
    }
    if (ms.saves) { // Sets up save on change.
      if (!s.state) throw('storeOpts: "saves" requires state');
      if (!chkns && !s.namespaced && sfx=='') throw('storeOpts: must have namespaced=true');
      if (!isArray(ms.saves))
        throw("storeOpts: saves is not an array");
      //delete s.saves;
      var k = Object.keys(t);
    
      for (var nami in ms.saves) {
        nam = ms.saves[nami];
        if (t[nam] === undefined) throw('storeOpts: saves has no state data: '+nam);
        if (nam.substr(0,2) === 'r_') throw('storeOpts: saves not allowed for readonly state data: '+nam);
        var ind = 'update_'+nam;
        if (m[ind] === undefined)
          m[ind] = optInit(nam, plugin, sfx, ms);
        else if (typeof(m[ind]) !== 'function')
          throw('storeOpts: save missing mutation function: '+ind);
        var f = m[ind];
        m[ind] = optSet(nam, f, plugin+sfx);
      }
    }
    if (!ms.noauto) {
      for (nam in t) {
        var ukey = 'update_'+nam, pfx = nam.substr(0,2);
        if (!m[ukey] && (pfx !== 'r_' || pfx !== 'x_'))
          m[ukey] = optInit(nam, plugin, sfx, ms);
      }
    }
    if (s.modules)
      for (nam in s.modules)
        StoreSaves(plugin, s.modules[nam], 0, sfx+'/'+nam);
  }
  
  function optsLoad(m) {
    // Commit saved options.
    var cpath = router.currentRoute.path;
    Pdq.inOptsLoad = true;
    for (var i = 0; i<m.opts.length; i++) {
      var n = m.opts[i];
      var jval = JSON.parse(n.val);
      var cmd = 'update_'+n.opt;
      if (n.plugin != '')
        cmd = n.plugin+'/'+cmd;
      store.commit(cmd, jval.val);
    }
    Pdq.inOptsLoad = false;
  }
  
  Pdq.updateTitle = function(path) {
    if (!path)
      path = router.currentRoute.path;
    var pre = store.state.v_t_project, spath = path.substr(1,path.length-1);
    document.title = spath+':'+pre+' PDQ';
  };
  
  function wsSend(mod, cmd, data, opts)  {
    if (arguments.length != 4)
      console.warn("wrong # of args to wsSend");
    if (!opts)
      opts = {};
    if (!data)
      data = {};
    ($jsig("mod:string, cmd:string, data:object=void, opts:object=void", arguments ))();
    if (!Pdq.wsonline) {
      setTimeout(function () {
        wsSend(mod, cmd, data, opts);
      }, 100);
      return;
    }
    var dat = { mod:mod, cmd:cmd, data:data, opts:opts };
    var sdata = JSON.stringify(dat);
    Log.trace("SENDING: "+sdata);
    Pdq.ws.send(sdata);
  }
  
  var WsSend = wsSend.bind(null, Mod);
  Pdq.$pdqSend = WsSend;
  
  function getExtn(s) {
    var ei = s.lastIndexOf('.');
    if (ei>=0)
      return s.substr(ei);
  }
  
  function loadFile(mod, scr) {
    if (getExtn(scr) == '.css')
      return DoCss(mod, scr);
    var head = document.head || document.getElementsByTagName('head')[0];
    var s = document.createElement('script');
    s.setAttribute('src', scr);
    head.appendChild(s);
  }
  
  function startup() {
    WsConnClose(false);
    Pdq.wsonline = true;
    var pi, r = {browser:navigator.userAgent, session:Session.id};
    var hash = document.location.hash;
    if (hash.substr(0,2) === '#/')
      pi = hash.split('/')[1];
    else
      pi = 'admin';
    r.plugin = pi;
    WsSend('init', r, {});
  }
  
  function objValues(d) {
    var res = [], ok = Object.keys(d).sort();
    for (var i in ok)
      res.push(d[ok[i]]);
    return res;
  }
  
  function getParamNames(func) {
    var ARGUMENT_NAMES = /([^\s,]+)/g;
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    //var STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if(result === null)
     result = [];
    return result;
  }
  
  function argCheckCall(mscmd, msargs, mcstr, _msg) {
  
    var keys = Object.keys(_msg.data).sort();
    if (msargs.length != mscmd.length) {
      console.warn(mcstr, ' function expects ',mscmd.length,' arguments but gets passed ', msargs.length, ': eg. ', ['_msg'].concat(keys));
      return;
    }
    if (!ChkArgs[mcstr]) {
      var args = ChkArgs[mcstr] = getParamNames(mscmd),
        keyss = keys.join(','), argss = args.slice(1).join(',');
      if (keyss != argss)
        console.warn(mcstr, ' function args "'+args[0]+','+argss+'" do not match msg keys "'+args[0]+','+keyss+'"');
        
    }
  }
  
  function wsRecv(obj) { 
    Pdq.inOptsLoad = false;
    Log.trace("RECV: "+obj.data);
    var msg=JSON.parse(obj.data);
    $matchObj(msg, '{cmd:string, data:object, mod:string, opts:object}')();
    var mod=msg.mod, cmd=msg.cmd, opts = (msg.opts?msg.opts:{}), subp = opts.subp;
    Pdq.msg = msg;
    if (mod === '!') {
      switch (cmd) {
        case 'reload': dputs('reload request'); location.reload(); return;
        default: console.warn('unknown cmd',cmd);
      }
      return;
    }
    if (mod === '*') {
      dputs('TODO: broadcast');
      return;
    }
    var plugin = Pdq.Plugins[mod];
    if (!plugin) {
      dputs('Unknown plugin "'+cmd+' '+obj.data+'"');
      return;
    }
    var Modi = plugin.messages, mscmd, mcstr=mod;
    if (subp) mcstr+='/'+subp;
    mcstr+='.'+cmd;
    if (Modi && ((subp && Modi[subp] && (mscmd=Modi[subp][cmd]))
      || (mscmd=Modi[cmd]))) {
      var msargs = [msg].concat(objValues(msg.data));
      if (mscmd.length==1)
        mscmd.apply(plugin.popts, [msg]);
      else {
        argCheckCall(mscmd, msargs, mcstr, msg);
        mscmd.apply(plugin.popts, msargs );
      }
    } else
      console.warn('Unknown web cmd "'+cmd+' '+obj.data+'"');
  }
  
  function WsConnClose(disc) {
    if (store)
      store.commit('update_s_t_wsClosed', disc);
    if (Pdq.shadeDisc) {
      if (disc)
        $('body')[0].classList.add('pdq-shade');
      else
        $('body')[0].classList.remove('pdq-shade');
      return 1;
    }
    var id = $('#apperr')[0];
    if (disc)
      id.innerHTML = '<b>Disconnected from Jsish-Websocket:</b> <button onclick="Pdq.StartWebSock()">Reconnect</button>';
    else
      id.innerHTML = '';
  }
  
  function DoExit(m) {
    Pdq.wsonline = false;
    dputs('connection closed');
    if (WsConnClose(true)) {
      clearTimeout(Pdq.toid.StartWebSock);
      Pdq.toid.StartWebSock = setTimeout(StartWebSock, 5000);
    }
  }
  
  function wsClose() {
    DoExit({rc:-2});
  }
  
  function pluginIndex(plugin, lst) {
    for (var i in lst)
      if (plugin == lst[i].name) return i;
  }
  
  function ipluginIndex(plugin) {
    var lst = Pdq.pluginConf.plugins;
    for (var i in lst)
      if (plugin == lst[i].name) return lst[i];
  }
  
  function PlugPath(plugin) {
    return Pdq.baseroot+(ipluginIndex(plugin) ? 'plugins' : 'builtins')+'/'+plugin;
  }
  
  function CompUrl(name, fpart) {
    var plst = name.split('/'), plugin = plst[1];
    var pi = Plugins[plugin];
    if (!pi)
      return '';
    if (typeof(fpart) !== 'string')
      fpart = name.substr(1).replace(/[\/]/g,'-')+'-Vue.js';
     return PlugPath(plugin)+'/html/'+fpart;
  }
  
  // Dynamic import VUE component and setup Vuex state mappings.
  function ImportMap(name, fpart) {
    
    function isvuecomp() { // Return true if components are .vue instead of .vue.js
      if (!window.jsiWebSocket) return false;
      var vc = Pdq.plugConf[plugin].vuecomps;
      if (!vc) return false;
      if (vc == '*') return true;
      vc = vc.split(',');
      return (vc && vc.indexOf(subp)>=0);
    }
    
    var plst = name.split('/'), plugin = plst[1], subp = plst[2];
    var path;
    if (name=='pdq') {
      path = 'html/pdq.vue.js';
      plugin = 'pdq';
    } else {
      var pi = Plugins[plugin];
      var fext = (isvuecomp()?'.vue':'.vue.js');
      if (!pi)
        return console.warn('not plugin', name);
      if (typeof(fpart) !== 'string')
        fpart = name.substr(1).replace(/[\/]/g,'-')+fext;
      else if (fpart.indexOf('.')<0)
        fpart += fext;
    
      path = PlugPath(plugin)+'/html/'+fpart;
    }
    if (!subp) subp = '';
    return Import(path, plugin, subp, name);
  }
  
  function pdqCommit(str, val) {
    var vstr = this.$pdqPlug.pname+'/'+str;
    this.$store.commit(vstr, val);
  }
  
  function pdqPush(str) {
    var vstr = '/'+this.$pdqPlug.pname+'/'+str;
    this.$router.push(vstr);
  }
  
  // Return function to import plugin via ajax, call MapSetup, then resolve.
  function Import(path, plugin, subp, name) {
    var fpre = plugin+'/'+subp,
      cpn = 'plug-'+(plugin+'-'+subp).toLowerCase();
    return function (resolve, reject) {
      Pdq.inc(path,
        function() {
          dputs("PLUG", plugin, "SUBM", subp);
          if (plugin == 'pdq') {
            cc = Pdq.pdqcomp;
            cpn = 'pdq-frame';
            resolve(Vue.component(cpn.toLowerCase(), cc));
            return;
          }
          var ci = Plugins[plugin].comps[subp], cc = ci.comp, cs = ci.subs;
          if (!cc)
            reject('failed load: '+plugin+'.'+subp);
          else {
            
            function fnSetup(cc, insub) {
              var ccc = cc.computed;
              ccc.$pdqPlug = function() { return {fpath:path, pname:plugin, sname:subp, cname:cpn, route:fpre, plugin:Plugins[plugin], plugsub:ci}; };
              //ccc.$pdqPlugin = function() { return fpre; };
              ccc.$pdqSend = function() { return ci.$pdqSend; };
              if (Pdq.addBreak && typeof(cc.template) == 'string' && cc.methods /*&& subp*/) {
                if (!cc.methods.$pdqBreak) {
                  if (insub) return;
                  console.warn(fpre+': missing $pdqBreak');
                }
                cc.template = '<div class="pdqplugframe" v-on:click.alt.ctrl.stop="$pdqBreakCall">'+cc.template+'</div>';
              }
            }
            
            var keysn = MapSetup(name, cc);
            if (cs) {
              for (var csi in cs) {
                StoreMap(cs[csi], keysn[1], name, keysn[0], true);
                fnSetup(cs[csi], true);
                //MapSetup(name, cs[csi]);
                //puts("IMPORT VUE COMP SUB", csi, name);
                Vue.component(csi, cs[csi]);
                if (Pdq.subcomps[csi])
                  console.warn('duplicate subcomponent:',csi);
                Pdq.subcomps[csi] = cs[csi];
              }
            }
            fnSetup(cc, false);
            var ccx = cc; // Vue.extend({mixins:[cc]}); // TODO: extend mixins from parent???
            if (ci.css)
              DoCss(plugin, ci.css);
            if (!ci.include || !isArray(ci.include) || !ci.include.length) {
              resolve(Vue.component(cpn, ccx));
              return;
            }
  
            var i, incs = ci.include, inclen = incs.length;
            for (i in incs) {
              var inc = incs[i];
              if (getExtn(inc) !== '.js') {
                console.warn('ignoring include in component that is not a .js file: '+inc);
                if (--inclen<=0) {
                  resolve(Vue.component(cpn, ccx));
                  break;
                }
              }
              if (Pdq.incLst.indexOf(inc)>=0) {
                if (--inclen<=0) {
                    resolve(Vue.component(cpn, ccx));
                    break;
                  }
              } else {
                Pdq.incLst.push(inc);
                Pdq.inc(inc, function() {
                  if (--inclen<=0)
                    resolve(Vue.component(cpn, ccx));
                });
              }
            }
          }
        });
    };
  }
  
  function Component(inpath, comp, subc) {
    // Define a plugin component/subcomponent.
    var path = inpath;
    if (subc) {
      path = Pdq.compCur;
      if (inpath[0]=='-')
        inpath = path+inpath;
    } else
      Pdq.compCur = inpath;
    var pe = path.lastIndexOf('/');
    if (pe>=0)
      path = path.substr(pe+1);
    pe = path.indexOf('.');
    if (pe>=0)
      path = path.substr(0, pe);
    var m = path.split('-');
    var mod = m[0];
    if (!m[1]) m[1] = '';
    var subp = m.slice(1).join('/');
    
    if (mod == 'pdq') {
      if (subc) {
        Vue.component(inpath, comp);
        return;
        //throw 'pdq subcomponent unsupported';
      }
      Pdq.pdqcomp = comp;
    } else {
      var popts = comp.popts;
      if (!popts) {
        comp.popts = popts = {};
      } else {
        if (subc)
          console.warn('popts in subcomponent');
        else
          $matchObj(popts, '{css:string, include:array}', true, true, path+': ')();  
      }
      var sopts, plug = Plugins[mod];
      if (subc) {
        sopts = plug.comps[subp];
        sopts.subs[inpath] = comp;
        //puts('SUBCOMPONENT insert:', subp, inpath);
      } else {
        sopts = {
          comp:comp, include:popts.include, css:popts.css, subs:{},
          $pdqSend:function(cmd, msg) {
            return plug.popts.$pdqSend(cmd, (msg?msg:{}), {subp:subp});
          }
        };
        plug.comps[subp] = sopts;
      }
    }
  }
  
  Pdq.component = function(path, comp) { return Component(path, comp, false);};
  
  Pdq.subcomponent = function(path, comp) { return Component(path, comp, true);};
  
  var compMembers = ['template', 'name', 'popts',
    'data', 'props', 'propsData', 'computed', 'methods', 'watch', 'el', 
    'beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated',
    'activated', 'deactivated', 'beforeDestroy', 'destroyed', 'errorCaptured',
    'beforeRouteEnter',  'beforeRouteUpdate', 'beforeRouteLeave' ];
    
  function checkComponent(fpre, cc) {
    for (var i in cc) {
      if (compMembers.indexOf(i)<0)
        console.warn(fpre+' unknown member in component: ', i);
    }
  }
  
  // After a component is loaded, find in pdqRouteList then call StoreMap.
  function MapSetup(fpre, cc) {
    checkComponent(fpre, cc);
    var plst = fpre.split('/'), plugname=plst[1], subp = plst[2];
    var n = null, m = Pdq.pdqRouteList, pre='/';
    for (var i = 1; i<plst.length; i++) {
      var rnam = pre + plst[i];
      for (var j = 0; j<m.length; j++) {
        if (m[j].name == fpre) {
          n = m[j];
          break;
        }
        if (m[j].path==rnam || m[j].path.split('/')[0]==rnam) {
          if (i==plst.length-1)
            n = m[j];
          else
            m = m[j].children;
          break;
        }
      }
      pre = '';
    }
      
    if (!n)
      return console.warn('component/children not found', fpre);
    var keys = n.meta.keys;
    StoreMap(cc, n, fpre, keys, true);
    return [keys, n];
  }
  Pdq.MapSetup = MapSetup;
  
  // Add Store mapState and mapMutations for given route
  function StoreMap(cc, n, fpre, keys, apply) {
      /* Store name prefixes are:
       *  r_ : readonly, object-typed
       *  s_ : primitive or simple typed.
       *  t_ : object-typed
       *  u_ : do not type check.
       *  v_ : object-typed, get/set (ie. for v-model)
       *  w_ : primitive, get/set (ie. for v-model)
       *  x_ : no auto-setup of mapState/mapMutation/...
       */
    if (!cc)
      throw 'null cc';
    if (fpre === '/') return;
    var ecmd = console.error;
    if (fpre[0] !== '/' && n.name !== '')
      return ecmd(fpre, 'name missing leading slash', n.path);
    var plst = fpre.split('/'), plugname=plst[1], subp = plst[2];
    if (plst.length > 1) {
      var plugin = Plugins[plugname];
      if (!plugin)
        return ecmd(fpre+': missing plugin');
      var mstore = plugin.store, pmstore;
      var si = 2;
      while (mstore && (subp = plst[si])) {
        pmstore = mstore;
        mstore = mstore.modules[subp];
        si+=2;
      }
      if (!mstore)
        mstore = { state:{}, mutations:{} };
        //return ecmd(fpre+': plugin missing store');
      if (!mstore.state) {
        dputs(fpre, ' added missing store.state');
        mstore.state = {};
      }
      var state = mstore.state, sconf = mstore.storeOpts;
      if (!sconf) sconf = {};
      var mutes = mstore.mutations;
      if (!mutes) mstore.mutations = mutes = {};
      var skeys = Object.keys(state);
      if (!cc.computed)
        cc.computed = {};
      var ccc = cc.computed;
      if (!cc.methods) cc.methods = {};
      for (si in skeys)
        keys.push({key:skeys[si], path:fpre, store:mstore, conf:sconf, subp:cc});
      if (keys.length && !sconf.noauto && apply) {
        var nv, gnv;
        //var cc = n.component;
        if (!cc.computed) cc.computed = {};
        ccc = cc.computed;
        if (!cc.methods) cc.methods = {};
        var mmm = cc.methods;
        for (var kii in keys) {
          var ki = keys[kii];
          var key = ki.key;
          var keypre = key.substr(0,2);
          if (keypre == 'x_') continue;
          var ukey = 'update_'+key;
          var pmutes = ki.store.mutations;
          dputs(fpre, 'path',ki.path, key);
          var isTopkey = (ki.path==='/'), isParent = (ki.path !== fpre);
          var tfpre = (isParent?ki.path:fpre).substr(1);
          if (!isTopkey && isParent && ki.subp) { // Parent.
            var pcc = ki.subp, pccc = pcc.computed, pmmm = pcc.methods;
            
            if (mstore.state[key])
              dputs(fpre, ' warning: overriding parent state', key);
            else if (pccc && pccc[key] && !ccc[key]) {
              ccc[key] = pccc[key];
              if (pmmm && pmmm[ukey] && !mmm[ukey]) {
                mmm[ukey] = pmmm[ukey];
                dputs(fpre, ' inheriting parent state/mutate key', key);
                continue;
              }
            }
          }
          
          if (!mmm[ukey] /*&& pmutes[ukey]*/) {
            if (sconf.noauto)
              dputs(fpre,' ignoring mutation: ',ukey);
            else {
              if (isTopkey) {
                nv = Vuex.mapMutations([ukey]);
                gnv = Vuex.mapState([key]);
              } else {
                nv = Vuex.mapMutations(tfpre,[ukey]);
                gnv = Vuex.mapState(tfpre,[key]);
              }
              if (keypre == 'v_' || keypre == 'w_') {
                ccc[key] = { 
                  get: gnv[key],
                  set: nv[ukey],
                };
                dputs(fpre,' added get/set computed: ',key);
                continue;
              }
              ccc[key] = gnv[key];
              if (keypre !== 'r_')
                mmm[ukey] = nv[ukey];
              dputs(fpre,' added mutation: ',ukey);
            }
          }
          if (!ccc[key]) {
            if (sconf.noauto)
              dputs(fpre,' missing computed: ',key);
            else if (isTopkey) {
              dputs(fpre,' adding top computed: ',key);
              nv = Vuex.mapState([key]);
              ccc[key] = nv[key];
            } else {
              nv = Vuex.mapState(tfpre,[key]);
              ccc[key] = nv[key];
              dputs(fpre,' adding computed: ',key);
            }
          }
        }
      }
    }
  }
  
  /* 
   * Traverse route adding state keys and mapState to each module.
   * Also validate checking for undefineds, missing store/component, etc.
   */
  function routeMapper(val, lev, ecmd, pkeys, pcomp) {
    if (!ecmd)
      ecmd = console.error;
    var fpath = (pcomp?pcomp.name:'/');
      
    if (!Array.isArray(val)) return ecmd(fpath+': expected an array');
    if (!pkeys || !pkeys.length) {
      pkeys = [];
      var Tkeys = Object.keys(Store.state);
      for (var t in Tkeys) {
        pkeys.push({key:Tkeys[t], path:'/', subp:null, store:Store});
      }
    }
    for (var nnv in val) {
      var n = val[nnv];
      var keys = pkeys.slice(0);
      if (n === undefined)
        return ecmd(fpath+': undefined val ');
      if (n.path === undefined)
        return ecmd(fpath+': undefined path: ');
      if (n.name === undefined)
        return ecmd(fpath+': undefined name: ');
      if (n.path === '*') continue;
      
      if (!n.meta)
        n.meta = {};
      var fpre = n.name, cc = n.component, cct = typeof(cc), meta = n.meta;
      if (n.redirect && n.redirect[0] != '/')
        n.redirect = fpre + '/' + n.redirect;
      meta.url = CompUrl(n.name, cc);
      if (cc === null) {
        var cpn = 'plug'+n.name.replace('/', '-').toLowerCase();
        cc = n.component = Vue.component(cpn, {template:'<router-view />'});
      } else if (n.component === undefined || cc === true)
        cc = n.component = ImportMap(n.name, cc);
      else if (cct === 'string') {
        if (cc.indexOf('.')>=0)
          cc = n.component = ImportMap(n.name, cc);
        else
          cc = n.component = {template:'<'+cc+' />'};
      } else if (fpath != '/' && cct != 'object' && cct != 'function')
        return ecmd(fpre+': component must be in [undefined, null, string, object, function]: ', n.path);
      var apply = (fpre !== '/' && cc && typeof(cc) !== 'function');
      var cpath = n.name.substr(1);
      if (cc)
        StoreMap(cc, n, fpre, keys, apply);
      if (!apply)
        meta.keys = keys.slice(0);
      if (!meta.data)
        return ecmd(fpre+': missing meta.data = Pdq: ');
      
      if (meta.insert) { // TODO: allow disabling PDQ sidemenu, etc.
        var ms = meta.insert, tns = [];
        for (var tsi in ms) {
          if (ms[tsi][0]=='-') {
            ms[tsi] = cpath+ms[tsi];
          }
          //puts('SUBCOMP ROUTE:', ms[tsi]);
          if (metaInsertNames.indexOf(tsi)<0)
            tns.push(tsi);
        }
        if (tns.length)
            console.warn(fpre+': insert "'+tns.join(',')+'" not in: "'+metaInsertNames.join(',')+'"');
      }
      if (n.children)
        routeMapper(n.children, lev+1, ecmd, keys, n);
    }
  }
  
  // Sanity-check messages to ensure func-args are sorted.
  function pluginCheckMsgs(m, nam, isi, lev, subp, ecmd) {
    if (!ecmd)
      ecmd = console.error;
    var pm = 'Msg'+(isi?'i':'s');
    var pref = pm+' '+nam+subp;
    if (typeof(m) !== 'object') return ecmd(pref+'is not an object');
    var inf, ist, al;
    for (var j in m) {
      var i = m[j];
      switch (typeof(i)) {
        case 'object': pluginCheckMsgs(i,nam,isi,lev+1,'.'+j,ecmd); break;
        case 'function':
          if (!isi) continue;
          al = getParamNames(i);
          if (!al || al.length<1) return ecmd(pref+' function needs 1+ args: '+j);
          ist = al.slice(1);
          var istu = ist.join(',');
          var ists = ist.sort().join(',');
          if (istu !== ists)
            return ecmd(pref+'>'+j+' function params after "'+al[0]+'" are not sorted: '+istu);
          break;
        default: 
          return ecmd(pref+'>'+j+' type is not a function or object: ');
      }
    }
  }
  
  // Move component.store to Store, set meta.data and set name using path.
  function routeStores(mod, r, s, Pdq, pfx, lvl) {
    var subp = r.component;
    if (!lvl) {
      if (pfx==='')
        pfx = r.path;
      if (r.path !== '/'+mod)
        return console.error('path "',r.path,'" must be "/',mod,'"');
    }
    if (subp && typeof(subp) === 'object' && subp.store) {
      if (Object.keys(s).length !== 0)
        return console.error(mod, " found component.store and non-empty store");
      s = subp.store;
      delete subp.store;
    }
    if (!r.name)
      r.name = pfx;
    if (!r.meta)
      r.meta = {data:Pdq};
    if (!r.meta.data)
      r.meta.data = Pdq;
    if (!r.children) return s;
    if (!s.modules) s.modules = {};
    var sm = s.modules;
    for (var nnc in r.children) {
      var n = r.children[nnc];
      var lst = n.path.split('/'),
        sub = lst[0];
      sm[sub] = routeStores(mod, n, sm[sub]?sm[sub]:{}, Pdq, pfx+'/'+sub, lvl+1);
    }
    return s;
  }

  
  function WebsockOpen() {
    //WsConnClose(false);
    //if (!Pdq.wsonline)
      startup();
  }

  Pdq.StartWebSock = function StartWebSock() {
    var url = document.URL.replace(/^http/,'ws').split('#')[0];
    var ws = Pdq.ws = new WebSocket(url, "ws");
    ws.onmessage = wsRecv;
    ws.onclose = wsClose;
    ws.onopen = WebsockOpen;
  };
  
  function DoCss(mod, css) {
    if (css.indexOf('{')>=0)
      $jsi.css(css);
    else
      $jsi.css(PlugPath(mod)+'/html/'+css);
  }
  
  function onload()
  {
    if (Pdq.loaded) {
      console.warn("ALREADY LOADED");
      return;
    }
    Pdq.loaded=1;
  
    var isfossil = $jsi.isfossil();
    var sess = $jsi.getCookie('sessionJsi'), iflags = 0, uflags = 0;
    if (sess && !isfossil) {
      var ssp = sess.split('.');
      iflags = parseInt(ssp[1]);
      uflags = parseInt(ssp[2]);
    }
    
    var host = location.host;
    //var histmode = (host != '127.0.0.1' && ((iflags&1) || location.port<=500 || location.protocol=='https'));
    
    Pdq.body = $('body')[0];
    if (Session.id == '')
      Session.id = sess;
  
    StoreSaves('', Store, 0);
    var n, m, pm, pi, hide;
    for (m in piAll) {
      pm = piAll[m];
      hide = pm.hide;
      n = pm.name;
      pi = Plugins[n];
      if (!pi) continue;
      //$matchObj(pi, '{Css:string, Mod:string, messages:object, route:object, store:object, Scripts:array, Version:number, comps:object, popts:object}', true, true)();
      if (!pi.Mod || !pi.route || !pi.popts) {
        console.warn("Module must export at least popts/route", pi.popts, pi.route);
        continue;
      }
      function wsSendFn(n) { // WS Send used by Plugin Msg handlers.
        return function(msg,obj,opts) {
          if (!opts) opts = {};
          if (!obj) obj = {};
          wsSend(n, msg, obj, opts);
        };
      }
      pi.popts.$pdqSend = wsSendFn(n);
      pi.popts.$pdqToast = Pdq.toastMsg;
      if (!pi.store)
        pi.store = {};
      pi.store = pdqStores[n] = routeStores(pi.Mod, pi.route, pi.store, pi.popts, '', 0);
      var pr = pi.route;
      if (hide) {
        if (!pr.meta) pr.meta = {};
        pr.meta.visible = false;
      }
      Pdq.pdqRouteList.push(pr);
      Pdq.pdqRoutes.push(pr.name);
      
      if (!pi.messages)
        pi.messages = {};
      pluginCheckMsgs(pi.messages, n, true, 0, '');
  
      Pdq.Plugins[n] = pi;
      var mself = pi.popts;
      if (mself.css)
        DoCss(pi.Mod, mself.css);
      if (mself.include) {
        for (var script in mself.include)
          loadFile(pi.Mod, mself.include[script]);
      }
    }
    
    var punk = Vue.component("pdq-unknown",{template:`<div class="unknown"> <router-view /> <b>PAGE NOT FOUND</b></div>`});
    var redir = Pdq.pluginConf.confattrs.home;
    Store.state.v_t_home = redir;
    var rconf = {
      routes: [{ path:'/', name:'/', redirect:redir, component:ImportMap('pdq'), 
          meta:{visible:true, data:Pdq},
          children:Pdq.pdqRouteList,
        },
        {path: '*', name:'*', component:punk,  meta:{visible:false} }
      ]
    };
    if (Pdq.pluginConf.confattrs.histmode)
      rconf.mode = 'history';
  
    routeMapper(rconf.routes, 0);
    for (n in pdqStores)
      StoreSaves(Plugins[n].Mod, pdqStores[n], 1);
  
    
    store = Pdq.$store = new Vuex.Store(Store);
    router = Pdq.$router = new VueRouter(rconf);
    for (n in Plugins) {
      pi = Plugins[n];
      pi.popts.$store = store;
      pi.popts.$router = router;
      pi.popts.$pdqCommit = pdqCommit;
      pi.popts.$pdqPush = pdqPush;
      pi.popts.$pdqPlug = {fpath:'/'+n, pname:n, sname:null, cname:n, route:'/'+n, plugin:Plugins[n], plugsub:null};
    }
  
    Pdq.routes = router.options.routes;
    Vue.filter('$pdqFileSizeFmt', function (sz) {
      if (sz>=1024*1024*1024)
        return Math.round(sz/(1024*1024*1024))+'T';
      if (sz>=1024*1024)
        return Math.round(sz/(1024*1024))+'M';
      if (sz>=1024)
        return Math.round(sz/1024)+'K';
      if (sz)
        return sz;
    });
    Vue.filter('$pdqToTitle',  function(s) {
        if (s) s = s[0].toUpperCase()+s.substr(1).replace('_',' '); return s;});
   
    for (var mm in pdqStores) {
      store.registerModule(mm, pdqStores[mm]);
    }
  
    Vue.component('app-view', {template: '<router-view />' } );
    Vue.mixin({
      methods: {
        $pdqlog:console.log,
        $pdqwarn:console.warn,
        $pdqerror:console.warn,
        $pdqCommit:pdqCommit,
        $pdqPush:pdqPush,
        $pdqToast:Pdq.toastMsg,
        $pdqToTitle: function $pdqToTitle(s) { if (s) s = s[0].toUpperCase()+s.substr(1); return s;},
        $pdqBreakCall:function $pdqBreakCall(e) { if (!Pdq.noBreak && !Pdq.pluginConf.confattrs.noBreak) this.$pdqBreak(e);},
        $pdqBreak:function $pdqBreak() { console.warn('$pdqBreak: '+ this.$pdqPlug);},
        $pdqInsert:function $pdqInsert(name) {
          if (metaInsertNames.indexOf(name)<0) {
            console.warn('name "'+name+'" not one of: '+metaInsertNames.join(','));
            return;
          }
          var i, s, m = this.$route.matched;
          if (!m)
            return;
          for (i = m.length-1; i>=0; i--) {
            if (m[i].meta && m[i].meta.insert && (s=m[i].meta.insert[name])) {
              if (Pdq.subcomps[s])
                return Pdq.subcomps[s];
              //puts('REQ INSERT', name, s);
              return s;
            }
          }
        },
      },
    });
    Pdq.vm = new Vue({
      store:store,
      router:router,
      data:Pdq
    }).$mount('#app');
    ClearAppErr();
  }
  
  function ClearAppErr() {
    var id = $('#apperr')[0];
    id.addEventListener("click", function() {
      id.innerHTML = '';
    });
  }
  
  Pdq.toastMsg = function(obj) {
    store.commit('pdq/update_s_toastMsg', obj);
  };
  
  var Msgs = {
    init_rsp:function(msg)  {
      var m = msg.data;
      $matchObj(m, '{info:object, interp:object, opts:array, username:string}')();   
      $jsi.conf({interp:m.interp});
        
      var i = m.info;
      if (!i.username || !i.username.length) {
        console.warn("NOT LOGGED IN");
      }
      else {
        $matchObj(i, '{appDir:string,isAdmin:boolean,isLocalhost:boolean,project:string,username:string,verinfo:object}')();   
        var iv = i.verinfo;
        store.commit('update_s_t_username', i.username);
        store.commit('update_s_t_isAdmin', i.isAdmin);
        store.commit('update_s_t_isLocalhost', i.isLocalhost);
        store.commit('update_s_t_appDir', i.appDir);
        store.commit('update_v_t_project', i.project);
        store.commit('update_s_t_verInfo', iv);
        if (m.info.project && m.info.project.length)
          Pdq.updateTitle();
        Pdq.$pdqSend('optsLoad', {username:i.username}, {});
        store.commit('update_s_t_isInit', true);
      }
    },
    
    optsLoad_rsp:function(msg) {
      var m = msg.data;
      // Get all saved options.  For active path values are pushed into data.
      $matchObj(m, '{opts:array}')();
      optsLoad(m);
    },
    
    error:function(msg) {
      var m = msg.data;
      if (!m.variant) m.variant='danger';
      if (!m.title) m.title='ERROR';
      m.noAutoHide = true;
      Pdq.toastMsg(m);
    },
    
    warn:function(msg) {
      var m = msg.data;
      if (!m.title) m.title='WARN';
      if (!m.variant) m.variant='warning';
      Pdq.toastMsg(m);
    },
    
    success:function(msg) {
      var m = msg.data;
      if (!m.title) m.title='SUCCESS';
      Pdq.toastMsg(m);
    },
    exit:function(msg) {
      var m = msg.data;
      DoExit(m);
    },
  };
  Pdq.messages = Msgs;
  
  Pdq.inc = Jsish.inc;
  
  var plRegs = 1;
  var Plugins = {};
  var piAll = null;
  
  function loadPlugins() {
    Pdq.baseroot = "";
    var i, PPIN = [];
    piAll = Pdq.pluginConf.plugins.concat(Pdq.pluginConf.builtins); //TODO: validate no dups
    plRegs = piAll.length;
    for (i in piAll) {
      var n = piAll[i].name, en = piAll[i].enabled;
      if (Pdq.plugConf[n])
        console.warn('duplicate plugin conf', n);
      Pdq.plugConf[n] = piAll[i];
      if (!en) {
        plRegs--;
        continue;
      }
      var ppath = PlugPath(n)+'/html/'+n+'.js';
      dputs("PPP:", ppath);
      Pdq.inc(ppath, null, function() { 
        console.warn("FAIL:"); plRegs--;
      });
    }
    if (window.jsiWebSocket) {
      clearTimeout(Pdq.toid.StartWebSock);
      Pdq.toid.StartWebSock = setTimeout(Pdq.StartWebSock, 10);
    }
  }
  
  Pdq.load = function(ok) {
    if (ok && window.PdqConfigStr) {
      try {
        var lst = JSON.parse(window.PdqConfigStr);
        $matchObj(lst, '{confattrs:object, builtins:array, plugins:array, status:object}')();
        if (lst.builtins && !lst.builtins.find(function(el) { return el.name == 'admin'; }))
          console.warn('missing admin');
        else {
          Pdq.pluginConf = Object.assign(Pdq.pluginConf, lst);
        }
        if (Pdq.addBreak)
          Pdq.addBreak = window.jsiWebSocket;
      } catch(e) {
        console.warn("FAILED: "+e);
      }
    }
    loadPlugins();
  };
  
})();
  
