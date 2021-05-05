"use strict";Pdq.component("admin",{template:`
  <div>
    <router-view />
  </div>
`
,
  mounted:function() {
  },
  methods: {
    $pdqBreak:function() {debugger;},
  },
});


Pdq.subcomponent("pdq-admin-login",{template:`
  <div id="login">
    <b-card>
    <div v-if="s_t_username.length">
    Currently logged in. <router-link v-bind:to="'Logout'">Log out</router-link>
    </div>
    <div v-else>
      <h3>Login</h3>
      <form action="/login" ref="loginform"  v-on:submit.prevent="login">
        <b-input type="text" name="username" v-model="Login.username" autofocus placeholder="Username" autocomplete="username"/>
        <b-input type="password" name="password" v-model="Login.password" placeholder="Password" v-on:keyup.enter.native="login" autocomplete="current-password"/>
        <input type="hidden" name="frompath" v-model="Login.frompath" />
        <b-button v-on:click="login">Login</b-button>
        <b-alert variant="danger" dismissible v-on:dismissed="Login.LoginFill=0" :show="Login.LoginFill">Must provide both username and password</b-alert>
      </form>
    </div>
    </b-card>
  </div>
`
,
  data:function() { return this.$root.$data; },
  methods: {
    $pdqBreak:function $pdqBreak() {debugger;},
    login:function() {
      if(this.Login.username == "" || this.Login.password == "") {
        this.Login.LoginFill=5;
      } else {
        this.loginform = this.$refs.loginform;
        this.$refs.loginform.submit();
      }
    },
  },
  beforeRouteEnter:function(to, from, next) {
    to.meta.data.Login.frompath = from.path;
    next();
    
  },
});


Pdq.subcomponent("pdq-admin-logout",{template:`
  <div>
    <b-card>
    <form action="/logout" ref="logoutform" v-on:submit.prevent="logout">
      <input type="hidden" name="frompath" v-model="Login.frompath" />
      Click here to <b-button variant="danger" v-on:click="logout" title="Log out of PDQ">Logout</b-button>
    </form>
    </b-card>
  </div>
`
,
  data:function() { return this.$root.$data; },
  methods: {
    $pdqBreak:function $pdqBreak() {debugger;},
    logout:function() {
      this.$refs.logoutform.submit();
    },
  },
  beforeRouteEnter:function(to, from, next) {
    to.meta.data.Login.frompath = from.path;
    next();
    
  },
});

