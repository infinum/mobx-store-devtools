var remotedev = require('remotedev');
var mobx = require('mobx');

var silent = false;

function silentAction(store, action) {
  silent = true;
  store[action].apply(store, Array.prototype.slice.call(arguments, 2));
  silent = false;
}

var toggleAction = mobx.action('TOGGLE_ACTION', function toggleAction(store, id, state) {
  var start = state.stagedActionIds.indexOf(id);

  if (start === -1) {
    return state;
  }

  var toggledActionIndex = state.skippedActionIds.indexOf(id);
  var skipped = toggledActionIndex !== -1;

  silentAction(store, 'insert', state.computedStates[start - 1].state);

  for (var i = (skipped ? start : start + 1); i < state.stagedActionIds.length; i++) {
    if (i !== start && state.skippedActionIds.indexOf(state.stagedActionIds[i]) !== -1) {
      continue; // it's already skipped
    }

    silentAction(store, 'applyPatch', state.actionsById[state.stagedActionIds[i]].action);
    state.computedStates[i].state = store.snapshot;
  }

  if (skipped) {
    state.skippedActionIds.splice(toggledActionIndex, 1);
  } else {
    state.skippedActionIds.push(id);
  }

  return state;
});

module.exports = {
  init: function init(store, options) {
    if (!('findAll' in store)) {
      throw new Error('The store should be a mobx-collection-store or mobx-jsonapi-store instance');
    }

    if (!('patchListen' in store)) {
      throw new Error('Please upgrade your mobx-collection-store (minimal version is 1.4.0)');
    }

    var devtools = remotedev.connectViaExtension(options);

    devtools.subscribe(function onMessage(message) {
      // Helper when only time travelling needed

      var state = remotedev.extractState(message);

      if (state instanceof Array) {
        silentAction(store, 'insert', state);
      } else if (message.payload) {
        switch(message.payload.type) {
          case 'TOGGLE_ACTION':
            return devtools.send(null, toggleAction(store, message.payload.id, state));
          default:
            console.log('undefined payload type', message.payload, state);
        }
      } else {
        console.log(message, state);
      }
    });

    // Send changes to the remote monitor
    store.patchListen(function onPatch(data) {
      if (silent) {
        return;
      }

      var action = Object.assign({type: data.op + data.path}, data);

      if (typeof action.value === 'object' && 'snapshot' in action.value) {
        action.value = action.value.snapshot;
      }

      if (typeof action.oldValue === 'object' && 'snapshot' in action.oldValue) {
        action.oldValue = action.oldValue.snapshot;
      }

      devtools.send(action, store.snapshot);
    });

    devtools.send({type: '@@MOBX_STORE/INIT'}, store.snapshot);
  }
};
