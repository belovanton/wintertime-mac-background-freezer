const { name } = require( `${__dirname}/../package.json` )
const { ipcRenderer } = require( 'electron' )

const q = query => document.querySelector( query )

// ///////////////////////////////
// Initialisation
// ///////////////////////////////
document.addEventListener( 'DOMContentLoaded',  f => {

	// Inits
	setTitle()
	restoreConfig()

	// Visual listeners
	interactiveHelp()
	interactiveInterface()

	// Functionality
	handleInteractions()

} )


// Set title to app name
const setTitle = f => ( document.title = name ) && ( q('#title' ).innerHTML = name )

// IPC comms
const restoreConfig = f => {
	// On restore response, parse data
	ipcRenderer.on( 'restored-config-data', ( event, restoredBlocklist ) => {

		// Turn the comma separated string into a newline delimited string
		restoredBlocklist = restoredBlocklist.replace( /,/g, '\n' )
		const blocklist = q( '#blocklist' )
		blocklist.value = restoredBlocklist
		blocklist.style.height = `${ blocklist.scrollHeight }px`
	} )
	// make restore request
	ipcRenderer.send( 'restore-config', true )
}

const interactiveHelp = f => {
	const helpfield = q( '#help' )
	q( '#askhelp').addEventListener( 'click' , f => {
		helpfield.style.display == 'none' ? helpfield.style.display = 'block' : helpfield.style.display = 'none'
	} )
}

const interactiveInterface =  f => {

	// Resize test window
	const blocklist = q( '#blocklist' )
	blocklist.style.height = `${ blocklist.scrollHeight }px`
	blocklist.addEventListener( 'keyup', ( { target } ) => target.style.height = `${ target.scrollHeight }px` )

}

const handleInteractions = f => {

	const submitFormData = f => {

		const form = q( '#form' )
		const status = q( '#status' )
		if( process.env.debug ) console.log( 'Form submit triggered' ) 
		const { value } = form.blocklist
		const button = q( '#start' )
		button.value = button.value.includes( 'Start' ) ? 'Stop freezing' : 'Start freezing'
		status.innerHTML = button.value.includes( 'Start' ) ? 'Waiting' : 'Freezing apps'
		status.classList.remove(button.value.includes( 'Start' ) ? 'statusactive' : 'statusdeactive')
		status.classList.add(button.value.includes( 'Start' ) ? 'statusdeactive' : 'statusactive')
		ipcRenderer.send( 'block', value.split( '\n' ) )
	}
	const wintertime=5*60
	const summertime=20
	duration = 5
	const startTextTimer = f => {
		var timer = duration, minutes, seconds;
		setInterval(function () {
			minutes = parseInt(timer / 60, 10);
			seconds = parseInt(timer % 60, 10);
	
			minutes = minutes < 10 ? "0" + minutes : minutes;
			seconds = seconds < 10 ? "0" + seconds : seconds;
	
			q( '#timercaption' ).innerHTML = minutes + ":" + seconds;
	
			if (--timer < 0) {
				timer = duration;
			}
		}, 1000);
	}
	// On form submit
	form.addEventListener( 'submit',  e => {
		e.preventDefault()
		submitFormData()
	} )
	const startWaiting = f => {
		var timerID2 = setInterval(function() {
			const status = q( '#status' )
			status.innerHTML = "started timer"
			const start = q( '#start' )
			start.click()
			duration = wintertime
			startTextTimer()
			startTimer()
			clearInterval(timerID2)
		}, summertime * 1000); 
	}
	const startTimer = f => {
		var timerID = setInterval(function() {
			const status = q( '#status' )
			status.innerHTML = "stoped timer"
			const start = q( '#start' )
			start.click()
			duration = summertime
			ipcRenderer.send( 'panic', true ) 
			startTextTimer()
			startWaiting()
			clearInterval(timerID)
		}, wintertime * 1000); 
	}
	
	// On timer
	q( '#timer' ).addEventListener( 'click', f => {
		duration = wintertime
		startTextTimer()
		startTimer()
	} )	
	// On panic
	q( '#panic' ).addEventListener( 'click', f => {
		const status = q( '#status' )
		status.innerHTML = 'Reseted all freezed apps'
		ipcRenderer.send( 'panic', true ) 
	} )

	// On backend keyboard shortcuit
	ipcRenderer.on( 'keyboard-shortcut', ( event, content ) => {
		if( process.env.debug ) console.log( content )
		if( content == 'toggle-block' ) submitFormData()
	} )

}