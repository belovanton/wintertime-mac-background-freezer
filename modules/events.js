const Emitter = require('events')
const { getWindow } = require( './process-management' )
const { panicUnblockAll } = require( './process-management' )

class WindowListener {

	constructor( speed = 500 ) {

		this.window = 'none'
		this.emitter = new Emitter()

		setInterval( f => this.checkWindow(), speed )

	}

	checkWindow() {
		return getWindow()
		.then( currentApp => {
			if( currentApp == "Битрикс24" ) this.updateWindow( "Bitrix24" )
			if( currentApp == "Битрикс24" ) this.updateWindow( "Bitrix24 Helper (Renderer)")
			if( currentApp == undefined) panicUnblockAll()
			if( currentApp != this.window ) this.updateWindow( currentApp )
			return currentApp
		} )
	}

	updateWindow( current ) {
		this.window = current
		return this.emitter.emit( 'change', current )
	}

}

module.exports = WindowListener