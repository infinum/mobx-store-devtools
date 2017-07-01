var remotedev = require('remotedev');

var silent = false;

function silentAction(store, action, ...args) {
  silent = true;
  store[action](...args);
  silent = false;
}

function toggleAction(store, id, state) {
  const idx = state.skippedActionIds.indexOf(id);
  const skipped = idx !== -1;
  const start = state.stagedActionIds.indexOf(id);

  if (start === -1) {
    return state;
  }

  silent(store, 'insert', state.computedStates[start - 1].state);

  for (let i = (skipped ? start : start + 1); i < state.stagedActionIds.length; i++) {
    if (i !== start && state.skippedActionIds.indexOf(state.stagedActionIds[i]) !== -1) {
      continue; // it's already skipped
    }

    silent(store, 'applyPatch', state.actionsById[state.stagedActionIds[i]].action);
    state.computedStates[i].state = store.snapshot;
  }

  if (skipped) {
    state.skippedActionIds.splice(idx, 1);
  } else {
    state.skippedActionIds.push(id);
  }

  return state;
}

module.exports = {
  init: function init(store) {
    if (!('findAll' in store)) {
      throw new Error('The store should be a mobx-collection-store or mobx-jsonapi-store instance');
    }

    if (!('patchListen' in store)) {
      throw new Error('Please upgrade your mobx-collection-store (minimal version is 1.4.0)');
    }

    var devtools = remotedev.connectViaExtension();

    devtools.subscribe(function onMessage(message) {
      // Helper when only time travelling needed

      var state = remotedev.extractState(message);

      if (state instanceof Array) {
        silent(store, 'insert', state);
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
