<template>
  <div v-if="newsfeed && newsfeed.visible && !newsfeed.unfollowed" class="bg-white">
    <b-card :style="'background-color:' + backgroundColor" no-body>
      <b-card-body class="p-1 p-sm-2">
        <b-card-text>
          <b-dropdown class="float-right" right variant="white">
            <template slot="button-content" />
            <b-dropdown-item :href="'/chitchat/' + newsfeed.id" target="_blank">
              Open in new window
            </b-dropdown-item>
            <b-dropdown-item :b-v-modal="'newsEdit' + newsfeed.id" @click="show">
              Edit
            </b-dropdown-item>
            <b-dropdown-item @click="unfollow">
              Unfollow this thread
            </b-dropdown-item>
            <b-dropdown-item @click="report">
              Report this thread or one of its replies
            </b-dropdown-item>
            <b-dropdown-item v-if="parseInt(me.id) === parseInt(newsfeed.userid) || mod" @click="deleteIt">
              Delete this thread
            </b-dropdown-item>
          </b-dropdown>
          <news-message v-if="newsfeed.type === 'Message'" :id="newsfeed.id" :newsfeed="newsfeed" :users="users" @focus-comment="focusComment" />
          <news-about-me v-else-if="newsfeed.type === 'AboutMe'" :id="newsfeed.id" :newsfeed="newsfeed" :users="users" @focus-comment="focusComment" />
          <news-community-event v-else-if="newsfeed.type === 'CommunityEvent'" :id="newsfeed.id" :newsfeed="newsfeed" :users="users" @focus-comment="focusComment" />
          <news-volunteer-opportunity v-else-if="newsfeed.type === 'VolunteerOpportunity'" :id="newsfeed.id" :newsfeed="newsfeed" :users="users" @focus-comment="focusComment" />
          <news-story v-else-if="newsfeed.type === 'Story'" :id="newsfeed.id" :newsfeed="newsfeed" :users="users" @focus-comment="focusComment" />
          <news-alert v-else-if="newsfeed.type === 'Alert'" :id="newsfeed.id" :newsfeed="newsfeed" :users="users" @focus-comment="focusComment" />
          <news-noticeboard v-else-if="newsfeed.type === 'Noticeboard'" :id="newsfeed.id" :newsfeed="newsfeed" :users="users" @focus-comment="focusComment" />
          <!-- TODO Design - Replace this with a notice-message component. Fix the issue with the floated dropdown above first -->
          <b-alert v-else variant="danger" show>
            Unknown item type {{ newsfeed.type }}
          </b-alert>
        </b-card-text>
      </b-card-body>
      <div slot="footer">
        <a v-if="!showAllReplies && newsfeed.replies.length > 10" href="#" variant="white" class="mb-3" @click="(e) => { e.preventDefault(); showAllReplies = true }">
          Show earlier {{ newsfeed.replies.length | pluralize(['reply', 'replies'], { includeNumber: false }) }} ({{ newsfeed.replies.length - 10 }})
        </a>
        <ul v-for="entry in repliestoshow" :key="'newsfeed-' + entry.id" class="list-unstyled mb-2">
          <li>
            <news-reply :key="'newsfeedreply-' + newsfeed.id + '-reply-' + entry.id" :reply="entry" :users="users" :threadhead="newsfeed" :scroll-to="scrollTo" />
          </li>
        </ul>
        <span v-if="!newsfeed.closed" class="text-small">
          <b-row>
            <b-col class="d-flex">
              <b-input-group class="flex-shrink-2">
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
                    />
                  </span>
                </b-input-group-prepend>
                <b-textarea
                  ref="threadcomment"
                  v-model="threadcomment"
                  size="sm"
                  rows="1"
                  max-rows="8"
                  maxlength="2048"
                  spellcheck="true"
                  placeholder="Write a comment on this thread and hit enter..."
                  class="p-0 pl-1 pt-1"
                  @keydown.enter.exact.prevent
                  @keyup.enter.exact="sendComment"
                  @keydown.enter.shift.exact="newlineComment"
                  @keydown.alt.shift.exact="newlineComment"
                  @focus="focusedComment"
                />
              </b-input-group>
              <b-btn size="sm" variant="white" class="float-right flex-grow-1 ml-1">
                <v-icon name="camera" /><span class="d-none d-sm-inline">&nbsp;Photo</span>
              </b-btn>
            </b-col>
          </b-row>
        </span>
        <notice-message v-else>
          This thread is now closed.  Thanks to everyone who contributed.
        </notice-message>
      </div>
    </b-card>
    <b-modal
      :id="'newsEdit-' + newsfeed.id"
      ref="editModal"
      title="Edit your post"
      size="lg"
      no-stacking
    >
      <template slot="default">
        <b-textarea
          ref="editText"
          v-model="newsfeed.message"
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
    <NewsReportModal :id="newsfeed.id" ref="newsreport" />
  </div>
</template>

<style scoped lang="scss">
.profilesm {
  width: 25px !important;
  height: 25px !important;
}

::v-deep .img-thumbnail {
  cursor: pointer;

  /*TODO DESIGN Should use same values as global.scss, maybe mixins*/
  @media (max-width: 992px) {
    max-width: 100px;
  }
}
</style>

<script>
// TODO EH Refer to WANTED/OFFER/RECEIVED/TAKEN
// TODO MINOR Attach to thread
// TODO DESIGN Some indication of newly added entries
// TODO Click on loves to show who loves them
import NewsReportModal from './NewsReportModal'
import twem from '~/assets/js/twem'

// Use standard import to avoid screen-flicker
import NewsReply from '~/components/NewsReply'
import NewsMessage from '~/components/NewsMessage'
import NewsAboutMe from '~/components/NewsAboutMe'
const NewsCommunityEvent = () => import('~/components/NewsCommunityEvent')
const NewsVolunteerOpportunity = () =>
  import('~/components/NewsVolunteerOpportunity')
const NewsStory = () => import('~/components/NewsStory')
const NewsAlert = () => import('~/components/NewsAlert')
const NewsNoticeboard = () => import('~/components/NewsNoticeboard')
const NoticeMessage = () => import('~/components/NoticeMessage')

export default {
  components: {
    NewsReportModal,
    NewsReply,
    NewsMessage,
    NewsAboutMe,
    NewsCommunityEvent,
    NewsVolunteerOpportunity,
    NewsStory,
    NewsAlert,
    NewsNoticeboard,
    NoticeMessage
  },
  props: {
    id: {
      type: Number,
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
      replyingTo: null,
      threadcomment: null,
      showAllReplies: false,
      newsreport: false
    }
  },
  computed: {
    newsfeed() {
      return this.$store.getters['newsfeed/get'](this.id)
    },
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
    backgroundColor() {
      let col

      switch (this.newsfeed.type) {
        case 'CommunityEvent':
          col = '#add8e62e'
          break
        case 'VolunteerOpportunity':
          col = '#c3e6cb26'
          break
        default:
          col = 'white'
          break
      }

      return col
    },
    repliestoshow() {
      let ret = []

      if (this.newsfeed.replies && this.newsfeed.replies.length) {
        if (this.showAllReplies || this.newsfeed.replies.length <= 10) {
          ret = this.newsfeed.replies
        } else {
          // We have to prune what we show.
          ret = this.newsfeed.replies.slice(-10)
        }
      }

      return ret
    }
  },
  methods: {
    focusComment: function() {
      this.$refs.threadcomment.focus()
    },
    focusedComment: function() {
      this.replyingTo = this.newsfeed.id
    },
    async sendComment() {
      // TODO MINOR This is sluggish.  Can we fake up the reply in the store in advance, or have some other visual indicator?
      // Same applies to NewsReply.
      // Encode up any emojis.
      if (this.threadcomment) {
        const msg = twem.untwem(this.threadcomment)

        console.log(
          'Comment replying this',
          this.replyingTo,
          this.newsfeed.threadhead
        )
        await this.$store.dispatch('newsfeed/send', {
          message: msg,
          replyto: this.replyingTo,
          threadhead: this.newsfeed.threadhead
        })

        // New message will be shown because it's in the store and we have a computed property.

        // Clear the textarea now it's sent.
        this.threadcomment = null
      }
    },
    newlineComment() {
      // TODO MINOR Would be good to handle inserting in the middle a block of text, though last time I looked at this it
      // was quite fiddly.
      this.threadcomment += '\n'
    },
    show() {
      this.$refs.editModal.show()
    },
    save() {
      this.$store.dispatch('newsfeed/edit', {
        id: this.newsfeed.id,
        message: this.newsfeed.message
      })

      this.$refs.editModal.hide()
    },
    deleteIt() {
      this.$store.dispatch('newsfeed/delete', {
        id: this.id,
        threadhead: this.id
      })
    },
    unfollow() {
      this.$store.dispatch('newsfeed/unfollow', {
        id: this.id
      })
    },
    report() {
      this.$refs.newsreport.show()
    }
  }
}
</script>
