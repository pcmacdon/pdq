"use strict";Pdq.component("admin-system",{template:`
  <div>

    <div v-if="View=='Main'">
      <div class="p-1">
        <b-button v-bind:to="'system/settings'" title="System settings">
          <b-icon icon="gear-fill"></b-icon>
          Settings
        </b-button>
        <b-button v-bind:to="'system/software'" title="Current software version">
          <b-icon icon="info-circle-fill"></b-icon> 
          <b-badge v-if="canUpdatePdq" variant="danger">1</b-badge>
          Software
        </b-button>
      </div>
      <b-jumbotron bg-variant="info" text-variant="white" border-variant="dark">
        <template v-slot:header>PDQ : Vue + Jsi</template>
      
        <template v-slot:lead>
          <transition enter-active-class="animated fadeIn" mode="in-out"
            v-on:after-enter="ShowLev = true"
          >
            <p v-if="ShowTop">
              Plugin based, atomic site management.
            </p>
          </transition>
        </template>
      
        <hr class="my-4">
      
        <transition enter-active-class="animated bounce" mode="in-out">
          <p v-if="ShowLev">
           Server with hot-reload, sqlite and websocket baked-in.
          </p>
        </transition>
      </b-jumbotron>
    </div>

    <b-card v-else-if="View=='software'" class="my-2">
      
      <b-container fluid> 
        <h2>Software</h2>

        <b-table hover :items="tdata" :fields="tfields" striped bordered class="w-auto shadow" thead-class="bg-info"></b-table>

		<span>
          <span v-if="s_t_isAdmin">
            <b-button :disabled="!canUpdatePdq" class="my-2" variant="primary" v-on:click="Upgrade" :title="canUpdatePdq?'Upgrade PDQ now':'PDQ can not be upgraded'">Upgrade PDQ</b-button>
          </span>
	      <b-button class="my-2" variant="primary" v-on:click="Plugins" :title="'List Plugins'">Plugins</b-button>
	    </span>
        
        <div v-if="needJsiUpdate">
          Note, before you can update PDQ you'll need to download/install your version of Jsi from <b-link href="https://jsish.org/bin/jsish">jsish.org</b-link>
        </div>
      </b-container>

    </b-card>
    
    <b-card v-else-if="View=='settings'" class="my-2">
      <b-container fluid> 
      <h2>Settings</h2>
        <b-checkbox v-if="0" v-model="pick">Test</b-checkbox>
        <b-row class="my-1">
          <b-col sm="5">
            <b-input-group prepend="Project Name:" class="mt-2">
              <b-form-input v-model="v_t_project" :disabled="!s_t_isAdmin" ></b-form-input>
              <b-input-group-append v-if="!notMod">
                <b-button variant="primary" v-on:click="ProjName" title="Modify Project Name">Apply</b-button>
              </b-input-group-append>
            </b-input-group>
          </b-col>
        </b-row>

        <b-row class="my-1">
          <b-col sm="5">
            <b-input-group prepend="Home:" class="mt-2">
              <b-form-select v-model="v_t_home" :disabled="!s_t_isAdmin" :options="homeOpts" @change="SetHome"></b-form-select>
            </b-input-group>
          </b-col>
        </b-row>

      </b-container>
    </b-card>
        
    <div v-else>
      Unknown view: {{View}}
    </div>
  <!--
    <div>
      <b-button
        @click="viscol=!viscol"
        :variant="viscol?'info':'primary'">
        {{viscol?'Close ????':'Open ????'}}
      </b-button>
      <b-collapse v-model="viscol" >
        Here is the <b>collapse</b>!
      </b-collapse>
    </div>
  -->
  </div>
`
,
  props:{ view:{type:String, default:''} },
  data:function data() {
    return {
      pick:false,
      viscol:false,
      showPdqInfo:false,
      ShowLev:false, ShowTop:false,
      project:'',
      homeOpts:Pdq.pdqRoutes,
      tfields: [
        {key:'version',class:'bg-info'},
        {key:'pdq'},
        {key:'jsi'}
      ],
    };
  },
  mounted: function mounted() {
    var iv = this.s_t_verInfo;
    if (this.s_t_isInit && (!iv.version || !iv.checkeddate || this.outOfDate(iv.checkeddate))) {
      this.$pdqSend('pdqVerinfo');
    }
    this.project = this.v_t_project;
    this.ShowTop=true;
  },
  computed: {
    mycol:function mycol() { return this.$refs.mycol; },
    View:function View() { var v = this.$route.params.view; return (v?v:'Main'); },
    notMod:function notMod() { return Pdq.pluginConf.status.project == this.v_t_project; },
    vertitle:function vertitle() {
      var vi = this.s_t_verInfo;
      var s = 'Current='+vi.curversion + ',  Latest='+vi.version
        + ', Jsi-have='+ vi.verjsi + ',  Jsi-req=' + vi.verjsireq
        + ', IsLocal='+ this.s_t_isLocalhost;
      return (this.canUpdatePdq?'Not ':'')+'Up To Date: '+s;
    },
    tdata:function tdata() {
      var vi = this.s_t_verInfo;
      return [
        {version:'Current', pdq:vi.curversion, jsi:vi.verjsi},
        {version:'Available', pdq:vi.version, jsi:vi.verjsireq},
      ];
    },
    vi:function vi() { return this.s_t_verInfo; },
    needJsiUpdate:function needJsiUpdate() {
      var vi = this.s_t_verInfo;
      return (vi.version && vi.curversion<vi.version && vi.verjsi<vi.verjsireq);
    },
    vercur:function vercur() {
      return this.s_t_verInfo.curversion;
    },
    canUpdatePdq:function canUpdatePdq() {
      var vi = this.s_t_verInfo;
      return (vi.version && vi.version>vi.curversion && vi.verjsi >= vi.verjsireq && this.s_t_isLocalhost);
    },
  },
  methods: {
    $pdqBreak:function $pdqBreak() {debugger;},
    outOfDate:function outOfDate(str) {
      var day = 24 * 60 * 60 * 1000;
      var d = new Date(str);
      var old = ((new Date()-d)>day);
      return old;
    },
    Upgrade:function Upgrade() {
      this.$pdqSend('Upgrade', {info:{project:this.v_t_project}});
    },
    ProjName:function ProjName() {
      this.$pdqSend('ProjName', {info:{project:this.v_t_project}});
    },
    Plugins:function Plugins() {
		this.$router.push('/admin/plugins');
	},
    SetHome:function SetHome(val) {
      puts('Val', val);
      this.$pdqSend('SetHome', {home:val});
    },
  },
  watch: {
    admstatus:function admstatus() {
      this.$bvToast.toast('Admin status updated', { title: 'Admin', autoHideDelay: 3000 });
    },
  },
});



