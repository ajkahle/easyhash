var _                   = require('lodash'),
    md5                 = require('md5');
const EventEmitter = require('events').EventEmitter;
const util = require('util');

function compare(){
  EventEmitter.call(this);
}

// conventionally, NodeJs uses util.inherits() for inheritance
util.inherits(compare, EventEmitter);

compare.prototype.run = function(a,b,aid,bid){
  this.emit('start',{stage:"Comparing Your File"});

  var aIndex, aItem, added, bCopy, bCopyItem, bIndex, found, i, j, len, len1, missing, ref, search;
  missing = [];
  found = [];
  added = [];

  bCopy = b.slice();
  for (aIndex = i = 0, len = a.length; i < len; aIndex = ++i) {
    this.emit('progress',{stage:"Comparing Your File",progress:i,total:a.length});
    aItem = a[aIndex];
    bIndex = -1;
    if (aid) {
      search = {};
      search[bid] = aItem[aid];
      bIndex = _.findIndex(bCopy, search);
    } else {
      bIndex = bCopy.indexOf(aItem);
    }
    if (bIndex !== -1) {
      found.push(aItem);
      delete bCopy[bIndex];
    } else {
      missing.push(aItem);
    }
  }
  this.emit('start',{stage:"Comparing Other File"});
  for (j = 0, len1 = bCopy.length; j < len1; j++) {
    this.emit('progress',{stage:"Comparing Other File",progress:j,total:bCopy.length});
    bCopyItem = bCopy[j];
    added.push(bCopyItem);
  }
  this.emit('done',{
    found: found,
    missing: missing,
    added: added
  });
};

module.exports = compare;
