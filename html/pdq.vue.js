

"use strict";Pdq.component("pdq",{template:`
  <div class="pdqplugframe" v-on:click.alt.ctrl.stop="$pdqBreakCall">
    <!-- Pdq main window -->
    <b-sidebar id="pdq_sidebar" bg-variant="info" title="Menu">
      <component v-bind:is="$pdqInsert('sidebar')" />
    </b-sidebar>
    <b-container fluid class="">
      <b-row rows="1" class="bg-navbar bd-navbar" style="padding-left:0">
        <b-col>
          <b-navbar  class="p-1">
            <b-navbar-nav>
              <b-nav-form class="d-inline-flex">
                <b-nav-item v-if="Mmenushowbut" id="pdq_menubut2" v-b-toggle.pdq_sidebar>&#9776;</b-nav-item>
                <b-button size="sm" class="my-2 my-sm-0">PDQ</b-button>
              </b-nav-form>
            </b-navbar-nav>
            
            <component v-bind:is="$pdqInsert('top')" class="ml-1" />
            <b-navbar-nav class="ml-auto">
                <b-nav-form class="d-inline-flex">
                  <b-form-input size="sm" class="mr-sm-2" placeholder="Search"></b-form-input>
                  <b-button size="sm" class="my-2 my-sm-0" type="submit">Search</b-button>
                </b-nav-form>
        
                <b-nav-form class="d-inline-flex" id="pdq-popover-target-1">
                  <b-nav-item v-bind:href="loglink">{{logname}}</b-nav-item>
                  <b-avatar size="1.5em" class="" v-bind:variant="(islog?'primary':'secondary')" badge="2" badge-variant="danger"/>
                </b-nav-form>    
        
            </b-navbar-nav>
       
            <b-popover v-if="NotUser" target="pdq-popover-target-1" triggers="hover" placement="bottomleft">
                <template #title>{{ (islog?'User Settings':'Click below to "login"') }}</template>
                <b-avatar class="m-1" v-bind:variant="(islog?'primary':'secondary')" />
                <b-button v-bind:href="loglink">{{logname}}</b-button>
                <b-button v-on:click="isBusy=!isBusy">Busy</b-button>
                <b-button v-on:click="Mmenuisopen=!Mmenuisopen">Menu</b-button>
            </b-popover> 
          </b-navbar>
        </b-col>
      </b-row>
      <b-row class="" rows="11">
        <b-col v-if="Mmenuisopen" cols="1" class="bd-sidebar pl-2">
          <pdq-menu />
        </b-col>
        <b-col  class="" cols="10">
          <router-view />
        </b-col>
        <b-col v-if="showToc" cols="1" class="bd-toc p-0">
          <component v-bind:is="$pdqInsert('right')" style="margin-left:-4px;" />
        </b-col>
        <b-overlay v-bind:show="isBusy" class="h-100" no-wrap>
        </b-overlay>
      </b-row>
      <component v-bind:is="$pdqInsert('bottom')" />
    </b-container>
  </div>
`
,
  // JS comments ok after this point.
  data:function data() { return this.$root.$data; },
  mounted:function mounted() {
    this.updateTitle();
  },
  methods: {
    $pdqBreak:function $pdqBreak() {debugger;},
    //trace:console.log,
    trace:function trace() {},    
  },
  watch: {
    $route:function $route(to, from) {
      this.updateTitle(to.path);
    },
    s_toastMsg:function s_toastMsg(m) {
      // Thin wrapper for bvToast where text is stored in "m.msg"
      if (!m) return;
      var msg = m.msg;
      this.trace("toastMsg", m);
      if (!m.variant) m.variant = 'success';
      var mv = m.variant;
      if (mv == 'danger')
        m.noAutoHide = true;
      if (!m.autoHideDelay && !m.noAutoHide) m.autoHideDelay = 3000;
      if (!m.title) {
        switch (mv) {
          case 'danger': m.title = 'Error'; break;
          default: m.title = $pdqToTitle(mv); break;
        }
      }
      this.$bvToast.toast(msg, m);
      this.$store.commit('pdq/update_s_toastMsg', null);
    },
  },
  
  computed: Object.assign(
      Vuex.mapState(['s_t_username']),
      Vuex.mapState('pdq', ['s_toastMsg']),{
    subRoute:function subRoute() {
      var rv = this.$router.currentRoute.path;
      var rts = this.routes[0].children;
      var cur = rv.split('/')[1];
      for (var i = 0; i<rts.length; i++) {
        if (rts[i].name === cur)
          return rts[i].children;
      }
      return;
    },
    NotUser:function NotUser() {
      var rv = (this.$router.currentRoute.path.indexOf('/admin/users')!==0);
      return rv;
    },
    islog:function islog() {
      return (this.s_t_username != '');
    },
    logname:function logname() {
      var u = this.s_t_username;
      if (u!=='') return u;
      return 'login';
    },
    loglink:function loglink() {
      var u = this.s_t_username;
      if (u!=='') return '#/admin/users/'+u;
      return '#/admin/login';
    },
    bcitems:function bcitems() {
      var rr = [], mr = this.$route.matched;
      var mlp = '', mte = mr[mr.length-1].path.split('/');
      for (var i = 1; i<mte.length; i++) {
        var t = mte[i];
        if (t[0] === ':') break;
        mlp += ('/'+t);
        rr.push({text:t, href:'#'+mlp, active:(i==(mte.length-1))});
      }
      return rr;
    },
  }),

});




Vue.component("pdq-menu",{template:`
  <div class="pdqplugframe" v-on:click.alt.ctrl.stop="$pdqBreakCall">
    <component v-bind:is="$pdqInsert('left')"/>
    <ul style="float:left;" class="pdq-nav-area list-unstyled" v-bind:class="{'pdq-mmisopen':Mmenuisopen}" >
      <pdq-menu-item v-for="(r,i) in routes" v-bind:key="i" v-bind:mispop="false" v-bind:route="r" v-bind:level="0"/>
    </ul>
    <component v-bind:is="$pdqInsert('left2')"/>
  </div>
`
,
  data:function data() { return this.$root.$data; },
  methods: {
    $pdqBreak:function $pdqBreak() {debugger;},
  },
});





Vue.component("pdq-menu-item",{template:`
  <li v-if="isVisible" v-bind:style="sbstyle" class="pdqplugframe" v-on:click.alt.ctrl.stop="$pdqBreakCall">
      <router-link
        active-class="active"
        v-bind:to="{name: route.name}"
        class="nav-link p-0"
        v-bind:style="level==0?'display:none':''"
        v-bind:id="'pdqmenu_'+name+'_'+level"
      >{{icon}}<span v-bind:class="'pdq-menuname'+level">{{name | $pdqToTitle}}</span>
    </router-link>
    <ul v-if="route.children && route.children.length && !showPop && level<=max" class="m-0 p-0 list-unstyled">
      <pdq-menu-item v-for="(r,i) in route.children" v-bind:key="i" v-bind:mispop="false" v-bind:route="r" v-bind:level="level+1" v-bind:max="max"></pdq-menu-item>
    </ul>
     <!-- <b-popover v-if="showPop" v-bind:target="'pdqmenu_'+name+'_'+level" triggers="hover" placement="right" variant="secondary">
      <template #title>{{name}}</template>
      <ul class="m-0 p-0 list-unstyled">
        <pdq-menu-item v-for="(r,i) in route.children" v-bind:key="i" v-bind:mispop="true" v-bind:route="r" v-bind:level="level+1"></pdq-menu-item>
      </ul>
    </b-popover> -->
  </li>
`
,
  props: { route: { type: Object }, level: {type: Number }, mispop:{type:Boolean}, max:{type:Number, default:2}},
  mounted: function mounted() {},
  methods: {
    samePre:function samePre() {
      var cd = this.$root.$data,
        cp = cd.$router.currentRoute.path.split('/')[1],
        cn = this.route.name.split('/')[1];
      return (cp === cn);
    },
    $pdqBreak:function $pdqBreak() {debugger;},
  },
  computed: {
    sbstyle:function sbstyle() {
      var st = 'padding-left:';
      if (this.mispop)
        st += '-10px; margin-left:-10px;';
      else
        st += ((this.level-1)*3)+'px';
      return st;
    },
    showPop:function showPop() {
      if (!(this.level==1 && this.route.children && this.route.children.length))
        return false;
      return (!this.samePre());
    },
    isVisible:function isVisible() {
      return (this.route.name && (!this.route.meta || (this.route.meta.visible === undefined
        ||  this.route.meta.visible) ));
    },
    name:function name() {
      if (!this.route.name)
        return '';
      var rn = this.route.name.split('/');
      return rn[rn.length-1];
    },
    icon:function icon() {
      return (this.route.meta ? this.route.meta.icon : '');
    }
  }
});

