
  basis.require('basis.event');
  basis.require('basis.net');
  basis.require('basis.net.rpc');


 /**
  * @namespace basis.net.service
  */

  var namespace = this.path;


  //
  // import names
  //

  var createEvent = basis.event.create;
  var createRpc = basis.net.rpc.createRpc;

  var Emitter = basis.event.Emitter;
  var AjaxTransport = basis.net.AjaxTransport;


 /**
  * @class Service
  */

  var SERVICE_HANDLER = {
    start: function(service, request){
      this.inprogressTransports.add(request.transport);
    },
    complete: function(service, request){
      this.inprogressTransports.remove(request.transport);
    }
  };


  var Service = Emitter.subclass({
    className: namespace + '.Service',

    inprogressTransports: null,

    transportClass: AjaxTransport,

    dispatch_sessionOpen: createEvent('sessionOpen'),
    dispatch_sessionClose: createEvent('sessionClose'),
    dispatch_sessionFreeze: createEvent('sessionFreeze'),
    dispatch_sessionUnfreeze: createEvent('sessionUnfreeze'),

    isSecure: false,

    prepare: basis.fn.$true,
    signature: basis.fn.$undef,
    isSessionExpiredError: basis.fn.$false,

    init: function(){
      ;;;if (this.requestClass) basis.dev.warn(namespace + '.Service#requestClass is not supported; set requestClass via transportClass')

      Emitter.prototype.init.call(this);

      this.inprogressTransports = [];

      var TransportClass = this.transportClass;
      this.transportClass = TransportClass.subclass({
        service: this,

        needSignature: this.isSecure,

        dispatch_failure: function(request, error){
          TransportClass.prototype.dispatch_failure.call(this, request, error);

          if (this.needSignature && this.service.isSessionExpiredError(request))
          {
            this.service.freeze();
            this.service.stoppedTransports.push(this);
            this.stop();
          }
        },

        request: function(requestData){
          if (!this.service.prepare(this, requestData))
            return;

          if (this.needSignature && !this.service.sign(this))
            return;

          return TransportClass.prototype.request.call(this, requestData);
        }
      });

      this.addHandler(SERVICE_HANDLER);
    },

    sign: function(transport){
      if (this.sessionKey)
      {
        this.signature(transport, this.sessionData);
        return true;
      }
      else
      {
        ;;;basis.dev.warn('Request ignored. Service have no session key');
      }
    },

    openSession: function(sessionKey, sessionData){
      this.sessionKey = sessionKey;
      this.sessionData = sessionData;

      this.unfreeze();

      this.dispatch_sessionOpen();
    },

    closeSession: function(){
      this.freeze();

      this.dispatch_sessionClose();
    },

    freeze: function(){ 
      if (!this.sessionKey)
        return;

      this.sessionKey = null;
      this.sessionData = null;

      this.stoppedTransports = this.inprogressTransports.filter(function(transport){
        return transport.needSignature;
      });

      for (var i = 0, transport; transport = this.inprogressTransports[i]; i++)
        transport.stop();

      this.dispatch_sessionFreeze();
    },

    unfreeze: function(){
      if (this.stoppedTransports)
        for (var i = 0, transport; transport = this.stoppedTransports[i]; i++)
          transport.resume();

      this.dispatch_sessionUnfreeze();
    },
    
    createTransport: function(config){
      return new this.transportClass(config);
    },

    createAction: function(config){
      return createRpc(basis.object.complete({
        service: this
      }, config));
    },

    destroy: function(){
      this.inprogressTransports = null;
      this.stoppedTransports = null;
      this.sessionKey = null;
      this.sessionData = null;

      Emitter.prototype.destroy.call(this);
    }
  });

  //
  // exports
  //
  module.exports = {
    Service: Service
  };
