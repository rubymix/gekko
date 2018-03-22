var _ = require('lodash');
const moment = require('moment');
const log = require('../core/log');
const util = require('../core/util');
const request = require('request');

class Korbit {
  constructor(clientId, clientSecret, username, password) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.username = username;
    this.password = password;

    this.accessToken = null;
    this.refreshToken = null;
    this.expireDate = new Date();
  }

  nonce() {
    return Math.round(Date.now() / 1000);
  }

  currencyPair(symbol) {
    switch (symbol) {
      case 'bchkrw':
        return 'bch_krw';
      case 'btckrw':
        return 'btc_krw';
      case 'etckrw':
        return 'etc_krw';
      case 'ethkrw':
        return 'eth_krw';
      case 'xrpkrw':
        return 'xrp_krw';
    }
    return symbol;
  }


  ticker(market, callback) {
    request.get({
      url: 'https://api.korbit.co.kr/v1/ticker/detailed',
      qs: { currency_pair: this.currencyPair(market) },
      json: true
    }, function(error, response, body) {
      if (error) {
        callback(error);
      } else if (response.statusCode !== 200) {
        callback(new Error('HTTP status code is ' + response.statusCode));
      } else {
        callback(null, body);
      }
    });
  }

  transactions(market, callback) {
    request.get({
      url: 'https://api.korbit.co.kr/v1/transactions',
      qs: {
        currency_pair: this.currencyPair(market),
        time: 'day' // minute hour day
      },
      json: true
    }, function(error, response, body) {
      if (error) {
        callback(error);
      } else if (response.statusCode !== 200) {
        callback(new Error('HTTP status code is ' + response.statusCode));
      } else {
        callback(null, body);
      }
    });
  }


  volume(callback) {
    this.auth((err) => {
      if (err) {
        return callback(err);
      }

      request.get({
        url: 'https://api.korbit.co.kr/v1/user/volume',
        headers: { Authorization: 'Bearer ' + this.accessToken },
        json: true
      }, (error, response, body) => {
        if (error) {
          callback(error);
        } else if (response.statusCode !== 200) {
          callback(new Error('HTTP status code is ' + response.statusCode));
        } else {
          callback(null, body);
        }
      });
    });
  }

  balances(callback) {
    this.auth((err) => {
      if (err) {
        return callback(err);
      }

      request.get({
        url: 'https://api.korbit.co.kr/v1/user/balances',
        headers: { Authorization: 'Bearer ' + this.accessToken },
        json: true
      }, (error, response, body) => {
        if (error) {
          callback(error);
        } else if (response.statusCode !== 200) {
          callback(new Error('HTTP status code is ' + response.statusCode));
        } else {
          callback(null, body);
        }
      });
    });
  }

  orders(market, id, callback) {
    this.auth((err) => {
      if (err) {
        return callback(err);
      }

      request.get({
        url: 'https://api.korbit.co.kr/v1/user/orders',
        headers: { Authorization: 'Bearer ' + this.accessToken },
        qs: {
          currency_pair: this.currencyPair(market),
          id: id
        },
        json: true
      }, (error, response, body) => {
        if (error) {
          callback(error);
        } else if (response.statusCode !== 200) {
          callback(new Error('HTTP status code is ' + response.statusCode));
        } else {
          callback(null, body);
        }
      });
    });
  }

  buy(market, amount, price, callback) {
    this.auth((err) => {
      if (err) {
        return callback(err);
      }

      request.post({
        url: 'https://api.korbit.co.kr/v1/user/orders/buy',
        headers: { Authorization: 'Bearer ' + this.accessToken },
        qs: {
          currency_pair: this.currencyPair(market),
          type: 'limit',
          price: price,
          coin_amount: amount,
          nonce: this.nonce(),
        },
        json: true
      }, (error, response, body) => {
        if (error) {
          callback(error);
        } else if (response.statusCode !== 200) {
          callback(new Error('HTTP status code is ' + response.statusCode));
        } else {
          callback(null, body);
        }
      });
    });
  }

  sell(market, amount, price, callback) {
    this.auth((err) => {
      if (err) {
        return callback(err);
      }

      request.post({
        url: 'https://api.korbit.co.kr/v1/user/orders/sell',
        headers: { Authorization: 'Bearer ' + this.accessToken },
        qs: {
          currency_pair: this.currencyPair(market),
          type: 'limit',
          price: price,
          coin_amount: amount,
          nonce: this.nonce(),
        },
        json: true
      }, (error, response, body) => {
        if (error) {
          callback(error);
        } else if (response.statusCode !== 200) {
          callback(new Error('HTTP status code is ' + response.statusCode));
        } else {
          callback(null, body);
        }
      });
    });
  }

  cancelOrders(market, id, callback) {
    this.auth((err) => {
      if (err) {
        return callback(err);
      }

      request.post({
        url: 'https://api.korbit.co.kr/v1/user/orders/cancel',
        headers: { Authorization: 'Bearer ' + this.accessToken },
        qs: {
          currency_pair: this.currencyPair(market),
          id: id,
          nonce: this.nonce(),
        },
        json: true
      }, (error, response, body) => {
        if (error) {
          callback(error);
        } else if (response.statusCode !== 200) {
          callback(new Error('HTTP status code is ' + response.statusCode));
        } else {
          callback(null, body);
        }
      });
    });
  }

  auth(done) {
    if (!this.clientId || !this.clientSecret || !this.username || !this.password) {
      return done(new Error('API key required'));
    }

    if (this.accessToken && this.expireDate.getTime() > Date.now()) {
      done();
    } else {
      this.requestAccessToken(done);
    }
  }

  requestAccessToken(done) {
    log.info('Request Korbit Access Token');
    request.post({
      url: 'https://api.korbit.co.kr/v1/oauth2/access_token',
      form: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        username: this.username,
        password: this.password,
        grant_type: 'password'
      },
      json: true
    }, (error, response, body) => {
      if (error) {
        done(error);
      } else if (response.statusCode !== 200) {
        done(new Error('HTTP status code is ' + response.statusCode));
      } else {
        this.accessToken = body.access_token;
        this.refreshToken = body.refresh_token;
        this.expireDate = new Date(Date.now() + body.expires_in * 1000);
        log.debug(body);
        done();
      }
    });
  }

  refreshAccessToken(done) {
    log.info('Refresh Korbit Access Token');
    request.post({
      url: 'https://api.korbit.co.kr/v1/oauth2/access_token',
      form: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      },
      json: true
    }, (error, response, body) => {
      if (error) {
        done(error);
      } else if (response.statusCode === 401) {
        this.accessToken = null;
        this.refreshToken = null;
        this.expireDate = new Date();
        done(new Error('HTTP status code is ' + response.statusCode));
      } else if (response.statusCode !== 200) {
        done(new Error('HTTP status code is ' + response.statusCode));
      } else {
        this.accessToken = body.access_token;
        this.refreshToken = body.refresh_token;
        this.expireDate = new Date(Date.now() + body.expires_in * 1000);
        log.debug(body);
        done();
      }
    });
  }
}

var Trader = function(config) {
  _.bindAll(this);
  if (_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.username = config.username;
    this.password = config.passphrase;
    this.asset = config.asset.toLowerCase();
    this.currency = config.currency.toLowerCase();
    this.market = this.asset + this.currency;
  }
  this.name = 'Korbit';

  this.korbit = new Korbit(this.key, this.secret, this.username, this.password);
};

// if the exchange errors we try the same call again after
// waiting 10 seconds
Trader.prototype.retry = function(method, args) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..');

  var self = this;

  // make sure the callback (and any other fn)
  // is bound to Trader
  _.each(args, function(arg, i) {
    if (_.isFunction(arg))
      args[i] = _.bind(arg, self);
  });

  // run the failed method again with the same
  // arguments after wait
  setTimeout(
    function() {
      method.apply(self, args);
    },
    wait
  );
};

Trader.prototype.stripAmount = function(amount) {
  switch (this.asset) {
    case 'bch':
    case 'btc':
    case 'etc':
    case 'eth':
      amount *= 100000000;
      amount = Math.floor(amount);
      amount /= 100000000;
      break;
    case 'xrp':
      amount *= 1000000;
      amount = Math.floor(amount);
      amount /= 1000000;
      break;
  }

  return amount;
};


// The callback needs to have the parameters of err and ticker.
// Ticker needs to be an object with atleast the bid and ask property in float.
Trader.prototype.getTicker = function(callback) {
  let args = _.toArray(arguments);
  let set = function(err, result) {
    if (err) {
      log.error(err);
      return this.retry(this.getTicker, args);
    }

    let ticker = {
      bid: parseFloat(result.bid),
      ask: parseFloat(result.ask),
    };
    callback(null, ticker);
  }.bind(this);

  this.korbit.ticker(this.market, set);
};

// The callback needs to have the parameters of err and fee.
// Fee is a float that represents the amount the exchange takes out of the orders Gekko places.
// If an exchange has a fee of 0.2% this should be 0.0002.
Trader.prototype.getFee = function(callback) {
  let args = _.toArray(arguments);
  let set = function(err, result) {
    if (err) {
      log.error(err);
      return this.retry(this.getFee, args);
    }

    let fee = parseFloat(result.btc_krw.maker_fee);
    callback(null, fee);
  }.bind(this);

  this.korbit.volume(set);
};

// The callback needs to have the parameters of err and portfolio.
// Portfolio needs to be an array of all currencies and assets combined in the form of objects, an example object looks like {name: 'BTC', amount: 1.42131} (name needs to be an uppercase string, amount needs to be a float).
Trader.prototype.getPortfolio = function(callback) {
  let args = _.toArray(arguments);
  let set = function(err, results) {
    if (err) {
      log.error(err);
      return this.retry(this.getPortfolio, args);
    }

    let portfolio = [];
    _.forEach(results, function(balance, asset) {
      portfolio.push({ name: asset.toUpperCase(), amount: parseFloat(balance.available) });
    });
    callback(null, portfolio);
  }.bind(this);

  this.korbit.balances(set);
};

// Note that this function is a critical function, retry handlers should abort quickly if attemps to dispatch this to the exchange API fail so we don't post out of date orders to the books.
Trader.prototype.buy = function(amount, price, callback) {
  let args = _.toArray(arguments);
  let set = function(err, result) {
    if (err) {
      log.error(err);
      return this.retry(this.buy, args);
    }

    if (result.status === 'success') {
      callback(null, result.orderId);
    } else {
      log.error('unable to buy: ' + result.status);
      return this.retry(this.sell, args);
    }
  }.bind(this);

  this.korbit.buy(this.market, this.stripAmount(amount), price, set);
};

// This should create a buy / sell order at the exchange for [amount] of [asset] at [price] per 1 asset.
// If you have set direct to true the price will be false.
// The callback needs to have the parameters err and order.
// The order needs to be something that can be fed back to the exchange to see wether the order has been filled or not.
// Note that this function is a critical function, retry handlers should abort quickly if attemps to dispatch this to the exchange API fail so we don't post out of date orders to the books.
Trader.prototype.sell = function(amount, price, callback) {
  let args = _.toArray(arguments);
  let set = function(err, result) {
    if (err) {
      log.error(err);
      return this.retry(this.sell, args);
    }

    if (result.status === 'success') {
      callback(null, result.orderId);
    } else {
      log.error('unable to sell: ' + result.status);
      return this.retry(this.sell, args);
    }
  }.bind(this);

  this.korbit.sell(this.market, this.stripAmount(amount), price, set);
};

// The order will be something that the manager previously received via the sell or buy methods.
// The callback should have the parameters err and order.
// Order is an object with properties price, amount and date.
// Price is the (volume weighted) average price of all trades necesarry to execute the order.
// Amount is the amount of currency traded and Date is a moment object of the last trade part of this order.
Trader.prototype.getOrder = function(id, callback) {
  let args = _.toArray(arguments);
  let set = function(err, results) {
    if (err) {
      log.error(err);
      return this.retry(this.getOrder, args);
    }

    let price = 0;
    let amount = 0;
    let date = moment(0);

    const order = _.first(results);
    if (order === undefined) {
      // cancel?
      log.debug('unable to get order ' + id + ': result is empty');
    } else {
      price = parseFloat(order.avg_price || order.price);
      amount = parseFloat(order.filled_amount);
      date = moment(order.last_filled_at || 0);
    }

    callback(null, { price, amount, date });
  }.bind(this);

  this.korbit.orders(this.market, id, set);
};

// The order will be something that the manager previously received via the sell or buy methods.
// The callback should have the parameters err and filled.
// Filled is a boolean that is true when the order is already filled and false when it is not.
// Currently partially filled orders should be treated as not filled.
Trader.prototype.checkOrder = function(id, callback) {
  let args = _.toArray(arguments);
  let set = function(err, results) {
    if (err) {
      log.error(err);
      return this.retry(this.checkOrder, args);
    }

    const order = _.first(results);
    if (order === undefined) {
      log.debug('unable to check order ' + id + ': result is empty');
      callback(null, true);
    } else if (order.status === 'filled') {
      callback(null, true);
    } else if (order.status === 'partially_filled') {
      callback(null, false);
    } else if (order.status === 'unfilled') {
      callback(null, false);
    } else {
      callback(null, false);
    }
  }.bind(this);

  this.korbit.orders(this.market, id, set);
};

// The order will be something that the manager previously received via the sell or buy methods.
// The callback should have the parameterer err.
Trader.prototype.cancelOrder = function(id, callback) {
  let args = _.toArray(arguments);
  let get = function(err, results) {
    if (err) {
      log.error(err);
      return this.retry(this.cancelOrder, args);
    }

    const order = _.first(results);
    if (order === undefined) {
      log.debug('unable to cancel order ' + id + ': result is empty');
      callback();
    } else if (order.status === 'success' ||
      order.status === 'already_filled' ||
      order.status === 'already_canceled') {
      callback();
    } else {
      log.error('unable to cancel order: ' + order.status);
      callback(true);
    }
  }.bind(this);

  this.korbit.cancelOrders(this.market, id, get);
};

Trader.prototype.getTrades = function(since, callback, descending) {
  let args = _.toArray(arguments);
  let set = function(err, results) {
    if (err) {
      log.error(err);
      return this.retry(this.cancelOrder, args);
    }

    let trades = [];
    _.forEach(results, function(transaction) {
      trades.push({
        date: moment(transaction.timestamp).unix(),
        price: +transaction.price,
        amount: +transaction.amount,
        tid: +transaction.tid
      });
    });

    trades.sort((a, b) => {
      return descending ? b.date - a.date : a.date - b.date;
    });

    callback(null, trades);
  }.bind(this);

  this.korbit.transactions(this.market, set);
};

Trader.getCapabilities = function() {
  return {
    name: 'Korbit',
    slug: 'korbit',
    currencies: ['KRW'],
    assets: ['BCH', 'BTC', 'ETC', 'ETH', 'XRP'],
    maxTradesAge: 60,
    maxHistoryFetch: null,
    markets: [
      { pair: ['KRW', 'BCH'], minimalOrder: { amount: 0.005, unit: 'asset' } },
      { pair: ['KRW', 'BTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['KRW', 'ETC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['KRW', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['KRW', 'XRP'], minimalOrder: { amount: 10, unit: 'asset' } }
    ],
    requires: ['key', 'secret', 'username', 'passphrase'],
    fetchTimespan: 60,
    tid: 'tid',
    tradable: true
  };
};

module.exports = Trader;