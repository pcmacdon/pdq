"use strict"; Pdq.component( "admin-repos", { template:`
 <div>
  <b-modal v-model="showModDialog" v-on:ok="doApply">Confirm Apply!</b-modal>
  <b-card>
  <b-container v-if="showList" fluid="md">
    <b-row>
      <b-col cols="3">
        <b-input-group prepend="Rows" v-if="showPerPage">
          <b-form-select v-model="v_t_rowsPerPage" v-bind:options="s_t_rowsPerPageList"/>
        </b-input-group>
      </b-col>
      <b-col>
        <b-pagination
          v-model="currentPage"
          v-bind:total-rows="totalRows"
          v-bind:per-page="perPage"
          v-if="totalRows>v_t_rowsPerPage"
        />
      </b-col>
      <b-col col md="4">
        <b-form-input
          v-model="filter"
          type="search"
          placeholder="Type to Search"
          v-on:keyup.enter="doFilter"
        />
      </b-col>
    </b-row>
    <b-row>
      <b-table striped hover v-bind:items="rows" v-bind:fields="lfields" small bordered head-variant="light"
        class="shadow"
        sort-icon-left
        no-local-sorting
        v-bind:foot-clone="rows.length>8"
        v-bind:sort-by.sync="sortBy"
        v-bind:sort-desc.sync="sortDesc"
        v-bind:sort-direction="sortDirection"
      >
        <template v-slot:head(rowid)="data">
          <b-form-checkbox  v-model="checkedAll" v-on:change="selectAll">
          </b-form-checkbox>
        </template>
        <template v-slot:cell(rowid)="data">
          <b-form-checkbox  v-model="checkedNames" v-bind:value="data.item.rowid" :id="''+data.item.rowid">
          </b-form-checkbox>
        </template>
        <template v-slot:cell(pathname)="data">
          <router-link v-bind:to="'Files/'+encodeURIComponent(data.value)">{{ data.value }}</router-link>
        </template>
        <template v-slot:cell(datestamp)="data">
          <span v-bind:title="getTitle(data.item)">{{ data.value }}</span>
        </template>
      </b-table>
    </b-row>
  
    <b-row class="my-1">
      <b-col cols="3">
        <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut" mode="out-in">
          <b-input-group  size="sm" v-if="this.checkedNames.length">
            <b-input-group-append>
              <b-button v-on:click="Apply" v-bind:disabled="bulkAction===null || !this.checkedNames.length">Apply</b-button>
            </b-input-group-append>
            <b-form-select v-model="bulkAction" v-bind:options="bulkOptions"></b-form-select>
          </b-input-group>
        </transition>
      </b-col>
    </b-row>

  </b-container>
  <div v-else>
    <button v-on:click.once="Done">Done</button>
    <div>Title: <input v-model="title" placeholder="File title" /></div>
    <textarea v-model="text" rows="20" cols="60" style="resize:both" />
  </div>
  </b-card>
 </div>
`
,
  data:function() {
    return {
      showList:true,
      show:false, rows:[], numRows:0, totalRows:0,
      currentPage:1, perPage:20,
      dir:'/',
      forceList:0,
      pageOptions:[1, 5, 10, 15, 20, 30, 50, 100],
      filter:'',
      checkedNames:[], checkedAll:false,
      bulkAction:null, filterBy:'', dontshow:false, 
      applyLst:[],
      showModDialog:false,
      showPerPage:true,
      bulkOptions:[
          { value: null, text: '' },
          { value: 'Delete', text:'Delete' },
        ],
      lfields: [
        {key:'rowid', label:'', tdAttr:{style:'max-width:0.1em;'}, thStyle:'max-width:0.1em;'},
        {key:'pathname',  sortable:true, label:'Name'},
        {key:'datestamp', sortable:true, sortDirection: 'desc', label:'Date'}
      ],
      sortBy: 'date',
      sortDesc: false,
      sortDirection: 'asc',
    };
  },
  watch: {
    currentPage:function(val) { this.doListRepos(); },
    sortDesc:function(val) { this.doListRepos(); },
    sortBy:function(val) { this.doListRepos(); },
    perPage:function(val) { this.doListRepos(); },
    s_updated:function(val) {
      this.doListRepos();
    },
    t_rows:function(val) {
      this.rows = val.rows;
      this.numRows = val.rows.length;
      this.totalRows = val.cnt;
    },
    filter:function(val) {
      if (!this.filter.length)
        this.doListRepos();
    },
  },
  mounted:function() {
    this.showModDialog = false;
    this.doListRepos();
  },
  methods: {
    $pdqBreak:function $pdqBreak() {debugger;},
    doFilter:function() {
      this.doListRepos();
    },
    doListRepos:function() {
      this.$pdqSend('Files', {max:this.perPage, page:this.currentPage,
        filter:this.filter, sortBy:this.sortBy, sortDesc:this.sortDesc, dir:this.dir});
    },
    Apply:function() {
      var call = [], rows = this.s_List_rows;
      for (var i in rows) {
        var it = rows[i];
        if (this.checkedNames.indexOf(it.rowid)>=0)
          call.push(it.rowid);
      }
      this.applyLst = call;
      this.showModDialog = true;
    },
    doApply:function() {
      this.$pdqSend('List_Apply', {op:this.bulkAction,rowids:this.applyLst});
    },
    Filter:function() {
    },
    selectAll:function(on) {
      if (!on) {
        this.checkedNames = [];
      } else {
        var call = [], rows = this.s_List_rows;
        for (var i in rows)
          call.push(rows[i].rowid.toString());
        this.checkedNames = call;
      }
    },
    getTitle:function(row) {
      if (!row.timestamp)
        return '';
      return row.timestamp+' UTC: Update=' + row.timeupdated;
    },
  },
});

