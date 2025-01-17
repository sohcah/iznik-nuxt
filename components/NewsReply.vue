<template>
  <div v-if="reply.userid && users[reply.userid] && reply.visible">
    <b-row class="p-0">
      <b-col class="p-0">
        <table v-if="users[reply.userid].profile">
          <tbody>
            <tr>
              <td style="vertical-align: top" class="clickme" title="Click to see their profile" @click="showInfo">
                <b-img-lazy
                  rounded="circle"
                  class="profilemd p-0 ml-1 mb-1 mr-2 inline float-left mt-2"
                  alt="Profile picture"
                  title="Profile"
                  :src="users[reply.userid].profile.turl"
                  @error.native="brokenImage"
                />
              </td>
              <td class="align-top">
                <v-icon v-if="users[reply.userid].settings.showmod" name="leaf" class="showmodsm text-success" />
                <span class="text-success font-weight-bold clickme" title="Click to see their profile" @click="showInfo">{{ users[reply.userid].displayname }}</span>
                <span class="font-weight-bold prewrap forcebreak replytext nopara">
                  <NewsHighlight
                    :search-words="threadUsers"
                    :text="emessage"
                    :max-chars="500"
                    class="font-weight-bold prewrap forcebreak replytext d-inline"
                  /> <br>
                </span>
                <div v-if="reply.image">
                  <b-img
                    v-b-modal="'photoModal-' + reply.id"
                    rounded
                    class="clickme"
                    alt="ChitChat photo"
                    :src="reply.image.paththumb"
                    style="width: 150px"
                    @error.native="brokenImage"
                  />
                </div>
                <span v-if="reply.message && reply.userid && users[reply.userid]">
                  <span class="text-muted small">
                    {{ $dayjs(reply.timestamp).fromNow() }}
                  </span>
                  <NewsUserInfo :user="users[reply.userid]" />
                  <span>
                    &bull;<span class="text-muted small clickme" @click="replyReply">&nbsp;Reply</span>
                  </span>
                  <span class="text-muted small clickme">
                    <span v-if="!reply.loved" @click="love">
                      &bull;&nbsp;Love this
                    </span>
                    <span v-if="reply.loved" @click="unlove">
                      &bull;&nbsp;Unlove this
                    </span>
                    <span v-if="reply.loves">
                      <v-icon name="heart" class="text-danger" />&nbsp;{{ reply.loves }}
                    </span>
                    <span v-if="parseInt(me.id) === parseInt(reply.userid)" v-b-modal="'newsEdit-' + reply.id">
                      &bull;&nbsp;Edit
                    </span>
                    <span v-if="parseInt(me.id) === parseInt(reply.userid) || mod" @click="deleteReply">
                      &bull;&nbsp;Delete
                    </span>
                    <span v-if="parseInt(me.id) !== parseInt(reply.userid)">
                      &bull;&nbsp;
                      <ChatButton
                        :userid="reply.userid"
                        size="naked"
                        title="Message"
                      />
                    </span>
                  </span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </b-col>
    </b-row>
    <a v-if="!showAllReplies && reply.replies.length > 5" href="#" variant="white" class="mb-3" @click="(e) => { e.preventDefault(); showAllReplies = true }">
      Show earlier {{ reply.replies.length | pluralize(['reply', 'replies'], { includeNumber: false }) }} ({{ reply.replies.length - 5 }})
    </a>
    <div v-if="reply.replies && reply.replies.length > 0" class="pl-3">
      <ul v-for="entry in reply.replies" :key="'newsfeed-' + entry.id" class="p-0 pt-1 pl-1 list-unstyled mb-1 border-left">
        <li>
          <news-reply :key="'newsfeedreply-' + reply.id + '-reply-' + entry.id" :reply="entry" :users="users" />
        </li>
      </ul>
    </div>
    <b-row v-if="showReplyBox" class="mb-2">
      <b-col class="p-0 pb-1 d-flex ml-4">
        <b-input-group class="pl-4 flex-shrink-2">
          <b-input-group-prepend>
            <span class="input-group-text pl-1 pr-1">
              <b-img-lazy
                v-if="me.profile.turl"
                rounded="circle"
                thumbnail
                class="profilesm p-0 m-0 inline float-left"
                alt="Profile picture"
                title="Profile"
                :src="me.profile.turl"
                @error.native="brokenImage"
              />
            </span>
          </b-input-group-prepend>
          <b-textarea
            ref="replybox"
            v-model="replybox"
            size="sm"
            rows="1"
            max-rows="8"
            maxlength="2048"
            spellcheck="true"
            placeholder="Write a reply to this comment and hit enter..."
            class="p-0 pl-1 pt-1"
            @keydown.enter.exact.prevent
            @keyup.enter.exact="sendReply"
            @keydown.enter.shift.exact="newlineReply"
            @keydown.alt.shift.exact="newlineReply"
            @focus="focusedReply"
          />
        </b-input-group>
        <b-btn size="sm" variant="white" class="flex-grow-1 float-right ml-1">
          <v-icon name="camera" />&nbsp;Photo
        </b-btn>
      </b-col>
    </b-row>
    <b-modal
      v-if="reply.image"
      :id="'photoModal-' + reply.id"
      ref="photoModal"
      title="ChitChat Photo"
      alt="ChitChat Photo"
      size="lg"
      no-stacking
      ok-only
    >
      <template slot="default">
        <b-img
          fluid
          rounded
          center
          :src="reply.image.path"
        />
      </template>
    </b-modal>
    <b-modal
      :id="'newsEdit-' + reply.id"
      ref="editModal"
      title="Edit your post"
      size="lg"
      no-stacking
    >
      <template slot="default">
        <b-textarea
          ref="editText"
          v-model="reply.message"
          rows="8"
          maxlength="2048"
          spellcheck="true"
          placeholder="Edit your post..."
        />
      </template>
      <template slot="modal-footer" slot-scope="{ ok, cancel }">
        <b-button variant="white" @click="cancel">
          Cancel
        </b-button>
        <b-button variant="success" @click="save">
          Save
        </b-button>
      </template>
    </b-modal>
    <ProfileModal v-if="infoclick" :id="reply.userid" ref="profilemodal" />
  </div>
</template>

<style scoped lang="scss">
@import 'color-vars';

.replytext {
  font-size: 14px;
  line-height: 1.2;
}

.showmodsm {
  top: 28px;
  left: 26px;
  border-radius: 50%;
  position: absolute;
  background-color: $color-white;
  width: 15px;
  padding-left: 3px;
  padding-top: 3px;
}
</style>

<script>
// TODO EH User tagging
import twem from '~/assets/js/twem'
const NewsUserInfo = () => import('~/components/NewsUserInfo')
const NewsHighlight = () => import('~/components/NewsHighlight')
const ProfileModal = () => import('~/components/ProfileModal')
const ChatButton = () => import('~/components/ChatButton')

export default {
  name: 'NewsReply',
  components: {
    NewsUserInfo,
    NewsHighlight,
    ProfileModal,
    ChatButton
  },
  props: {
    threadhead: {
      type: Object,
      required: true
    },
    reply: {
      type: Object,
      required: true
    },
    users: {
      type: Object,
      required: true
    },
    scrollTo: {
      type: String,
      required: false,
      default: ''
    }
  },
  data: function() {
    return {
      showReplyBox: false,
      replyingTo: null,
      replybox: null,
      infoclick: false,
      showAllReplies: false
    }
  },
  computed: {
    me() {
      return this.$store.getters['auth/user']()
    },
    mod() {
      const me = this.me
      return (
        me &&
        (me.systemrole === 'Moderator' ||
          me.systemrole === 'Admin' ||
          me.systemrole === 'Support')
      )
    },
    emessage() {
      return this.reply.message
        ? twem.twem(this.$twemoji, this.reply.message)
        : null
    },
    threadUsers() {
      const ret = []
      for (const user in this.users) {
        ret.push('@' + this.users[user].displayname)
      }
      return ret
    },
    repliestoshow() {
      let ret = []

      if (this.reply.replies && this.reply.replies.length) {
        if (this.showAllReplies || this.reply.replies.length <= 5) {
          ret = this.reply.replies
        } else {
          // We have to prune what we show, but we should show any replyto.
          ret = this.reply.replies
          let pruned = 0
          let pruneAt = ret - 1

          while (pruned < 5 && pruneAt < ret.length) {
            if (ret[pruneAt].id !== parseInt(this.replyTo)) {
              pruned++
              ret.splice(pruneAt, 1)
            } else {
              pruneAt++
            }
          }
        }
      }

      return ret
    }
  },
  mounted() {
    if (parseInt(this.scrollTo) === this.reply.id) {
      // We want to scroll to this reply to make sure it's visible
      this.$el.scrollIntoView()

      // TODO DESIGN Can we have some visual highlighting of the element we've just scrolled to?
    }
  },
  methods: {
    showInfo() {
      // We use v-if so that the profile modal is not inserted into the DOM until we have clicked, which saves the
      // fetch of the user info.
      this.infoclick = true
      setTimeout(() => {
        this.$refs.profilemodal.show()
      }, 25)
    },
    replyReply() {
      this.replyingTo = this.reply.id
      this.showReplyBox = true

      // Can't set focus immediately as not in DOM until re-render.
      this.$nextTick(() => {
        this.$refs.replybox.focus()

        // Reply with tag.
        this.replybox = '@' + this.users[this.reply.userid].displayname + ' '
      })
    },
    focusReply: function() {
      this.$refs.replybox.focus()
    },
    focusedReply: function() {
      this.replyingTo = this.reply.id
    },
    async sendReply() {
      // Encode up any emojis.
      if (this.replybox) {
        const msg = twem.untwem(this.replybox)

        await this.$store.dispatch('newsfeed/send', {
          message: msg,
          replyto: this.replyingTo,
          threadhead: this.reply.threadhead
        })

        // New message will be shown because it's in the store and we have a computed property.

        // Clear and hide the textarea now it's sent.
        this.replybox = null
        this.showReplyBox = false
      }
    },
    newlineReply() {
      this.replybox += '\n'
    },
    love() {
      this.$store.dispatch('newsfeed/love', {
        id: this.reply.id,
        replyto: this.reply.replyto,
        threadhead: this.reply.threadhead
      })
    },
    unlove() {
      this.$store.dispatch('newsfeed/unlove', {
        id: this.reply.id,
        replyto: this.reply.replyto,
        threadhead: this.reply.threadhead
      })
    },
    save() {
      this.$store.dispatch('newsfeed/edit', {
        id: this.reply.id,
        message: this.reply.message
      })

      this.$refs.editModal.hide()
    },
    deleteReply() {
      this.$store.dispatch('newsfeed/delete', {
        id: this.reply.id,
        threadhead: this.reply.threadhead
      })
    },
    brokenImage(event) {
      event.target.src = '/static/defaultprofile.png'
    }
  }
}
</script>
