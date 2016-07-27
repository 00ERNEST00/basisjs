var Value = require('basis.data').Value;
var Window = require('basis.ui.window').Window;
var jsSourcePopup = require('../../../module/js-source-popup/index.js');
var DomTree = require('./dom.js');
var BindingView = require('./bindings.js');
var SourceView = require('./source.js');

module.exports = Window.subclass({
  target: true,
  modal: true,
  visible: Value.query('data.hasTarget').as(Boolean),
  showSource: new basis.Token(false),

  satellite: {
    domTree: DomTree,
    bindings: BindingView,
    source: SourceView
  },

  template: resource('./template/window.tmpl'),
  binding: {
    showSource: 'showSource',
    domTree: 'satellite:',
    bindings: 'satellite:',
    source: 'satellite:',

    hasParent: 'data:',
    hasOwner: 'data:',
    hasGroup: 'data:',
    objectClassName: 'data:',
    objectId: 'data:',
    objectLocation: 'data:',
    warningCount: 'data:',
    sourceTitle: {
      events: 'update',
      getter: function(node){
        return node.data.url || '[inline]';
      }
    },
    isFile: {
      events: 'update',
      getter: function(node){
        return Boolean(node.data.url);
      }
    }
  },
  action: {
    upParent: function(){
      this.api.upParent();
    },
    upOwner: function(){
      this.api.upOwner();
    },
    upGroup: function(){
      this.api.upGroup();
    },
    close: function(){
      this.api.dropTarget();
    },
    openSource: function(){
      if (this.data.url)
        this.target.api.openFile(this.data.url);
    },
    openObjectLocation: function(){
      if (this.data.objectLocation)
        this.target.api.openFile(this.data.objectLocation);
    },
    enterObjectLocation: function(e){
      if (this.data.objectLocation)
      {
        jsSourcePopup.loc.set(this.data.objectLocation);
        jsSourcePopup.show(e.actionTarget);
      }
    },
    leaveObjectLocation: function(){
      jsSourcePopup.hide();
    },
    toggleSource: function(){
      this.showSource.set(!this.showSource.value);
    },
    logInfo: function(){
      this.api.logInfo();
    }
  },

  realign: function(){},
  setZIndex: function(){},
  init: function(){
    Window.prototype.init.call(this);
    this.dde.fixLeft = false;
    this.dde.fixTop = false;
    this.api.init();
  },
  set: function(data){
    this.update(data);
  }
});