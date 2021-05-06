"use strict";Pdq.component("admin-users",{template:`
  <div>
    <b-card>
    <div v-if="showList">
      <b-button class="my-2" title="Add a new user" v-on:click="UserAdd">
        <b-icon icon="plus"></b-icon>
        Add
      </b-button>
      <b-table striped hover v-bind:items="rows" v-bind:fields="lfields" small bordered head-variant="light" class="shadow">
        <template v-slot:cell(login)="data">
          <router-link v-bind:to="'Users/'+data.value">{{ data.value }}</router-link>
        </template>
        <template v-slot:cell(date)="data">
          <span v-bind:title="getTitle(data.item)">{{ data.value }}</span>
        </template>
        <template v-slot:cell(last)="data">
          <span v-bind:title="getTitle(data.item)">{{ data.value }}</span>
        </template>
      </b-table>
    </div>
    
    <div v-if="showUser">
      <b-alert variant="danger" v-if="loginBad" show>No such user: "{{puser}}"</b-alert>
      <div v-else>
        <span v-if="s_t_isAdmin">
          <b-button class="my-2" v-on:click="UserUpdate" v-bind:disabled="notMod" title="Commit changes">
          <b-icon icon="box-arrow-up"></b-icon>
          {{isAdd?'Add':'Update'}}
          </b-button>
          <b-button class="my-2" v-on:click="showDel=!showDel" v-if="!isAdd" v-bind:disabled="noDel" title="Delete user">
            <b-icon icon="trash"></b-icon>
            Delete
          </b-button>
        </span>
        <b-button class="my-2" variant="primary" v-on:click="logout()" v-if="isLogin">Logout</b-button>
        <div v-if="showDel">
          <b-button class="my-2" variant="primary" v-on:click="UserDel" v-if="!isAdd">Yes, Delete!</b-button>
          <b-button class="my-2" variant="primary" v-on:click="logout" v-if="!isAdd">Cancel</b-button>
        </div>
        <b-container fluid>
          <form>
          <b-row class="my-1">
            <b-col sm="2"> <label>Login:</label> </b-col>
            <b-col sm="8"> <b-form-input v-bind:readonly="!isAdd" type="text" v-model="i_login" v-bind:autofocus="isAdd" autocomplete="username"></b-form-input> </b-col>
          </b-row>
          <b-row class="my-1">
            <b-col sm="2"> <label>Password:</label> </b-col>
            <b-col sm="8"> <b-form-input type="password" v-model="i_pw" autocomplete="current-password"></b-form-input> </b-col>
          </b-row>
          <b-row class="my-1">
            <b-col sm="2"> <label>Description:</label> </b-col>
            <b-col sm="8"> <b-form-input type="text" v-model="i_info"></b-form-input> </b-col>
          </b-row>
          <b-row class="my-1">
            <b-col sm="2"> <label>Capability:</label> </b-col>
            <b-col sm="8"> <b-form-input type="text" v-model="i_cap" v-bind:disabled="this.i_uid === 1"></b-form-input> </b-col>
          </b-row>
          <b-row class="my-1">
            <b-col sm="2"> <label>Uid:</label> </b-col>
            <b-col sm="8"> <b-form-input type="number" v-model="i_uid" readonly></b-form-input> </b-col>
          </b-row>
          </form>
        </b-container>
      </div>
    </div>
    </b-card>
    <b-modal v-model="showModDialog" v-on:ok="DoAbort">Ok to abandon modifications?</b-modal>
  </div>
`
,
  data:function data() {
    var data =  {
      rows:[],
      checkedNames:[], checkedAll:false,
      dontshow:false,
      showDel:false,
      isAdd:false,
      lfields: [
        {key:'login'},
        {key:'info'},
        {key:'date'},
        {key:'last'},
        {key:'uid'},
        {key:'cap'},
      ],
      loginBad:false,
      nextlink:null,
      puser:null,
      show:false,
      showModDialog:false,
      sortBy: 'date',
      sortDesc: false,
      sortDirection: 'asc',
      info:{login:'', uid:-1, info:'', pw:'', cap:'' },
      utabIndex:0,
    };
    for (var p in data.info)
      data['i_'+p] = data.info[p];
    return data; 
  },
  props:{
    user: {
      type:String,
      default:'null',
    },
  },
  mounted:function mounted() {
    this.$pdqSend('List');
    this.fillUser();
  },
  beforeRouteUpdate:function beforeRouteUpdate(to, from, next) {
    next();
    this.fillUser();
  },
  beforeRouteLeave:function beforeRouteLeave(to, from, next) {
    var notmod = this.notMod;
    this.nextlink = to;
    if (notmod)
      next();
    else {
      this.showModDialog = true;
    }
  },
  watch: {
    s_rows:function rows(val) {
      this.rows = val;
      this.fillUser();
    },
    s_updated:function updated(val) {
      this.clearMod();
    },
  },
  computed: {
    showUser:function showUser() {
      return this.$route.params.user!==undefined;
    },
    showList:function showList() {
      return this.$route.params.user===undefined;
    },
    isLogin:function isLogin() {
      return (this.puser && this.puser === this.s_t_username && !this.s_t_isLocalhost);
    },
    notMod:function notMod() {
      //return false;
      var s1 = JSON.stringify(this.getInfo()),
        s2 = JSON.stringify(this.info);
      return (s1 === s2);
    },
    noDel:function noDel() {
      return (this.i_uid === 1 || this.i_login === this.s_t_username);
    },
    noCaps:function noCaps() {
      return (this.i_uid === 1);
    },
  },
  methods: {
    $pdqBreak:function $pdqBreak() {debugger;},
    logout:function logout() {
      this.$pdqPush('logout');
    },
    fillUser:function fillUser() {
      this.showModDialog = false;
      this.puser = this.$route.params.user;
      this.isAdd = (this.puser === '+');
      if (!this.puser) return;
      this.showDel = false;
      if (this.isAdd) {
        this.clearMod();
        this.loginBad = false;
        return;
      }
      if ((this.i_login !== this.puser || this.i_uid === -1) && this.rows.length) {
        var rows = this.rows;
        for (var i in rows) {
          if (rows[i].login === this.puser) {
            this.setInfo(rows[i]);
            this.clearMod();
            this.loginBad = false;
            return;
          }
        }
        this.clearMod();
        this.loginBad = true;
      }
      this.i_pw = '';
      this.clearMod();
    },
    /*getInfo() {
      return {login:this.i_login, uid:this.i_uid, info:this.i_info, pw:this.i_pw, cap:this.i_cap};
    },
    setInfo() {
      var u = this.info;
      this.i_login = u.login; this.i_uid = u.uid,  this.i_info=u.info; this.i_pw=u.pw; this.i_cap=u.cap; 
    },*/
    getInfo:function getInfo() {
      var res = {}, pi = this.info;
      for (var p in pi)
        res[p] = this['i_'+p];
      return res;
    },
    setInfo:function setInfo(info) {
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
    UserUpdate:function UserUpdate() {
      this.info = this.getInfo();
      this.$pdqSend('Update', {info: this.info, isAdd:this.isAdd});
    },
    clearMod:function clearMod() {
      this.info = this.getInfo();
    },
    DoAbort:function DoAbort() {
      this.clearMod();
      this.$router.push(this.nextlink);
    },
    UserAdd:function UserAdd() {
      this.$pdqPush('users/+');
    },
    UserDel:function UserDel() {
      this.info = this.getInfo();
      this.$pdqSend('Delete', {info: this.info});
    },
    selectAll:function selectAll(on) {
      if (!on) {
        this.checkedNames = [];
      } else {
        var call = [];
        for (var i in this.rows)
          call.push(this.rows[i].rowid.toString());
        this.checkedNames = call;
      }
    },
    getTitle:function getTitle(row) {
      if (!row.timestamp)
        return '';
      return row.timestamp+' UTC: Update=' + row.timeupdated;
    },
  },
  /*popts:{
    //include:['admin.css'], // CSS ILLEGAL IN MODULE
    //css:'admin.css'
  },*/
});

