'use strict';

import {showErrorMsg, clearErrors} from './utils.js';
import {Router} from './router.js';
// import {sendMsg} from './chatws.js'
/**
 * Base view class
 */
class BaseRoute {
  /**
   * BaseRoute constructor
   * @param {Node} rootEl - DOM element
   * @param {Router} router - route object
   * @param {Object} controller - business logic implementer
   * @param {SubscribeAdapter} subscriber - adapter allowint event subscription
   */
  constructor(rootEl, router, controller = null, subscriber = null) {
    if (!(rootEl instanceof Node)) {
      throw new TypeError('rootEl must be Node');
    }
    if (!(router instanceof Router)) {
      throw new TypeError('router must be Router');
    }

    this._rootEl = rootEl;
    this._router = router;
    this._controller = controller;
    this._subscriber = subscriber;
    this._eventHandlers = {};
    if (this.render) {
      this._render = this.render.bind(this);
    }
  }

  /**
   * Adds listener of specific event
   * @param {Event} event - DOM event
   * @param {Function} handler - handler, duh
   */
  _addListener(event, handler) {
    if (!(event in this._eventHandlers)) {
      this._eventHandlers[event] = [];
    }

    this._eventHandlers[event].push(handler);
    this._rootEl.addEventListener(event, handler);
  }

  /**
   * Remove listeners of specific event
   * @param {Event} event - event to remove
   */
  _removeAllListeners(event) {
    if (event in this._eventHandlers) {
      const eventHandlers = this._eventHandlers[event];
      for (let i = eventHandlers.length; i--;) {
        const handler = eventHandlers[i];
        this._rootEl.removeEventListener(event, handler);
      }
    }
  }

  /**
   * Inits route
   */
  init() { }

  /**
   * Reverts route init
   */
  deinit() {
    this._rootEl.innerHTML = '';
    for (event in this._eventHandlers) {
      if (this._eventHandlers.hasOwnProperty(event)) {
        this._removeAllListeners(event);
      }
    }
  }
}

/**
 * BaseRoute extension for index.html render
 */
class IndexRoute extends BaseRoute {
  /**
   * IndexRoute constructor
   * @param {Array} args - argumets to pass to BaseRoute constructor
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * initializer
   */
  prerender() {
    this._rootEl.innerHTML = Handlebars.templates['menu.html']({
      isAuthorized: null,
    });
  }

  /**
   * Renders route after receiving event
   * @param {Object} state - passed global state
   * @param {String} key - event type
   * @param {*} value - event data
   */
  render(state, key, value) {
    this._rootEl.innerHTML = Handlebars.templates['menu.html']({
      isAuthorized: value,
    });
  }

  /**
   * Inits route
   */
  init() {
    this.prerender();
    this._subscriber.subscribeEvent('UserLoaded', this._render);
    this._controller.getUser();
    super.init();
  }
  /**
   * deinitializer
   */
  deinit() {
    this._subscriber.unsubscribeEvent('UserLoaded', this._render);
    super.deinit();
  }
}

/**
 * BaseRoute extension for login.html render
 */
class LoginRoute extends BaseRoute {
  /**
   * LoginRoute constructor
   * @param {Array} args - argumets to pass to BaseRoute constructor
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * Renders route after receiving event
   * @param {Object} state - passed global state
   * @param {String} key - event type
   * @param {*} value - event data
   */
  render(state, key, value) {
    if (value === 'success') {
      this._router.routeTo('/');
      return;
    }

    showErrorMsg(this._form, value.errorField, value.error);
  }

  /**
   * Inits route
   */
  init() {
    this._rootEl.innerHTML = Handlebars.templates['login.html']();
    this._addListener('submit', (event) => {
      event.preventDefault();
      this._form = event.target;
      clearErrors(this._form);

      const login = this._form.elements['login'].value;
      const password = this._form.elements['password'].value;
      this._controller.login(login, password);
    });

    this._subscriber.subscribeEvent('LoggedIn', this._render);
    super.init();
  }

  /**
   * Reverts route init
   */
  deinit() {
    this._subscriber.unsubscribeEvent('LoggedIn', this._render);
    super.deinit();
  }
}

/**
 * BaseRoute extension for settings.html render
 */
class SettingsRoute extends BaseRoute {
  /**
   * SettingsRoute constructor
   * @param {Array} args - argumets to pass to BaseRoute constructor
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * Renders route after receiving event
   * @param {Object} state - passed global state
   * @param {String} key - event type
   * @param {*} value - event data
   */
  render(state, key, value) {
    if (value !== 'success') {
      showErrorMsg(this._form, value.errorField, value.error);
      return;
    }

    if (key === 'ProfileUpdated') {
      this._waitingAvatarUpdate = false;
    }

    if (key === 'AvatarUpdated') {
      this._waitingAvatarUpdate = false;
    }

    if (this._waitingProfileUpdate && this._waitingAvatarUpdate) {
      return;
    }

    this._router.routeTo('/');
  }

  /**
   * Inits route
   */
  init() {
    this._rootEl.innerHTML = Handlebars.templates['settings.html']();
    this._addListener('submit', (event) => {
      event.preventDefault();
      this._form = event.target;
      clearErrors(this._form);

      const login = this._form.elements['login'].value;
      const password = this._form.elements['password'].value;
      const repassword = this._form.elements['repeat_password'].value;
      const input = this._form.elements['avatar'];

      if (input.value) {
        this._waitingAvatarUpdate = true;
      }

      this._controller.updateProfile(login, password, repassword, input);
    });

    this._waitingProfileUpdate = true;
    this._subscriber.subscribeEvent('ProfileUpdated', this._render);
    this._subscriber.subscribeEvent('AvatarUpdated', this._render);

    super.init();
  }

  /**
   * Reverts route init
   */
  deinit() {
    this._subscriber.unsubscribeEvent('ProfileUpdated', this._render);
    this._subscriber.unsubscribeEvent('AvatarUpdated', this._render);

    super.deinit();
  }
}

/**
 * BaseRoute extension for profile.html render
 */
class ProfileRoute extends BaseRoute {
  /**
   * ProfileRoute constructor
   * @param {Array} args - argumets to pass to BaseRoute constructor
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * Renders route after receiving event
   * @param {Object} state - passed global state
   * @param {String} key - event type
   * @param {*} value - event data
   */
  render(state, key, value) {
    if (value) {
      /* TODO(everyone): make settings file */
      const user = value;
      this._rootEl.innerHTML = Handlebars.templates['profile.html']({
        login: user.login,
        email: user.email,
        avatar_path: user.img,
        score: user.score,
      });
    } else {
      this._router.routeTo('/');
    }
  }

  /**
   * Inits route
   */
  init() {
    this._subscriber.subscribeEvent('UserLoaded', this._render);
    this._controller.getUser();
    super.init();
  }

  /**
   * Reverts route init
   */
  deinit() {
    this._subscriber.unsubscribeEvent('UserLoaded', this._render);
    super.deinit();
  }
}

/**
 * BaseRoute extension for signup.html render
 */
class SignUpRoute extends BaseRoute {
  /**
   * SignUpRoute constructor
   * @param {Array} args - argumets to pass to BaseRoute constructor
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * Renders route after receiving event
   * @param {Object} state - passed global state
   * @param {String} key - event type
   * @param {*} value - event data
   */
  render(state, key, value) {
    if (value === 'success') {
      this._router.routeTo('/');
      return;
    }

    showErrorMsg(this._form, value.errorField, value.error);
  }

  /**
   * Inits route
   */
  init() {
    this._rootEl.innerHTML = Handlebars.templates['signup.html']();
    this._addListener('submit', (event) => {
      event.preventDefault();
      this._form = event.target;
      clearErrors(this._form);

      const login = this._form.elements['login'].value;
      const email = this._form.elements['email'].value;
      const password = this._form.elements['password'].value;
      const repassword = this._form.elements['repeat_password'].value;

      this._controller.signUp(login, email, password, repassword);
    });

    this._subscriber.subscribeEvent('SignedUp', this._render);
    super.init();
  }

  /**
   * Reverts route init
   */
  deinit() {
    this._subscriber.unsubscribeEvent('SignedUp', this._render);
    super.deinit();
  }
}

/**
 * BaseRoute extension for leaderboard.html render
 */
class LeaderBoardRoute extends BaseRoute {
  /**
   * LeaderBoardRoute constructor
   * @param {Array} args - argumets to pass to BaseRoute constructor
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * Initial route render
   */
  prerender() {
    this.render({}, '', {
      users: [],
      pageCount: 0,
      currentPage: 0,
    });
  }

  /**
   * Renders route after receiving event
   * @param {Object} state - passed global state
   * @param {String} key - event type
   * @param {*} value - event data
   */
  render(state, key, value) {
    this._rootEl.innerHTML =
      Handlebars.templates['leaderboard.html']({
        users: value.users,
        pageCount: value.pageCount,
        currentPage: value.currentPage,
        size: '5',
      });

    const pagination = document.getElementById('pagination');
    pagination.addEventListener('click', (event) => {
      event.preventDefault();
      const link = event.target;
      const page = link.getAttribute('href');
      this._controller.getLeaderboard(page);
    });
  }

  /**
   * Inits route
   */
  init() {
    this.prerender();
    this._subscriber.subscribeEvent('LeaderboardLoaded', this._render);
    this._controller.getLeaderboard(1);

    super.init();
  }

  /**
   * Reverts route init
   */
  deinit() {
    this._subscriber.unsubscribeEvent('LeaderboardLoaded', this._render);

    super.deinit();
  }
}

/**
 * BaseRoute extension for about.html render
 */
class AboutRoute extends BaseRoute {
  /**
   * AboutRoute constructor
   * @param {Node} rootEl - DOM element
   * @param {Router} router - route object
   */
  constructor(rootEl, router) {
    super(rootEl, router);
  }

  /**
   * Inits route
   */
  init() {
    this._rootEl.innerHTML = Handlebars.templates['about.html']();
    super.init();
  }

  /**
   * Reverts route init
   */
  deinit() {
    super.deinit();
  }
}

/**
 * BaseRoute extension for logout pseudo-render
 */
class LogoutRoute extends BaseRoute {
  /**
   * LogoutRoute constructor
   * @param {Array} args - argumets to pass to BaseRoute constructor
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * Renders route after receiving event
   * @param {Object} state - passed global state
   * @param {String} key - event type
   * @param {*} value - event data
   */
  render(state, key, value) {
    if (value === 'success') {
      this._router.routeTo('/');
    }
  }

  /**
   * Inits route
   */
  init() {
    // TODO: actually we can draw logged menu to exclude short glitch on logout
    this._subscriber.subscribeEvent('LoggedOut', this._render);
    this._controller.logout();
    super.init();
  }

  /**
   * Reverts route init
   */
  deinit() {
    this._subscriber.unsubscribeEvent('LoggedOut', this._render);
    super.deinit();
  }
}

class SinglePlayerRoute extends BaseRoute {
  /**
   * AboutRoute constructor
   * @param {Node} rootEl - DOM element
   * @param {Router} router - route object
   */
  constructor(rootEl, router, controller, subscriber) {
    super(rootEl, router, controller, subscriber);
  }

  render(state, key, value) {
    let context = {};
    if (key === 'QuestionList') {
      const round = value.round;
      const users = value.users;

      context = {
        num: round.questionCount + 1,
        themes: round.themes,
        users: users,
        isQuestionList: true,
      };
    } else if (key === 'Question') {
      context = {
        users: value.users,
        question: value.question,
        isQuestion: true,
        num: 1,
      };
    } else if (key === 'Message') {
      context = {
        users: value.users,
        message: value.message,
        isMessage: true,
        num: 1,
      };
    }

    this._rootEl.innerHTML = Handlebars.templates['svoyak.html'](context);
  }

  /**
   * Inits route
   */
  init() {
    this._controller.init();

    this._addListener('click', (event) => {
      const questionEl = document.getElementById('questions');
      if (!questionEl) {
        return;
      }

      let tile = event.target;
      if (!questionEl.isSameNode(tile.parentElement)) {
        tile = tile.parentElement;

        if (!questionEl.isSameNode(tile.parentElement)) {
          return;
        }
      }

      event.preventDefault();

      this._controller.displayQuestion(tile);
    });

    this._addListener('submit', (event) => {
      event.preventDefault();
      this._form = event.target;
      clearErrors(this._form);

      const answer = this._form.elements['answer'].value;

      this._controller.displayAnswer(answer);
    });

    this._subscriber.subscribeEvent('QuestionList', this._render);
    this._subscriber.subscribeEvent('Question', this._render);
    this._subscriber.subscribeEvent('Message', this._render);
    super.init();
  }

  /**
   * Reverts route init
   */
  deinit() {
    super.deinit();
    this._subscriber.unsubscribeEvent('QuestionList', this._render);
    this._subscriber.unsubscribeEvent('Question', this._render);
    this._subscriber.unsubscribeEvent('Message', this._render);
  }
}

class NotFoundRoute extends BaseRoute {
  constructor(rootEl, router) {
    super(rootEl, router);
  }

  init() {
    console.log('NOT FND');
    this._rootEl.innerHTML = Handlebars.templates['404.html']();
    super.init();
  }

  deinit() {
    super.deinit();
  }
}

class ChatRoute extends BaseRoute {
  /**
   * AboutRoute constructor
   * @param {Node} rootEl - DOM element
   * @param {Router} router - route object
   */
  constructor(...args) {
    super(...args);
  }

  render(state, key, value) {
    let p = document.createElement('p');
    let img = document.createElement('img');
    p.innerText = value.text;
    document.getElementById('text-field').appendChild(p);
  }
  /**
   * Inits route
   */
  init() {
    this._subscriber.subscribeEvent('Msg', this._render);
    this._rootEl.innerHTML = Handlebars.templates['chat.html']();
    let text = document.getElementById('pop-up');
    text.addEventListener('submit', (event) => {
      event.preventDefault();
      this._form = event.target;
      let msg = this._form.elements["text"].value;
      console.log(msg);
      this._controller.sendMsg(msg);
    });

    super.init();
  }

  /**
   * Reverts route init
   */
  deinit() {
    this._subscriber.unsubscribeEvent('Msg', this._render);
    super.deinit();
  }
}

export {
  IndexRoute,
  LoginRoute,
  LeaderBoardRoute,
  SignUpRoute,
  ProfileRoute,
  SettingsRoute,
  AboutRoute,
  LogoutRoute,
  SinglePlayerRoute,
  NotFoundRoute,
  ChatRoute,
};
