'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var VK_API_URL = 'https://api.vk.com/';
var _events = [];

var VKBot = function () {
  function VKBot(token) {
    var _this = this;

    (0, _classCallCheck3.default)(this, VKBot);

    this.on = function (pattern, exec) {
      //maybe should use startWith?
      _events.push({ pattern: pattern, exec: exec });
    };

    this.uploadPhoto = function () {
      var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(path) {
        var data, upload, photos;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _this.api('photos.getMessagesUploadServer');

              case 2:
                data = _context.sent;
                _context.next = 5;
                return (0, _requestPromise2.default)({
                  uri: data.response.upload_url,
                  method: 'POST',
                  formData: {
                    photo: _fs2.default.createReadStream(path)
                  },
                  json: true
                });

              case 5:
                upload = _context.sent;
                _context.next = 8;
                return _this.api('photos.saveMessagesPhoto', upload);

              case 8:
                photos = _context.sent;

                if (!(!photos.response || photos.response.length == 0)) {
                  _context.next = 11;
                  break;
                }

                throw new Error('Cant upload photo: ' + photos);

              case 11:
                return _context.abrupt('return', photos.response[0]);

              case 12:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, _this);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }();

    this.api = function () {
      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(method, params) {
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!params) params = {};
                params.access_token = _this.token;
                params.version = 5.62;

                return _context2.abrupt('return', (0, _requestPromise2.default)({
                  uri: VK_API_URL + '/method/' + method,
                  method: 'POST',
                  formData: params,
                  json: true
                }));

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, _this);
      }));

      return function (_x2, _x3) {
        return _ref2.apply(this, arguments);
      };
    }();

    if (!token) throw new Error('Access token is required');

    this.token = token;
    this.poll = new LongPoll(this, 250);
  }

  (0, _createClass3.default)(VKBot, [{
    key: 'reply',


    //idk for what it here
    value: function reply(peer, data) {
      if (typeof data === 'string') data = { user_id: peer, message: data };else data = (0, _assign2.default)(data, { user_id: peer });
      this.api('messages.send', data);
    }
  }, {
    key: 'onUpdates',
    value: function onUpdates(updates) {
      var _this2 = this;

      updates.forEach(function (update) {
        //4 is new message code
        if (update[0] === 4) return _this2.onMessage({
          flags: update[2],
          peer: update[3],
          time: update[4],
          text: update[6]
        });
      });
    }
  }, {
    key: 'onMessage',
    value: function onMessage(message) {
      var targetEvent = _events.find(function (_ref3) {
        var pattern = _ref3.pattern;
        return new RegExp(pattern).test(message.text);
      });
      if (targetEvent) targetEvent.exec(message, new RegExp(targetEvent.pattern).exec(message.text));
    }
  }]);
  return VKBot;
}();

var LongPoll = function LongPoll(client, timeout) {
  (0, _classCallCheck3.default)(this, LongPoll);

  _initialiseProps.call(this);

  this.client = client;
  this.timeout = timeout || 1000;

  this.startPolling();
};

var _initialiseProps = function _initialiseProps() {
  var _this3 = this;

  this.startPolling = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return _this3.getPollSession();

          case 2:
            _this3.getUpdates();

          case 3:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this3);
  }));
  this.getPollSession = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
    var data;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return _this3.client.api('messages.getLongPollServer');

          case 2:
            data = _context4.sent;


            _this3.server = 'https://' + data.response.server;
            _this3.key = data.response.key;
            _this3.ts = data.response.ts;

          case 6:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, _this3);
  }));

  this.getUpdates = function () {
    var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(ts) {
      var data;
      return _regenerator2.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return (0, _requestPromise2.default)({
                uri: _this3.server,
                qs: {
                  act: 'a_check',
                  key: _this3.key,
                  ts: ts || _this3.ts,
                  wait: 25,
                  mode: 2,
                  version: 1
                },
                json: true
              });

            case 2:
              data = _context5.sent;


              //TODO errors handling

              _this3.client.onUpdates(data.updates);

              _context5.next = 6;
              return _this3.sleep(_this3.timeout);

            case 6:
              _this3.getUpdates(data.ts);

            case 7:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, _this3);
    }));

    return function (_x4) {
      return _ref6.apply(this, arguments);
    };
  }();

  this.sleep = function (timeout) {
    return new _promise2.default(function (resolve) {
      return setTimeout(resolve, timeout);
    });
  };
};

exports.default = VKBot;