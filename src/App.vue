<template>
  <main>
    <div class="cast-button">
      <google-cast-launcher></google-cast-launcher>
    </div>
    <qrcode-stream @decode="onDecode"></qrcode-stream>
    <h1 v-if="state === 'notconnected'">En attente</h1>
    <h1 v-if="state === 'connected'">Le jeu !</h1>
  </main>

</template>

<script>
import { v4 as uuid } from 'uuid'
import { io } from 'socket.io-client'
import {QrcodeStream} from 'vue-qrcode-reader/src'

const initializeCastApi = function() {
  cast.framework.CastContext.getInstance().setOptions({
    receiverApplicationId: '720A8D7E',
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
  });
};
const sessionId = uuid()
const socket = io('https://cast.leoboyer.dev')

// This starter template is using Vue 3 experimental <script setup> SFCs
// Check out https://github.com/vuejs/rfcs/blob/script-setup-2/active-rfcs/0000-script-setup.md
export default {
  components: {QrcodeStream},
  data() {
    return {
      state: 'notconnected'
    }
  },
  created() {
    window['__onGCastApiAvailable'] = function(isAvailable) {
      console.log('init', isAvailable)
      if (isAvailable) {
        initializeCastApi();
      }
    };

    cast.framework.CastContext.getInstance().addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, e => {
      if (e.sessionState === 'SESSION_STARTED') {
        this.pairWithCast()
        this.pairWithServer()
      }
    })

    // bindings
    socket.on('ready', () => this.state = 'connected')
  },
  methods: {
    onDecode(decodedString) {

    },
    pairWithCast() {
      const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
      if(castSession){
        castSession.sendMessage('urn:x-cast:com.pnk.poccast', {
          type: "syncID",
          text: sessionId
        });
      }
    },
    pairWithServer () {
      console.log({
        sessionId,
        type: 'player'
      })
      socket.emit('config', {
        id: sessionId,
        type: 'player'
      })
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.cast-button {
  width: 30px;
  height: 30px;
}
</style>
