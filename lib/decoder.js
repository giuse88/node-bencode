
var Transform = require( 'stream' ).Transform

var encode = require( './encode' )
var decode = require( './decode' )

const STATE = {
  IDLE:  0x00,
  BYTES: 0x30, // 0
  INT:   0x69, // i
  LIST:  0x6C, // l
  DICT:  0x64, // d
}

function find( chr, chunk ) {

  var i = 0
  var c = chunk.length

  while( i < c ) {
    if( chunk[i] === chr )
      return i
    i++
  }

  return -1

}

/**
 * Decoder constructor
 * @param {Object} options
 *   @property {Number} highWaterMark
 *   @property {String} encoding
 */
function Decoder( options ) {
  
  if( !(this instanceof Decoder) )
    return new Decoder( options )
  
  options = options || {}
  
  // Make sure _transform's `chunk`
  // argument is *always* a Buffer
  options.decodeStrings = true
  // Go into 'object mode' since
  // we're emitting decoded values
  options.objectMode = true
  
  Transform.call( this, options )
  
  this._data      = []
  this._state     = STATE.IDLE
  this._prevState = STATE.IDLE
  this._depth     = 0
  this._chunk     = new Buffer(0)
  
}

// Inherit from `stream.Transform` class
var $ = Decoder.prototype = Object.create(
  Transform.prototype, {
    constructor: { value: Decoder }
  }
)

/**
 * Internal transform function
 * @param  {Buffer|String}  chunk
 * @param  {String}         encoding
 * @param  {Function}       done
 */
$._transform = function( chunk, encoding, done ) {
  
  Object.keys( STATE ).forEach( function( type ) {
    if( STATE[type] === this._state ) {
      console.log( 'STATE: 0x' + this._state.toString(16), '('+type+')' )
    }
  }.bind( this ))
  
  // console.log( 'CHUNK:', chunk )
  
  const BOD  = 0x3A // :
  const EOD  = 0x65 // e
  
  this._chunk = chunk
  
  var bytes = chunk.length
  var offset = 0
  
  while( offset < bytes ) {
    switch( this._state ) {
      case STATE.IDLE:  offset += this._idle();  break
      case STATE.BYTES: offset += this._bytes(); break
      case STATE.INT:   offset += this._int();   break
      case STATE.LIST:  offset += this._list();  break
      case STATE.DICT:  offset += this._dict();  break
      default: // Make IDLE default, maybe?
        this.emit( 'error', new Error(
          'Invalid state at offset', offset,
          '(byte 0x' + chunk[offset].toString( 16 ) + ')'
        ))
        offset++
        break
    }
  }
  
  // We're done with this chunk
  done()
  
}

$._idle = function() {
  
  var chunk = this._chunk
  
  // Check if first byte is an (int),
  // which equals being in [0x30..0x39]
  if( chunk[0] > 0x29 && chunk[0] < 0x40 ) {
    this._state = STATE.BYTES
  } else {
    this._state = chunk[0]
  }
  
  // Make sure the previous state
  // is set to IDLE
  this._prevState = STATE.IDLE
  
  return 0
  
}

$._bytes = function() {
  
  var chunk = this._chunk
  
  // If we were IDLE, then we need
  // to figure out the length of bytes
  if( this._prevState === STATE.IDLE ) {
    var bod = -1, length = 0
    if( ~(bod = find( 0x3A, chunk )) ) {
      length = parseInt( chunk.slice( 0, bod ).toString( 'ascii' ), 10 )
    } else {
      // Chunk is a partial
    }
  }
  
  
  
}

$._int = function() {
  
}

$._list = function() {
  
}

$._dict = function() {
  
}

module.exports = Decoder
