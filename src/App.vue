<template>
  <main>
    <section v-if="state === 'notconnected'">
      <h1>En attente</h1>
      <div class="qrcode">
        <QrcodeStream @decode="onDecode"></QrcodeStream>
      </div>
    </section>
    <section class="game" v-if="state === 'connected'">
      <h1>Le jeu !</h1>
      <p v-if="playerTurn">C'est votre tour! Appuyez sur votre dé pour tirer.</p>
      <p v-else>En attente de l'adversaire</p>
      <article class="dice" :class="{ active: playerTurn, diceGone }" @click="roll">
        <span>Votre dé</span>
        <span class="number" id="player-dice">{{ diceVal }}</span>
      </article>
    </section>
    <div v-if="state === 'notconnected' || connectionMethod === 'cast'" class="cast-button">
      <google-cast-launcher></google-cast-launcher>
    </div>
  </main>

</template>

<script>
import { v4 as uuid } from 'uuid'
import { io } from 'socket.io-client'
import {QrcodeStream} from 'vue-qrcode-reader'

let sessionId = uuid()
const socket = io('https://cast.leoboyer.dev')

export default {
  components: {QrcodeStream},
  data() {
    return {
      state: 'notconnected',
      connectionMethod: null,
      playerTurn: false,
      diceGone: false,
      diceVal: '...',
    }
  },
  created() {
    window['__onGCastApiAvailable'] = (isAvailable) => {
      console.log('init', isAvailable)
      if (isAvailable) {
        this.initializeCastApi();
      }
    };

    // bindings
    socket.on('ready', () => this.state = 'connected')
    socket.on('game-data', this.onGameData.bind(this))
  },
  methods: {
    onDecode(decodedString) {
      if (decodedString.length === 36) {
        sessionId = decodedString
        this.connectionMethod = 'pc'
        this.pairWithServer()
      }
    },
    onGameData (data) {
      switch (data.type) {
        case 'turn':
          this.playerTurn = data.turn
          if (this.playerTurn) this.diceGone = false
          break
        case 'diceVal':
          this.diceVal = data.val
          break
      }
    },
    initializeCastApi() {
      cast.framework.CastContext.getInstance().setOptions({
        receiverApplicationId: '720A8D7E',
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
      })
      cast.framework.CastContext.getInstance().addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, e => {
        if (e.sessionState === 'SESSION_STARTED' || e.sessionState === 'SESSION_RESUMED') {
          this.pairWithCast()
          this.pairWithServer()
        }
        if (e.sessionState === 'SESSION_ENDED') {
          this.state = 'notconnected'
        }
      })
    },
    pairWithCast() {
      const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
      if(castSession){
        castSession.sendMessage('urn:x-cast:com.pnk.poccast', {
          type: "syncID",
          text: sessionId
        });
        this.connectionMethod = 'cast'
      }
    },
    pairWithServer () {
      socket.emit('config', {
        id: sessionId,
        type: 'player'
      })
    },
    roll() {
      if (!this.playerTurn) return
      this.diceVal = Math.round(Math.random() * 6) + 1
      this.diceGone = true
      socket.emit('game-data', {
        type: 'roll',
        number: this.diceVal
      })
    }
  }
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.cast-button {
  position: fixed;
  right: 10px;
  left: 10px;
  width: 30px;
  height: 30px;
}
.qrcode {
  width: 300px;
  height: 300px;
}

.game {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background-color: #f5f9ff;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dice {
  width: 400px;
  background-color: #3f658f;
  color: #a7a7a7;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  margin: auto 0;
  transition: all .5s;
  align-items: center;
  font-size: 1.2em;
}

.dice .number {
  font-size: 5em;
  font-weight: bold;
}

.dice.active {
  background-color: #103d6b;
  color: #fff;
}
.dice.diceGone {
  transform: translateY(-80vh);
}
</style>
