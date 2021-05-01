"use strict";Pdq.component("admin-plugins",{template:`
  <div>
    <b-card class="mt-2">
      <div v-if="showAvail">
        <b-button><router-link class="text-light" to="plugins" title="go back">&lt; Back</router-link></b-button>
        <h4 v-if="!s_avail.length">No Plugins Available</h4>
        <div v-else>
          <h4>Available Plugins</h4>
          <b-table responsive sticky-header striped hover v-bind:items="s_avail"
              v-bind:fields="getFields" small bordered head-variant="light"
              class="shadow"
              sort-icon-left
              v-bind:foot-clone="s_avail.length>8"
              v-bind:sort-by.sync="sortBy"
              v-bind:sort-desc.sync="sortDesc"
              v-bind:sort-direction="sortDirection"
          >
              <template v-slot:head(rowid)="data"><span></span>
              </template>
              <template v-slot:cell(rowid)="data">
                  <b-button size="sm" variant="outline-primary" v-on:click="GetInstall(data)" title="Click to install">Install</b-button>
              </template>
          </b-table>
        </div>
      </div>
      
      <div v-if="showDup">
        <h4>Duplicate plugin: {{dupNameFrom}}</h4>
        <b-input-group size="lg">
          <b-input-group-prepend>
            <b-button v-bind:disabled="i_builtin || !dupNameTo || !dupNameFrom" v-on:click="DuplicateDo" title="Duplicate plugin">Duplicate</b-button>
          </b-input-group-prepend>
          <b-form-input v-model="dupNameTo" style="max-width:14em"></b-form-input>
        </b-input-group>
      </div>
      
      <div v-if="showInst">
          <h4>Plugins Installed</h4>
          <b-row>
            <b-col>
              <b-button v-on:click="Avail" :disabled="!s_avail.length"
                :title="s_avail.length?'Plugins available to install':'All available plugins already installed'">
                <b-icon icon="plus"></b-icon>
                Add
              </b-button>
              <b-button v-on:click="Refresh" title="Refresh list of available plugins">
                <b-icon icon="arrow-clockwise"></b-icon>
                Refresh
              </b-button>
            </b-col>
          </b-row>
          
          <b-row>
            <h5 v-if="!s_instRows.length">There are no plugins installed yet!</h5>
            <b-table v-else striped hover v-bind:items="s_instRows" v-bind:fields="instFields"
                small bordered head-variant="light" class="shadow mt-2"
                sort-icon-left
                v-bind:foot-clone="s_instRows.length>8"
                v-bind:sort-by.sync="sortBy"
                v-bind:sort-desc.sync="sortDesc"
                v-bind:sort-direction="sortDirection"
            >
               <!-- 
               <template v-slot:head(rowid)="data">
                    <b-form-checkbox  v-model="instCheckedAll" v-on:change="instSelectAll">
                    </b-form-checkbox>
                </template>
                <template v-slot:cell(rowid)="data">
                    <b-form-checkbox  v-model="instCheckedNames" v-bind:value="data.item.rowid" v-bind:id="''+data.item.rowid">
                    </b-form-checkbox>
                </template>
                -->
                <template v-slot:cell(name)="data">
                    <router-link v-bind:to="'plugins/'+data.value">{{ data.value }}</router-link>
                    <b-badge v-if="NewestVer(data.item)>data.item.version" variant="success">1</b-badge>
                </template>
                <template v-slot:cell(date)="data">
                    <span v-bind:title="instGetTitle(data.item)">{{ data.value }}</span>
                </template>
                <template v-slot:cell(latestver)="data">
                    {{ NewestVer(data.item) }}
                </template>
            </b-table>
          </b-row>

           <!-- 
          <b-row class="my-1">
              <b-col cols="3">
                  <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut" mode="out-in">
                      <b-input-group  size="sm" v-if="this.instCheckedNames.length">
                          <b-input-group-append>
                            <b-button v-on:click="InstallApply" v-bind:disabled="bulkAction===null || !this.instCheckedNames.length">Bulk</b-button>
                          </b-input-group-append>
                          <b-form-select v-model="bulkAction" v-bind:options="bulkOptions"></b-form-select>
                      </b-input-group>
                  </transition>
              </b-col>
          </b-row>
          -->
  
  
      </div>
  
      <div v-if="showPlugin">
          <b-alert v-if="pluginBad" variant="danger" show>No such plugin: "{{pname}}"</b-alert>
          <b-container v-else fluid>
              <b-row>
                <b-col>
                  <b-button v-on:click="$pdqPush('plugins')" title="go back">&lt; Back</b-button>
                  <b-button v-bind:disabled="i_builtin" v-on:click="Remove" title="Delete plugin: non-builtins only">Remove</b-button>
                  <b-button v-bind:disabled="upgradeDisabled()" v-on:click="Upgrade" title="Update plugin: non-builtins only">Upgrade</b-button>
                  <b-button v-bind:disabled="i_builtin" v-on:click="Duplicate" title="Duplicate plugin">Duplicate</b-button>
                  <b-button v-on:click="ShowFiles">Show Files</b-button>
                </b-col>
              </b-row>
              
              <b-container class="m-2">
                <b-row v-for="(r,i) in getPlugItems" v-bind:key="i">
                  <b-col cols="6">
                    <b-input-group :title="r.title">
                      <b-input-group-prepend>
                        <b-input-group-text class="bg-info text-dark" style="width:6em;">{{r.name}}:</b-input-group-text>
                      </b-input-group-prepend>
                      <b-input-group-text> {{r.val}} </b-input-group-text>
                    </b-input-group>
                  </b-col>
                </b-row>
              </b-container>
 
              <b-row class="my-1">
                <b-form-checkbox v-model="i_enabled" class="mx-2" v-bind:disabled="pname=='admin'" v-on:change="Enable">Enabled</b-form-checkbox>
                <b-form-checkbox v-model="i_uionly"  class="mx-2" v-bind:disabled="pname=='admin'" v-on:change="UiOnly">UI Only</b-form-checkbox>
                <b-form-checkbox v-model="i_hide"    class="mx-2" v-bind:disabled="pname=='admin'" v-on:change="Hide">Hide-Menu</b-form-checkbox>
                <b-form-checkbox v-model="i_builtin" class="mx-2" disabled>Builtin</b-form-checkbox>
              </b-row>
          </b-container>
      </div>
  
    </b-card>
  </div>
`
,
  data: function() {
    var data = {
      dupNameFrom:'', dupNameTo:'',
      show:'',
      getCheckedNames:[], getCheckedAll:false,
      instCheckedNames:[], instCheckedAll:false,
      dontshow:false,
      showModDialog:false,
      curplug:null,
      bulkAction:null,
      bulkOptions:[
          { value: null, text:'Bulk Actions' },
          { value: 'Disable', text:'Disable' },
          { value: 'Delete', text:'Delete' },
        ],
      instFields: [
       // {key:'rowid',  label:'', thStyle:'width:0.1em;' },
        {key:'name',   sortable:true },
        {key:'title',  sortable:true },
        {key:'version', sortable:true, headerTitle:'Version installed' },
        {key:'latestver', label:'Latest', headerTitle:'Newest version available'  },
        {key:'date',   sortable:true, headerTitle:'Date plugin was installed' },
      ],
      getFields: [
        {key:'rowid',  label:'', thStyle:'width:0.1em;', stickyColumn:true },
        {key:'name',  sortable:true },
        {key:'date',  sortable:true, headerTitle:'Date of newest version of plugin' },
        {key:'title',   sortable:true },
        {key:'version', sortable:true, headerTitle:'Latest version available' },
        {key:'author',  sortable:true },
      ],
      pluginBad:false,
      pname:undefined,
      sortBy: 'date',
      sortDesc: false,
      sortDirection: 'asc',
      info:{name:'', title:'', date:'', version:0, author:'', enabled:false, builtin:false, hide:false, dltime:'', dlfrom:'', uionly:false},
    };
    for (var p in data.info)
      data['i_'+p] = data.info[p];
    return data; 
  },
  props:{
    plugin: {
      type:String,
      default:'null',
    },
  },
  mounted:function() {
    this.updatePlugInfo(this.$route.params.plugin);
  },
  beforeRouteUpdate:function(to, from, next) {
    this.trace('to',to);
    if (to.name == '/admin/plugins')
      this.updatePlugInfo(to.params.plugin);
    next();
  },
  watch: {
    s_instRows:function(val) {
      this.fillPlugin();
    },
    s_updated:function(val) {
      this.clearMod();
    },
  },
  computed: {
    showDup:function() { return this.pname=='-'; },
    showAvail:function() { return this.pname=='+'; },
    showPlugin:function() { 
      this.trace("SSSA", this.pname, this.pname!==undefined && this.pname != '+');
      return this.pname!==undefined && this.pname != '+' &&  this.pname != '-';
    },
    showInst:function() { return this.pname===undefined; },
    notMod:function() {
      //return false;
      var s1 = JSON.stringify(this.getInfo()),
        s2 = JSON.stringify(this.info);
      return (s1 === s2);
    },
    getPlugItems:function() {
      var info = this.info;
      return [ {name:"Plugin", val:info.name},
       {name:"Version", val:info.version},
       {name:"Published", val:info.date, title:'Date plugin was published'},
       {name:"Installed", val:info.dltime},
       {name:"Site", val:info.dlfrom}
      ];
    },
  },
  methods: {
    $pdqBreak:function $pdqBreak() {debugger;},
    //trace:console.log,
    trace:function() {},
    upgradeDisabled:function() {
      var n = this.i_name;
      if (!Pdq.Plugins[n]) return true;
      var lv = Pdq.Plugins[n].latestver;
      this.trace("upgradeDisabled", lv, this.i_version);
      return this.i_builtin || lv==0 || lv<=this.i_version;
    },
    NewestVer:function(item) {
      var n = item.name, vv = Pdq.Plugins[n];
      return (vv ? vv.latestver: '');
    },
    GetInstall:function(data) {
      var name = data.item.name;
      this.trace("GetInstall", name);
      this.$pdqSend('Install', {name:name, opts:{allowCode:true}});
    },
    InstallApply:function() {
      this.trace("InstallApply: UNIMPL");
    },
    Avail:function() { this.$router.push('plugins/+'); },
    updatePlugInfo:function(pname) {
      if (!this.s_avail.length)
        this.$pdqSend('Avail', {nocache:false, novar:false});
      this.pname = pname;
      this.trace("UPDATEPN", pname, this.s_instRows.length);
      if (pname=='+' || pname=='-') {
        //this.$pdqSend('Avail');
      } else if (!this.s_instRows.length)
        this.$pdqSend('List');
      else if (pname)
        this.fillPlugin();
    },
    ShowFiles:function() {
      var ipre = (this.i_builtin?'builtins/':'plugins/');
      var path = 'Files/'+encodeURIComponent(ipre+this.pname+'/');
      this.$pdqPush(path);
    },
    Remove:function() {
      this.trace("REMOVE", this.pname);
      var opts = {keepconf:false};
      this.$pdqSend('Remove', {plugin:this.pname, opts:opts});
    },
    Duplicate:function() {
      this.dupNameFrom = this.pname;
      this.dupNameTo = this.pname+'_new';
      this.$pdqPush('plugins/-');
    },
    DuplicateDo:function() {
      this.trace("DUPLICATE", this.dupName);
      this.$pdqSend('Duplicate', {plugin:this.dupNameFrom, plugnew:this.dupNameTo});
      this.$pdqPush('plugins/');
    },
    UiOnly:function(val) {
      this.$pdqSend('UiOnly', {uionly:val, plugin:this.pname});
    },
    Enable:function(val) {
      this.trace("ENABLE", this.pname, val);
      this.$pdqSend('Enable', {enabled:val, plugin:this.pname});
    },
    Hide:function(val) {
      this.trace("Hide", this.pname, val);
      this.$pdqSend('Hide', {hide:val, plugin:this.pname});
    },
    Upgrade:function() {
      this.trace("UPDATE", this.pname);
      this.$pdqSend('Install', {name:this.pname, opts:{allowCode:true, upgrade:true}});
    },
    getInfo:function() {
      var res = {}, pi = this.info;
      for (var p in pi)
        res[p] = this['i_'+p];
      return res;
    },
    Refresh:function() {
      this.$pdqSend('Avail', {nocache:true, novar:false});
    },
    setInfo:function(info) {
      if (!info)
        info = this.info;
      for (var p in info) {
        var idx = 'i_'+p;
        if (this[idx] === 'undefined')
          console.warn('undefined key', idx);
        else
          this[idx] = info[p];
      }
    },
    instSelectAll:function(on) {
      if (!on) {
        this.instCheckedNames = [];
      } else {
        var call = [], r = this.s_instRows;
        for (var i in r)
          call.push(r[i].rowid.toString());
        this.instCheckedNames = call;
      }
    },
    getSelectAll:function(on) {
      if (!on) {
        this.getCheckedNames = [];
      } else {
        var call = [], r = this.s_getRows;
        for (var i in r)
          call.push(r[i].rowid.toString());
        this.getCheckedNames = call;
      }
    },
    instGetTitle:function(row) {
      if (!row.timestamp)
        return '';
      return row.timestamp+' UTC: Update=' + row.timeupdated;
    },
    fillPlugin:function() {
      if (!this.pname || this.pname == '+') return;
      var r = this.s_instRows;
      for (var i in r) {
        if (r[i].name === this.pname) {
          this.curplug = r[i];
          Object.assign(this.info, r[i]);
          this.setInfo(r[i]);
          this.clearMod();
          this.pluginBad = false;
          return;
        }
      }
       //if (this.infoI !== '')
      //  this.info = JSON.parse(this.infoI);
      this.pluginBad = true;
    },
    clearMod:function() {
      this.info = this.getInfo();
    },
    DoAbort:function() {
      this.clearMod();
      this.$router.push(this.nextlink);
    },
  },
});

