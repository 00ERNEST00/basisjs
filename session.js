/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  (function(){

    // namespace

    var namespace = 'Basis.Session';

    // import names

    var Class = Basis.Class;
    var extend = Object.extend;
    var nsWrapers = Basis.DOM.Wrapers;

    /*
     *  Common
     */

    var EXCEPTION_SESSION_NOT_OPEN = 'No opened session';
    var EXCEPTION_SESSION_IS_FROZEN = 'Session is frozen';

    var DEBUG_MODE = Basis.Browser.Cookies.get('DEBUG_MODE');

    var activeSession;
    var freezeState = false;
    var sessions = {};

    function getSession(key){
      if (!sessions[key])
        sessions[key] = new Session(key);

      return sessions[key];
    };

    /*
     *  SessionManager
     */

    var SessionManager = extend(new nsWrapers.EventObject(), {
      isOpened: function(){
        return Function.$isNotNull(activeSession);
      },
      getTimestamp: function(){
        if (activeSession)
          return activeSession.timestamp;
      },
      open: function(key, data){
        var session = getSession(key);
        if (activeSession == session)
        {
          if (freezeState)
            this.unfreeze();

          return;
        }
        else
          this.close();

        activeSession = session;
        session.timestamp = Number(new Date());
        if (data)
          extend(session.data, data);

        ;;; if (DEBUG_MODE && typeof console != 'undefined') console.info('Session opened: ' + activeSession.key);

        this.dispatch('sessionOpen', this);
      },
      close: function(){
        if (activeSession)
        {
          if (freezeState)
            this.unfreeze();

          ;;; if (DEBUG_MODE && typeof console != 'undefined') console.info('Session closed: ' + activeSession.key);

          this.dispatch('sessionClose', this);
          activeSession = null;
        }
      },
      freeze: function(){
        if (!freezeState && activeSession)
        {
          try {
            this.dispatch('sessionFreeze', this);
          } catch(e){
            ;;; if (typeof console != 'undefined') console.log(e);
          };
          freezeState = true;
        }
      },
      unfreeze: function(){
        if (freezeState)
        {
          freezeState = false;
          this.dispatch('sessionUnfreeze', this);
        }
      },
      storeData: function(key, data){
        if (activeSession)
          return activeSession.storeData(key, data);
        else
          throw new Error(EXCEPTION_SESSION_NOT_OPEN);
      },
      getData: function(key){
        if (activeSession)
          return activeSession.getData(key);
        else
          throw new Error(EXCEPTION_SESSION_NOT_OPEN);
      },
      destroy: function(){
        var keys = Object.keys(sessions);
        var key;
        while (key = keys.pop())
          sessions[key].destroy();

        this.inherit();
      }
    });

    /*
     *  Session
     */

    var Session = Class(nsWrapers.EventObject, {
      className: namespace + '.Session',

      behaviour: nsWrapers.createBehaviour(nsWrapers.EventObject, {
        destroy: function(){
          if (activeSession == this)
            SessionManager.close();
          delete sessions[this.key]
        }
      }),

      init: function(key){
        this.inherit();

        this.key = key;
        this.data = {};

        ;;; if (DEBUG_MODE && typeof console != 'undefined') console.info('Session created: ' + key);
      },
      storeData: function(key, data){
        if (freezeState)
          throw new Error(EXCEPTION_SESSION_IS_FROZEN);

        return this.data[key] = data;
      },
      getData: function(key){
        if (freezeState)
          throw new Error(EXCEPTION_SESSION_IS_FROZEN);

        return this.data[key];
      },
      destroy: function(){
        this.inherit();

        var keys = Object.keys(this.data);
        var key;
        while (key = keys.pop())
        {
          var data = this.data[key];
          if (data != null && typeof data.destroy == 'function')
            data.destroy();
          delete this.data[key];
        }
      }
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      SessionManager: SessionManager
    });

  })();
