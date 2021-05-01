"use strict"; Pdq.plugin('admin', {
  route: {
    redirect:'system',
    children:[
      {path: 'system/:view?' },
      {path: 'plugins/:plugin?' },
      {path: 'users/:user?' },
      {path: 'files/:indir?' },
      {path: 'repos/:indir?'},
      {path: 'logout',      component:'pdq-admin-logout',  meta:{visible:false} },
      {path: 'login',       component:'pdq-admin-login',   meta:{visible:false} },
    ]
  },
  
  store: {
    storeOpts: { // These are all just default values.
      saves: [],
      saveall: false,   // Save all "state" when modified.
      stricttype:false,   // All typecheck failures throw an error
      notypecheck:false,  // Disable all typechecking
      noauto:false,   // Do not create any "update_" mutations.
    },
    state: {},
    modules: {
      system: {
        state: {
        },
      },
      plugins: {
        state: {
          s_instRows    :[],
          s_updated    :0,
          s_avail     :[],
          s_show    :'List',
        },
        mutations: {
          //update_s_updated(state, val)   { state.s_updated += val; },
        },
      },
      users: {
        state: {
          s_rows     :[],
          s_updated    :0,
        },
        mutations: {
          //update_s_updated(state, val)   { state.s_updated += val; },
        },
      },
      files: {
        storeOpts: {
           // noauto:false,   // If true, does not auto-create "update_" mutations, computed, watch, etc.
        },
        state: {
          s_rows      :[],
          v_text      :'',
          s_updated     :0,
        },
      },
      repos: {
        state: {
          t_rows     :{rows:[], cnt:0},
          s_updated    :0,
        }
      },
    }
  },
  
  messages: {
    plugins: {
      List_rsp:function List_rsp(_msg, rows) {
        this.$pdqCommit('plugins/update_s_instRows', rows);
      },
      Remove_rsp:function Remove_rsp(_msg,  plugin) {
        this.$pdqSend('List', {}, {subp:'plugins'}); 
        this.$pdqPush('plugins');
        this.$pdqToast( {title:'Plugin Removed', msg: 'Plugin: '+plugin});
      },
      Duplicate:function(_msg,  plugin, plugnew) {
        this.$pdqSend('List', {}, {subp:'plugins'}); 
        this.$pdqPush('plugins');
        this.$pdqToast( {title:'Plugin Duplicate', msg: 'Plugin: '+plugin+' '+plugnew});
      },
      Avail_rsp:function Avail_rsp(_msg, list) {
        var i, n, avail = [], p = list, q = [];
        for (i=0; i<p.length; i++) {
          n = p[i].name;
          if (Pdq.Plugins[n]) {
            Pdq.Plugins[n].latestver = p[i].version;
            continue;
          } else if (Pdq.plugConf[n] && !Pdq.plugConf[n].enabled)
            continue;
          q.push(p[i]);
          p[i].rowid = q.length;
        }
        this.$pdqCommit('plugins/update_s_avail', q);
        //this.$pdqPush('plugins/@');
        //this.$pdqCommit('plugins/update_s_show', 'Avail');
      },
      Install_rsp:function Install_rsp(_msg, done, name) {
        this.$pdqPush('plugins');
        this.$pdqToast({title:'Plugin Install '+(done?'Complete':'Failed'), msg: 'Plugin: '+name});
      },
    },
    system: {
      ProjName_rsp:function ProjName_rsp(_msg, info) {
        this.$store.commit('update_v_t_project', info.project);
      },
      Upgrade_rsp:function Upgrade_rsp(_msg, done, msg) {
        var req = {title:'PDQ Upgrade '+(done?'Complete':'Failed'), msg:msg};
        if (done) {
          req.autoHideDelay = 30000;
          req.variant = 'warning';
        } else {
          req.noAutoHide=true;
          req.variant = 'danger';
        }
        this.$pdqToast(req);
            
      },
      pluginVerinfo_rsp:function pluginVerinfo_rsp(msg) {
      },
      
      pdqVerinfo_rsp:function pdqVerinfo_rsp(msg) {
        var iv = msg.data.verinfo;
        this.$store.commit('update_s_t_verInfo', iv);
      },
      
    },
    users: {
      Update_rsp:function Update_rsp(_msg, info) {
        this.$pdqCommit('users/update_s_updated', this.epoch++);
        this.$pdqSend('List', {}, {subp:'users'});
        this.$pdqPush('users');
      },
      
      Delete_rsp:function Delete_rsp(_msg, info) {
        this.$pdqCommit('users/update_s_updated', this.epoch++);
        this.$pdqSend('List', {}, {subp:'users'});
        this.$pdqPush('users');
      },
      
      List_rsp:function List_rsp(_msg, rows) {
        this.$pdqCommit('users/update_s_rows', rows);
      },
    },
    files: {
      Load_rsp:function Load_rsp(_msg, fileData, name) {
        this.$pdqCommit('files/update_v_text', fileData);
      },
    
      Save_rsp:function Save_rsp(_msg, cnt, msg, name) {
        if (cnt>=0)
          this.$pdqCommit('files/update_s_updated', this.epoch++);
      },
      Dir_rsp:function Dir_rsp(_msg, rows) {
        for (var i = 0; i<rows.length; i++)
          rows[i].rowid = i;
        this.$pdqCommit('files/update_s_rows', rows);
      },
      Dira_rsp:function Dira_rsp(_msg, cnt, rows) {
        for (var i = 0; i<rows.length; i++)
          rows[i].rowid = i;
        this.$pdqCommit('files/update_s_rows', rows);
      },
    },
    repos: {
      Files_rsp:function Files_rsp(_msg) {
        this.$pdqCommit('repos/update_t_rows', _msg.data);
      },
    },
  },
  /*popts: {
    //include:['admin.css'],
    //css:'admin.css',
  },*/
  
});



