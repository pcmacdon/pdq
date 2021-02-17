"use strict";Pdq.component("admin-files",{template:`
  <div>
    <b-modal v-model="showApplyDialog" v-on:ok="doApply">Confirm Apply!</b-modal>
    <b-modal v-model="showAbortDialog" v-on:ok="doAbort">Ok to abandon modifications?</b-modal>
  
    <b-card>
      <div v-if="showNew">
          <button v-on:click.once="Create">Create</button>
          <div>Title: <input v-model="newtitle" placeholder="Files title" /></div>
          <textarea v-model="newtext" rows="20" cols="60" style="resize:both" />
      </div>
  
      <b-container v-else-if="showList" fluid="md">
          <b-row>
              <b-col cols="3">
                  <b-input-group prepend="Rows" v-if="showPerPage">
                    <b-form-select v-model="v_t_rowsPerPage" v-bind:options="s_t_rowsPerPageList"/>
                  </b-input-group>
              </b-col>
              <b-col>
                  <b-pagination v-if="totalRows>v_t_rowsPerPage"
                      v-model="currentPage"
                      v-bind:total-rows="totalRows"
                      v-bind:per-page="v_t_rowsPerPage"
                      v-bind:aria-controls="files_tbl"
                  >
                  </b-pagination>
              </b-col>
              <b-col col md="4">
                    <b-form-input
                        v-model="filter"
                        type="search"
                        placeholder="Type to Filter Files"
                        v-on:keyup.enter="doFilter"
                  ></b-form-input>
              </b-col>
          </b-row>
      
          </b-row>
            <b-table class="shadow mt-2"
                ref="files_tbl" striped hover v-bind:items="s_rows" v-bind:fields="lfields"
                small bordered head-variant="light" sort-icon-left
                v-bind:foot-clone="s_rows.length>8"
                v-bind:per-page="v_t_rowsPerPage"
                v-bind:current-page="currentPage"
                v-bind:sort-by.sync="sortBy"
                v-bind:sort-desc.sync="sortDesc"
                v-bind:sort-direction="sortDirection"
                v-bind:filter="filter"
                v-on:filtered="Filter"
            >
                <template v-slot:head(rowid)="data">
                    <b-form-checkbox  v-model="checkedAll" v-on:change="selectAll">
                    </b-form-checkbox>
                </template>
                <template v-slot:cell(rowid)="data">
                    <b-form-checkbox  v-model="checkedNames" v-bind:value="data.item.rowid" v-bind:id="''+data.item.rowid" />
                </template>
                <template v-slot:cell(size)="data">
                     <span>{{ data.value }}</span>
                </template>
                <template v-slot:cell(perms)="data">
                     <code class="text-dark">{{ data.value }}</code>
                </template>
                <template v-slot:cell(name)="data">
                    <b-link href="#" v-on:click="fileAction(data.item)">
                        {{ data.item.name }}
                        <b v-if="data.item.perms[0] !== '-'" style="color:black">{{ getFPrefix(data.item) }}</b>
                    </b-link>
                </template>
                <template v-slot:cell(mtime)="data">
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
     
      <!-- EDIT -->
      <b-container v-else class="fluid no-gutters p-0">
      
        <b-row class="no-gutters w-100">
          <b-col>
            <b-navbar variant="info">
              <b-checkbox v-model="useTE" class="px-3">Text</b-checkbox>
              <b-checkbox v-if="!useTE" v-model="useLN" class="px-3">Linenumbers</b-checkbox>
              <b-button class="px-3"  v-on:click="Save" title="Save changes">Save</b-button>
          </b-navbar>
          </b-col>
        </b-row>
        <b-row class="no-gutters w-100">
          <b-col class="">
            <div v-if="useTE"
            >
              <!-- the "margin !important" cause margin keeps changing with 2nd number getting bigger and bigger? -->
              <textarea ref="viewer" v-model="v_text" v-on:keydown="ismodified = true" v-on:keyup.ctrl.i="doIndent($event)" 
             class="w-100 overflow-auto"
                  v-bind:style="{resize:'both', width:tvWid + 'px', height:tvHi+'px', margin:'0 0 0 0 !important'}"
                   />
            </div>
            <div v-else>
              <prism-editor v-model="v_text" language="js" v-bind:lineNumbers="useLN"
              >
              </prism-editor>
           </div>
          </b-col>
        </b-row>
        <b-row class="">
          <b-col>
          </b-col>
        </b-row>
    </b-container>  
    
    </b-card>
  </div>
`
,
  props:{ indir:{type:String, default:''} },
  data:function data() {
    return {
      newtext:'', newtitle:'',
      path:null,
      useTE:false,
      useLN:true,
      fpath:null,
      ismodified:false, nextlink:null, 
      mdWid:400, mdHi:460, tvWid:450, tvHi:400,
      showList:true, showNew:false,
      rows:[], totalRows:0,
      files_tbl:"", show:false, dir:'', filter:'',
      currentPage:1,
      checkedNames:[], checkedAll:false,
      bulkAction:null, filterBy:'', dontshow:false, 
      applyLst:[],
      showApplyDialog:false,
      showAbortDialog:false,
      showPerPage:true,
      bulkOptions:[
          { value: null, text: '' },
          { value: 'Delete', text:'Delete' },
        ],
      lfields: [
        {key:'rowid', label:'', thStyle:'width:.1em;', class:'py-0'},
        {key:'name', class:'py-0',  sortable:true, formatter:"getFname",
          sortByFormatted:  function (val, nam, data) {
            return (data.perms[0]==='d' ? '/' : '')  + val; }
           },
        {key:'size', class:'py-0',  sortable:true, thStyle:'text-align:right', tdAttr:{style:'text-align:right' } },
        {key:'mtime', class:'py-0', sortable:true, sortDirection: 'desc', label:'Modified',
          formatter:"getDate", thStyle:'text-align:center', tdAttr:{style:'text-align:center' } },
        {key:'perms', class:'py-0',  sortable:true },
      ],
      sortBy: 'name',
      sortDesc: false,
      sortDirection: 'asc',
    };
  },
  mounted:function mounted() {
    this.showApplyDialog = false;
    this.showAbortDialog = this.ismodified = false;
    this.files_tbl = this.$refs.files_tbl.toString();
    
    var idir = this.$route.params.indir;
    var dir = (idir?decodeURIComponent(idir):'');
    if (this.showList=(dir == '' || dir[dir.length-1]=='/'))
      this.setListFiles(this.$route.params.indir);
    else
      this.doLoadFile(this.$route.params.indir);

  },
  beforeRouteUpdate:function beforeRouteUpdate(to, from, next) {
    var idir = to.params.indir;
    var dir = (idir?decodeURIComponent(idir):'');
    this.showList=(dir == '' || dir[dir.length-1]=='/');
    if (this.showList)
      this.setListFiles(dir);
    else
      this.doLoadFile(dir);
    next();
  },
  beforeRouteLeave:function beforeRouteLeave(to, from, next) {
    if (this.showList) {next(); return; }
    var ismod = this.docModified;
    this.nextlink = to;
    if (!ismod)
      next();
    else {
      this.showAbortDialog = true;
    }
  },
  computed: {
    docModified:function docModified() {
      if (this.ismodified)
        return true;
      return false;
    },
  },
  watch: {
    s_rows:function rows(val) {
      this.rows = val;
      this.totalRows = val.length;
    },
    s_updated:function updated(val) {
      this.ismodified = false;
    },
  },
  methods: {
    $pdqBreak:function $pdqBreak() {debugger;},
    Create:function Create() {
      this.$pdqSend('Create', {text:this.newtext,title:this.newtitle});
    },
    Filter:function Filter(lst) {
      this.totalRows = lst.length;
    },
    fileAction:function fileAction(item) {
      var ldir = this.dir + item.name;
      var isdir = this.isDir(item);
      this.showList=isdir;
      var epath = encodeURIComponent(ldir+(isdir?'/':''));
      if (isdir) {
        //this.doListFiles();
        this.dir = ldir;
        this.currentPage = 1;
      }
      this.$pdqPush('files/'+epath);
    },
    isDir:function isDir(data) {
      return (data.perms[0] === 'd');
    },
    getFPrefix:function getFPrefix(data) {
      switch (data.perms[0]) {
        case 'd': return '/'; break;
        case 'p': return '|'; break;
        case 'l': return '@'; break;
        case '-': return ''; break;
      }
      return '*';
    },
    getFname:function getFname(val, key, data) {
      var sf = this.getFPrefix(data);
      return data.name+sf;
    },
    getDate:function getDate(val) {
      var d = new Date(val*1000);
      var n = d.toISOString().split('T')[0];
      return n + ' ' + d.toTimeString().split(' ')[0];
    },
    doFilter:function doFilter() {
      this.doListFiles();
    },
    doListFiles:function doListFiles() {
      this.$pdqSend('Dir', {max:this.v_t_rowsPerPage, filter:this.filterBy, dir:this.dir});
    },
    setListFiles:function setListFiles(dir) {
      this.dir = (dir?decodeURIComponent(dir):'');
      this.doListFiles();
    },
    Apply:function Apply() {
      var call = [], rows = this.rows;
      for (var i in rows) {
        var it = rows[i];
        if (this.checkedNames.indexOf(it.rowid)>=0)
          call.push(rows[i].name);
      }
      this.applyLst = call;
      this.showApplyDialog = true;
    },
    doApply:function doApply() {
      this.$pdqSend('Apply', {op:this.bulkAction,names:this.applyLst});
    },
    selectAll:function selectAll(on) {
      if (!on) {
        this.checkedNames = [];
      } else {
        var call = [], rows = this.rows;
        for (var i in rows)
          call.push(rows[i].rowid.toString());
        this.checkedNames = call;
      }
    },
    getTitle:function getTitle(row) {
      if (!row.timestamp)
        return '';
      return row.timestamp+' UTC: Update=' + row.timeupdated;
    },
    // Edit
    doLoadFile:function doLoadFile(path) {
      this.fpath = (path?decodeURIComponent(path):null);
      if (this.fpath)
        this.$pdqSend('Load', {path: this.fpath});
    },
    Save:function Save() {
      this.$pdqSend('Save', {text:this.v_text, title:this.title, path:this.fpath});
    },
    IndentSel:function IndentSel(event) // Toggle textarea indent
    {   
      var id  = event.currentTarget;
      if (!id) return;
      var s = id.selectionStart, f = id.selectionEnd;
      if (s === undefined || f === undefined) return;
      var r = '', v = id.value, i, lst = [], l,
        sel = id.value.substring(s, f),
        spl = sel.split('\n');
    
      if (sel.substr(0,4) == '  ') {
        for (i = 0; i<spl.length; i++) {
          l = spl[i];
          if (l.substr(0,4) == '  ')
            l = l.substr(4);
          lst.push(l);
        }
      } else {
        var len = spl.length;
        if (spl[len-1] === '') {
          spl = spl.slice(0,len-1);
          f--;
        }
        for (i = 0; i<spl.length; i++) {
          l = spl[i];
          l = '  '+l;
          lst.push(l);
        }
      }
      var nv = v.substr(0,s) + lst.join('\n') + v.substr(f);
      id.value = nv;
      return nv;
    },
  
    insertAtCursor:function insertAtCursor(input, textToInsert, del) {
      input.focus();
      if (del)
        document.execCommand("delete", false, '');
      var isSuccess = document.execCommand("insertText", false, textToInsert);
    
      // Firefox (non-standard method)
      if (!isSuccess && typeof input.setRangeText === "function") {
      var start = input.selectionStart;
      input.setRangeText(textToInsert);
      // update cursor to be at the end of insertion
      input.selectionStart = input.selectionEnd = start + textToInsert.length;
    
      // Notify any possible listeners of the change
      var e = document.createEvent("UIEvent");
      e.initEvent("input", true, false);
      input.dispatchEvent(e);
      }
    },
  
    doIndent:function doIndent(event) {
      var nv = this.IndentSel( event);
      if (nv)
        this.update_v_text(nv);
    },
    changed:function changed(event) {
      //this.text2 = event.target.innerHTML.trim();
    },
    doAbort:function doAbort() {
      this.ismodified = false;
      this.$router.push(this.nextlink);
    },
    Dlg:function Dlg(op) {
      this.showAbortDialog = false;
      switch (op) {
        case 'save':
          this.saveFile();
        case 'discard':
          this.ismodified = false;
          this.$router.push(this.nextlink);
          break;
        case 'close': break;
        default: console.warn('unknown op: '+op);
      }
    },
  },
});

