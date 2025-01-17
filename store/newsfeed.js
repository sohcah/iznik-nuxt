import cloneDeep from 'lodash.clonedeep'

export const state = () => ({
  // Use array for newsfeed as we need ordering.
  newsfeed: [],
  users: {},
  context: {},
  area: 'nearby'
})

export const mutations = {
  addNewsfeed(state, item) {
    // Remove any existing copy.  Not great to scan an array, but this is only used when (re)fetching a single
    // item and therefore it's not too bad.
    state.newsfeed = state.newsfeed.filter(obj => {
      return parseInt(obj.id) !== parseInt(item.id)
    })

    state.newsfeed.unshift(item)
  },

  removeNewsfeed(state, id) {
    state.newsfeed = state.newsfeed.filter(obj => {
      return parseInt(obj.id) !== parseInt(id)
    })
  },

  mergeNewsfeed(state, payload) {
    const items =
      typeof payload.newsfeed === 'object'
        ? Object.values(payload.newsfeed)
        : payload.newsfeed

    if (items) {
      for (const item of items) {
        state.newsfeed.push(item)
      }
    }
  },

  mergeUsers(state, payload) {
    const items =
      typeof payload.users === 'object'
        ? Object.values(payload.users)
        : payload.users

    if (items) {
      for (const item of items) {
        if (state.users[item.id]) {
          // Already there.  Merge in all fields.  This is because we can get users with different levels of
          // info in them (e.g. users in replies have less info) and we don't want to lose info by overwriting.
          state.users[item.id] = Object.assign(state.users[item.id], item)
        } else {
          state.users[item.id] = item
        }
      }
    }
  },

  setContext(state, params) {
    state.context = params.ctx
  },

  area(state, payload) {
    state.area = payload.area
  },

  clearFeed(state) {
    state.newsfeed = []
    state.context = {}
  }
}

export const getters = {
  get: state => id => {
    const ret = state.newsfeed
      ? state.newsfeed.find(item => {
          return parseInt(item.id) === parseInt(id)
        })
      : null

    return ret
  },

  newsfeed: state => () => {
    return state.newsfeed
  },

  users: state => () => {
    return state.users
  },

  getContext: state => () => {
    return state.context
  },

  area: state => id => {
    return state.area
  }
}

export const actions = {
  clearFeed({ commit }, params) {
    commit('clearFeed')
  },

  async fetchFeed({ commit, state }, params) {
    params = params || {
      context: {}
    }

    if (params.context) {
      // Ensure the context is a real object, in case it has been in the store.
      const ctx = cloneDeep(params.context)
      params.context = ctx
    }

    // Ensure the context has the correct distance we want to see.
    params.context = params.context === null ? {} : params.context
    params.context.distance = state.area

    params.types = [
      'Message',
      'CommunityEvent',
      'VolunteerOpportunity',
      'Alert',
      'Story',
      'AboutMe',
      'Noticeboard'
    ]

    const res = await this.$axios.get(process.env.API + '/newsfeed', {
      params: params
    })

    if (res.status === 200) {
      commit('mergeNewsfeed', res.data)

      // We get some users back but might miss some in replies.
      const users = res.data.users
      commit('mergeUsers', {
        users: users
      })

      if (!params || !params.noContext) {
        commit('setContext', {
          ctx: res.data.context ? res.data.context : null
        })
      }
    }
  },

  async fetch({ commit }, params) {
    let newsfeedobj = null

    const newsfeed = await this.$axios.get(process.env.API + '/newsfeed', {
      params: params
    })

    if (newsfeed.status === 200 && newsfeed.data.ret === 0) {
      newsfeedobj = newsfeed.data.newsfeed

      if (newsfeedobj) {
        // Valid id
        commit('addNewsfeed', newsfeedobj)

        const user = newsfeed.data.newsfeed.user

        if (user) {
          const users = {}
          users[user.id] = user

          // Also add in any users from replies.
          for (const reply of newsfeed.data.newsfeed.replies) {
            users[reply.user.id] = reply.user
          }

          commit('mergeUsers', {
            users: users
          })
        }
      }
    }

    return newsfeedobj
  },

  async send({ commit, dispatch }, params) {
    let newsfeedobj = null

    const newsfeed = await this.$axios.post(
      process.env.API + '/newsfeed',
      params
    )

    if (newsfeed.status === 200 && newsfeed.data.ret === 0) {
      // The thread head may have been passed (for a reply) or if not, then it's a new thread and the id is returned.
      newsfeedobj = await dispatch('fetch', {
        id: params.threadhead ? params.threadhead : newsfeed.data.id
      })
    }

    return newsfeedobj
  },

  async love({ commit, dispatch }, params) {
    await this.$axios.post(process.env.API + '/newsfeed', {
      id: params.id,
      action: 'Love'
    })

    // We fetch the thread head to force a rerender
    await dispatch('fetch', {
      id: params.threadhead
    })
  },

  async unlove({ commit, dispatch }, params) {
    await this.$axios.post(process.env.API + '/newsfeed', {
      id: params.id,
      action: 'Unlove'
    })

    // We fetch the thread head to force a rerender
    await dispatch('fetch', {
      id: params.threadhead
    })
  },

  async edit({ commit, dispatch }, params) {
    await this.$axios.post(
      process.env.API + '/newsfeed',
      {
        id: params.id,
        message: params.message,
        action: 'Edit'
      },
      {
        headers: {
          'X-HTTP-Method-Override': 'PATCH'
        }
      }
    )

    // We fetch the thread head to force a rerender
    await dispatch('fetch', {
      id: params.threadhead
    })
  },

  async delete({ commit, dispatch }, params) {
    await this.$axios.post(
      process.env.API + '/newsfeed',
      {
        id: params.id
      },
      {
        headers: {
          'X-HTTP-Method-Override': 'DELETE'
        }
      }
    )

    if (params.id !== params.threadhead) {
      // We fetch the thread head to force a rerender
      await dispatch('fetch', {
        id: params.threadhead
      })
    } else {
      commit('removeNewsfeed', params.id)
    }
  },

  async unfollow({ commit, dispatch }, params) {
    await this.$axios.post(process.env.API + '/newsfeed', {
      id: params.id,
      action: 'Unfollow'
    })
  },

  async report({ commit, dispatch }, params) {
    await this.$axios.post(process.env.API + '/newsfeed', {
      id: params.id,
      reason: params.reason,
      action: 'Report'
    })
  }
}
