<template>
  <b-modal
    v-if="!loggedIn"
    id="loginModal"
    ref="loginModal"
    v-model="showModal"
    title="Let's get freegling!"
    no-stacking
    visible
    size="lg"
    hide-footer
    no-close-on-backdrop
  >
    <b-row>
      <b-col class="text-center pb-3">
        You will receive emails, and your name and approximate location will be public.  You can
        control privacy from Settings.  Read <nuxt-link target="_blank" to="/terms">
          Terms of Use
        </nuxt-link> and
        <nuxt-link target="_blank" to="/privacy">
          Privacy
        </nuxt-link> for details.
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12" lg="6" class="text-center">
        <p v-if="showSignUp">
          <b>Using one of these buttons is the easiest way to create an account:</b>
        </p>
        <b-img alt="Facebook login" :class="'loginbutton clickme ' + (facebookDisabled ? ' signindisabled' : '')" src="~/static/signinbuttons/facebook.png" @click="loginFacebook" />
        <b-img alt="Google login" :class="'mb-1 loginbutton clickme ' + (googleDisabled ? ' signindisabled' : '')" src="~/static/signinbuttons/google.png" @click="loginGoogle" />
        <b-img alt="Yahoo login" :class="'loginbutton clickme ' + (yahooDisabled ? ' signindisabled' : '')" src="~/static/signinbuttons/yahoo.png" @click="loginYahoo" />
        <notice-message v-if="socialblocked" variant="warning">
          Social sign in blocked - check your privacy settings
        </notice-message>
      </b-col>
      <b-col cols="12" class="d-block d-lg-none">
        <b-row>
          <b-col cols="5">
            <hr class="text-danger pb-2 d-block d-lg-none login__splitter">
          </b-col>
          <b-col cols="2" class="text-center">
            <em>Or</em>
          </b-col>
          <b-col cols="5">
            <hr class="text-danger pb-2 d-block d-lg-none login__splitter">
          </b-col>
        </b-row>
      </b-col>
      <b-col cols="12" lg="6" class="mt-0">
        <b-form ref="form" action="/" autocomplete="on" method="post" @submit="loginNative">
          <div>
            <b-row v-if="showSignUp">
              <b-col>
                <b-form-input
                  id="firstname"
                  ref="firstname"
                  v-model="firstname"
                  name="firstname"
                  placeholder="Your first name"
                  alt="First name"
                  class="mb-3"
                  autocomplete="given-name"
                />
              </b-col>
            </b-row>
            <b-row v-if="showSignUp">
              <b-col>
                <b-form-input
                  id="lastname"
                  ref="lastname"
                  v-model="lastname"
                  name="lastname"
                  placeholder="Your last name"
                  alt="Last name"
                  class="mb-3"
                  autocomplete="family-name"
                />
              </b-col>
            </b-row>
            <b-row>
              <b-col>
                <b-form-input
                  id="email"
                  ref="email"
                  v-model="email"
                  name="email"
                  placeholder="Your email address"
                  alt="Email address"
                  class="mb-3"
                  autocomplete="username email"
                />
              </b-col>
            </b-row>
            <b-row>
              <b-col>
                <b-form-input
                  id="password"
                  ref="password"
                  v-model="password"
                  name="password"
                  type="password"
                  placeholder="Your password"
                  alt="Password"
                  class="mb-2"
                  autocomplete="current-password"
                />
              </b-col>
            </b-row>
            <b-row>
              <b-col>
                <b-btn
                  v-b-modal.add
                  block
                  size="lg"
                  variant="success"
                  class="mb-2 mt-2"
                  type="submit"
                  value="login"
                >
                  <span v-if="!showSignUp">
                    Sign in to Freegle
                  </span>
                  <span v-else>
                    Sign up to Freegle
                  </span>
                </b-btn>
              </b-col>
            </b-row>
            <b-row v-if="!showSignUp">
              <b-col class="text-center">
                <nuxt-link to="/forgot">
                  I forgot my password
                </nuxt-link>
              </b-col>
            </b-row>
            <b-row v-if="!showSignUp">
              <b-col class="text-center">
                New freegler? <a href="#" @click="clickShowSignUp">Sign Up</a>
              </b-col>
            </b-row>
            <b-row v-else>
              <b-col class="text-center">
                Already a freegler? <a href="#" @click="clickShowSignIn">Sign In</a>
              </b-col>
            </b-row>
          </div>
        </b-form>
      </b-col>
    </b-row>
  </b-modal>
</template>

<style scoped lang="scss">
@import 'color-vars';

.loginbutton {
  width: 303px;
}

.login__splitter {
  border-top: 1px solid $color-red;
}

.signindisabled {
  opacity: 0.2;
}
</style>

<script>
// TODO Eye icon to show password for mobile
// TODO DESIGN Need vertical line or some other way to indicate that the form on the right is an alternative to
// the buttons.
// TODO DESIGN Spacing and alignment of the buttons is a bit off.
// TODO DESIGN MINOR Would be nice to have "Sign up" buttons for social sign in.
// TODO DESIGN Google's terms require the square icon, which is annoyingly inconsistent with the others.  Are we
// allowed to have square other ones?  If so, please make such images.
import Vue from 'vue'
const NoticeMessage = () => import('~/components/NoticeMessage')

export default {
  components: {
    NoticeMessage
  },
  data: function() {
    return {
      bump: Date.now(),
      firstname: null,
      lastname: null,
      email: null,
      password: null,
      pleaseShowModal: false,
      showSignUp: false
    }
  },

  computed: {
    loggedIn() {
      const ret = Boolean(this.$store.getters['auth/user']())
      return ret
    },

    // Use of this.bump means we will recompute when we need to, i.e. when the modal is shown.  This is overriding
    // normal reactivity but that's because the SDKs we use aren't written in Vue.
    facebookDisabled() {
      const ret = this.bump && typeof Vue.FB === 'undefined'
      console.log('Compute facebook disabled', ret, this.bump, Vue.FB)
      return ret
    },

    googleDisabled() {
      const ret = this.bump && (!window || !window.gapi || !window.gapi.client)
      console.log('Compute Google disabled', ret, window)
      return ret
    },

    yahooDisabled() {
      // Yahoo currently can't be disabled, because it's redirect auth flow rather than load of a JS toolkit.
      return false
    },

    socialblocked() {
      const ret =
        this.bump &&
        (this.facebookDisabled || this.googleDisabled || this.yahooDisabled)
      console.log('compute socialblocked', ret)
      return ret
    },

    showModal() {
      return this.pleaseShowModal || this.$store.getters['auth/forceLogin']()
    },

    loggedInEver() {
      return this.$store.getters['auth/loggedInEver']()
    },

    signUp() {
      return !this.loggedInEver() || this.showSignUp
    }
  },

  methods: {
    show() {
      // Force reconsideration of social signin disabled.
      this.bump = Date.now()
      this.pleaseShowModal = true
    },
    hide() {
      this.pleaseShowModal = false
    },
    loginNative(e) {
      const self = this
      e.preventDefault()
      e.stopPropagation()

      if (this.showSignUp) {
        this.$store
          .dispatch('auth/signup', {
            firstname: this.firstname,
            lastname: this.lastname,
            email: this.email,
            password: this.password
          })
          .then(() => {
            // We are now logged in. Prompt the browser to remember the credentials.
            if (window.PasswordCredential) {
              try {
                const c = new window.PasswordCredential(e.target)
                navigator.credentials
                  .store(c)
                  .then(function() {
                    self.pleaseShowModal = false
                  })
                  .catch(err => {
                    console.error('Failed to save credentials', err)
                  })
              } catch (e) {
                self.pleaseShowModal = false
              }
            } else {
              self.pleaseShowModal = false
            }

            if (this.$nuxt.path === '/' || !this.$nuxt.path) {
              // We've signed up from the home page.  Send them to chitchat - that shows some activity, and also
              // has the Give/Find prompt.
              this.$router.push('/chitchat')
            }
          })
          .catch(e => {
            // TODO
            console.error('Native login failed', e)
          })
      } else {
        // Login
        this.$store
          .dispatch('auth/login', {
            email: this.email,
            password: this.password
          })
          .then(() => {
            // We are now logged in. Prompt the browser to remember the credentials.
            if (window.PasswordCredential) {
              try {
                const c = new window.PasswordCredential(e.target)
                navigator.credentials
                  .store(c)
                  .then(function() {
                    self.pleaseShowModal = false
                  })
                  .catch(err => {
                    console.error('Failed to save credentials', err)
                  })
              } catch (e) {
                self.pleaseShowModal = false
              }
            } else {
              self.pleaseShowModal = false
            }
          })
          .catch(e => {
            // TODO
            console.error('Native login failed', e)
          })
      }
    },
    async loginFacebook() {
      console.log('Facebook login')
      // TODO Do we still have the Chrome on IOS problem?
      try {
        let response = null
        const promise = new Promise(function(resolve, reject) {
          Vue.FB.login(
            function(ret) {
              console.log('Returned in promise', ret)
              response = ret
              resolve()
            },
            { scope: 'email' }
          )
        })

        await promise
        console.log('Returned after promise', response)
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken
          console.log('Now login on server', accessToken)

          await this.$store.dispatch('auth/login', {
            fblogin: 1,
            fbaccesstoken: accessToken
          })

          // We are now logged in.
          console.log('Logged in')
          self.pleaseShowModal = false
        } else {
          console.error('Facebook response missing auth', response)
          throw new Error('Facebook response missing auth')
        }
      } catch (e) {
        // TODO
        console.error('Native login failed', e)
      }
    },

    loginGoogle() {
      const params = {
        clientid: process.env.GOOGLE_CLIENT_ID,
        cookiepolicy: 'single_host_origin',
        callback: async authResult => {
          console.log('Signin returned', authResult)
          if (authResult.access_token) {
            console.log('Signed in')

            await this.$store.dispatch('auth/login', {
              googleauthcode: authResult.code,
              googlelogin: true
            })

            // We are now logged in.
            console.log('Logged in')
            self.pleaseShowModal = false
          } else if (authResult.error) {
            // TODO
            console.error('There was an error: ' + authResult.error)
          }
        },
        immediate: false,
        scope: 'profile email',
        app_package_name: 'org.ilovefreegle.direct'
      }

      window.gapi.auth.signIn(params)
    },

    loginYahoo() {
      // Sadly Yahoo doesn't support a Javascript-only OAuth flow, so far as I can tell.  So what we do is
      // post to the server, get a redirection URL from there, redirect on here to Yahoo to complete the
      // signin, and then return to a /yahoologin route.
      console.log(
        'Yahoo login',
        this.$route.query.page,
        window.location,
        document.URL
      )
      let match
      const pl = /\+/g // Regex for replacing addition symbol with a space
      const search = /([^&=]+)=?([^&]*)/g
      const decode = function(s) {
        return decodeURIComponent(s.replace(pl, ' '))
      }
      const query = window.location.search.substring(1)

      // We want to post to the server to do the login there.  We pass all the URL
      // parameters we have, which include the OpenID response.
      const urlParams = {}
      while ((match = search.exec(query)))
        urlParams[decode(match[1])] = decode(match[2])

      urlParams.yahoologin = true
      urlParams.returnto = document.URL
      urlParams.host =
        window.location.protocol +
        '//' +
        window.location.hostname +
        (window.location.port ? ':' + window.location.port : '')
      console.log('Got URL params', urlParams)

      this.$axios
        .post(process.env.API + '/session', urlParams)
        .then(result => {
          const ret = result.data

          console.log('Default Session login returned', ret)
          if (ret.redirect) {
            // We are not logged in - we need to redirect to Yahoo
            //
            // The URL returned by the server has its hostname in it, but perhaps we are running on a different
            // host, especially when developing.
            let url = ret.redirect
            const apihost = process.env.API.replace('https://', '').replace(
              '/api',
              ''
            )
            const re = new RegExp(apihost, 'g')
            url = url.replace(
              re,
              window.location.hostname +
                (window.location.port ? ':' + window.location.port : '')
            )
            console.log('Redirect to Yahoo', url)
            window.location = url
          } else if (ret.ret === 0) {
            // We are logged in.  Get the logged in user
            console.log('Logged in')
            this.$store.dispatch('auth/fetchUser')
            self.pleaseShowModal = false
          } else {
            // TODO
            console.error('Server login failed', ret)
          }
        })
        .catch(e => {
          // TODO
          console.error('Yahoo login failed', e)
        })
    },

    clickShowSignUp(e) {
      this.showSignUp = true
      e.preventDefault()
      e.stopPropagation()
    },

    clickShowSignIn(e) {
      this.showSignUp = false
      e.preventDefault()
      e.stopPropagation()
    }
  }
}
</script>
